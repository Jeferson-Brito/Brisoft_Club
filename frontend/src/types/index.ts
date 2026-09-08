// ===== TIPOS =====

export interface Employee {
  id: number;
  name: string;
  role: string;
  client: string;
  post: string;
  registration: string;
  supervisor: string;
  score: number;
  badge: 'ouro' | 'prata' | 'bronze' | 'diamante' | null;
  status: 'ativo' | 'inativo' | 'licenca';
  evaluations: number;
  avgScore: number;
  presence: number;
  avatar?: string;
  admissionDate: string;
}

export interface Client {
  id: number;
  name: string;
  cnpj: string;
  segment: string;
  posts: number;
  employees: number;
  avgScore: number;
  status: 'ativo' | 'inativo' | 'implantacao';
  responsible: string;
  email: string;
  phone: string;
  address: string;
  since: string;
}

export interface Season {
  id: number;
  name: string;
  subtitle: string;
  period: string;
  start: string;
  end: string;
  status: 'andamento' | 'encerrada' | 'aguardando';
  employees: number;
  clients: number;
  avgScore: number;
}

export interface Achievement {
  id: number;
  date: string;
  employee: string;
  type: string;
  typeColor: string;
  client: string;
  post: string;
  description: string;
  count: number;
}

export interface ImportRecord {
  id: number;
  file: string;
  type: 'colaboradores' | 'clientes' | 'avaliacoes' | 'outros';
  records: number;
  status: 'concluida' | 'erro' | 'processando';
  importedBy: string;
  date: string;
  time: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  sector: string;
  role: 'Administrador' | 'Gestor' | 'Usuário' | 'Cliente' | 'Convidado';
  status: 'ativo' | 'inativo';
  lastAccess: string;
  initials?: string;
  color?: string;
}

export interface Evaluation {
  date: string;
  employee: string;
  registration: string;
  client: string;
  post: string;
  evaluator: string;
  evaluatorRole: string;
  scores: [number, number, number];
  score: number;
  badge: 'ouro' | 'prata' | 'bronze' | null;
  hasCompliment: boolean;
}
