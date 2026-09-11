import { useEffect, useState } from 'react';
import {
  Calendar, CheckCircle2, Star, MessageSquare, Filter,
  Download, Eye, X,
  Pencil,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { DetailModal } from '../../app/ui';
import { usePhotoData } from '../../app/photo-data';
import { api } from '../../app/state';
import { useSearchParams } from 'react-router-dom';

type DrawerTab = 'avaliacao' | 'elogio' | 'historico';

export default function Historico() {
  const { evaluations, season: _season, data, refresh, notify } = usePhotoData();
  const [params, setParams] = useSearchParams();
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('avaliacao');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('Todos');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedEvaluator, setSelectedEvaluator] = useState('Todos');
  const [selectedClassification, setSelectedClassification] = useState('Todos');
  const [selectedScore, setSelectedScore] = useState('Todos');
  const [selectedCompliment, setSelectedCompliment] = useState('Todos');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>([]);

  const historyData = evaluations
    .filter((evaluation) => !selectedSeason || evaluation.seasonId === selectedSeason)
    .filter((evaluation) => selectedCycle === 'Todos' || evaluation.cycleId === selectedCycle)
    .filter((evaluation) => selectedClient === 'Todos' || evaluation.client === selectedClient)
    .filter((evaluation) => selectedPost === 'Todos' || evaluation.post === selectedPost)
    .filter((evaluation) => selectedEvaluator === 'Todos' || evaluation.evaluator === selectedEvaluator)
    .filter((evaluation) => selectedClassification === 'Todos' || evaluation.badge === selectedClassification.toLowerCase())
    .filter((evaluation) => selectedScore === 'Todos' || evaluation.scores.includes(Number(selectedScore)))
    .filter((evaluation) => selectedCompliment === 'Todos' || evaluation.hasCompliment === (selectedCompliment === 'Sim'))
    .filter((evaluation) => !searchEmployee || `${evaluation.employee} ${evaluation.registration}`.toLowerCase().includes(searchEmployee.toLowerCase()))
    .filter((evaluation) => !startDate || String(evaluation.sentAt || evaluation.createdAt).slice(0, 10) >= startDate)
    .filter((evaluation) => !endDate || String(evaluation.sentAt || evaluation.createdAt).slice(0, 10) <= endDate)
    .map((e, i) => ({ ...e, id: e.id ?? i + 1 }));
  const completedCount = historyData.filter(item => item.status === 'enviada').length;
  const complimentCount = historyData.filter(item => item.hasCompliment).length;
  const clients = [...new Set(evaluations.map(item => item.client).filter(Boolean))];
  const posts = [...new Set(evaluations.map(item => item.post).filter(Boolean))];
  const evaluators = [...new Set(evaluations.map(item => item.evaluator).filter(Boolean))];
  const cycleOptions = data.cycles.filter(item => !selectedSeason || item.seasonId === selectedSeason);
  const scaleOptions = [...new Map(data.seasons.flatMap(item => item.rules?.scale || []).map((item: any) => [item.value, item])).values()];
  const selectedEvalSeason = data.seasons.find(item => item.id === selectedEval?.seasonId);
  const selectedEvalCycle = data.cycles.find(item => item.id === selectedEval?.cycleId);

  useEffect(() => {
    const requested = params.get('evaluation');
    if (requested) setSelectedEval(evaluations.find(item => String(item.id) === requested) || null);
  }, [params, evaluations]);

  const closeDetails = () => {
    const next = new URLSearchParams(params);
    next.delete('evaluation');
    setParams(next, { replace: true });
    setSelectedEval(null);
  };

  const selectCls = 'w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer';

  const toggleSelectAll = () => {
    if (selectedRows.length === historyData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(historyData.map(f => f.id));
    }
  };

  const toggleSelectRow = (id: string | number) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-3.5 page-enter">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{historyData.length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações realizadas</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">conforme os filtros atuais</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{completedCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações concluídas</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{historyData.length ? Math.round(completedCount / historyData.length * 100) : 0}% do total filtrado</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Star size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{complimentCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Com elogio</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{historyData.length ? Math.round(complimentCount / historyData.length * 100) : 0}% das avaliações</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{historyData.length ? Math.round(historyData.filter(item => item.status === 'enviada').length / historyData.length * 100) : 0}%</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Taxa de resposta</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">de clientes ativos</div>
          </div>
        </div>
      </div>

      {/* ── Filters Section ── */}
      <details className="filter-disclosure bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-2.5">
        <summary className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-slate-500" />
            <span>Filtros</span>
          </div>
          <button
            onClick={(event) => {
              event.preventDefault();
              setSelectedSeason('');
              setSelectedCycle('Todos');
              setSelectedClient('Todos');
              setSelectedPost('Todos');
              setSelectedEvaluator('Todos');
              setSelectedClassification('Todos');
              setSelectedScore('Todos');
              setSelectedCompliment('Todos');
              setSearchEmployee('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Limpar filtros
          </button>
        </summary>

        {/* 10 Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Temporada</label>
            <select className={selectCls} value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)}>
              <option value="">Todas</option>
              {data.seasons.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ciclo</label>
            <select className={selectCls} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>
              <option value="Todos">Todos</option>
              {cycleOptions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cliente</label>
            <select className={selectCls} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option>Todos</option>
              {clients.map(client => <option key={client}>{client}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Posto</label>
            <select className={selectCls} value={selectedPost} onChange={e => setSelectedPost(e.target.value)}>
              <option>Todos</option>
              {posts.map(post => <option key={post}>{post}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Colaborador</label>
            <input
              type="text"
              placeholder="Buscar por nome ou matrícula..."
              value={searchEmployee}
              onChange={e => setSearchEmployee(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Avaliador</label>
            <select className={selectCls} value={selectedEvaluator} onChange={e => setSelectedEvaluator(e.target.value)}>
              <option>Todos</option>
              {evaluators.map(evaluator => <option key={evaluator}>{evaluator}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Classificação</label>
            <select className={selectCls} value={selectedClassification} onChange={e => setSelectedClassification(e.target.value)}>
              <option>Todos</option>
              <option>Ouro</option>
              <option>Prata</option>
              <option>Bronze</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nota</label>
            <select className={selectCls} value={selectedScore} onChange={e => setSelectedScore(e.target.value)}>
              <option>Todos</option>
              {scaleOptions.map((item: any) => <option key={item.value} value={item.value}>{item.value} - {item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Com elogio</label>
            <select className={selectCls} value={selectedCompliment} onChange={e => setSelectedCompliment(e.target.value)}>
              <option>Todos</option>
              <option>Sim</option>
              <option>Não</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Período da avaliação</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="text-right text-[11px] text-slate-400">Os filtros são aplicados automaticamente.</div>
      </details>

      {/* ── Main Layout: Table + Side Drawer ── */}
      <div className="flex flex-col xl:flex-row gap-3.5 items-start">
        {/* Table Column */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <span className="text-amber-500">★</span>
              <span>Avaliações ({historyData.length})</span>
            </div>
            <a href="/api/export/evaluations" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
              <Download size={12} />
              <span>Exportar Excel</span>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] whitespace-nowrap">
                    <th className="p-2.5 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === historyData.length && historyData.length > 0}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">Cliente / Posto</th>
                    <th className="py-2.5 px-3">Avaliador</th>
                    <th className="py-2.5 px-3 text-center">Notas</th>
                    <th className="py-2.5 px-3 text-center">Pontuação</th>
                    <th className="py-2.5 px-3 text-center">Classificação</th>
                    <th className="py-2.5 px-3 text-center">Elogio</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyData.map(row => {
                    const isSelected = selectedRows.includes(row.id);
                    const isDrawerOpen = selectedEval?.id === row.id;
                    const badgeLabel = row.badge ? row.badge.charAt(0).toUpperCase() + row.badge.slice(1) : 'Sem medalha';
                    const scoreBg = row.badge === 'ouro'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : row.badge === 'prata'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-orange-100 text-orange-800 border-orange-200';

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isDrawerOpen ? 'bg-blue-50/60' : isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(row.id)}
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
                          <div className="text-slate-700 font-medium">{row.client}</div>
                          <div className="text-[10px] text-slate-400">{row.post}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="text-slate-700 font-medium">{row.evaluator}</div>
                          <div className="text-[10px] text-slate-400">({row.evaluatorRole})</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            {row.scores.map((s: number, i: number) => (
                              <span key={i} className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                                s === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center font-black text-slate-800">{row.score}</td>
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
                          <button
                            onClick={() => setSelectedEval(isDrawerOpen ? null : row)}
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                              isDrawerOpen
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70'
                            }`}
                          >
                            <Eye size={12} />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-xs text-slate-500">Mostrando {historyData.length} de {evaluations.length} resultados reais</div>
          </div>
        </div>

        {/* ── Side Details Drawer ── */}
        {selectedEval && (
          <DetailModal label={`Detalhes da avaliação de ${selectedEval.employee}`} onClose={closeDetails}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detalhes da Avaliação</h2>
              <button
                onClick={closeDetails}
                type="button"
                aria-label="Fechar detalhes da avaliação"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Collaborator info card */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Avatar name={selectedEval.employee} src={selectedEval.photo} size="md" />
                <div>
                  <div className="text-xs font-bold text-slate-800">{selectedEval.employee}</div>
                  <div className="text-[10px] text-slate-400">Matrícula: {selectedEval.registration}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                🏆 {selectedEval.badge ? selectedEval.badge.charAt(0).toUpperCase() + selectedEval.badge.slice(1) : 'Sem classificação'}
              </span>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 text-xs">
              {(['avaliacao', 'elogio', 'historico'] as DrawerTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`flex-1 py-1.5 font-bold text-center capitalize border-b-2 transition-colors ${
                    drawerTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'avaliacao' ? 'Avaliação' : tab === 'elogio' ? 'Elogio' : 'Histórico'}
                </button>
              ))}
            </div>

            {/* Tab content: Avaliação */}
            {drawerTab === 'avaliacao' && (
              <div className="space-y-3 text-xs">
                {/* 2x2 Meta info */}
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
                    <div className="font-semibold text-slate-700">{selectedEvalSeason?.name || '—'} - {selectedEvalCycle?.name || '—'}</div>
                  </div>
                </div>

                {/* Notas e comentários */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Notas e comentários</div>
                  <div className="space-y-2">
                    {(selectedEval.answers || []).map((answer: any) => {
                      const criterion = selectedEvalSeason?.rules?.criteria?.find((item: any) => item.id === answer.criterionId);
                      const option = selectedEvalSeason?.rules?.scale?.find((item: any) => item.value === answer.value);
                      return (
                      <div key={answer.criterionId} className="p-2 rounded-lg border border-slate-100 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-[11px]">{answer.name || criterion?.name || answer.criterionId}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            {answer.value} - {option?.label || 'Nota registrada'}
                          </span>
                        </div>
                        {criterion?.description && <p className="text-[10px] text-slate-400 mb-1">{criterion.description}</p>}
                        <p className="text-[10px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                          {answer.comment || 'Sem comentário.'}
                        </p>
                      </div>
                    )})}
                  </div>
                </div>

                {/* Score summary */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div>
                    <div className="text-xl font-black text-blue-700 leading-none">{selectedEval.score}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pontuação total</div>
                  </div>
                  {selectedEval.hasCompliment && <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      🏆 Com elogio
                    </span>
                    <div className="text-[10px] text-emerald-600 font-bold">+{selectedEval.complimentPoints || 0} pontos</div>
                  </div>}
                </div>

                {/* Actions footer */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={closeDetails}
                    type="button"
                    className="flex-1 text-center py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    ← Voltar para a lista
                  </button>
                  {data.role.permissions.includes('evaluations') && selectedEval.status !== 'rascunho' && selectedEvalCycle?.status === 'ativo' && <button
                    onClick={async () => {
                      const reason = window.prompt('Motivo da reabertura para correção:');
                      if (!reason) return;
                      try {
                        await api(`/evaluations/${selectedEval.id}/reopen`, { reason });
                        await refresh();
                        closeDetails();
                        notify('Avaliação reaberta para correção.');
                      } catch (error) {
                        notify((error as Error).message);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs">
                    <Pencil size={11} />
                    <span>Reabrir avaliação</span>
                  </button>}
                </div>
              </div>
            )}

            {drawerTab === 'elogio' && (
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-1 text-amber-700 font-bold">
                  <Star size={14} className="fill-amber-400" />
                  <span>Elogio Registrado</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{selectedEval.compliment || 'Esta avaliação não possui elogio registrado.'}</p>
              </div>
            )}

            {drawerTab === 'historico' && (
              <div className="text-xs space-y-2 text-slate-500">
                <div className="p-2 border-l-2 border-blue-500 bg-slate-50">
                  <div className="font-semibold text-slate-700">Avaliação enviada</div>
                  <div className="text-[10px]">{selectedEval.date} por {selectedEval.evaluator}</div>
                </div>
                {(selectedEval.revisions || []).map((revision: any, index: number) => (
                  <div key={index} className="p-2 border-l-2 border-slate-300 bg-slate-50">
                    <div className="font-semibold text-slate-700">Versão anterior preservada</div>
                    <div className="text-[10px]">{new Date(revision.date).toLocaleString('pt-BR')} · {revision.score} pontos · {revision.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </DetailModal>
        )}
      </div>
    </div>
  );
}
