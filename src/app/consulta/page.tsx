import type { Metadata } from 'next';
import Link from 'next/link';
import { CpfConsulta } from '@/components/portal/cpf-consulta';

export const metadata: Metadata = {
  title: 'Consulta de parcelas | Probank',
  description: 'Consulte valores em aberto pelo CPF',
};

export default function ConsultaPage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <div className="mb-8 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Área do operador
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Consulta de parcelas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe seu CPF para ver o valor em aberto, vencimentos e situação
            dos contratos.
          </p>
        </div>
        <CpfConsulta />
      </div>
    </div>
  );
}
