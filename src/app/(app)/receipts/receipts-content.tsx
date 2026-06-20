'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer, ReceiptsData } from '@/types';
import { formatCurrency, formatCpf, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import {
  FilterActions,
  FilterBar,
  FilterField,
} from '@/components/layout/filter-bar';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { paginateItems } from '@/lib/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterestStatusBadge } from '@/components/ui/interest-status-badge';
import { ViewTabs } from '@/components/ui/view-tabs';
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

type StatusFilter = 'all' | 'PENDENTE' | 'ATRASADO' | 'PAGO';

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
  const [filterMonth, setFilterMonth] = useState(month);
  const [filterCustomerId, setFilterCustomerId] = useState(customerId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [installmentsPage, setInstallmentsPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);

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

  useEffect(() => {
    setFilterMonth(month);
    setFilterCustomerId(customerId);
    setInstallmentsPage(1);
    setReceivedPage(1);
  }, [month, customerId]);

  const filteredInstallments = useMemo(() => {
    const items = data?.installments ?? [];
    if (statusFilter === 'all') {
      return items;
    }
    return items.filter((item) => item.status === statusFilter);
  }, [data?.installments, statusFilter]);

  const installmentsPagination = useMemo(
    () => paginateItems(filteredInstallments, installmentsPage),
    [filteredInstallments, installmentsPage],
  );

  useEffect(() => {
    setInstallmentsPage(1);
  }, [statusFilter]);

  const receivedPagination = useMemo(
    () => paginateItems(data?.received ?? [], receivedPage),
    [data?.received, receivedPage],
  );

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
      <PageHeader
        title="Recebimentos"
        description="Controle das parcelas de juros mensais por cliente"
      />

      <FilterBar
        onSubmit={(event) => {
          event.preventDefault();
          const params = new URLSearchParams({ month: filterMonth });
          if (filterCustomerId) {
            params.set('customerId', filterCustomerId);
          }
          router.push(`/receipts?${params.toString()}`);
        }}
      >
        <FilterField label="Mês" htmlFor="month">
          <Input
            id="month"
            name="month"
            type="month"
            value={filterMonth}
            onChange={(event) => setFilterMonth(event.target.value)}
          />
        </FilterField>
        <FilterField label="Cliente" htmlFor="customerId">
          <SimpleSelect
            value={filterCustomerId}
            onChange={setFilterCustomerId}
            options={customerOptions}
            placeholder="Todos os clientes"
            className="w-full"
          />
        </FilterField>
        <FilterActions>
          <Button type="submit" className="w-full sm:w-auto">
            Filtrar
          </Button>
        </FilterActions>
      </FilterBar>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Atrasados</p>
            <p className="mt-1 text-2xl font-bold text-red-700">
              {data?.summary.atrasados ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(data?.summary.valorAtrasado ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {data?.summary.pendentes ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(data?.summary.valorPendente ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pagos</p>
            <p className="mt-1 text-2xl font-bold text-green-700">
              {data?.summary.pagos ?? 0}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatCurrency(data?.summary.valorPago ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              Parcelas de juros do mês ({data?.summary.total ?? 0})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              A cobrar:{' '}
              <span className="font-semibold text-amber-700">
                {formatCurrency(data?.pendingTotal ?? 0)}
              </span>
            </p>
          </div>
          <ViewTabs
            tabs={[
              { id: 'all', label: 'Todos', count: data?.summary.total ?? 0 },
              {
                id: 'ATRASADO',
                label: 'Atrasados',
                count: data?.summary.atrasados ?? 0,
              },
              {
                id: 'PENDENTE',
                label: 'Pendentes',
                count: data?.summary.pendentes ?? 0,
              },
              { id: 'PAGO', label: 'Pagos', count: data?.summary.pagos ?? 0 },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Juros do mês</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Pendente</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead className="w-[1%] whitespace-nowrap" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6}>Carregando...</TableCell>
                </TableRow>
              ) : filteredInstallments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6}>
                    Nenhuma parcela de juros neste filtro.
                  </TableCell>
                </TableRow>
              ) : (
                installmentsPagination.items.map((item) => (
                  <TableRow key={item.cycleId}>
                    <TableCell>
                      <Link
                        href={`/customers/${item.customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {item.customer.nome}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(item.vencimento)}</TableCell>
                    <TableCell>{formatCurrency(item.jurosGerado)}</TableCell>
                    <TableCell>{formatCurrency(item.jurosPago)}</TableCell>
                    <TableCell>{formatCurrency(item.jurosPendente)}</TableCell>
                    <TableCell>
                      <InterestStatusBadge status={item.status} />
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {item.status !== 'PAGO' ? (
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
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={installmentsPagination.page}
            totalPages={installmentsPagination.totalPages}
            totalItems={installmentsPagination.totalItems}
            pageSize={installmentsPagination.pageSize}
            onPageChange={setInstallmentsPage}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Pagamentos registrados ({data?.received.length ?? 0})
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
                receivedPagination.items.map((payment) => (
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
          <Pagination
            page={receivedPagination.page}
            totalPages={receivedPagination.totalPages}
            totalItems={receivedPagination.totalItems}
            pageSize={receivedPagination.pageSize}
            onPageChange={setReceivedPage}
          />
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
