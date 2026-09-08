import type { Employee, Client, Season, Achievement, ImportRecord, User, Evaluation } from '../types';

// ===== COLABORADORES =====
export const employees: Employee[] = [
  { id: 1, name: 'Carlos Eduardo Silva', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Portaria Principal', registration: '4587', supervisor: 'Marcos Santos', score: 118, badge: 'ouro', status: 'ativo', evaluations: 6, avgScore: 5.0, presence: 100, admissionDate: '12/03/2021' },
  { id: 2, name: 'Ana Paula Santos', role: 'Recepcionista', client: 'Hospital Central', post: 'Recepção', registration: '3126', supervisor: 'Fernanda Lima', score: 112, badge: 'ouro', status: 'ativo', evaluations: 5, avgScore: 4.8, presence: 98, admissionDate: '05/07/2020' },
  { id: 3, name: 'Rafael Almeida', role: 'Vigilante', client: 'Cond. Parque Sul', post: 'Acesso Lateral', registration: '7894', supervisor: 'Ricardo Souza', score: 109, badge: 'ouro', status: 'ativo', evaluations: 5, avgScore: 4.7, presence: 100, admissionDate: '18/01/2022' },
  { id: 4, name: 'Juliana Costa', role: 'Aux. Serviços Gerais', client: 'Indústria Paulista', post: 'Área Comum', registration: '6521', supervisor: 'Patricia Lima', score: 106, badge: 'ouro', status: 'ativo', evaluations: 5, avgScore: 4.6, presence: 96, admissionDate: '22/09/2021' },
  { id: 5, name: 'Daniel Ferreira', role: 'Porteiro', client: 'Centro Empresarial Alpha', post: 'Recepção', registration: '9632', supervisor: 'Roberto Nunes', score: 102, badge: 'prata', status: 'ativo', evaluations: 5, avgScore: 4.4, presence: 94, admissionDate: '08/11/2020' },
  { id: 6, name: 'Fernanda Rocha', role: 'Zeladora', client: 'Shopping Boa Vista', post: 'Piso 1', registration: '7410', supervisor: 'Marcos Santos', score: 98, badge: 'prata', status: 'ativo', evaluations: 4, avgScore: 4.2, presence: 100, admissionDate: '15/04/2022' },
  { id: 7, name: 'Lucas Oliveira', role: 'Vigilante', client: 'Hospital Central', post: 'Estacionamento', registration: '8851', supervisor: 'Fernanda Lima', score: 96, badge: 'prata', status: 'ativo', evaluations: 5, avgScore: 4.1, presence: 92, admissionDate: '03/06/2021' },
  { id: 8, name: 'Paulo Mendes', role: 'Vigilante', client: 'Cond. Parque Sul', post: 'Portaria', registration: '7789', supervisor: 'Ricardo Souza', score: 94, badge: 'prata', status: 'licenca', evaluations: 4, avgScore: 4.0, presence: 88, admissionDate: '27/02/2020' },
  { id: 9, name: 'Mariana Alves', role: 'Recepcionista', client: 'Centro Empresarial Alpha', post: 'Recepção', registration: '3345', supervisor: 'Roberto Nunes', score: 92, badge: 'prata', status: 'ativo', evaluations: 5, avgScore: 3.9, presence: 95, admissionDate: '11/08/2022' },
  { id: 10, name: 'Bruno Santos', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Monitoramento', registration: '6612', supervisor: 'Marcos Santos', score: 90, badge: 'prata', status: 'ativo', evaluations: 4, avgScore: 3.8, presence: 90, admissionDate: '14/12/2021' },
  { id: 11, name: 'Camila Figueiredo', role: 'Auxiliar de Portaria', client: 'Hospital Central', post: 'Entrada Principal', registration: '5201', supervisor: 'Fernanda Lima', score: 85, badge: 'prata', status: 'ativo', evaluations: 4, avgScore: 3.6, presence: 93, admissionDate: '09/03/2022' },
  { id: 12, name: 'Thiago Barbosa', role: 'Vigilante', client: 'Indústria Paulista', post: 'Galpão', registration: '4478', supervisor: 'Patricia Lima', score: 78, badge: 'bronze', status: 'ativo', evaluations: 4, avgScore: 3.3, presence: 85, admissionDate: '20/10/2020' },
];

// Próximos a avaliar (para tela Avaliar)
export const toEvaluate: Employee[] = [
  { id: 1, name: 'Carlos Eduardo Silva', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Portaria Principal', registration: '4587', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 2, name: 'Ana Paula Santos', role: 'Recepcionista', client: 'Shopping Boa Vista', post: 'Recepção', registration: '3126', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 3, name: 'Rafael Lima', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Acesso Lateral', registration: '7894', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 4, name: 'Juliana Costa', role: 'Auxiliar de Serviços Gerais', client: 'Shopping Boa Vista', post: 'Área Comum', registration: '6521', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 5, name: 'Marcelo Oliveira', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Estacionamento', registration: '9100', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 6, name: 'Fernanda Rocha', role: 'Zeladora', client: 'Shopping Boa Vista', post: 'Administração', registration: '7410', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
  { id: 7, name: 'Paulo Mendes', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Portaria Secundária', registration: '7789', supervisor: 'Marcos Santos', score: 0, badge: null, status: 'ativo', evaluations: 0, avgScore: 0, presence: 0, admissionDate: '' },
];

// ===== CLIENTES =====
export const clients: Client[] = [
  { id: 1, name: 'Shopping Boa Vista', cnpj: '12.345.678/0001-90', segment: 'Shopping', posts: 4, employees: 35, avgScore: 284, status: 'ativo', responsible: 'Mariana Souza', email: 'contato@shoppingboavista.com', phone: '(11) 3333-4444', address: 'Av. Central, 1000 – Centro, São Paulo – SP', since: '2022' },
  { id: 2, name: 'Hospital Central', cnpj: '23.456.789/0001-12', segment: 'Saúde', posts: 6, employees: 28, avgScore: 276, status: 'ativo', responsible: 'Carlos Mendes', email: 'operacoes@hospitalcentral.com', phone: '(11) 4444-5555', address: 'Rua das Flores, 200 – Jardim Paulista, São Paulo – SP', since: '2021' },
  { id: 3, name: 'Condomínio Parque Sul', cnpj: '34.567.890/0001-34', segment: 'Condomínio', posts: 3, employees: 24, avgScore: 261, status: 'ativo', responsible: 'Beatriz Costa', email: 'adm@parquesul.com', phone: '(11) 5555-6666', address: 'Rua das Palmeiras, 500 – Morumbi, São Paulo – SP', since: '2023' },
  { id: 4, name: 'Indústria Paulista', cnpj: '45.678.901/0001-76', segment: 'Indústria', posts: 5, employees: 42, avgScore: 248, status: 'ativo', responsible: 'Roberto Alves', email: 'rh@industriapaulista.com', phone: '(11) 6666-7777', address: 'Av. Industrial, 3000 – Santo André, SP', since: '2020' },
  { id: 5, name: 'Centro Empresarial Alpha', cnpj: '56.789.012/0001-11', segment: 'Empresarial', posts: 4, employees: 37, avgScore: 243, status: 'ativo', responsible: 'Amanda Ferreira', email: 'seguranca@cealpha.com', phone: '(11) 7777-8888', address: 'Av. Berrini, 1400 – Brooklin, São Paulo – SP', since: '2022' },
  { id: 6, name: 'Shopping Jardim Norte', cnpj: '67.890.123/0001-55', segment: 'Shopping', posts: 3, employees: 31, avgScore: 231, status: 'ativo', responsible: 'Felipe Santos', email: 'operacoes@jardimnorte.com', phone: '(11) 8888-9999', address: 'Av. Norte, 800 – Santana, São Paulo – SP', since: '2023' },
  { id: 7, name: 'Hospital Vida', cnpj: '78.901.234/0001-01', segment: 'Saúde', posts: 4, employees: 26, avgScore: 208, status: 'ativo', responsible: 'Luciana Moreira', email: 'adm@hospitalvida.com', phone: '(11) 9999-0000', address: 'Rua Saúde, 100 – Vila Mariana, São Paulo – SP', since: '2021' },
  { id: 8, name: 'Edifício Prime', cnpj: '89.012.345/0001-67', segment: 'Comercial', posts: 2, employees: 18, avgScore: 196, status: 'implantacao', responsible: 'Marcos Pereira', email: 'adm@edificioprime.com', phone: '(11) 1111-2222', address: 'Av. Faria Lima, 2000 – Pinheiros, São Paulo – SP', since: '2024' },
  { id: 9, name: 'Logística Norte', cnpj: '90.123.456/0001-89', segment: 'Logística', posts: 3, employees: 21, avgScore: 184, status: 'ativo', responsible: 'Diego Cavalcanti', email: 'rh@logisticanorte.com', phone: '(11) 2222-3333', address: 'Rod. Anhanguera, km 30 – Cajamar, SP', since: '2022' },
  { id: 10, name: 'Outros Clientes', cnpj: 'Diversos', segment: 'Diversos', posts: 12, employees: 134, avgScore: 172, status: 'ativo', responsible: 'Diversos', email: '–', phone: '–', address: 'Diversos', since: '–' },
];

// ===== TEMPORADAS =====
export const seasons: Season[] = [
  { id: 1, name: '2025/1', subtitle: 'Talentos em Ação', period: '01/01/2025 – 28/02/2025', start: '01/01/2025', end: '28/02/2025', status: 'andamento', employees: 1248, clients: 87, avgScore: 284 },
  { id: 2, name: '2024/2', subtitle: 'Desempenho que Inspira', period: '01/07/2024 – 31/12/2024', start: '01/07/2024', end: '31/12/2024', status: 'encerrada', employees: 1102, clients: 76, avgScore: 276 },
  { id: 3, name: '2024/1', subtitle: 'Juntos Somos Mais', period: '01/01/2024 – 30/06/2024', start: '01/01/2024', end: '30/06/2024', status: 'encerrada', employees: 986, clients: 68, avgScore: 261 },
  { id: 4, name: '2023/2', subtitle: 'Evoluir Sempre', period: '01/07/2023 – 31/12/2023', start: '01/07/2023', end: '31/12/2023', status: 'encerrada', employees: 842, clients: 61, avgScore: 243 },
  { id: 5, name: '2023/1', subtitle: 'Gente que Faz', period: '01/01/2023 – 30/06/2023', start: '01/01/2023', end: '30/06/2023', status: 'encerrada', employees: 780, clients: 54, avgScore: 231 },
  { id: 6, name: '2022/2', subtitle: 'Primeiros Passos', period: '01/07/2022 – 31/12/2022', start: '01/07/2022', end: '31/12/2022', status: 'encerrada', employees: 695, clients: 50, avgScore: 208 },
];

// ===== CONQUISTAS =====
export const achievements: Achievement[] = [
  { id: 1, date: '28/01/2025', employee: 'Mariana Alves', type: 'Elogio do Cliente', typeColor: 'purple', client: 'Shopping Boa Vista', post: 'Recepção', description: 'Atendimento excelente e postura exemplar no posto.', count: 15 },
  { id: 2, date: '25/01/2025', employee: 'Carlos Eduardo Silva', type: 'Destaque do Mês', typeColor: 'green', client: 'Hospital Central', post: 'Portaria', description: 'Maior pontuação nas avaliações de janeiro.', count: 12 },
  { id: 3, date: '20/01/2025', employee: 'Rafael Almeida', type: 'Espírito de Equipe', typeColor: 'blue', client: 'Cond. Parque Sul', post: 'Estacionamento', description: 'Sempre disposto a ajudar a equipe.', count: 8 },
  { id: 4, date: '15/01/2025', employee: 'Juliana Costa', type: 'Postura Exemplar', typeColor: 'orange', client: 'Indústria Paulista', post: 'Área Comum', description: 'Disciplina e apresentação impecáveis.', count: 5 },
  { id: 5, date: '10/01/2025', employee: 'Lucas Oliveira', type: 'Elogio do Cliente', typeColor: 'purple', client: 'Shopping Jardim Norte', post: 'Entrada', description: 'Cliente destacou a cordialidade e atenção.', count: 15 },
];

// ===== IMPORTAÇÕES =====
export const imports: ImportRecord[] = [
  { id: 1, file: 'colaboradores_jan2025.xlsx', type: 'colaboradores', records: 248, status: 'concluida', importedBy: 'João Silva', date: '28/01/2025', time: '10:24' },
  { id: 2, file: 'clientes_shopping.xlsx', type: 'clientes', records: 87, status: 'concluida', importedBy: 'Mariana Alves', date: '25/01/2025', time: '14:18' },
  { id: 3, file: 'avaliacoes_2025_01.xlsx', type: 'avaliacoes', records: 1248, status: 'concluida', importedBy: 'João Silva', date: '20/01/2025', time: '09:11' },
  { id: 4, file: 'postos_atualizacao.csv', type: 'outros', records: 42, status: 'processando', importedBy: 'João Silva', date: '15/01/2025', time: '16:37' },
  { id: 5, file: 'colaboradores_antigos.xlsx', type: 'colaboradores', records: 312, status: 'erro', importedBy: 'Rafael Almeida', date: '10/01/2025', time: '11:02' },
  { id: 6, file: 'clientes_novos.xlsx', type: 'clientes', records: 65, status: 'concluida', importedBy: 'Fernanda Rocha', date: '05/01/2025', time: '13:45' },
  { id: 7, file: 'avaliacoes_dez2024.xlsx', type: 'avaliacoes', records: 980, status: 'concluida', importedBy: 'João Silva', date: '28/12/2024', time: '10:20' },
  { id: 8, file: 'colaboradores_dez2024.xlsx', type: 'colaboradores', records: 276, status: 'concluida', importedBy: 'Juliana Costa', date: '20/12/2024', time: '15:18' },
  { id: 9, file: 'clientes_atualizacao.csv', type: 'clientes', records: 34, status: 'concluida', importedBy: 'Lucas Oliveira', date: '10/12/2024', time: '09:33' },
  { id: 10, file: 'avaliacoes_nov2024.xlsx', type: 'avaliacoes', records: 842, status: 'concluida', importedBy: 'Mariana Alves', date: '30/11/2024', time: '16:21' },
];

// ===== USUÁRIOS =====
export const users: User[] = [
  { id: 1, name: 'João Silva', email: 'joao.silva@combate.com.br', sector: 'Administrativo', role: 'Administrador', status: 'ativo', lastAccess: '04/02/2025 10:24', color: '#1B6EF3' },
  { id: 2, name: 'Mariana Alves', email: 'mariana.alves@combate.com.br', sector: 'RH', role: 'Gestor', status: 'ativo', lastAccess: '04/02/2025 09:17', color: '#8b5cf6' },
  { id: 3, name: 'Carlos Eduardo', email: 'carlos.eduardo@combate.com.br', sector: 'Operacional', role: 'Gestor', status: 'ativo', lastAccess: '03/02/2025 18:42', color: '#8b5cf6' },
  { id: 4, name: 'Fernanda Rocha', email: 'fernanda.rocha@combate.com.br', sector: 'Comercial', role: 'Usuário', status: 'ativo', lastAccess: '03/02/2025 16:03', color: '#10b981' },
  { id: 5, name: 'Lucas Oliveira', email: 'lucas.oliveira@combate.com.br', sector: 'TI', role: 'Administrador', status: 'ativo', lastAccess: '02/02/2025 14:21', color: '#1B6EF3' },
  { id: 6, name: 'Juliana Costa', email: 'juliana.costa@combate.com.br', sector: 'Qualidade', role: 'Gestor', status: 'ativo', lastAccess: '02/02/2025 11:08', color: '#8b5cf6' },
  { id: 7, name: 'Rafael Almeida', email: 'rafael.almeida@combate.com.br', sector: 'Operacional', role: 'Usuário', status: 'ativo', lastAccess: '01/02/2025 17:36', color: '#10b981' },
  { id: 8, name: 'Ana Beatriz', email: 'ana.beatriz@combate.com.br', sector: 'Financeiro', role: 'Usuário', status: 'inativo', lastAccess: '28/01/2025 09:12', color: '#f59e0b' },
  { id: 9, name: 'Pedro Santos', email: 'pedro.santos@combate.com.br', sector: 'Comercial', role: 'Usuário', status: 'ativo', lastAccess: '04/02/2025 08:55', color: '#ef4444' },
  { id: 10, name: 'Camila Ferreira', email: 'camila.ferreira@combate.com.br', sector: 'RH', role: 'Usuário', status: 'inativo', lastAccess: '25/01/2025 15:27', color: '#6366f1' },
];

// ===== AVALIAÇÕES CONCLUÍDAS =====
export const evaluations: Evaluation[] = [
  { date: '15/02/2025', employee: 'Carlos Eduardo Silva', registration: '4587', client: 'Shopping Boa Vista', post: 'Portaria Principal', evaluator: 'Ana Souza', evaluatorRole: 'Gestor do Cliente', scores: [5, 5, 5], score: 118, badge: 'ouro', hasCompliment: true },
  { date: '14/02/2025', employee: 'Mariana Alves', registration: '3126', client: 'Hospital Central', post: 'Recepção', evaluator: 'Roberto Lima', evaluatorRole: 'Supervisor', scores: [4, 4, 4], score: 96, badge: 'ouro', hasCompliment: false },
  { date: '12/02/2025', employee: 'Rafael Almeida', registration: '7894', client: 'Cond. Parque Sul', post: 'Acesso Lateral', evaluator: 'Fernanda Costa', evaluatorRole: 'Fiscal', scores: [4, 5, 4], score: 98, badge: 'ouro', hasCompliment: true },
  { date: '10/02/2025', employee: 'Juliana Costa', registration: '6521', client: 'Indústria Paulista', post: 'Área Comum', evaluator: 'Carlos Mendes', evaluatorRole: 'Gestor do Cliente', scores: [5, 4, 4], score: 96, badge: 'ouro', hasCompliment: false },
  { date: '08/02/2025', employee: 'Daniel Ferreira', registration: '9632', client: 'Centro Empresarial Alpha', post: 'Recepção', evaluator: 'Ricardo Souza', evaluatorRole: 'Supervisor', scores: [4, 4, 4], score: 88, badge: 'prata', hasCompliment: false },
  { date: '08/02/2025', employee: 'Fernanda Rocha', registration: '7410', client: 'Shopping Boa Vista', post: 'Piso 1', evaluator: 'Ana Souza', evaluatorRole: 'Gestor do Cliente', scores: [4, 3, 4], score: 82, badge: 'prata', hasCompliment: true },
  { date: '07/02/2025', employee: 'Lucas Oliveira', registration: '8851', client: 'Hospital Central', post: 'Estacionamento', evaluator: 'Marcos Pereira', evaluatorRole: 'Fiscal', scores: [3, 4, 4], score: 78, badge: 'bronze', hasCompliment: false },
  { date: '07/02/2025', employee: 'Paulo Mendes', registration: '7789', client: 'Cond. Parque Sul', post: 'Portaria', evaluator: 'Roberto Lima', evaluatorRole: 'Supervisor', scores: [4, 4, 3], score: 76, badge: 'bronze', hasCompliment: false },
];

// Pendências para avaliar
export const pendingEvaluations = [
  { id: 1, employee: 'Marcos Vinicius Lima', registration: '4587', role: 'Vigilante', client: 'Shopping Boa Vista', post: 'Portaria Principal', evaluator: 'Carlos Mendes', evaluatorRole: 'Gestor do Cliente', status: 'atrasado', deadline: '15/02/2025', daysLeft: -5 },
  { id: 2, employee: 'Ana Paula Santos', registration: '3126', role: 'Recepcionista', client: 'Hospital Central', post: 'Recepção', evaluator: 'Fernanda Alves', evaluatorRole: 'Gestor do Cliente', status: 'atrasado', deadline: '16/02/2025', daysLeft: -4 },
  { id: 3, employee: 'Rafael Almeida', registration: '7894', role: 'Vigilante', client: 'Cond. Parque Sul', post: 'Acesso Lateral', evaluator: 'Ricardo Souza', evaluatorRole: 'Supervisor', status: 'pendente', deadline: '20/02/2025', daysLeft: 8 },
  { id: 4, employee: 'Juliana Costa', registration: '6521', role: 'Aux. Serviços Gerais', client: 'Indústria Paulista', post: 'Área Comum', evaluator: 'Patrícia Lima', evaluatorRole: 'Gestor do Cliente', status: 'pendente', deadline: '22/02/2025', daysLeft: 10 },
  { id: 5, employee: 'Daniel Ferreira', registration: '9632', role: 'Porteiro', client: 'Centro Empresarial Alpha', post: 'Recepção', evaluator: 'Roberto Nunes', evaluatorRole: 'Fiscal', status: 'pendente', deadline: '23/02/2025', daysLeft: 11 },
  { id: 6, employee: 'Fernanda Rocha', registration: '7410', role: 'Zeladora', client: 'Shopping Boa Vista', post: 'Piso 1', evaluator: 'Carlos Mendes', evaluatorRole: 'Gestor do Cliente', status: 'pendente', deadline: '24/02/2025', daysLeft: 12 },
  { id: 7, employee: 'Lucas Oliveira', registration: '8851', role: 'Vigilante', client: 'Hospital Central', post: 'Estacionamento', evaluator: 'Marcos Pereira', evaluatorRole: 'Supervisor', status: 'pendente', deadline: '25/02/2025', daysLeft: 13 },
  { id: 8, employee: 'Paulo Mendes', registration: '7789', role: 'Vigilante', client: 'Cond. Parque Sul', post: 'Portaria', evaluator: 'Ricardo Souza', evaluatorRole: 'Supervisor', status: 'pendente', deadline: '26/02/2025', daysLeft: 14 },
];
