'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  HandCoins,
  Banknote,
  Wallet,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuth, getUser } from '@/lib/auth';
import { userRoleLabel } from '@/lib/labels';
import type { AuthUser } from '@/types';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/loans', label: 'Empréstimos', icon: HandCoins },
  { href: '/receipts', label: 'Recebimentos', icon: Banknote },
  { href: '/movimentacoes', label: 'Movimentações', icon: Wallet },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
  { href: '/audit', label: 'Auditoria', icon: Shield, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser<AuthUser>();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || user?.role === 'ADMIN',
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                : 'text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                active
                  ? 'bg-sidebar-active/20 text-sidebar-active'
                  : 'bg-white/5 text-sidebar-muted group-hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {link.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-[100dvh] overflow-x-hidden bg-background">
      <aside className="hidden w-72 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-active/20 text-sidebar-active">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">Probank</p>
              <p className="text-xs text-sidebar-muted">Crédito & cobrança</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5">
          <NavLinks />
        </nav>

        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <div className="rounded-xl bg-white/5 px-3 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.nome}</p>
            <p className="text-xs text-sidebar-muted">
              {user?.role ? userRoleLabel[user.role] : ''}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-white/15 bg-transparent text-sidebar-foreground hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100%,20rem)] max-w-full flex-col bg-sidebar p-5 pb-safe-bottom text-sidebar-foreground shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">Probank</p>
                <p className="truncate text-xs text-sidebar-muted">{user?.nome}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-sidebar-foreground hover:bg-white/10 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            <Button
              variant="outline"
              className="mt-4 w-full border-white/15 bg-transparent text-sidebar-foreground"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </aside>
        </div>
      )}

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-3 py-3 backdrop-blur pb-safe-top md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">Probank</p>
            <p className="truncate text-xs text-muted-foreground">{user?.nome}</p>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-safe-bottom sm:p-4 md:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
