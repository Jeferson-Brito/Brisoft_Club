import { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  HelpCircle,
  ShieldCheck,
  Users,
  Award,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Info,
  Trophy,
  Building2,
  UserCheck,
  Crown,
  Check,
  X,
  FileSpreadsheet,
  Lock
} from "lucide-react";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const FAQS: FAQItem[] = [
  {
    id: "faq-1",
    category: "ranking",
    question: "Por que um colaborador com avaliações não aparece no ranking?",
    answer: "Verifique se o colaborador possui penalidade de bloqueio de ciclo ou suspensão de temporada aplicada em Colaboradores → Ações. Além disso, verifique se a temporada já possui ciclos ativos ou concluídos e se o filtro selecionado corresponde ao posto/cliente correto.",
    tags: ["ranking", "colaborador", "bloqueio", "inelegivel", "pontos"]
  },
  {
    id: "faq-2",
    category: "roles",
    question: "O cliente consegue ver as notas dadas pelo supervisor/fiscal?",
    answer: "Não! O sistema garante isolamento total das visões: o cliente vê apenas os dados e notas referentes ao seu papel e aos postos que ele gerencia. O supervisor/fiscal também só vê os dados dos colaboradores sob sua supervisão.",
    tags: ["privacidade", "cliente", "supervisor", "sigilo", "notas"]
  },
  {
    id: "faq-3",
    category: "replication",
    question: "Como funciona a replicação automática se o cliente ou supervisor não avaliar?",
    answer: "Se um dos dois avaliadores deixar de avaliar dentro do prazo estabelecido, o sistema copia automaticamente a nota dada pelo outro avaliador. A avaliação gerada é identificada como 'Sistema (nota replicada)'. Dessa forma, o colaborador não fica com nota zerada nem é prejudicado pela ausência de uma das partes.",
    tags: ["replicacao", "prazo", "sistema", "nota", "cliente", "supervisor", "prejudicado"]
  },
  {
    id: "faq-4",
    category: "seasons",
    question: "Como funcionam os prazos separados para cliente e supervisor dentro de um mesmo ciclo?",
    answer: "Ao criar ou editar um ciclo, o administrador pode definir 'Prazo do cliente' (ex: primeira quinzena do mês) e 'Prazo do supervisor' (ex: segunda quinzena). Cada papel só poderá responder ao formulário durante seu respectivo período de vigência.",
    tags: ["prazos", "ciclo", "janela", "datas", "quinzena"]
  },
  {
    id: "faq-5",
    category: "ranking",
    question: "Como o colaborador conquista a classificação Diamante?",
    answer: "A medalha Diamante é o grau máximo de excelência. Ela é concedida de forma automática no momento em que uma temporada é 'Publicada' oficialmente pelo administrador, caso o colaborador tenha alcançado a classificação Ouro em duas temporadas consecutivas.",
    tags: ["diamante", "ouro", "medalha", "temporada", "publicada", "streak"]
  },
  {
    id: "faq-6",
    category: "seasons",
    question: "O que significa 'Publicar' uma temporada e qual a diferença de apenas encerrar?",
    answer: "Encerrar a temporada consolida as médias finais de todos os ciclos. Publicar a temporada é a etapa final oficial: congela os resultados publicamente, libera a visualização oficial e dispara a verificação de medalhas Diamante por histórico consecutivo.",
    tags: ["publicar", "encerrar", "oficial", "diamante", "congelar"]
  },
  {
    id: "faq-7",
    category: "roles",
    question: "Quem tem permissão para exportar dados e planilhas no sistema?",
    answer: "Por regras de governança e segurança, apenas os perfis Administrador e Analista possuem botões de exportação (Excel/CSV). Clientes, supervisores e colaboradores visualizam apenas as informações na própria tela, sem permissão de download em massa.",
    tags: ["exportacao", "download", "excel", "csv", "admin", "analista"]
  },
  {
    id: "faq-8",
    category: "penalties",
    question: "Qual a diferença entre Penalidade, Bloqueio de Ciclo e Suspensão de Temporada?",
    answer: "A Penalidade subtrai uma quantidade fixa de pontos (ex: -5 ou -10 pts por falta leve/grave) mantendo o colaborador no ranking. O Bloqueio de Ciclo torna o colaborador inelegível apenas para o ciclo em vigor. A Suspensão de Temporada remove a elegibilidade do colaborador em todos os ciclos da temporada inteira.",
    tags: ["penalidade", "bloqueio", "suspensao", "desconto", "pontos"]
  }
];

