'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const schema = z.object({
  nome: z.string().min(2),
  cpf: z.string().min(11),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: customer } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => {
      const { data } = await api.get<Customer>(`/customers/${params.id}`);
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: customer
      ? {
          nome: customer.nome,
          cpf: customer.cpf,
          telefone: customer.telefone ?? '',
          whatsapp: customer.whatsapp ?? '',
          endereco: customer.endereco ?? '',
          observacoes: customer.observacoes ?? '',
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: FormData) =>
      api.patch(`/customers/${params.id}`, payload),
    onSuccess: () => {
      toast.success('Cliente atualizado');
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push(`/customers/${params.id}`);
    },
    onError: () => toast.error('Erro ao atualizar cliente'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/customers/${params.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Editar cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input {...register('nome')} />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input {...register('cpf')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
