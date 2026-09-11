import { useState } from 'react';
import { Clock, Users, Filter, ChevronRight, Download, Search, Building2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';

const PAGE_LOADED_AT = Date.now();

export default function Pendentes() {
  const { pending: pendingEvaluations, clients, cycle, data } = usePhotoData();

  // Avaliação dupla: detectar quais avaliadores já submeteram por participante
  const roles = data.roles;
  const clientRoleIds = new Set(roles.filter(r => r.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'cliente').map(r => r.id));
  const supervisorRoleIds = new Set(roles.filter(r => ['supervisor', 'fiscal'].includes(r.name?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '')).map(r => r.id));

  const getEvalStatus = (participantId: string) => {
    const evals = data.evaluations.filter(e => e.participantId === participantId && e.status === 'enviada' && !e.replicated);
    return {
      clientDone: evals.some(e => clientRoleIds.has(e.roleId)),
      supervisorDone: evals.some(e => supervisorRoleIds.has(e.roleId)),
    };
  };
  const [filterTab, setFilterTab] = useState<'todos' | 'atrasados' | 'iniciada'>('todos');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [selectedEvaluator, setSelectedEvaluator] = useState('Todos');
  const [situacoes, setSituacoes] = useState({ naoAvaliado: true, iniciada: false, atrasado: false });
  const [sortBy, setSortBy] = useState('deadline');
  const [selectedRows, setSelectedRows] = useState<Array<string | number>>([]);

  const filtered = pendingEvaluations.filter(item => {
    const matchesTab = filterTab === 'atrasados'
      ? item.status === 'atrasado'
      : filterTab === 'iniciada'
        ? item.status === 'iniciada'
        : true;
    const activeSituations = [situacoes.naoAvaliado, situacoes.iniciada, situacoes.atrasado].some(Boolean);
    const matchesSituation = !activeSituations ||
      (situacoes.naoAvaliado && item.status === 'pendente') ||
      (situacoes.iniciada && item.status === 'iniciada') ||
      (situacoes.atrasado && item.status === 'atrasado');
    return matchesTab && matchesSituation && (
      (selectedClient === 'Todos' || item.client === selectedClient) &&
      (selectedPost === 'Todos' || item.post === selectedPost) &&
      (selectedRole === 'Todos' || item.role === selectedRole) &&
      (selectedEvaluator === 'Todos' || item.evaluator === selectedEvaluator)
    );
  }).sort((a, b) => sortBy === 'name'
    ? a.employee.localeCompare(b.employee)
    : sortBy === 'client'
      ? a.client.localeCompare(b.client)
      : String(a.deadlineRaw).localeCompare(String(b.deadlineRaw)));

  const toggleSelectAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map(f => f.id));
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
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{pendingEvaluations.length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações pendentes</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">no ciclo ativo</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{new Set(pendingEvaluations.map(item => item.client)).size}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Clientes com pendências</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">de {clients.length} clientes</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{new Set(pendingEvaluations.map(item => item.employeeId)).size}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Não avaliados</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">de {data.employees.length} colaboradores</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{Math.max(0, Math.ceil((new Date(`${cycle?.deadline || ''}T12:00:00`).getTime() - PAGE_LOADED_AT) / 86400000) || 0)}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Dias restantes</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">Até {cycle?.deadline || '—'}</div>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <details className="filter-disclosure bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-3">
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
              setSituacoes({ naoAvaliado: true, iniciada: false, atrasado: false });
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Limpar filtros
          </button>
        </summary>

        {/* 4 Selects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cliente</label>
            <select className={selectCls} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
              <option>Todos</option>
              {clients.map(client => <option key={client.id}>{client.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Posto</label>
            <select className={selectCls} value={selectedPost} onChange={e => setSelectedPost(e.target.value)}>
              <option>Todos</option>
              {[...new Set(pendingEvaluations.map(item => item.post))].map(post => <option key={post}>{post}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Função</label>
            <select className={selectCls} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
              <option>Todos</option>
              {[...new Set(pendingEvaluations.map(item => item.role))].map(role => <option key={role}>{role}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Avaliador</label>
            <select className={selectCls} value={selectedEvaluator} onChange={e => setSelectedEvaluator(e.target.value)}>
              <option>Todos</option>
              {[...new Set(pendingEvaluations.map(item => item.evaluator))].map(evaluator => <option key={evaluator}>{evaluator}</option>)}
            </select>
          </div>
        </div>

        {/* Situação Checkboxes + Aplicar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500">Situação:</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={situacoes.naoAvaliado}
                onChange={e => setSituacoes(s => ({ ...s, naoAvaliado: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Não avaliado</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={situacoes.iniciada}
                onChange={e => setSituacoes(s => ({ ...s, iniciada: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Avaliação iniciada</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={situacoes.atrasado}
                onChange={e => setSituacoes(s => ({ ...s, atrasado: e.target.checked }))}
                className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
              <span>Atrasado</span>
            </label>
          </div>

          <span className="text-[11px] text-slate-400">Os filtros são aplicados automaticamente.</span>
        </div>
      </details>

      {/* ── Sub-tabs & Quick Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterTab('todos')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterTab === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Todos ({pendingEvaluations.length})
          </button>
          <button
            onClick={() => setFilterTab('atrasados')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterTab === 'atrasados'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white text-rose-600 border border-slate-200/80 hover:bg-rose-50/50'
            }`}
          >
            <span>Atrasados</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterTab === 'atrasados' ? 'bg-white/20' : 'bg-rose-100 text-rose-700'}`}>
              {pendingEvaluations.filter(item => item.status === 'atrasado').length}
            </span>
          </button>
          <button
            onClick={() => setFilterTab('iniciada')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              filterTab === 'iniciada'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-slate-200/80 hover:bg-amber-50/50'
            }`}
          >
            <span>Avaliação iniciada</span>
            <span className={`text-[10px] px-1 py-0.2 rounded-full ${filterTab === 'iniciada' ? 'bg-white/20' : 'bg-amber-100 text-amber-800'}`}>
              {pendingEvaluations.filter(item => item.status === 'iniciada').length}
            </span>
          </button>
        </div>

        {/* Sort & Export */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline text-[11px]">Ordenar por:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs font-medium border border-slate-200/80 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none cursor-pointer">
              <option value="deadline">Prazo (mais próximo)</option>
              <option value="name">Nome (A-Z)</option>
              <option value="client">Cliente</option>
            </select>
          </div>
          <a href="/api/export/pending" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
            <Download size={12} />
            <span>Exportar</span>
          </a>
        </div>
      </div>

      {/* ── Mobile Cards View (Telas menores que md) ── */}
      <div className="block md:hidden space-y-3">
        {filtered.map(row => {
          const { clientDone, supervisorDone } = getEvalStatus(row.id);
          return (
            <div key={row.id} className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={row.employee} src={row.photo} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate leading-tight">{row.employee}</h3>
                    <p className="text-[11px] text-slate-500 truncate">{row.role} · Matrícula {row.registration}</p>
                  </div>
                </div>
                {row.status === 'atrasado' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80 flex-shrink-0">
                    Atrasado
                  </span>
                ) : row.status === 'iniciada' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 flex-shrink-0">
                    Iniciada
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex-shrink-0">
                    Pendente
                  </span>
                )}
              </div>

              <div className="bg-slate-50/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Cliente / Posto:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[190px]">{row.client} · {row.post}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Prazo:</span>
                  <span className={`font-semibold ${row.status === 'atrasado' ? 'text-rose-600' : 'text-slate-700'}`}>
                    {row.deadline} ({row.daysLeft})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Avaliações:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      clientDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {clientDone ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                      Cliente
                    </span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      supervisorDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {supervisorDone ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                      Supervisor
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/avaliacoes/avaliar?participant=${row.id}`}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-xs active:scale-98"
              >
                <span>Avaliar Colaborador</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          );
        })}
        <div className="p-2 text-center text-xs text-slate-400 font-medium">
          Mostrando {filtered.length} de {pendingEvaluations.length} colaboradores pendentes
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
                <th className="py-2.5 px-3">Avaliadores</th>
                <th className="py-2.5 px-3">Situação</th>
                <th className="py-2.5 px-3">Prazo</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(row => {
                const isSelected = selectedRows.includes(row.id);
                return (
                  <tr key={row.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
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
                    <td className="py-2 px-3 whitespace-nowrap">
                      {(() => {
                        const { clientDone, supervisorDone } = getEvalStatus(row.id);
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              clientDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {clientDone ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                              Cliente
                            </span>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              supervisorDone ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {supervisorDone ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
                              Supervisor
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {row.status === 'atrasado' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/80">
                          Atrasado
                        </span>
                      ) : row.status === 'iniciada' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">Iniciada</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{row.deadline}</div>
                      <div className={`text-[10px] ${row.status === 'atrasado' ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                        {row.daysLeft}
                      </div>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/avaliacoes/avaliar?participant=${row.id}`}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                        >
                          <Search size={11} />
                          <span>Avaliar</span>
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
          Mostrando {filtered.length} de {pendingEvaluations.length} resultados reais
        </div>
      </div>
    </div>
  );
}
