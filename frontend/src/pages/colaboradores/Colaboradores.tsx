import { useState, useEffect } from 'react';
import {
  Search, Users, Trophy, Filter,
  Download, Plus, X, Star, Target, BarChart3, Eye,
  ShieldAlert, Paperclip, MoreVertical, Pencil,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';
import { api } from '../../app/state';
import { Link, useNavigate } from 'react-router-dom';
import type { Employee } from '../../types';
import { EmployeeActionEditor } from '../../components/employees/EmployeeActionEditor';
import { DetailModal } from '../../app/ui';

export default function Colaboradores() {
  const navigate = useNavigate();
  const { employees, evaluations, data, refresh, notify } = usePhotoData();
  const [creatingAction, setCreatingAction] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [drawerTab, setDrawerTab] = useState<'resumo' | 'avaliacoes' | 'historico' | 'ocorrencias'>('resumo');
  const [searchName, setSearchName] = useState('');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedRole, setSelectedRole] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleClose = () => setActiveMenuId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuId(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  const filteredEmployees = employees.filter(e => {
    if (searchName && !`${e.name} ${e.registration}`.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (selectedClient !== 'Todos' && e.client !== selectedClient) return false;
    if (selectedPost !== 'Todos' && e.post !== selectedPost) return false;
    if (selectedRole !== 'Todas' && e.role !== selectedRole) return false;
    if (selectedStatus !== 'Todos' && e.status !== selectedStatus) return false;
    return true;
  });

  const selectCls = 'w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer';

  const resetFilters = () => {
    setSearchName('');
    setSelectedClient('Todos');
    setSelectedPost('Todos');
    setSelectedRole('Todas');
    setSelectedStatus('Todos');
  };
      const clientOptions = [...new Set(employees.map(item => item.client).filter(Boolean))];
  const postOptions = [...new Set(employees.map(item => item.post).filter(Boolean))];
  const roleOptions = [...new Set(employees.map(item => item.role).filter(Boolean))];
  const selectedEmployeeEvaluations = evaluations
    .filter(item => item.registration === selectedEmp?.registration)
    .sort((a, b) => String(b.sentAt || b.createdAt).localeCompare(String(a.sentAt || a.createdAt)));
  const selectedActions = data.employeeActions
    .filter(item => item.employeeId === selectedEmp?.id)
    .sort((a, b) => String(b.appliedAt).localeCompare(String(a.appliedAt)));
  // @ts-ignore
  const removeEmployee = async (employee: any) => {
    if (!window.confirm(`Excluir ${employee.name} permanentemente? O acesso, os vínculos e o histórico de avaliações deste colaborador também serão removidos.`)) return;
    try {
      await api(`/records/employees/${employee.id}/delete`, { confirm: true });
      setSelectedEmp(null);
      await refresh();
      notify("Colaborador excluído.");
    } catch (error) {
      notify((error as Error).message);
    }
  };

  return (
    <div className="space-y-3.5 page-enter">
      {/* ── Barra Superior Padronizada: Busca + Filtros + Ação ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por colaborador ou matrícula..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                style={{ paddingLeft: "44px" }}
                className="w-full pl-11 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all search-input"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                filterOpen || selectedClient !== 'Todos' || selectedPost !== 'Todos' || selectedRole !== 'Todas' || selectedStatus !== 'Todos'
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              <span>Filtros</span>
              {(selectedClient !== 'Todos' || selectedPost !== 'Todos' || selectedRole !== 'Todas' || selectedStatus !== 'Todos') && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
            {(searchName || selectedClient !== 'Todos' || selectedPost !== 'Todos' || selectedRole !== 'Todas' || selectedStatus !== 'Todos') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/colaboradores/novo')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all duration-150 cursor-pointer active:scale-95 flex-shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} className="text-[#f5b300]" />
            <span>Novo colaborador</span>
          </button>
        </div>

        {filterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Cliente</label>
              <select className={selectCls} value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="Todos">Todos os clientes</option>
                {clientOptions.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Posto</label>
              <select className={selectCls} value={selectedPost} onChange={e => setSelectedPost(e.target.value)}>
                <option value="Todos">Todos os postos</option>
                {postOptions.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Função</label>
              <select className={selectCls} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                <option value="Todas">Todas as funções</option>
                {roleOptions.map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
              <select className={selectCls} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="Todos">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="licenca">Licença</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Layout: Table + Right Detail Drawer ── */}
      <div className="flex flex-col xl:flex-row gap-3.5 items-start">
        {/* Left Column: Table */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Users size={14} className="text-blue-600" />
              <span>Colaboradores ({filteredEmployees.length})</span>
            </div>
            <a href="/api/export/employees" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
              <Download size={12} />
              <span>Exportar Excel</span>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-3 text-center w-12">#</th>
                    <th className="py-3 px-3 text-center w-14">Foto</th>
                    <th className="py-3 px-3">Nome</th>
                    <th className="py-3 px-3">Matrícula</th>
                    <th className="py-3 px-3">Função</th>
                    <th className="py-3 px-3">Cliente / Posto</th>
                    <th className="py-3 px-3 text-center">Pontuação</th>
                    <th className="py-3 px-3 text-center">Classificação</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center w-14">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp, idx) => {
                    const pos = idx + 1;
                    const isSelected = selectedEmp?.id === emp.id;
                    const posBadge =
                      pos === 1 ? 'w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center mx-auto shadow-xs' :
                      pos === 2 ? 'w-6 h-6 rounded-full bg-slate-400 text-white font-black text-xs flex items-center justify-center mx-auto' :
                      pos === 3 ? 'w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center mx-auto' :
                      'w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center mx-auto';

                    const hasGold = emp.score > 0 || emp.badge === 'ouro';

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => setSelectedEmp(emp)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors border-b border-slate-100 ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <span className={posBadge}>{pos}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="w-8 h-8 rounded-full ring-2 ring-slate-200 overflow-hidden mx-auto bg-white flex items-center justify-center">
                            <Avatar name={emp.name} src={emp.photo} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                          {emp.name}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {emp.registration}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {emp.role}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800 leading-tight">{emp.client}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{emp.post}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900 text-sm">
                          {emp.score}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {hasGold ? (
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              🏆 Ouro
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ativo
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                              }}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                activeMenuId === emp.id
                                  ? 'text-[#071e4d] bg-slate-200 shadow-inner'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Opções do colaborador"
                              aria-haspopup="true"
                              aria-expanded={activeMenuId === emp.id}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === emp.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 ${
                                  idx >= filteredEmployees.length - 2 && filteredEmployees.length > 2
                                    ? 'bottom-full mb-1'
                                    : 'top-full mt-1'
                                } w-52 bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.15)] border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setSelectedEmp(emp);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#071e4d] transition-colors cursor-pointer text-left"
                                >
                                  <Eye size={15} className="text-[#071e4d] flex-shrink-0" />
                                  <span>Ver perfil do colaborador</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    navigate(`/colaboradores/${emp.id}/editar`);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#071e4d] transition-colors cursor-pointer text-left"
                                >
                                  <Pencil size={15} className="text-[#f5b300] flex-shrink-0" />
                                  <span>Editar colaborador</span>
                                </button>

                                {data.role.globalScope && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setSelectedEmp(emp);
                                      setCreatingAction(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left border-t border-slate-100 mt-1 pt-1.5"
                                  >
                                    <ShieldAlert size={15} className="text-rose-500 flex-shrink-0" />
                                    <span>Registrar ocorrência</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-xs text-slate-500">Mostrando {Math.min(10, filteredEmployees.length)} de {filteredEmployees.length} colaboradores reais</div>
          </div>
        </div>

        {/* Right Column: Collaborator Detail Drawer */}
        {selectedEmp && (
          <DetailModal label={`Detalhes de ${selectedEmp.name}`} onClose={() => setSelectedEmp(null)}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Colaborador</h2>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <Avatar name={selectedEmp.name} src={selectedEmp.photo} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="text-xs font-bold text-slate-800 truncate">{selectedEmp.name}</div>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                    {selectedEmp.badge ? selectedEmp.badge.charAt(0).toUpperCase() + selectedEmp.badge.slice(1) : 'Sem classificação'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Matrícula: {selectedEmp.registration}</div>
                {selectedEmp.cpf && <div className="text-[10px] text-slate-400">CPF: ***.***.***-{selectedEmp.cpf.slice(-2)}</div>}
                {selectedEmp.loginEmail && <div className="text-[10px] text-blue-600 truncate">Login: {selectedEmp.loginEmail}</div>}
                <div className="text-[10px] text-slate-500 font-medium">Função: {selectedEmp.role}</div>
                <div className="text-[10px] text-slate-500 truncate">Cliente: {selectedEmp.client}</div>
                <div className="text-[10px] text-slate-400 truncate">Posto: {selectedEmp.post}</div>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 text-xs">
              {(['resumo', 'avaliacoes', 'ocorrencias', 'historico'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`flex-1 py-1.5 font-bold text-center capitalize border-b-2 transition-colors ${
                    drawerTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'resumo' ? 'Resumo' : tab === 'avaliacoes' ? 'Avaliações' : tab === 'ocorrencias' ? 'Ocorrências' : 'Histórico'}
                </button>
              ))}
            </div>

            {/* Tab: Resumo */}
            {drawerTab === 'resumo' && (
              <div className="space-y-3">
                {/* 4 Mini Stat Boxes */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <Trophy size={14} />
                      <span className="text-sm font-black text-slate-800">{selectedEmp.score}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Pontos na temporada</div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <BarChart3 size={14} />
                      <span className="text-sm font-black text-slate-800">{selectedEmp.evaluations}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Avaliações realizadas</div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                      <Star size={14} className="fill-amber-400" />
                      <span className="text-sm font-black text-slate-800">{selectedEmp.avgScore.toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Média das avaliações</div>
                  </div>

                  <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                      <Target size={14} />
                      <span className="text-sm font-black text-slate-800">{selectedEmp.presence}%</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500">Presença nas avaliações</div>
                  </div>
                </div>

                {/* Últimas avaliações */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Últimas avaliações</span>
                    <Link to="/avaliacoes/historico" className="text-[11px] text-blue-600 font-semibold hover:underline">Ver todas</Link>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {evaluations.filter(item => item.registration === selectedEmp.registration).slice(-3).reverse().map(item => ({
                      date: item.date,
                      client: item.client,
                      rating: item.scores.length ? Math.round(item.scores.reduce((sum: number, score: number) => sum + score, 0) / item.scores.length) : 0,
                      starCls: item.score >= 80 ? 'text-emerald-500' : 'text-amber-500',
                    })).map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-[11px]">
                        <div>
                          <div className="font-semibold text-slate-700">{item.date}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">Cliente: {item.client}</div>
                        </div>
                        <span className={`font-bold flex items-center gap-0.5 ${item.starCls}`}>
                          {item.rating} ★
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Button */}
                <button type="button" onClick={() => { navigate(`/colaboradores/${selectedEmp.id}/editar`); setSelectedEmp(null); }} className="w-full flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                  <Pencil size={13} />
                  <span>Editar cadastro e alocação</span>
                </button>
              </div>
            )}

            {drawerTab === 'avaliacoes' && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-2">
                <p>{selectedEmployeeEvaluations.length} avaliações registradas para este colaborador.</p>
                {selectedEmployeeEvaluations.slice(0, 5).map(item => <Link key={item.id} to={`/avaliacoes/historico?evaluation=${item.id}`} className="block p-2 border rounded bg-white hover:border-blue-200">
                  <div className="font-bold text-slate-700">{item.date} · {item.client}</div>
                  <div className="text-[10px] text-slate-400">{item.score} pontos · {item.badge || 'Sem classificação'}</div>
                </Link>)}
                {!selectedEmployeeEvaluations.length && <div className="text-[11px]">Nenhuma avaliação encontrada.</div>}
              </div>
            )}

            {drawerTab === 'historico' && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">Data de admissão</div>
                <div className="text-[11px] text-slate-600">{selectedEmp.admissionDate || '—'}</div>
                <div className="text-[11px] font-semibold text-slate-700 mt-2">Supervisor direto</div>
                <div className="text-[11px] text-slate-600">{selectedEmp.supervisor}</div>
              </div>
            )}
            {drawerTab === 'ocorrencias' && (
              <div className="space-y-2">
                {data.role.globalScope && <button className="btn w-full" onClick={() => setCreatingAction(true)}>
                  <ShieldAlert size={14} /> Registrar ocorrência
                </button>}
                {selectedActions.map((item) => {
                  const season = data.seasons.find(seasonItem => seasonItem.id === item.seasonId);
                  const cycle = data.cycles.find(cycleItem => cycleItem.id === item.cycleId);
                  const title = item.type === 'penalty' ? `${item.penaltyName} · −${item.points} pontos` : item.type === 'cycle_block' ? 'Impedido de avaliar no ciclo' : 'Suspenso da temporada';
                  return <div key={item.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1">
                    <div className="flex justify-between gap-2"><strong className="text-slate-700">{title}</strong><span className={item.status === 'ativo' ? 'text-red-600' : 'text-slate-400'}>{item.status === 'ativo' ? 'Ativa' : 'Cancelada'}</span></div>
                    <div>{season?.name}{cycle ? ` · ${cycle.name}` : ''}</div>
                    <div className="text-slate-500">{item.reason}</div>
                    {item.attachment && <a className="text-blue-600 inline-flex items-center gap-1" href={item.attachment.data} download={item.attachment.name}><Paperclip size={12} />{item.attachment.name}</a>}
                    {item.status === 'ativo' && data.role.globalScope && <button className="text-button danger block" onClick={async () => {
                      if (!window.confirm('Cancelar esta ocorrência?')) return;
                      await api(`/employee-actions/${item.id}/revoke`, {});
                      await refresh();
                      notify('Ocorrência cancelada.');
                    }}>Cancelar ocorrência</button>}
                  </div>;
                })}
                {!selectedActions.length && <div className="p-3 text-xs text-slate-500 bg-slate-50 rounded-lg">Nenhuma ocorrência registrada.</div>}
              </div>
            )}
          </div>
          </DetailModal>
        )}
      </div>
      {creatingAction && selectedEmp && (
        <EmployeeActionEditor
          employee={selectedEmp as any}
          seasons={data.seasons}
          cycles={data.cycles}
          penaltyTypes={data.penaltyTypes}
          onClose={() => setCreatingAction(false)}
          onSave={async value => {
            await api('/employee-actions', value);
            await refresh();
            notify('Ocorrência aplicada ao colaborador.');
          }}
        />
      )}
    </div>
  );
}
