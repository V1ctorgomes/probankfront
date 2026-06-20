'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer, ReceiptsData } from '@/types';
import { formatCurrency, formatCpf, formatDate } from '@/lib/format';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect } from '@/components/ui/simple-select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export default function ReceiptsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';

  const month =
    searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  const customerId = searchParams.get('customerId') ?? '';
  const [selectedLoan, setSelectedLoan] = useState<{
    loanId: string;
    jurosPendente: number;
    principalAtual: number;
  } | null>(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', month, customerId],
    queryFn: async () => {
      const { data } = await api.get<ReceiptsData>('/receipts', {
        params: {
          month,
          customerId: customerId || undefined,
        },
      });
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'receipts-filter'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers');
      return data;
    },
  });

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.nome} — CPF ${formatCpf(customer.cpf)}`,
  }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) });

  const paymentMutation = useMutation({
    mutationFn: (payload: PaymentForm & { loanId: string }) =>
      api.post('/payments', payload),
    onSuccess: () => {
      toast.success('Pagamento registrado');
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      reset();
      setOpen(false);
      setSelectedLoan(null);
    },
    onError: () => toast.error('Erro ao registrar pagamento'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recebimentos</h1>
        <p className="text-muted-foreground">
          Juros a receber e pagamentos do mês selecionado
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextMonth = String(formData.get('month') ?? month);
          const nextCustomerId = String(formData.get('customerId') ?? '');
          const params = new URLSearchParams({ month: nextMonth });
          if (nextCustomerId) {
            params.set('customerId', nextCustomerId);
          }
          router.push(`/receipts?${params.toString()}`);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="month">Mês</Label>
          <Input id="month" name="month" type="month" defaultValue={month} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente</Label>
          <SimpleSelect
            value={customerId}
            onChange={(value) => {
              const params = new URLSearchParams({ month });
              if (value) {
                params.set('customerId', value);
              }
              router.push(`/receipts?${params.toString()}`);
            }}
            options={customerOptions}
            placeholder="Todos os clientes"
            className="min-w-[240px]"
          />
          <input type="hidden" name="customerId" value={customerId} />
        </div>
        <Button type="submit">Filtrar</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>
            A receber no mês ({data?.pending.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Total de juros pendente:{' '}
            <span className="font-semibold text-amber-700">
              {formatCurrency(data?.pendingTotal ?? 0)}
            </span>
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Juros pendente</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>Carregando...</TableCell>
                </TableRow>
              ) : !data?.pending.length ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    Nenhum juros pendente neste mês.
                  </TableCell>
                </TableRow>
              ) : (
                data.pending.map((item) => (
                  <TableRow key={item.cycleId}>
                    <TableCell>
                      <Link
                        href={`/customers/${item.customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.customer.nome}
                      </Link>
                    </TableCell>
                    <TableCell>{item.referencia}</TableCell>
                    <TableCell>{formatCurrency(item.jurosPendente)}</TableCell>
                    <TableCell>{formatCurrency(item.principalAtual)}</TableCell>
                    <TableCell>
                      <Badge variant={item.overdue ? 'destructive' : 'secondary'}>
                        {item.overdue ? 'Atrasado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLoan({
                              loanId: item.loanId,
                              jurosPendente: item.jurosPendente,
                              principalAtual: item.principalAtual,
                            });
                            setOpen(true);
                          }}
                        >
                          Receber
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Recebidos no mês ({data?.received.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Total recebido:{' '}
            <span className="font-semibold">
              {formatCurrency(data?.receivedTotal ?? 0)}
            </span>
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Juros</TableHead>
                <TableHead>Principal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data?.received.length ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    Nenhum pagamento registrado neste mês.
                  </TableCell>
                </TableRow>
              ) : (
                data.received.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{payment.customer.nome}</TableCell>
                    <TableCell>{formatCurrency(payment.valor)}</TableCell>
                    <TableCell>{formatCurrency(payment.jurosAbatido)}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.principalAbatido)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <form
              onSubmit={handleSubmit((formData) =>
                paymentMutation.mutate({
                  ...formData,
                  loanId: selectedLoan.loanId,
                }),
              )}
              className="space-y-4"
            >
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  Juros pendente:{' '}
                  <strong>{formatCurrency(selectedLoan.jurosPendente)}</strong>
                </p>
                <p>
                  Principal:{' '}
                  <strong>{formatCurrency(selectedLoan.principalAtual)}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor recebido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={selectedLoan.jurosPendente}
                  {...register('valor', { valueAsNumber: true })}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                Confirmar
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
