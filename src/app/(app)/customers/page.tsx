'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer } from '@/types';
import { formatCpf, formatCurrency } from '@/lib/format';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ViewTabs } from '@/components/ui/view-tabs';
import { PageHeader } from '@/components/layout/page-header';
import type { AuthUser } from '@/types';
import { getUser } from '@/lib/auth';

const schema = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11),
  rg: z.string().optional(),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type CustomerTableProps = {
  customers: Customer[];
  isLoading: boolean;
  canEdit: boolean;
  variant: 'active' | 'inactive';
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
  onDelete: (customer: Customer) => void;
};

function CustomerTable({
  customers,
  isLoading,
  canEdit,
  variant,
  onDeactivate,
  onActivate,
  onDelete,
}: CustomerTableProps) {
  const emptyMessage =
    variant === 'active'
      ? 'Nenhum cliente ativo encontrado'
      : 'Nenhum cliente inativo encontrado';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Saldo devedor</TableHead>
          {canEdit && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 5 : 4}>Carregando...</TableCell>
          </TableRow>
        ) : customers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={canEdit ? 5 : 4}>{emptyMessage}</TableCell>
          </TableRow>
        ) : (
          customers.map((customer) => (
            <TableRow
              key={customer.id}
              className={variant === 'inactive' ? 'opacity-80' : undefined}
            >
              <TableCell className="font-medium">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-primary hover:underline"
                >
                  {customer.nome}
                </Link>
              </TableCell>
              <TableCell>{formatCpf(customer.cpf)}</TableCell>
              <TableCell>{customer.telefone ?? '-'}</TableCell>
              <TableCell>{formatCurrency(customer.saldoDevedor ?? 0)}</TableCell>
              {canEdit && (
                <TableCell className="flex flex-wrap gap-2">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="inline-flex h-7 items-center rounded-md border px-2.5 text-sm"
                  >
                    Ver
                  </Link>
                  {variant === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeactivate(customer.id)}
                    >
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onActivate(customer.id)}
                    >
                      Reativar
                    </Button>
                  )}
                  {customer.podeExcluir && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(customer)}
                    >
                      Excluir
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

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'active' | 'inactive'>('active');
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const canEdit = user?.role !== 'LEITURA';

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const { data } = await api.get<Customer[]>('/customers', {
        params: { search: search || undefined },
      });
      return data;
    },
  });

  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.ativo),
    [customers],
  );

  const inactiveCustomers = useMemo(
    () => customers.filter((customer) => !customer.ativo),
    [customers],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => api.post('/customers', payload),
    onSuccess: () => {
      toast.success('Cliente cadastrado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      reset();
      setOpen(false);
    },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/customers/${id}/deactivate`),
    onSuccess: () => {
      toast.success('Cliente desativado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/customers/${id}/activate`),
    onSuccess: () => {
      toast.success('Cliente reativado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast.success('Cliente excluído');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteTarget(null);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error.response?.data?.message ??
          'Não foi possível excluir este cliente',
      );
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro e consulta de clientes"
        actions={
          canEdit ? (
            <Button onClick={() => setOpen(true)}>Novo cliente</Button>
          ) : undefined
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-3"
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...register('nome')} />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input {...register('cpf')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input {...register('telefone')} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input {...register('whatsapp')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input {...register('endereco')} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea {...register('observacoes')} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Input
        placeholder="Buscar por nome ou CPF"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader className="gap-4">
          <ViewTabs
            tabs={[
              { id: 'active', label: 'Ativos', count: activeCustomers.length },
              {
                id: 'inactive',
                label: 'Inativos',
                count: inactiveCustomers.length,
              },
            ]}
            value={view}
            onChange={(value) => setView(value as 'active' | 'inactive')}
          />
        </CardHeader>
        <CardContent>
          <CustomerTable
            customers={view === 'active' ? activeCustomers : inactiveCustomers}
            isLoading={isLoading}
            canEdit={canEdit}
            variant={view}
            onDeactivate={(id) => deactivateMutation.mutate(id)}
            onActivate={(id) => activateMutation.mutate(id)}
            onDelete={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir permanentemente{' '}
            <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser
            desfeita.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
