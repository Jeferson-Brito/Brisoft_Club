import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2, Star, Filter, Download, Eye,
  Pencil, Search, X, RotateCcw,
  Sparkles, ArrowRight, Calendar,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../app/state';
import { DetailModal } from '../../app/ui';

type DrawerTab = 'avaliacao' | 'elogio' | 'historico';

export default function Concluidas() {
  const { evaluations: allEvaluations, data, refresh, notify, cycle, updateEvaluationStatus } = usePhotoData();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Permissão de exportação: apenas Administrador ou Analista (ou quem tem permissão de reports)
  const profileName = String(data.role?.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const canExport = profileName.includes("admin") || profileName.includes("analista") || Boolean(data.role?.permissions?.includes("reports"));

  // Avaliações concluídas ou canceladas
  const evaluations = useMemo(() => {
    return allEvaluations.filter(item => ['enviada', 'cancelada'].includes(item.status));
  }, [allEvaluations]);

  // Estados de filtro e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'todas' | 'elogio' | 'semelogio' | 'canceladas'>('todas');
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [minAverage, setMinAverage] = useState('');
  const [maxAverage, setMaxAverage] = useState('');
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>([]);

  // Estado do Modal de Detalhes da Avaliação
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('avaliacao');

  // Sincronização segura com parâmetro da URL (?evaluation=ID)
  const requestedId = params.get('evaluation') || '';

  useEffect(() => {
    if (requestedId) {
      const found = evaluations.find(item => String(item.id) === requestedId);
      setSelectedEval((prev: any) => (prev?.id === found?.id ? prev : (found || null)));
    } else {
      setSelectedEval((prev: any) => (prev ? null : prev));
    }
  }, [requestedId, evaluations]);

  const openDetails = (row: any) => {
    setSelectedEval(row);
    setDrawerTab('avaliacao');
    const next = new URLSearchParams(params);
    next.set('evaluation', String(row.id));
    setParams(next, { replace: true });
  };

  const closeDetails = () => {
    setSelectedEval(null);
    if (params.has('evaluation')) {
      const next = new URLSearchParams(params);
      next.delete('evaluation');
      setParams(next, { replace: true });
    }
  };

  const selectedEvalSeason = data.seasons?.find(
    (item: any) => item.id === selectedEval?.seasonId || item.status === 'ativa'
  );
  const selectedEvalCycle = data.cycles?.find(
    (item: any) => item.id === selectedEval?.cycleId || item.status === 'ativo'
  );

  // Opções dinâmicas para funções
  const roleOptions = useMemo(() => [...new Set(evaluations.map(item => item.role).filter(Boolean))], [evaluations]);

  // Cálculo da Média de Avaliação (1 a 5)
  const getAverage = (row: any): string => {
    const answers = row.answers || [];
    if (answers.length > 0) {
      const sum = answers.reduce((acc: number, a: any) => acc + Number(a.value || 0), 0);
      const avg = sum / answers.length;
      return avg.toFixed(1);
    }
    const scores = (row.scores || []).filter((s: any) => typeof s === 'number' && !isNaN(s) && s > 0);
    if (scores.length > 0) {
      const sum = scores.reduce((acc: number, s: number) => acc + Number(s || 0), 0);
      const avg = sum / scores.length;
      return avg.toFixed(1);
    }
    return '-';
  };

  // Obter array de notas para exibição de pills no PC
  const getRowScores = (row: any): number[] => {
    if (Array.isArray(row.scores) && row.scores.length > 0) {
      return row.scores;
    }
    if (Array.isArray(row.answers) && row.answers.length > 0) {
      return row.answers.map((a: any) => Number(a.value || 0)).filter((n: number) => !isNaN(n));
    }
    return [];
  };

  // Quantidade de filtros avançados ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatus !== 'todas') count++;
    if (selectedRole !== 'Todos') count++;
    if (minAverage) count++;
    if (maxAverage) count++;
    return count;
  }, [selectedStatus, selectedRole, minAverage, maxAverage]);

  const resetFilters = () => {
    setSelectedStatus('todas');
    setSelectedRole('Todos');
    setMinAverage('');
    setMaxAverage('');
    setSearchTerm('');
  };

  const canReopen = (row: any) => {
    const isManager = data.role.permissions.includes('evaluations');
    const activeSeason = data.seasons?.find((s: any) => s.status === 'ativa');
    const allowReevaluate =
      activeSeason?.rules?.allowReevaluate !== false &&
      data.settings?.rules?.allowReevaluate !== false;
    const isOwnerEvaluator =
      data.role.permissions.includes('evaluate') &&
      row.evaluatorId === data.user.id &&
      allowReevaluate;
    return (
      cycle?.status === 'ativo' &&
      row.status !== 'rascunho' &&
      (isManager || isOwnerEvaluator)
    );
  };

  const handleReopen = async (row: any) => {
    const confirmed = window.confirm(
      `Deseja reabrir a avaliação de ${row.employee}? Você poderá alterar as notas, justificativas e elogio.`
    );
    if (!confirmed) return;

    // 1. Fecha modal imediatamente
    closeDetails();

    // 2. Atualização otimista: remove de concluídas e reabre no estado local imediatamente
    if (typeof updateEvaluationStatus === 'function') {
      updateEvaluationStatus(row.id, 'rascunho');
    }

    notify('Reabrindo avaliação... Redirecionando para avaliar.');

    // 3. Navegação imediata para a tela de avaliação do colaborador
    navigate(`/avaliacoes/avaliar?participant=${row.participantId}`);

    // 4. Persiste a alteração no servidor em segundo plano
    try {
      await api(`/evaluations/${row.id}/reopen`, { reason: 'Reavaliação solicitada pelo usuário' });
      void refresh().catch(() => {});
    } catch (err: any) {
      notify(err?.message || 'Erro ao reabrir avaliação.');
      void refresh().catch(() => {});
    }
  };

  // Filtragem
  const filtered = useMemo(() => {
    return evaluations.filter(item => {
      const matchesStatus = selectedStatus === 'elogio'
        ? item.status === 'enviada' && item.hasCompliment
        : selectedStatus === 'semelogio'
          ? item.status === 'enviada' && !item.hasCompliment
          : selectedStatus === 'canceladas'
            ? item.status === 'cancelada'
            : item.status === 'enviada';

      if (!matchesStatus) return false;

      // Busca textual por colaborador, matrícula, posto ou função
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          (item.employee && item.employee.toLowerCase().includes(term)) ||
          (item.registration && String(item.registration).toLowerCase().includes(term)) ||
          (item.client && item.client.toLowerCase().includes(term)) ||
          (item.post && item.post.toLowerCase().includes(term)) ||
          (item.role && item.role.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Filtros avançados simplificados
      if (selectedRole !== 'Todos' && item.role !== selectedRole) return false;

      const avgStr = getAverage(item);
      const avgNum = parseFloat(avgStr);
      if (!isNaN(avgNum)) {
        if (minAverage && avgNum < Number(minAverage)) return false;
        if (maxAverage && avgNum > Number(maxAverage)) return false;
      }

      return true;
    });
  }, [evaluations, selectedStatus, searchTerm, selectedRole, minAverage, maxAverage]);

  const toggleSelectAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map((f, i) => f.id ?? (i + 1)));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const selectCls = 'w-full text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer';

  return (
    <div className="space-y-3.5 page-enter max-w-7xl mx-auto pb-10">
      

      {/* ── Barra Superior Limpa: Busca + Filtros + Exportação (se admin/analista) ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          
          {/* Campo de Busca Aprimorado com espaçamento garantido longe da lupa */}
          <div className="relative flex-1 group">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por colaborador, matrícula ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '44px', paddingRight: '36px' }}
              className="w-full h-11 pl-11 pr-4 text-xs sm:text-[13px] bg-slate-50/90 hover:bg-slate-50 focus:bg-white border border-slate-200/90 focus:border-emerald-500 rounded-xl text-slate-800 placeholder-slate-400 outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all font-medium shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botão de Filtros */}
          <button
            type="button"
            onClick={() => setShowFilters(prev => !prev)}
            className={`inline-flex items-center justify-center gap-1.5 h-11 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex-shrink-0 shadow-2xs ${
              showFilters || activeFiltersCount > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <Filter size={15} className={activeFiltersCount > 0 ? 'text-emerald-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Exportação restrita a Administrador ou Analista */}
          {canExport && (
            <a
              href="/api/export/evaluations"
              className="inline-flex items-center justify-center gap-1.5 h-11 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer flex-shrink-0"
              title="Exportar avaliações para planilha Excel"
            >
              <Download size={15} className="text-slate-500" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </a>
          )}
        </div>

        {/* Indicador de Filtros / Busca Ativos */}
        {(activeFiltersCount > 0 || searchTerm) && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100 px-1">
            <span>
              Filtros ativos: <strong className="text-slate-700">{filtered.length}</strong> avaliação(ões) encontrada(s)
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Limpar filtros</span>
            </button>
          </div>
        )}

        {/* ── Painel de Filtros Simplificado (quando expandido) ── */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Opções de Filtro</span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
              >
                Resetar todos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status / Elogio</label>
                <select
                  className={selectCls}
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as any)}
                >
                  <option value="todas">Todas Concluídas</option>
                  <option value="elogio">Com Elogio</option>
                  <option value="semelogio">Sem Elogio</option>
                  <option value="canceladas">Canceladas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Função</label>
                <select className={selectCls} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option>Todos</option>
                  {roleOptions.map(value => <option key={value}>{value}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Média de Avaliação</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Mínima (ex: 3.5)"
                    value={minAverage}
                    onChange={e => setMinAverage(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-slate-400 text-xs font-bold">até</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Máxima (ex: 5.0)"
                    value={maxAverage}
                    onChange={e => setMaxAverage(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center space-y-3 max-w-md mx-auto my-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
            {searchTerm || activeFiltersCount > 0 ? (
              <Search size={22} className="text-slate-400" />
            ) : (
              <CheckCircle2 size={24} className="text-emerald-500" />
            )}
          </div>
          
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-800">
              {searchTerm || activeFiltersCount > 0
                ? 'Nenhuma avaliação encontrada'
                : 'Nenhuma avaliação concluída'}
            </h2>
            <p className="text-xs text-slate-500">
              {searchTerm || activeFiltersCount > 0
                ? 'Tente ajustar ou limpar os filtros de busca.'
                : 'As avaliações concluídas aparecerão aqui.'}
            </p>
          </div>

          {searchTerm || activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Limpar filtros</span>
            </button>
          ) : (
            <Link
              to="/avaliacoes/avaliar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs"
            >
              <span>Avaliar Colaboradores</span>
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* ── Cards no Celular (Mantido como está) ── */}
          <div className="block md:hidden space-y-2.5">
            {filtered.map((row, idx) => {
              const rowId = row.id ?? (idx + 1);
              const avgScore = getAverage(row);

              return (
                <div
                  key={rowId}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={row.employee} src={row.photo} size="md" />
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm truncate leading-snug">
                          {row.employee}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {row.role} · Matrícula <span className="font-mono">{row.registration}</span>
                        </p>
                      </div>
                    </div>

                    {/* Média de Avaliação no Mobile */}
                    <div className="text-right flex-shrink-0 bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-2.5 py-1">
                      <div className="text-base font-black text-emerald-800 leading-none">
                        {avgScore}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 block mt-0.5 uppercase tracking-wider">
                        Média
                      </span>
                    </div>
                  </div>

                  {/* Elogio (se houver) */}
                  {row.hasCompliment && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/70 text-[11px] font-semibold">
                      <Sparkles size={11} className="text-amber-600 flex-shrink-0" />
                      <span className="truncate">Avaliação com elogio registrado</span>
                    </div>
                  )}

                  {/* Apenas a data de avaliação */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium py-1 px-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                    <Calendar size={12} className="text-slate-400" />
                    <span>
                      Data da avaliação: <strong className="text-slate-700">{row.date}</strong>{row.time && row.time !== '—' && ` às ${row.time}`}
                    </span>
                  </div>

                  {/* Botões de Ação Mobile */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openDetails(row)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Ver detalhes</span>
                    </button>
                    {canReopen(row) && (
                      <button
                        type="button"
                        onClick={() => handleReopen(row)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-colors shadow-2xs cursor-pointer"
                      >
                        <Pencil size={13} />
                        <span>Reavaliar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Tabela no Desktop (PC: com Notas pills, Pontuação, Classificação Ouro, etc.) ── */}
          <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <th className="p-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">DATA</th>
                    <th className="py-2.5 px-3">COLABORADOR</th>
                    <th className="py-2.5 px-3">CLIENTE / POSTO</th>
                    <th className="py-2.5 px-3">AVALIADOR</th>
                    <th className="py-2.5 px-3 text-center">NOTAS</th>
                    <th className="py-2.5 px-3 text-center">PONTUAÇÃO</th>
                    <th className="py-2.5 px-3 text-center">CLASSIFICAÇÃO</th>
                    <th className="py-2.5 px-3 text-center">ELOGIO</th>
                    <th className="py-2.5 px-3 text-center">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row, idx) => {
                    const rowId = row.id ?? (idx + 1);
                    const isSelected = selectedRows.includes(rowId);
                    const isDrawerOpen = selectedEval?.id === row.id;
                    const rowScores = getRowScores(row);
                    const rawBadge = (row.badge || row.classification || 'ouro').toLowerCase();
                    const badgeLabel = rawBadge.charAt(0).toUpperCase() + rawBadge.slice(1);
                    const scoreBg = rawBadge === 'ouro'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : rawBadge === 'prata'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : rawBadge === 'bronze'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <tr
                        key={rowId}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isDrawerOpen ? 'bg-blue-50/60' : isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(rowId)}
                            className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-600">{row.date}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={row.employee} src={row.photo} size="sm" />
                            <div>
                              <div className="font-semibold text-slate-800 whitespace-nowrap">{row.employee}</div>
                              <div className="text-[10px] text-slate-400">Matrícula: {row.registration}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="text-slate-700 font-medium">{row.client || '—'}</div>
                          <div className="text-[10px] text-slate-400">{row.post || '—'}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="text-slate-700 font-medium">{row.evaluator || '—'}</div>
                          <div className="text-[10px] text-slate-400">({row.evaluatorRole || 'Cliente'})</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            {rowScores.length > 0 ? (
                              rowScores.map((s: number, i: number) => (
                                <span
                                  key={i}
                                  className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                                    s === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-300 text-[11px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center font-black text-slate-800">
                          {row.score ?? 0}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${scoreBg}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          {row.hasCompliment ? (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-0.5">
                              🏆 Sim
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">— Não</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetails(row)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline cursor-pointer"
                              title="Ver detalhes da avaliação"
                            >
                              <Eye size={12} />
                              <span>Ver</span>
                            </button>
                            {canReopen(row) && (
                              <button
                                type="button"
                                onClick={() => handleReopen(row)}
                                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 font-bold text-[11px] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Reabrir e alterar notas desta avaliação"
                              >
                                <Pencil size={11} />
                                <span>Reavaliar</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer de Contagem exatamente como no padrão */}
            <div className="p-3 border-t border-slate-100 text-xs text-slate-500">
              Mostrando {filtered.length} de {evaluations.length} resultados reais
            </div>
          </div>
        </>
      )}

      {/* ── Modal de Detalhes da Avaliação (3 Sub-abas: Avaliação, Elogio, Histórico) ── */}
      {selectedEval && (
        <DetailModal
          label={`Detalhes da avaliação de ${selectedEval.employee}`}
          onClose={closeDetails}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Pinned Top: Header com Colaborador + 3 Sub-abas */}
            <div className="space-y-2.5 flex-shrink-0 pb-2">
              <div className="flex items-center gap-3">
                <Avatar name={selectedEval.employee} src={selectedEval.photo} size="md" />
                <div>
                  <div className="text-sm font-bold text-slate-800">{selectedEval.employee}</div>
                  <div className="text-[11px] text-slate-500">
                    Matrícula {selectedEval.registration} · {selectedEval.role}
                  </div>
                </div>
              </div>

              {/* Sub-abas fixas */}
              <div className="flex border-b border-slate-200 text-xs">
                {(['avaliacao', 'elogio', 'historico'] as DrawerTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(tab)}
                    className={`flex-1 py-2 font-bold text-center capitalize border-b-2 transition-colors cursor-pointer ${
                      drawerTab === tab
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'avaliacao' ? 'Avaliação' : tab === 'elogio' ? 'Elogio' : 'Histórico'}
                  </button>
                ))}
              </div>
            </div>

            {/* Corpo de Conteúdo com Rolagem Interna e Altura Estável */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-3 pt-1">
              
              {/* Aba: Avaliação */}
              {drawerTab === 'avaliacao' && (
                <div className="space-y-3 text-xs">
                  {/* Meta Informações */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-slate-50/70 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-slate-400">Data da avaliação</div>
                      <div className="font-semibold text-slate-700">{selectedEval.date}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Avaliador</div>
                      <div className="font-semibold text-slate-700">{selectedEval.evaluator}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Cliente / Posto</div>
                      <div className="font-semibold text-slate-700">{selectedEval.client}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Temporada / Ciclo</div>
                      <div className="font-semibold text-slate-700">
                        {selectedEvalSeason?.name || '—'} - {selectedEvalCycle?.name || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Notas e Critérios */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Notas e comentários
                    </div>
                    <div className="space-y-2">
                      {(selectedEval.answers || []).map((answer: any) => {
                        const criterion = selectedEvalSeason?.rules?.criteria?.find((item: any) => item.id === answer.criterionId);
                        const option = selectedEvalSeason?.rules?.scale?.find((item: any) => item.value === answer.value);
                        return (
                          <div key={answer.criterionId} className="p-2 rounded-lg border border-slate-100 bg-white">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 text-[11px]">
                                {answer.name || criterion?.name || answer.criterionId}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {answer.value} - {option?.label || 'Nota registrada'}
                              </span>
                            </div>
                            {criterion?.description && (
                              <p className="text-[10px] text-slate-400 mb-1">{criterion.description}</p>
                            )}
                            <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                              {answer.comment || 'Sem comentário.'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resumo de Nota e Média */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                    <div>
                      <div className="text-xl font-black text-emerald-800 leading-none">
                        Média {getAverage(selectedEval)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Pontuação: {selectedEval.score} pts
                      </div>
                    </div>
                    {selectedEval.hasCompliment && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          🏆 Com elogio
                        </span>
                        <div className="text-[10px] text-emerald-600 font-bold">
                          +{selectedEval.complimentPoints || 0} pontos
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ações do Rodapé do Modal */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={closeDetails}
                      type="button"
                      className="flex-1 text-center py-2 px-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      ← Voltar para a lista
                    </button>
                    {canReopen(selectedEval) && (
                      <button
                        type="button"
                        onClick={() => handleReopen(selectedEval)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Pencil size={12} />
                        <span>Reabrir e Reavaliar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Aba: Elogio */}
              {drawerTab === 'elogio' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <Star size={14} className="fill-amber-400" />
                    <span>Elogio Registrado</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {selectedEval.compliment || 'Esta avaliação não possui elogio registrado.'}
                  </p>
                </div>
              )}

              {/* Aba: Histórico de Revisões */}
              {drawerTab === 'historico' && (
                <div className="text-xs space-y-2 text-slate-500">
                  <div className="p-2 border-l-2 border-emerald-500 bg-slate-50 rounded-r-lg">
                    <div className="font-semibold text-slate-700">Avaliação enviada</div>
                    <div className="text-[10px] text-slate-500">{selectedEval.date} por {selectedEval.evaluator}</div>
                  </div>
                  {(selectedEval.revisions || []).length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[11px] italic">
                      Nenhuma alteração ou revisão registrada para esta avaliação.
                    </div>
                  ) : (
                    (selectedEval.revisions || []).map((revision: any, index: number) => (
                      <div key={index} className="p-2 border-l-2 border-slate-300 bg-slate-50 rounded-r-lg">
                        <div className="font-semibold text-slate-700">Versão anterior preservada</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(revision.date).toLocaleString('pt-BR')} · {revision.score} pontos · {revision.reason}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
}
