'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  HandCoins,
  CreditCard,
  Shield,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuth, getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Clientes', icon: Users },
  { href: '/loans', label: 'Empréstimos', icon: HandCoins },
  { href: '/payments', label: 'Pagamentos', icon: CreditCard },
  { href: '/audit', label: 'Auditoria', icon: Shield, adminOnly: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser<AuthUser>();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
        <div className="mb-8 px-2">
          <p className="text-xl font-bold tracking-tight">Probank</p>
          <p className="text-sm text-muted-foreground">Gestão de empréstimos</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links
            .filter((link) => !link.adminOnly || user?.role === 'ADMIN')
            .map((link) => {
              const Icon = link.icon;
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto space-y-3 border-t pt-4">
          <div className="px-2 text-sm">
            <p className="font-medium">{user?.nome}</p>
            <p className="text-muted-foreground">{user?.role}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-8">{children}</main>
    </div>
  );
}
