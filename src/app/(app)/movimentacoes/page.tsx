'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { transactionTypeLabel } from '@/lib/labels';
import { PageHeader } from '@/components/layout/page-header';
import { getUser } from '@/lib/auth';
import type { AuthUser, Category, TransactionList } from '@/types';
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
import { Pagination } from '@/components/ui/pagination';
import { paginateItems } from '@/lib/pagination';

const schema = z.object({
  tipo: z.enum(['INCOME', 'EXPENSE']),
  descricao: z.string().min(2),
  categoryId: z.string().optional(),
  valor: z.number().positive(),
  data: z.string().min(1),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function MovimentacoesPage() {
  const [open, setOpen] = useState(false);
  const defaults = useMemo(() => monthBounds(), []);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories');
      return data.filter((item) => item.ativo);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', startDate, endDate, tipoFilter],
    queryFn: async () => {
      const { data } = await api.get<TransactionList>('/transactions', {
        params: {
          startDate,
          endDate,
          tipo: tipoFilter || undefined,
        },
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
      tipo: 'INCOME',
      data: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedTipo = watch('tipo');

  const categoryOptions = categories
    .filter((category) => category.tipo === selectedTipo)
    .map((category) => ({ value: category.id, label: category.nome }));

  const pagination = useMemo(
    () => paginateItems(data?.items ?? [], page),
    [data?.items, page],
  );

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, tipoFilter]);

  const createMutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.post('/transactions', {
        ...payload,
        data: new Date(payload.data).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Movimentação registrada');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      reset({ tipo: 'INCOME', data: new Date().toISOString().slice(0, 10) });
      setOpen(false);
    },
    onError: () => toast.error('Erro ao registrar movimentação'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações"
        description="Entradas e saídas das finanças pessoais"
        actions={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>Nova movimentação</Button>
          ) : undefined
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimentação</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) => createMutation.mutate(values))}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>Tipo</Label>
              <SimpleSelect
                value={selectedTipo}
                onChange={(value) =>
                  setValue('tipo', value as FormData['tipo'])
                }
                options={[
                  { value: 'INCOME', label: 'Entrada' },
                  { value: 'EXPENSE', label: 'Saída' },
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input {...register('descricao')} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <SimpleSelect
                value={watch('categoryId') ?? ''}
                onChange={(value) => setValue('categoryId', value || undefined)}
                options={categoryOptions}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('valor', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...register('data')} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input {...register('observacoes')} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>De</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Até</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <SimpleSelect
              value={tipoFilter}
              onChange={setTipoFilter}
              options={[
                { value: 'INCOME', label: 'Entradas' },
                { value: 'EXPENSE', label: 'Saídas' },
              ]}
              placeholder="Todos"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(data?.resumo.entradas ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(data?.resumo.saidas ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(data?.resumo.resultado ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Carregando...</TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    Nenhuma movimentação no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                pagination.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.data)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.tipo === 'INCOME' ? 'secondary' : 'destructive'}
                      >
                        {transactionTypeLabel[item.tipo] ?? item.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell>{item.categoria ?? '—'}</TableCell>
                    <TableCell
                      className={
                        item.tipo === 'INCOME' ? 'text-green-700' : 'text-red-700'
                      }
                    >
                      {formatCurrency(item.valor)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
