'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import publicApi from '@/lib/public-api';
import { formatCurrency, formatCpf, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type PortalData = {
  clientName: string;
  totalDebt: number;
  totalPaid: number;
  overdueCount: number;
  contracts: Array<{
    dataInicio: string;
    status: string;
    principalAtual: number;
    jurosPendentes: number;
    ciclos: Array<{
      referencia: string;
      jurosPendente: number;
      atrasado: boolean;
    }>;
  }>;
};

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatReferencia(ref: string) {
  const [year, month] = ref.split('-');
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${months[Number(month) - 1]} de ${year}`;
}

function ConsultaResult({ data }: { data: PortalData }) {
  const openCycles = data.contracts.flatMap((contract) =>
    contract.ciclos.map((cycle) => ({
      ...cycle,
      status: contract.status,
    })),
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border bg-primary/5 p-4 text-center">
        <p className="text-sm text-muted-foreground">Olá,</p>
        <p className="text-xl font-bold">{data.clientName}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total em aberto</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {formatCurrency(data.totalDebt)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Meses em atraso</p>
            <p className="mt-1 text-2xl font-bold text-red-700">
              {data.overdueCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total já pago</p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {formatCurrency(data.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {openCycles.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Juros em aberto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openCycles.map((cycle) => (
              <div
                key={cycle.referencia}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{formatReferencia(cycle.referencia)}</p>
                  <p className="text-sm text-muted-foreground">
                    Valor: {formatCurrency(cycle.jurosPendente)}
                  </p>
                </div>
                <Badge variant={cycle.atrasado ? 'destructive' : 'secondary'}>
                  {cycle.atrasado ? 'Em atraso' : 'Em dia'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-green-700">
            Você não possui valores em aberto no momento.
          </CardContent>
        </Card>
      )}

      {data.contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Seus contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.contracts.map((contract, index) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    Contrato iniciado em {formatDate(contract.dataInicio)}
                  </p>
                  <Badge>{contract.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Saldo principal: {formatCurrency(contract.principalAtual)} · Juros
                  pendentes: {formatCurrency(contract.jurosPendentes)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CpfConsulta() {
  const [cpf, setCpf] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortalData | null>(null);
  const [searchedCpf, setSearchedCpf] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await publicApi.post<{
        ok: boolean;
        error?: string;
        data?: PortalData;
      }>('/portal/lookup', { cpf });

      if (!data.ok || !data.data) {
        setError(data.error ?? 'Não foi possível consultar. Tente novamente.');
        return;
      }

      setResult(data.data);
      setSearchedCpf(cpf);
    } catch {
      setError('Não foi possível consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleNewSearch() {
    setResult(null);
    setError('');
    setSearchedCpf('');
    setCpf('');
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(event) => setCpf(maskCpf(event.target.value))}
                placeholder="000.000.000-00"
                required
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? 'Consultando...' : 'Consultar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="w-full max-w-2xl">
          <p className="mb-4 text-center text-xs text-muted-foreground">
            Consulta para CPF {formatCpf(searchedCpf.replace(/\D/g, ''))} ·{' '}
            <button
              type="button"
              onClick={handleNewSearch}
              className="text-primary hover:underline"
            >
              Nova consulta
            </button>
          </p>
          <ConsultaResult data={result} />
        </div>
      )}
    </>
  );
}
