'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { DashboardStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const cards: Array<{
  key: keyof DashboardStats;
  label: string;
  money?: boolean;
}> = [
  { key: 'totalEmprestado', label: 'Total emprestado' },
  { key: 'principalEmAberto', label: 'Principal em aberto' },
  { key: 'jurosPendentes', label: 'Juros pendentes' },
  { key: 'recebidoHoje', label: 'Recebido hoje' },
  { key: 'recebidoMes', label: 'Recebido no mês' },
  { key: 'contratosAtivos', label: 'Contratos ativos', money: false },
  { key: 'contratosEmAtraso', label: 'Contratos em atraso', money: false },
  { key: 'contratosQuitados', label: 'Contratos quitados', money: false },
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard');
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Indicadores financeiros em tempo real
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : card.money === false
                    ? data?.[card.key]
                    : formatCurrency(data?.[card.key] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
