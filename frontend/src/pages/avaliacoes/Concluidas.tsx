import { useState } from 'react';
import { CheckCircle2, Users, Star, FileText, Filter, Download, Eye, Calendar } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';
import { Link } from 'react-router-dom';

export default function Concluidas() {
  const { evaluations: allEvaluations, clients, cycle } = usePhotoData();
  const evaluations = allEvaluations.filter(item => ['enviada', 'cancelada'].includes(item.status));
  const completedEvaluations = evaluations.filter(item => item.status === 'enviada');
  const [filterTab, setFilterTab] = useState<'todas' | 'elogio' | 'semelogio' | 'canceladas'>('todas');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [selectedEvaluator, setSelectedEvaluator] = useState('Todos');
  const [selectedClassification, setSelectedClassification] = useState('Todos');
  const [selectedCompliment, setSelectedCompliment] = useState('Todos');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>([]);

  const filtered = evaluations.filter(item => {
    const matchesTab = filterTab === 'elogio'
      ? item.status === 'enviada' && item.hasCompliment
      : filterTab === 'semelogio'
        ? item.status === 'enviada' && !item.hasCompliment
        : filterTab === 'canceladas'
          ? item.status === 'cancelada'
          : item.status === 'enviada';
    return (
      matchesTab &&
      (selectedClient === 'Todos' || item.client === selectedClient) &&
      (selectedPost === 'Todos' || item.post === selectedPost) &&
      (selectedRole === 'Todos' || item.role === selectedRole) &&
      (selectedEvaluator === 'Todos' || item.evaluator === selectedEvaluator) &&
      (selectedClassification === 'Todos' || item.badge === selectedClassification.toLowerCase()) &&
      (selectedCompliment === 'Todos' || item.hasCompliment === (selectedCompliment === 'Sim')) &&
      (!minScore || item.score >= Number(minScore)) &&
      (!maxScore || item.score <= Number(maxScore))
    );
  });
  const clientOptions = [...new Set(evaluations.map(item => item.client).filter(Boolean))];
  const postOptions = [...new Set(evaluations.map(item => item.post).filter(Boolean))];
  const roleOptions = [...new Set(evaluations.map(item => item.role).filter(Boolean))];
  const evaluatorOptions = [...new Set(evaluations.map(item => item.evaluator).filter(Boolean))];
  const complimentCount = completedEvaluations.filter(item => item.hasCompliment).length;

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

  const selectCls = 'w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer';

  return (
    <div className="space-y-3.5 page-enter">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{completedEvaluations.length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações concluídas</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">na temporada selecionada</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{new Set(evaluations.map(item => item.client)).size}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Clientes com avaliações</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">de {clients.length} clientes</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Star size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{complimentCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Com elogios</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{completedEvaluations.length ? Math.round(complimentCount / completedEvaluations.length * 100) : 0}% das avaliações</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{evaluations.filter(item => item.status === 'cancelada').length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações canceladas</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">neste período</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <details className="filter-disclosure bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-2.5">
        <summary className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter size={14} className="text-slate-500" />
            <span>Filtros</span>
          </div>
          <button
            onClick={(event) => {
              event.preventDefault();
              setSelectedClient('Todos');
              setSelectedPost('Todos');
              setSelectedRole('Todos');
              setSelectedEvaluator('Todos');
              setSelectedClassification('Todos');
              setSelectedCompliment('Todos');
              setMinScore('');
              setMaxScore('');
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Limpar filtros
          </button>
        </summary>

        {/* Row 1: Período, Cliente, Posto, Função, Avaliador */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Período</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={cycle ? `${cycle.start} - ${cycle.end}` : ''}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-600 cursor-default"
              />
              <Calendar size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cliente</label>
            <select className={selectCls} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option>Todos</option>
              {clientOptions.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Posto</label>
            <select className={selectCls} value={selectedPost} onChange={e => setSelectedPost(e.target.value)}>
              <option>Todos</option>
              {postOptions.map(value => <option key={value}>{value}</option>)}
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Avaliador</label>
            <select className={selectCls} value={selectedEvaluator} onChange={e => setSelectedEvaluator(e.target.value)}>
              <option>Todos</option>
              {evaluatorOptions.map(value => <option key={value}>{value}</option>)}
            </select>
          </div>
        </div>

        {/* Row 2: Nota final, Classificação, Com elogio, Aplicar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nota final</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Mínima"
                value={minScore}
                onChange={e => setMinScore(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="number"
                placeholder="Máxima"
                value={maxScore}
                onChange={e => setMaxScore(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
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
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Com elogio</label>
            <select className={selectCls} value={selectedCompliment} onChange={e => setSelectedCompliment(e.target.value)}>
              <option>Todos</option>
              <option>Sim</option>
              <option>Não</option>
            </select>
          </div>

          <div className="flex items-end justify-end">
            <span className="text-[11px] text-slate-400">Os filtros são aplicados automaticamente.</span>
          </div>
        </div>
      </details>

      {/* ── Sub-tabs & Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTab('todas')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'todas'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Todas ({completedEvaluations.length})
          </button>
          <button
            onClick={() => setFilterTab('elogio')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterTab === 'elogio'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-slate-200/80 hover:bg-emerald-50/50'
            }`}
          >
            <span>Com elogio</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterTab === 'elogio' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-800'}`}>
              {completedEvaluations.filter(item => item.hasCompliment).length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('semelogio')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterTab === 'semelogio'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-slate-200/80 hover:bg-amber-50/50'
            }`}
          >
            <span>Sem elogio</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterTab === 'semelogio' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
              {completedEvaluations.filter(item => !item.hasCompliment).length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('canceladas')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterTab === 'canceladas'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white text-rose-600 border border-slate-200/80 hover:bg-rose-50/50'
            }`}
          >
            <span>Canceladas</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterTab === 'canceladas' ? 'bg-white/20' : 'bg-rose-100 text-rose-700'}`}>
              {evaluations.filter(item => item.status === 'cancelada').length}
            </span>
          </button>
        </div>

        {/* Export */}
        <a href="/api/export/evaluations" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors self-end sm:self-auto">
          <Download size={12} />
          <span>Exportar Excel</span>
        </a>
      </div>

      {/* ── Mobile Cards View (Telas menores que md) ── */}
      <div className="block md:hidden space-y-3">
        {filtered.map((row, idx) => {
          const rowId = row.id ?? (idx + 1);
          const badgeLabel = row.badge ? row.badge.charAt(0).toUpperCase() + row.badge.slice(1) : 'Sem medalha';
          const scoreBg = row.badge === 'ouro'
            ? 'bg-amber-100 text-amber-800 border-amber-200'
            : row.badge === 'prata'
            ? 'bg-slate-100 text-slate-700 border-slate-300'
            : 'bg-orange-100 text-orange-800 border-orange-200';

          return (
            <div key={rowId} className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={row.employee} src={row.photo} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate leading-tight">{row.employee}</h3>
                    <p className="text-[11px] text-slate-500 truncate">{row.role} · Matrícula {row.registration}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-black text-slate-800 leading-tight">{row.score} pts</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${scoreBg}`}>
                    {badgeLabel}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Cliente / Posto:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[190px]">{row.client} · {row.post}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Avaliador:</span>
                  <div className="flex items-center gap-1.5 truncate max-w-[190px]">
                    <span className="font-semibold text-slate-700 truncate">{row.evaluator}</span>
                    {row.replicated && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Replicada</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Data de envio:</span>
                  <span className="text-slate-600">{row.date} às {row.time}</span>
                </div>
              </div>

              <Link
                to={`/avaliacoes/historico?evaluation=${row.id}`}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs py-2 px-3 rounded-lg transition-colors"
              >
                <Eye size={13} />
                <span>Ver detalhes da avaliação</span>
              </Link>
            </div>
          );
        })}
        <div className="p-2 text-center text-xs text-slate-400 font-medium">
          Mostrando {filtered.length} de {evaluations.length} avaliações concluídas
        </div>
      </div>

      {/* ── Desktop Table (Telas médias e grandes) ── */}
      <div className="hidden md:block bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] whitespace-nowrap">
                <th className="p-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Matrícula</th>
                <th className="py-2.5 px-3">Função</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Posto</th>
                <th className="py-2.5 px-3">Avaliador</th>
                <th className="py-2.5 px-3">Data da avaliação</th>
                <th className="py-2.5 px-3 text-center">Notas</th>
                <th className="py-2.5 px-3 text-center">Pontuação</th>
                <th className="py-2.5 px-3 text-center">Classificação</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, idx) => {
                const rowId = row.id ?? (idx + 1);
                const isSelected = selectedRows.includes(rowId);
                const badgeLabel = row.badge ? row.badge.charAt(0).toUpperCase() + row.badge.slice(1) : 'Sem medalha';
                const scoreBg = row.badge === 'ouro'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : row.badge === 'prata'
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-orange-100 text-orange-800 border-orange-200';

                return (
                  <tr key={rowId} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowId)}
                        className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={row.employee} src={row.photo} size="sm" />
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{row.employee}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.registration}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{row.role}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{row.client}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.post}</td>
                    <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{row.evaluator}</span>
                        {row.replicated && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Replicada</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">({row.evaluatorRole})</div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div>{row.date}</div>
                      <div className="text-[10px] text-slate-400">{row.time}</div>
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
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/avaliacoes/historico?evaluation=${row.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 font-semibold text-[11px] px-2 py-0.5 rounded-md transition-colors">
                          <Eye size={12} />
                          <span>Ver</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 text-xs text-slate-500">
          Mostrando {filtered.length} de {evaluations.length} resultados reais
        </div>
      </div>
    </div>
  );
}
