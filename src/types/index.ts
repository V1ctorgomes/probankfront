export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'OPERADOR' | 'LEITURA';
  nome: string;
}

export interface Customer {
  id: string;
  nome: string;
  cpf: string;
  rg?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  createdAt: string;
}

export interface Loan {
  id: string;
  customerId: string;
  principalOriginal: number;
  principalAtual: number;
  taxaJurosMensal: number;
  status: 'ATIVO' | 'QUITADO' | 'ENCERRADO';
  dataInicio: string;
  createdAt: string;
  jurosPendentes?: number;
  customer?: { id: string; nome: string; cpf: string };
}

export interface Payment {
  id: string;
  loanId: string;
  valor: number;
  jurosAbatido: number;
  principalAbatido: number;
  createdAt: string;
  user?: { id: string; nome: string };
  loan?: {
    id: string;
    principalAtual: number;
    status: string;
    customer?: { nome: string };
  };
}

export interface DashboardStats {
  totalEmprestado: number;
  principalEmAberto: number;
  jurosPendentes: number;
  recebidoHoje: number;
  recebidoMes: number;
  contratosAtivos: number;
  contratosEmAtraso: number;
  contratosQuitados: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  createdAt: string;
  user?: { id: string; nome: string; email: string } | null;
}
