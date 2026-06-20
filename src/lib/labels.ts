export const loanStatusLabel: Record<string, string> = {
  ATIVO: 'Ativo',
  QUITADO: 'Quitado',
  ENCERRADO: 'Encerrado',
};

export const userRoleLabel: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
  LEITURA: 'Consulta',
};

export const auditActionLabel: Record<string, string> = {
  LOGIN: 'Entrada no sistema',
  LOGOUT: 'Saída do sistema',
  CREATE: 'Cadastro',
  UPDATE: 'Alteração',
  DEACTIVATE: 'Desativação',
  ACTIVATE: 'Reativação',
  CLOSE: 'Encerramento',
  DELETE: 'Exclusão',
};

export const auditEntityLabel: Record<string, string> = {
  User: 'Usuário',
  Customer: 'Cliente',
  Loan: 'Empréstimo',
  Payment: 'Pagamento',
  Transaction: 'Movimentação',
  Category: 'Categoria',
};

export function formatAuditDescription(log: {
  action: string;
  entity: string;
}): string {
  const action = auditActionLabel[log.action] ?? log.action;
  const entity = auditEntityLabel[log.entity] ?? log.entity;
  return `${action} de ${entity.toLowerCase()}`;
}

export const transactionTypeLabel: Record<string, string> = {
  INCOME: 'Entrada',
  EXPENSE: 'Saída',
};