const CATEGORIES = [
  { id: "all", label: "Tudo", icon: BookOpen },
  { id: "overview", label: "Visão Geral", icon: Sparkles },
  { id: "roles", label: "Papéis & Acessos", icon: Users },
  { id: "seasons", label: "Ciclos & Prazos", icon: Calendar },
  { id: "evaluations", label: "Avaliações & Notas", icon: CheckCircle2 },
  { id: "ranking", label: "Ranking & Medalhas", icon: Trophy },
  { id: "replication", label: "Replicação Automática", icon: RefreshCw },
  { id: "penalties", label: "Penalidades", icon: AlertTriangle },
  { id: "faq", label: "Dúvidas Frequentes", icon: HelpCircle }
];

export function Manual() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({
    "faq-1": true,
    "faq-2": true,
    "faq-3": true
  });

  const toggleFaq = (id: string) => {
    setOpenFaq(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllFaqs = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    FAQS.forEach(f => {
      next[f.id] = expand;
    });
    setOpenFaq(next);
  };

  // Filter FAQs based on search & category
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQS.filter(item => {
      const matchesCategory = selectedCategory === "all" || selectedCategory === "faq" || item.category === selectedCategory;
      if (!q) return matchesCategory;
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = item.answer.toLowerCase().includes(q);
      const inTags = item.tags.some(t => t.toLowerCase().includes(q));
      return (inQuestion || inAnswer || inTags) && (selectedCategory === "all" || selectedCategory === "faq" || matchesCategory);
    });
  }, [searchQuery, selectedCategory]);

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase().trim());
  };

  const shouldShowSection = (sectionId: string, contentKeywords: string = "") => {
    if (searchQuery.trim()) {
      return matchesSearch(contentKeywords);
    }
    return selectedCategory === "all" || selectedCategory === sectionId;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-xl text-white p-6 sm:p-10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <BookOpen className="w-3.5 h-3.5" />
              Central de Ajuda & Conhecimento
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white m-0">
              Manual Oficial do Sistema
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed m-0">
              Aprenda de forma clara como funciona o Clube de Talentos: etapas das temporadas, janelas de avaliação, regras de notas, cálculo de rankings e proteção do colaborador.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-200">5 Papéis Configurados</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">Replicação Inteligente</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-200">4 Graus de Medalha</span>
            </div>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative mt-8">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você precisa aprender hoje? (ex: prazos, replicação, ouro, cliente, supervisor, exportar...)"
              className="w-full pl-12 pr-10 py-3.5 bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-900 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-white placeholder-slate-400 text-sm shadow-inner transition-all outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between text-xs text-indigo-300 mt-2 px-1">
              <span>Filtrando conteúdos com o termo: <strong>"{searchQuery}"</strong></span>
              <button
                onClick={() => setSearchQuery("")}
                className="underline hover:text-white"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: Visão Geral do Sistema */}
      {shouldShowSection("overview", "visão geral temporada ciclo avaliação ranking funcionamento") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">1. Como o Clube de Talentos Funciona</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">A estrutura mestra de avaliação contínua em 4 níveis interligados</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Nível 1</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Temporada</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                Período amplo (ex: 2 a 3 meses) que abriga múltiplos ciclos. Define e congela as regras de pontuação e critérios que serão válidos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">Nível 2</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Ciclos Mensais</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                Unidades menores (ex: 1 mês cada). Cada ciclo contém os prazos para clientes e supervisores avaliarem os colaboradores do período.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Nível 3</span>
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Dupla Avaliação</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                O colaborador recebe a avaliação de seu <strong>Cliente</strong> e do seu <strong>Supervisor/Fiscal</strong>. Ambas são ponderadas e somadas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">Nível 4</span>
                <Trophy className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Ranking & Pódio</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                As pontuações geram os rankings do ciclo e da temporada, concedendo as medalhas Bronze, Prata, Ouro e o prestigiado Diamante.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Linha do Tempo e Prazos dos Ciclos */}
      {shouldShowSection("seasons", "ciclo prazo cliente supervisor data quinzenas linha do tempo etapas") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">2. Linha do Tempo de um Ciclo e Janelas de Avaliação</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Como organizar prazos para que Cliente e Supervisor avaliem de forma organizada</p>
            </div>
          </div>

          {/* Stepper Timeline Diagram */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">
              {/* Step 1 */}
              <div className="flex flex-col p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <span className="text-[11px] font-semibold text-slate-500">Início</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 m-0">Criação do Ciclo</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  O administrador define o período do ciclo e os prazos específicos: <strong>Prazo do Cliente</strong> e <strong>Prazo do Supervisor</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">Fase Cliente</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 m-0">Janela do Cliente</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  Ex: Dias 01 a 15. Clientes avaliam os colaboradores dos seus postos. O cliente só consegue enviar formulários até o seu prazo limite.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">Fase Supervisor</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 m-0">Janela do Supervisor</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  Ex: Dias 16 a 30. Supervisores/Fiscais avaliam seus liderados. Também possuem prazo limite exclusivo.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">Automático</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 m-0">Fechamento & Replicação</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  Se alguém não avaliou, o sistema <strong>replica automaticamente</strong> a nota do outro avaliador para proteger o colaborador.
                </p>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">5</span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">Consolidação</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 m-0">Ranking & Premiação</h4>
                <p className="text-xs text-slate-600 leading-relaxed m-0">
                  As notas dos dois avaliadores são somadas em média ponderada, definindo a pontuação e pódio do ciclo.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 space-y-1">
              <strong className="text-blue-950 block">Dica para configuração de prazos:</strong>
              <span>
                Se você não preencher prazos separados, o sistema usará o <strong>Prazo Geral</strong> para todos os avaliadores simultaneamente.
                Preencha os campos <em>"Prazo do cliente"</em> e <em>"Prazo do supervisor"</em> apenas se desejar etapas quinzenais ou intercaladas!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Papéis, Permissões e Sigilo */}
      {shouldShowSection("roles", "papel papéis administrador analista cliente supervisor colaborador permissões privacidade exportação") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">3. Papéis do Sistema e Isolamento de Informações</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Entenda quem pode fazer o que e quais dados cada usuário tem acesso</p>
            </div>
          </div>

          {/* Privacy Security Banner */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-3.5">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 m-0">Regra de Sigilo e Isolamento entre Avaliadores</h4>
              <p className="text-xs text-amber-800 m-0 leading-relaxed">
                <strong>O Cliente NÃO visualiza as notas do Supervisor/Fiscal</strong>, e o <strong>Supervisor NÃO visualiza as notas do Cliente</strong>.
                Cada avaliador possui sua própria aba isolada de ranking e histórico, garantindo total imparcialidade e transparência.
                Além disso, a <strong>exportação de dados em Excel/CSV é restrita exclusivamente a Administradores e Analistas</strong>.
              </p>
            </div>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Admin */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  Administrador
                </span>
                <ShieldCheck className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Acesso total e irrestrito ao sistema.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Criar temporadas, ciclos e regras
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Aplicar penalidades e bloqueios
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Exportar dados completos em Excel
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Encerrar e Publicar temporadas
                </li>
              </ul>
            </div>

            {/* Analista */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Analista de RH / Operações
                </span>
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Acompanha o andamento dos ciclos e audita notas.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Visualizar rankings gerais e por cliente
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Aprovar ou reprovar elogios enviados
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Exportar relatórios em Excel/CSV
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não altera regras de pontuação
                </li>
              </ul>
            </div>

            {/* Cliente */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Cliente (Contratante)
                </span>
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Avalia os profissionais alocados no seu posto.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Avaliar colaboradores do seu posto
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Ver Ranking exclusivo do seu posto
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não vê notas do supervisor
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não exporta dados em planilha
                </li>
              </ul>
            </div>

            {/* Supervisor / Fiscal */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Supervisor / Fiscal
                </span>
                <UserCheck className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Avalia os colaboradores sob sua responsabilidade técnica.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Avaliar equipe sob sua supervisão
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Ver ranking da sua equipe
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não vê avaliações do cliente
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não exporta dados em planilha
                </li>
              </ul>
            </div>

            {/* Colaborador */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Colaborador
                </span>
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Profissional avaliado que busca medalhas e evolução.
              </p>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Visualizar suas avaliações concluídas
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Ver sua medalha e média de pontos
                </li>
                <li className="flex items-center gap-1.5 text-emerald-700">
                  <Check className="w-3.5 h-3.5 shrink-0" /> Ver elogios recebidos
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <X className="w-3.5 h-3.5 shrink-0 text-rose-500" /> Não avalia outros profissionais
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Como Funciona a Avaliação, Critérios e Elogios */}
      {shouldShowSection("evaluations", "avaliação critérios notas escala elogios pontos peso") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">4. Avaliação, Critérios e Cálculo da Nota</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Entenda a fórmula matemática e os tipos de status de avaliação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Cálculo dos Critérios</h4>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Cada resposta dada recebe os pontos correspondentes à nota na <strong>Escala de Notas</strong>. Em seguida, é multiplicado pelo <strong>Peso do Critério</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                Pontos = Σ (Nota × Peso do Critério)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Elogios & Bônus</h4>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Elogios aprovados agregam pontos bônus diretamente na avaliação do colaborador, incentivando atitudes excepcionais no posto de serviço.
              </p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                Total = Pontos Critérios + Bônus Elogio
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Média Ponderada</h4>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                No ciclo, a nota do colaborador é calculada combinando a avaliação do Cliente e do Supervisor conforme os pesos definidos para cada papel.
              </p>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                Nota Ciclo = Média (Cliente + Supervisor)
              </div>
            </div>
          </div>

          {/* Evaluation Status Pills */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">Status da Avaliação</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                <div>
                  <strong className="text-xs text-slate-800 block">Rascunho</strong>
                  <span className="text-[11px] text-slate-500">Salvo pelo avaliador, mas ainda não enviado. Pode ser alterado a qualquer momento.</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <strong className="text-xs text-emerald-900 block">Enviada</strong>
                  <span className="text-[11px] text-emerald-700">Avaliação oficial finalizada e contabilizada no cálculo do ranking.</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <strong className="text-xs text-amber-900 block">Impossível Avaliar</strong>
                  <span className="text-[11px] text-amber-700">Avaliador justificou impossibilidade (ex: colaborador de férias ou afastado).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: Ranking e as 4 Medalhas */}
      {shouldShowSection("ranking", "ranking medalhas bronze prata ouro diamante pódio pontos") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">5. Classificações e as 4 Medalhas do Clube</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Os níveis de reconhecimento e a regra especial para conquistar o Diamante</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bronze */}
            <div className="p-5 rounded-2xl border border-amber-800/20 bg-gradient-to-b from-amber-50/50 to-white space-y-3 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🥉
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 m-0">Bronze</h3>
                <span className="text-[11px] font-semibold text-amber-800">Faixa Inicial</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Atribuído a desempenhos que atingem os critérios básicos, com pontos a serem aprimorados no próximo ciclo.
              </p>
            </div>

            {/* Silver */}
            <div className="p-5 rounded-2xl border border-slate-300/60 bg-gradient-to-b from-slate-100/60 to-white space-y-3 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🥈
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Prata</h3>
                <span className="text-[11px] font-semibold text-slate-600">Faixa Intermediária</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Demonstra consistência, pontualidade e bom cumprimento dos procedimentos operacionais padrão.
              </p>
            </div>

            {/* Gold */}
            <div className="p-5 rounded-2xl border border-yellow-300/80 bg-gradient-to-b from-amber-100/40 to-white space-y-3 shadow-sm hover:shadow transition">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🥇
              </div>
              <div>
                <h3 className="text-sm font-bold text-yellow-950 m-0">Ouro</h3>
                <span className="text-[11px] font-semibold text-amber-700">Alta Performance</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Destaque absoluto no posto. Notas máximas, conduta exemplar e histórico frequente de elogios de clientes.
              </p>
            </div>

            {/* Diamond */}
            <div className="p-5 rounded-2xl border border-cyan-300 bg-gradient-to-b from-cyan-50/60 via-sky-50/30 to-white space-y-3 shadow-md hover:shadow-lg transition relative overflow-hidden">
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[10px] font-bold tracking-wide uppercase">
                Exclusivo
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                💎
              </div>
              <div>
                <h3 className="text-sm font-bold text-cyan-950 m-0">Diamante</h3>
                <span className="text-[11px] font-semibold text-cyan-700">Grau Máximo de Excelência</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed m-0">
                Concedido <strong>automaticamente</strong> na publicação da temporada para colaboradores que conquistaram <strong>Ouro em 2 temporadas consecutivas</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: Replicação Automática de Notas */}
      {shouldShowSection("replication", "replicação automática notas falta prazo ausência cliente supervisor") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">6. A Regra de Replicação Automática</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Garantia total de que o colaborador não seja prejudicado por falta de avaliação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0">
                Em muitos sistemas de avaliação, se o cliente ou o supervisor esquece de enviar a nota antes do término do prazo, o colaborador ficaria com nota zero ou sem nota no ciclo.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0">
                No <strong>Clube de Talentos</strong>, implementamos a <strong>Replicação Inteligente</strong>:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Se o <strong>Cliente avaliou</strong> mas o <strong>Supervisor não avaliou</strong>: a nota do Cliente é replicada como nota do Supervisor.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Se o <strong>Supervisor avaliou</strong> mas o <strong>Cliente não avaliou</strong>: a nota do Supervisor é replicada como nota do Cliente.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Se <strong>ambos avaliaram</strong>: a média ponderada exata dos dois é utilizada normalmente.</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-indigo-200/70 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quando a replicação acontece?
              </div>
              <ul className="text-xs text-slate-700 space-y-2 m-0 pl-4">
                <li>
                  <strong>Fechamento do Ciclo:</strong> Quando o ciclo é encerrado manualmente pelo administrador ou automaticamente ao passar a data limite.
                </li>
                <li>
                  <strong>Identificação Transparente:</strong> A avaliação replicada fica claramente registrada como <em>"Sistema (nota replicada de [Nome do Avaliador])"</em> para fins de auditoria.
                </li>
                <li>
                  <strong>Segurança:</strong> Se nenhum dos dois avaliou, o sistema não inventa nota, mantendo a integridade dos dados para investigação do RH.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: Penalidades, Bloqueios e Advertências */}
      {shouldShowSection("penalties", "penalidade penalidades advertência falta bloqueio suspensão inelegível pontos desconto") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">7. Penalidades, Bloqueios e Ações Disciplinares</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0">Como funcionam as sanções e o impacto direto na elegibilidade do colaborador</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Tipo 1</span>
                <span className="text-xs font-bold text-rose-600">- Pontos</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Penalidade Simples</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                Desconta uma pontuação fixa da nota do colaborador no ciclo atual (ex: advertência leve = -5 pontos). O colaborador continua participando do ranking.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">Tipo 2</span>
                <span className="text-xs font-bold text-orange-600">1 Ciclo</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Bloqueio de Ciclo</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                Torna o colaborador <strong>inelegível</strong> apenas no ciclo em que ocorreu a infração. Suas avaliações ficam salvas no histórico, mas ele não disputa o ranking nem medalha do ciclo.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">Tipo 3</span>
                <span className="text-xs font-bold text-red-600">Temporada Toda</span>
              </div>
              <h3 className="font-bold text-sm text-slate-800 m-0">Suspensão de Temporada</h3>
              <p className="text-xs text-slate-600 m-0 leading-relaxed">
                Infrações graves desqualificam o profissional de todos os ciclos da temporada vigente. Ele poderá retornar somente na temporada seguinte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: FAQ Interativo */}
      {shouldShowSection("faq", "faq dúvidas perguntas respostas ajuda") && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 m-0">8. Perguntas e Respostas Frequentes (FAQ)</h2>
                <p className="text-xs sm:text-sm text-slate-500 m-0">Respostas rápidas para as principais dúvidas do dia a dia</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => expandAllFaqs(true)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
              >
                Expandir tudo
              </button>
              <button
                type="button"
                onClick={() => expandAllFaqs(false)}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
              >
                Recolher tudo
              </button>
            </div>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm">Nenhuma pergunta encontrada para sua busca.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map(faq => {
                const isOpen = !!openFaq[faq.id];
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-300"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-slate-50/80 transition gap-4"
                    >
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-indigo-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 bg-white border-t border-slate-100">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed m-0 pt-3">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
