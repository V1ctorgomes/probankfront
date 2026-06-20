'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer, Loan } from '@/types';
import { formatCurrency, formatDate, formatPercent, formatCpf } from '@/lib/format';
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
import { Badge } from '@/components/ui/badge';
import { loanStatusLabel } from '@/lib/labels';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';

const schema = z.object({
  customerId: z.string().uuid(),
  principalOriginal: z.number().positive(),
  taxaJurosMensal: z.number().min(0).max(100),
  dataInicio: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  ATIVO: 'default',
  QUITADO: 'secondary',
  ENCERRADO: 'destructive',
};

export default function LoansPage() {
  const [open, setOpen] = useState(false);
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
      dataInicio: new Date().toISOString().slice(0, 10),
      taxaJurosMensal: 10,
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.post('/loans', {
        ...payload,
        taxaJurosMensal: payload.taxaJurosMensal / 100,
        dataInicio: new Date(payload.dataInicio).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Empréstimo criado');
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      reset();
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empréstimos</h1>
          <p className="text-muted-foreground">Contratos e juros mensais</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Novo empréstimo</Button>} />
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
                  <Label>Data de início</Label>
                  <Input type="date" {...register('dataInicio')} />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  Criar contrato
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Juros pendentes</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Início</TableHead>
                {canEdit && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>Carregando...</TableCell>
                </TableRow>
              ) : loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>Nenhum contrato encontrado</TableCell>
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
                    <TableCell>
                      {formatCurrency(loan.jurosPendentes ?? 0)}
                    </TableCell>
                    <TableCell>{formatPercent(loan.taxaJurosMensal)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[loan.status]}>
                        {loanStatusLabel[loan.status] ?? loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(loan.dataInicio)}</TableCell>
                    {canEdit && (
                      <TableCell className="flex flex-wrap gap-2">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="inline-flex h-7 items-center rounded-md border px-2.5 text-sm"
                        >
                          Ver
                        </Link>
                        {loan.status === 'ATIVO' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => closeMutation.mutate(loan.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}
