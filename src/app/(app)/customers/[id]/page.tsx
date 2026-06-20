'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react';
import api from '@/lib/api';
import type { Customer } from '@/types';
import { formatCurrency, formatCpf, formatDate, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const { data } = await api.get<Customer>(`/customers/${params.id}`);
      return data;
    },
  });

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (!customer) {
    return <p>Cliente não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
        <Link
          href={`/customers/${customer.id}/edit`}
          className="inline-flex h-8 items-center rounded-md border px-3 text-sm"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl">{customer.nome}</CardTitle>
              <Badge variant={customer.ativo ? 'default' : 'secondary'}>
                {customer.ativo ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">CPF</p>
              <p>{formatCpf(customer.cpf)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Telefone</p>
              <p>{customer.telefone ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">WhatsApp</p>
              <p>{customer.whatsapp ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Endereço</p>
              <p>{customer.endereco ?? '-'}</p>
            </div>
            {customer.observacoes && (
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">Observações</p>
                <p>{customer.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Saldo devedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">
              {formatCurrency(customer.saldoDevedor ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Principal + juros pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empréstimos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Juros pendentes</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Início</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!customer.loans?.length ? (
                <TableRow>
                  <TableCell colSpan={7}>Nenhum empréstimo registrado.</TableCell>
                </TableRow>
              ) : (
                customer.loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Badge>{loan.status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(loan.principalOriginal)}</TableCell>
                    <TableCell>{formatCurrency(loan.principalAtual)}</TableCell>
                    <TableCell>{formatCurrency(loan.jurosPendentes ?? 0)}</TableCell>
                    <TableCell>{formatPercent(loan.taxaJurosMensal)}</TableCell>
                    <TableCell>{formatDate(loan.dataInicio)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/loans/${loan.id}`}
                        className="inline-flex h-7 items-center rounded-md border px-2.5 text-sm"
                      >
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
