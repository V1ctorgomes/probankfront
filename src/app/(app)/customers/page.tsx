'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Customer } from '@/types';
import { formatCpf } from '@/lib/format';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';

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

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Cadastro e consulta de clientes</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>Novo cliente</Button>} />
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de clientes</CardTitle>
          <Input
            placeholder="Buscar por nome ou CPF"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Carregando...</TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum cliente encontrado</TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className={customer.ativo ? undefined : 'opacity-60'}
                  >
                    <TableCell className="font-medium">{customer.nome}</TableCell>
                    <TableCell>{formatCpf(customer.cpf)}</TableCell>
                    <TableCell>{customer.telefone ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={customer.ativo ? 'default' : 'secondary'}>
                        {customer.ativo ? 'Ativo' : 'Desativado'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {customer.ativo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deactivateMutation.mutate(customer.id)}
                          >
                            Desativar
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
