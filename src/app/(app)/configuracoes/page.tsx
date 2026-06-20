'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Category } from '@/types';
import { getUser } from '@/lib/auth';
import type { AuthUser } from '@/types';
import { transactionTypeLabel } from '@/lib/labels';
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

const schema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(['INCOME', 'EXPENSE']),
});

type FormData = z.infer<typeof schema>;

export default function ConfiguracoesPage() {
  const [open, setOpen] = useState(false);
  const [consultaUrl, setConsultaUrl] = useState('/consulta');
  const queryClient = useQueryClient();
  const user = getUser<AuthUser>();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    setConsultaUrl(`${window.location.origin}/consulta`);
  }, []);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories');
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
    defaultValues: { tipo: 'INCOME' },
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => api.post('/categories', payload),
    onSuccess: () => {
      toast.success('Categoria criada');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      reset({ tipo: 'INCOME' });
      setOpen(false);
    },
    onError: () => toast.error('Erro ao criar categoria'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      api.patch(`/categories/${id}`, { ativo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Apenas administradores podem gerenciar categorias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Categorias para movimentações financeiras
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Nova categoria</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar categoria</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-3"
            >
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input {...register('nome')} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <SimpleSelect
                  value={watch('tipo')}
                  onChange={(value) =>
                    setValue('tipo', value as FormData['tipo'])
                  }
                  options={[
                    { value: 'INCOME', label: 'Entrada' },
                    { value: 'EXPENSE', label: 'Saída' },
                  ]}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4}>Carregando...</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>Nenhuma categoria cadastrada</TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.nome}</TableCell>
                    <TableCell>
                      {transactionTypeLabel[category.tipo] ?? category.tipo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.ativo ? 'secondary' : 'destructive'}>
                        {category.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: category.id,
                            ativo: !category.ativo,
                          })
                        }
                      >
                        {category.ativo ? 'Desativar' : 'Reativar'}
                      </Button>
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
          <CardTitle>Consulta pública</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Compartilhe este link com clientes para consultarem parcelas pelo CPF:
          </p>
          <p className="mt-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {consultaUrl}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
