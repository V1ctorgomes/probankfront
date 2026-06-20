'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';

const schema = z.object({
  loanId: z.string().uuid(),
  valor: z.number().positive(),
});

type FormData = z.infer<typeof schema>;

export default function PaymentsPage() {
  const [open, setOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';

  const { data: loans = [] } = useQuery({
    queryKey: ['loans', 'active'],
    queryFn: async () => {
      const { data } = await api.get<Loan[]>('/loans', {
        params: { status: 'ATIVO' },
      });
      return data;
    },
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', selectedLoan],
    enabled: !!selectedLoan,
    queryFn: async () => {
      const { data } = await api.get<Payment[]>(`/payments/loan/${selectedLoan}`);
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
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const loanOptions = loans.map((loan) => ({
    value: loan.id,
    label: `${loan.customer?.nome ?? 'Cliente'} — saldo ${formatCurrency(loan.principalAtual)} + juros ${formatCurrency(loan.jurosPendentes ?? 0)}`,
  }));

  const historyOptions = loans.map((loan) => ({
    value: loan.id,
    label: loan.customer?.nome ?? 'Cliente',
  }));

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => api.post('/payments', payload),
    onSuccess: () => {
      toast.success('Pagamento registrado');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      reset();
      setOpen(false);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? 'Erro ao registrar pagamento');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
          <p className="text-muted-foreground">
            Registro com abatimento automático de juros e principal
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Registrar pagamento</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo pagamento</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((data) => createMutation.mutate(data))}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label>Contrato</Label>
                  <SimpleSelect
                    value={watch('loanId') ?? ''}
                    onChange={(value) => setValue('loanId', value)}
                    options={loanOptions}
                    placeholder="Selecione o contrato"
                  />
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
                  Registrar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico por contrato</CardTitle>
          <SimpleSelect
            value={selectedLoan}
            onChange={setSelectedLoan}
            options={historyOptions}
            placeholder="Selecione um contrato ativo"
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Juros abatido</TableHead>
                <TableHead>Principal abatido</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedLoan ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    Selecione um contrato para ver o histórico
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Carregando...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum pagamento registrado</TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(payment.valor)}</TableCell>
                    <TableCell>{formatCurrency(payment.jurosAbatido)}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.principalAbatido)}
                    </TableCell>
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
