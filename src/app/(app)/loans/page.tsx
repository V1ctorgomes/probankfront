'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer, Loan } from '@/types';
import { formatCurrency, formatDate, formatPercent, formatCpf } from '@/lib/format';
import {
  nextPaymentDateFromDay,
  paymentDayOptions,
  toDateInputValue,
} from '@/lib/loan-dates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect } from '@/components/ui/simple-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ViewTabs } from '@/components/ui/view-tabs';
import { loanStatusLabel } from '@/lib/labels';
import { PageHeader } from '@/components/layout/page-header';
import type { AuthUser } from '@/types';
import { getUser } from '@/lib/auth';

const schema = z.object({
  customerId: z.string().uuid(),
  principalOriginal: z.number().positive(),
  taxaJurosMensal: z.number().min(0).max(100),
  diaPagamento: z.number().int().min(1).max(31),
  dataInicio: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ATIVO: 'default',
  QUITADO: 'secondary',
  ENCERRADO: 'destructive',
};

type LoanTableProps = {
  loans: Loan[];
  isLoading: boolean;
  canEdit: boolean;
  variant: 'active' | 'closed';
  onClose?: (id: string) => void;
};

function LoanTable({
  loans,
  isLoading,
  canEdit,
  variant,
  onClose,
}: LoanTableProps) {
  const emptyMessage =
    variant === 'active'
      ? 'Nenhum empréstimo ativo encontrado'
      : 'Nenhum empréstimo encerrado encontrado';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Principal</TableHead>
          <TableHead>Saldo</TableHead>
          <TableHead>Juros pendentes</TableHead>
          <TableHead>Taxa</TableHead>
          {variant === 'closed' && <TableHead>Status</TableHead>}
          <TableHead>Dia pagamento</TableHead>
          <TableHead>1º pagamento</TableHead>
          {canEdit && variant === 'active' && <TableHead>Ações</TableHead>}
          {canEdit && variant === 'closed' && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 9 : 8}>Carregando...</TableCell>
          </TableRow>
        ) : loans.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 9 : 8}>{emptyMessage}</TableCell>
          </TableRow>
        ) : (
          loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell>
                {loan.customer ? (
                  <Link
                    href={`/customers/${loan.customer.id}`}
                    className="text-primary hover:underline"
                  >
                    {loan.customer.nome}
                  </Link>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatCurrency(loan.principalOriginal)}</TableCell>
              <TableCell>{formatCurrency(loan.principalAtual)}</TableCell>
              <TableCell>{formatCurrency(loan.jurosPendentes ?? 0)}</TableCell>
              <TableCell>{formatPercent(loan.taxaJurosMensal)}</TableCell>
              {variant === 'closed' && (
                <TableCell>
                  <Badge variant={statusVariant[loan.status]}>
                    {loanStatusLabel[loan.status] ?? loan.status}
                  </Badge>
                </TableCell>
              )}
              <TableCell>Dia {loan.diaPagamento ?? '—'}</TableCell>
              <TableCell>{formatDate(loan.dataInicio)}</TableCell>
              {canEdit && (
                <TableCell className="flex flex-wrap gap-2">
                  <Link
                    href={`/loans/${loan.id}`}
                    className="inline-flex h-7 items-center rounded-md border px-2.5 text-sm"
                  >
                    Ver
                  </Link>
                  {variant === 'active' && onClose && loan.status === 'ATIVO' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onClose(loan.id)}
                    >
                      Encerrar
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function LoansPage() {
  const defaultPaymentDay = 10;
  const defaultFirstPayment = toDateInputValue(
    nextPaymentDateFromDay(defaultPaymentDay),
  );

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'active' | 'closed'>('active');
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data } = await api.get<Loan[]>('/loans');
      return data;
    },
  });

  const activeLoans = useMemo(
    () => loans.filter((loan) => loan.status === 'ATIVO'),
    [loans],
  );

  const closedLoans = useMemo(
    () => loans.filter((loan) => loan.status !== 'ATIVO'),
    [loans],
  );

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers', {
        params: { onlyActive: 'true' },
      });
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      diaPagamento: defaultPaymentDay,
      dataInicio: defaultFirstPayment,
      taxaJurosMensal: 10,
    },
  });

  const selectedPaymentDay = watch('diaPagamento');

  const handlePaymentDayChange = (value: string) => {
    const day = Number(value);
    setValue('diaPagamento', day);
    setValue('dataInicio', toDateInputValue(nextPaymentDateFromDay(day)));
  };

  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.post('/loans', {
        customerId: payload.customerId,
        principalOriginal: payload.principalOriginal,
        taxaJurosMensal: payload.taxaJurosMensal / 100,
        diaPagamento: payload.diaPagamento,
        dataInicio: new Date(`${payload.dataInicio}T12:00:00.000Z`).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Empréstimo criado');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      reset({
        diaPagamento: defaultPaymentDay,
        dataInicio: defaultFirstPayment,
        taxaJurosMensal: 10,
      });
      setOpen(false);
    },
    onError: () => toast.error('Erro ao criar empréstimo'),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/loans/${id}/close`),
    onSuccess: () => {
      toast.success('Contrato encerrado');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empréstimos"
        description="Contratos, vencimentos e juros mensais"
        actions={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>Novo empréstimo</Button>
          ) : undefined
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar contrato</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>Cliente</Label>
              <SimpleSelect
                value={watch('customerId') ?? ''}
                onChange={(value) => setValue('customerId', value)}
                options={customers.map((customer) => ({
                  value: customer.id,
                  label: `${customer.nome} — CPF ${formatCpf(customer.cpf)}`,
                }))}
                placeholder="Selecione o cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor principal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('principalOriginal', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa mensal (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('taxaJurosMensal', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dia de pagamento</Label>
              <SimpleSelect
                value={String(selectedPaymentDay ?? defaultPaymentDay)}
                onChange={handlePaymentDayChange}
                options={paymentDayOptions}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do primeiro pagamento</Label>
              <Input type="date" {...register('dataInicio')} />
              <p className="text-xs text-muted-foreground">
                Esta data define o vencimento escolhido pelo cliente.
              </p>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Criar contrato
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="gap-4">
          <ViewTabs
            tabs={[
              { id: 'active', label: 'Ativos', count: activeLoans.length },
              { id: 'closed', label: 'Encerrados', count: closedLoans.length },
            ]}
            value={view}
            onChange={(value) => setView(value as 'active' | 'closed')}
          />
        </CardHeader>
        <CardContent>
          <LoanTable
            loans={view === 'active' ? activeLoans : closedLoans}
            isLoading={isLoading}
            canEdit={canEdit}
            variant={view}
            onClose={(id) => closeMutation.mutate(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
