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
      <section className="relative overflow-hidden bg-sidebar p-6 text-sidebar-foreground sm:p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.25),transparent_40%)]" />
        <div className="relative flex items-center gap-3 lg:mb-0 lg:block">
          <div className="mb-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sidebar-active/20 text-sidebar-active lg:mb-6 lg:h-14 lg:w-14">
            <HandCoins className="h-6 w-6 lg:h-7 lg:w-7" />
          </div>
          <div className="min-w-0 lg:max-w-md">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-4xl">
              Gestão moderna de empréstimos particulares
            </h1>
            <p className="mt-2 text-sm text-sidebar-muted sm:text-base lg:mt-4">
              Controle contratos, juros, recebimentos e finanças com clareza e
              segurança.
            </p>
          </div>
        </div>
        <p className="relative mt-6 hidden text-sm text-sidebar-muted lg:block">
          Probank — plataforma para operações de crédito pessoal
        </p>
      </section>

      <section className="flex items-center justify-center bg-background p-4 pb-safe-bottom sm:p-6">
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
