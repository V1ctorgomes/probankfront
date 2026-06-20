'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { HandCoins } from 'lucide-react';
import api from '@/lib/api';
import {
  decodeUserFromToken,
  getAccessToken,
  setTokens,
  setUser,
} from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post('/auth/login', data);
      setTokens(response.data.accessToken, response.data.refreshToken);
      const user = decodeUserFromToken(response.data.accessToken);
      if (user) setUser(user);
      toast.success('Login realizado com sucesso');
      router.push('/dashboard');
    } catch {
      toast.error('Credenciais inválidas');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.25),transparent_40%)]" />
        <div className="relative">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-active/20 text-sidebar-active">
            <HandCoins className="h-7 w-7" />
          </div>
          <h1 className="max-w-md text-4xl font-bold tracking-tight text-white">
            Gestão moderna de empréstimos particulares
          </h1>
          <p className="mt-4 max-w-md text-base text-sidebar-muted">
            Controle contratos, juros, recebimentos e finanças com clareza e
            segurança.
          </p>
        </div>
        <p className="relative text-sm text-sidebar-muted">
          Probank — plataforma para operações de crédito pessoal
        </p>
      </section>

      <section className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-0 shadow-xl ring-1 ring-border/80">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar no Probank</CardTitle>
            <p className="text-sm text-muted-foreground">
              Acesse sua conta operacional
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Cliente?{' '}
                <a href="/consulta" className="font-medium text-primary hover:underline">
                  Consulte suas parcelas
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
