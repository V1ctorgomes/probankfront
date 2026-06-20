import type { Metadata } from 'next';
import Link from 'next/link';
import { HandCoins } from 'lucide-react';
import { CpfConsulta } from '@/components/portal/cpf-consulta';

export const metadata: Metadata = {
  title: 'Consulta de parcelas | Probank',
  description: 'Consulte valores em aberto pelo CPF',
};

export default function ConsultaPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background">
      <header className="border-b border-border bg-card pb-safe-top">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">Probank</p>
              <p className="text-xs text-muted-foreground">Portal do cliente</p>
            </div>
          </div>
          <Link
            href="/login"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Área do operador
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-3 py-8 pb-safe-bottom sm:px-4 sm:py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Consulta de parcelas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Informe seu CPF para ver o valor em aberto, vencimentos e situação
            dos contratos.
          </p>
        </div>
        <CpfConsulta />
      </main>
    </div>
  );
}
