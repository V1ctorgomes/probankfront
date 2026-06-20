'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AuditLog } from '@/types';
import { formatDate } from '@/lib/format';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const { data } = await api.get<{
        items: AuditLog[];
        total: number;
      }>('/audit');
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Histórico de ações realizadas no sistema"
      />

      <Card>
        <CardHeader>
          <CardTitle>Últimas ações ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>Carregando...</TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>Nenhum registro</TableCell>
                </TableRow>
              ) : (
                data?.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.usuario}</TableCell>
                    <TableCell>{log.acao}</TableCell>
                    <TableCell>{log.registro}</TableCell>
                    <TableCell>{log.descricao}</TableCell>
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
