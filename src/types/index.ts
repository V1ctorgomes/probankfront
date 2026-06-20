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
  saldoDevedor?: number;
  podeExcluir?: boolean;
  loans?: Loan[];
}

export interface InterestCycle {
  id: string;
  loanId: string;
  referencia: string;
  principalBase: number;
  jurosGerado: number;
  jurosPago: number;
  jurosPendente?: number;
  vencimento?: string;
  status?: 'PAGO' | 'PENDENTE' | 'ATRASADO';
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
  diaPagamento?: number;
  createdAt: string;
  jurosPendentes?: number;
  customer?: { id: string; nome: string; cpf: string };
  interestCycles?: InterestCycle[];
  payments?: Payment[];
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
  createdAt: string;
  usuario: string;
  acao: string;
  registro: string;
  descricao: string;
}

export interface Category {
  id: string;
  nome: string;
  tipo: 'INCOME' | 'EXPENSE';
  ativo: boolean;
}

export interface TransactionItem {
  id: string;
  tipo: 'INCOME' | 'EXPENSE';
  origem: string;
  descricao: string;
  valor: number;
  data: string;
  observacoes?: string | null;
  categoria?: string | null;
}

export interface TransactionList {
  items: TransactionItem[];
  resumo: {
    entradas: number;
    saidas: number;
    resultado: number;
  };
}

export interface ReceiptsData {
  month: string;
  installments: Array<{
    cycleId: string;
    loanId: string;
    referencia: string;
    jurosGerado: number;
    jurosPago: number;
    jurosPendente: number;
    vencimento: string;
    status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
    principalAtual: number;
    customer: { id: string; nome: string; cpf: string };
  }>;
  summary: {
    total: number;
    pagos: number;
    pendentes: number;
    atrasados: number;
    valorPago: number;
    valorPendente: number;
    valorAtrasado: number;
  };
  pending: Array<{
    cycleId: string;
    loanId: string;
    referencia: string;
    jurosGerado: number;
    jurosPago: number;
    jurosPendente: number;
    vencimento: string;
    status: 'PENDENTE' | 'ATRASADO';
    principalAtual: number;
    customer: { id: string; nome: string; cpf: string };
  }>;
  pendingTotal: number;
  received: Array<Payment & { customer: { id: string; nome: string; cpf: string } }>;
  receivedTotal: number;
}
