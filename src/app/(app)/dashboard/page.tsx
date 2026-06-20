'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { DashboardStats } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';

const cards: Array<{
  key: keyof DashboardStats;
  label: string;
  money?: boolean;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}> = [
  { key: 'totalEmprestado', label: 'Total emprestado', accent: 'default' },
  { key: 'principalEmAberto', label: 'Principal em aberto', accent: 'warning' },
  { key: 'jurosPendentes', label: 'Juros pendentes', accent: 'danger' },
  { key: 'recebidoHoje', label: 'Recebido hoje', accent: 'success' },
  { key: 'recebidoMes', label: 'Recebido no mês', accent: 'success' },
  { key: 'contratosAtivos', label: 'Contratos ativos', money: false, accent: 'default' },
  { key: 'contratosEmAtraso', label: 'Contratos em atraso', money: false, accent: 'danger' },
  { key: 'contratosQuitados', label: 'Contratos quitados', money: false, accent: 'success' },
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
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação de crédito em tempo real"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            accent={card.accent}
            value={
              isLoading
                ? '...'
                : card.money === false
                  ? data?.[card.key]
                  : formatCurrency(data?.[card.key] ?? 0)
            }
          />
        ))}
      </div>
    </div>
  );
}
