'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import type { Loan } from '@/types';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import { loanStatusLabel } from '@/lib/labels';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InterestStatusBadge } from '@/components/ui/interest-status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const paymentSchema = z.object({
  valor: z.number().positive(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function LoanDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';
  const [open, setOpen] = useState(false);

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', params.id],
    queryFn: async () => {
      const { data } = await api.get<Loan>(`/loans/${params.id}`);
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) });

  const paymentMutation = useMutation({
    mutationFn: (payload: PaymentForm) =>
      api.post('/payments', { loanId: params.id, valor: payload.valor }),
    onSuccess: () => {
      toast.success('Pagamento registrado');
      queryClient.invalidateQueries({ queryKey: ['loan', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      reset();
      setOpen(false);
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  });

  if (isLoading) return <p>Carregando...</p>;
  if (!loan) return <p>Empréstimo não encontrado.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/loans"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
        {canEdit && loan.status === 'ATIVO' && (
          <Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>
            Registrar pagamento
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => paymentMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="rounded-xl border border-border bg-muted/50 p-3 text-sm">
              <p>
                Juros pendentes:{' '}
                <strong>{formatCurrency(loan.jurosPendentes ?? 0)}</strong>
              </p>
              <p>
                Principal:{' '}
                <strong>{formatCurrency(loan.principalAtual)}</strong>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Valor recebido (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('valor', { valueAsNumber: true })}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Confirmar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CardTitle className="text-lg sm:text-base">
                {'nome' in (loan.customer ?? {})
                  ? String((loan.customer as { nome: string }).nome)
                  : 'Empréstimo'}
              </CardTitle>
              <Badge>{loanStatusLabel[loan.status] ?? loan.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Principal original</p>
              <p>{formatCurrency(loan.principalOriginal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Saldo principal</p>
              <p>{formatCurrency(loan.principalAtual)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Juros pendentes</p>
              <p className="font-semibold text-amber-700">
                {formatCurrency(loan.jurosPendentes ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Taxa mensal</p>
              <p>{formatPercent(loan.taxaJurosMensal)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Dia de pagamento</p>
              <p>Dia {loan.diaPagamento ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Primeiro pagamento
              </p>
              <p>{formatDate(loan.dataInicio)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">
              Total em aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700 sm:text-3xl">
              {formatCurrency(
                loan.principalAtual + (loan.jurosPendentes ?? 0),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ciclos de juros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Gerado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loan.interestCycles?.length ? (
                <TableRow>
                  <TableCell colSpan={7}>Nenhum ciclo registrado.</TableCell>
                </TableRow>
              ) : (
                loan.interestCycles.map((cycle) => (
                  <TableRow key={cycle.id}>
                    <TableCell>{cycle.referencia}</TableCell>
                    <TableCell>
                      {cycle.vencimento ? formatDate(cycle.vencimento) : '—'}
                    </TableCell>
                    <TableCell>{formatCurrency(cycle.principalBase)}</TableCell>
                    <TableCell>{formatCurrency(cycle.jurosGerado)}</TableCell>
                    <TableCell>{formatCurrency(cycle.jurosPago)}</TableCell>
                    <TableCell>
                      {formatCurrency(cycle.jurosPendente ?? 0)}
                    </TableCell>
                    <TableCell>
                      {cycle.status ? (
                        <InterestStatusBadge status={cycle.status} />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Juros</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loan.payments?.length ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum pagamento registrado.</TableCell>
                </TableRow>
              ) : (
                loan.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(payment.valor)}</TableCell>
                    <TableCell>{formatCurrency(payment.jurosAbatido)}</TableCell>
                    <TableCell>{formatCurrency(payment.principalAbatido)}</TableCell>
                    <TableCell>{payment.user?.nome ?? '-'}</TableCell>
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
