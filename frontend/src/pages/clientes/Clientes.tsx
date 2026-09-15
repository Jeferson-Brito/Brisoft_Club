import { useState } from 'react';
import {
  Building2, MessageSquare, Users, Trophy, Filter,
  Download, Plus, MoreHorizontal, X, ArrowRight,
  TrendingUp, Trash2,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';
import { api } from '../../app/state';
import { Editor } from '../../app/ui';
import { Link } from 'react-router-dom';
import type { Client } from '../../types';
import { DetailModal } from '../../app/ui';

export default function Clientes() {
  const { clients, employees, data, refresh, notify } = usePhotoData();
  const [editing, setEditing] = useState<any>();
  const [creating, setCreating] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerTab, setDrawerTab] = useState<'geral' | 'postos' | 'colaboradores' | 'avaliacoes'>('geral');
  const [searchName, setSearchName] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const filteredClients = clients.filter(c => {
    if (searchName && !`${c.name} ${c.cnpj}`.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (selectedSegment !== 'Todos' && c.segment !== selectedSegment) return false;
    if (selectedStatus !== 'Todos' && c.status !== selectedStatus) return false;
    return true;
  });

  const selectCls = 'w-full text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer';

  const resetFilters = () => {
    setSearchName('');
    setSelectedSegment('Todos');
    setSelectedStatus('Todos');
  };

  const clientEmployees = employees.filter(e => e.client === selectedClient?.name);
  const top3 = [...clientEmployees].sort((a, b) => b.score - a.score).slice(0, 3);
  const segmentOptions = [...new Set(clients.map(client => client.segment).filter(Boolean))];
  const selectedClientEvaluations = data.evaluations.filter(item =>
    item.snapshot?.clientId === selectedClient?.id || item.snapshot?.client === selectedClient?.name);
  const selectedClientCompleted = selectedClientEvaluations.filter(item => item.status === 'enviada').length;
  const removeClient = async (client: any) => {
    if (!window.confirm(`Excluir ${client.name} permanentemente? Os vínculos, participações e avaliações relacionadas a esta empresa também serão removidos.`)) return;
    try {
      await api(`/records/clients/${client.id}/delete`, { confirm: true });
      setSelectedClient(null);
      setEditing(undefined);
      await refresh();
      notify("Cliente excluído.");
    } catch (error) {
      notify((error as Error).message);
    }
  };

  return (
    <div className="space-y-3.5 page-enter">
      {/* ── Cabeçalho da Página Padrão Corporativo Grupo Combate ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#071e4d] text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">Clientes</h1>
            <p className="text-xs text-slate-500 font-medium">Gerencie as empresas e postos atendidos pela sua equipe.</p>
          </div>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-[#071e4d] hover:bg-[#0c2e75] active:bg-[#06183d] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Novo cliente</span>
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{clients.filter(client => client.status === 'ativo').length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Clientes ativos</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">cadastrados na plataforma</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{data.evaluations.length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Avaliações recebidas</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">em todas as temporadas</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{employees.filter(employee => employee.score > 0).length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Colaboradores avaliados</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">em clientes ativos</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{clients.length ? Math.round(clients.reduce((sum, client) => sum + client.avgScore, 0) / clients.length) : 0}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Média geral de pontos</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">na temporada selecionada</div>
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
            onClick={(event) => { event.preventDefault(); resetFilters(); }}
            className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Limpar filtros
          </button>
        </summary>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Buscar cliente</label>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Segmento</label>
            <select className={selectCls} value={selectedSegment} onChange={e => setSelectedSegment(e.target.value)}>
              <option>Todos</option>
              {segmentOptions.map(segment => <option key={segment}>{segment}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select className={selectCls} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option>Todos</option>
              <option value="ativo">Ativo</option>
              <option value="implantacao">Em implantação</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

        </div>

        <div className="text-right text-[11px] text-slate-400">Os filtros são aplicados automaticamente.</div>
      </details>

      {/* ── Main Layout: Table + Right Detail Drawer ── */}
      <div className="flex flex-col xl:flex-row gap-3.5 items-start">
        {/* Left Column: Table */}
        <div className="flex-1 min-w-0 w-full space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Building2 size={14} className="text-blue-600" />
              <span>Clientes ({filteredClients.length})</span>
            </div>
            <a href="/api/export/clients" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
              <Download size={12} />
              <span>Exportar Excel</span>
            </a>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#071e4d] text-white font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">CNPJ</th>
                    <th className="py-2.5 px-3">Segmento</th>
                    <th className="py-2.5 px-3 text-center">Postos</th>
                    <th className="py-2.5 px-3 text-center">Colaboradores</th>
                    <th className="py-2.5 px-3 text-center">Média de pontos</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center w-12">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client, idx) => {
                    const pos = idx + 1;
                    const isSelected = selectedClient?.id === client.id;
                    const posBadge =
                      pos === 1 ? 'w-5 h-5 rounded-full bg-amber-400 text-white font-black text-[10px] flex items-center justify-center mx-auto shadow-2xs' :
                      pos === 2 ? 'w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-black text-[10px] flex items-center justify-center mx-auto' :
                      pos === 3 ? 'w-5 h-5 rounded-full bg-amber-700/80 text-white font-black text-[10px] flex items-center justify-center mx-auto' :
                      'font-bold text-slate-400 text-center block text-xs';

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`hover:bg-slate-50/70 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <span className={posBadge}>{pos}</span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                              <Building2 size={13} />
                            </div>
                            <span className="font-semibold text-slate-800">{client.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{client.cnpj}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{client.segment}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap text-center font-semibold">{client.posts}</td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap text-center font-semibold">{client.employees}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-center font-black text-slate-800">{client.avgScore}</td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          {client.status === 'ativo' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ativo
                            </span>
                          ) : client.status === 'implantacao' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Em implantação
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1">
                            <button onClick={(event) => { event.stopPropagation(); setEditing(client); }} aria-label={`Editar ${client.name}`} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"><MoreHorizontal size={14} /></button>
                            {data.role.globalScope && <button onClick={(event) => { event.stopPropagation(); void removeClient(client); }} aria-label={`Excluir ${client.name}`} data-help="Exclui permanentemente o cliente e todo o histórico relacionado." className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 text-xs text-slate-500">Mostrando {filteredClients.length} de {clients.length} clientes reais</div>
          </div>
        </div>

        {/* Right Column: Client Detail Drawer */}
        {selectedClient && (
          <DetailModal label={`Detalhes de ${selectedClient.name}`} onClose={() => setSelectedClient(null)}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{selectedClient.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">Nosso parceiro desde {selectedClient.since}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ativo
                </span>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 text-xs">
              {(['geral', 'postos', 'colaboradores', 'avaliacoes'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  className={`flex-1 py-1.5 font-bold text-center capitalize border-b-2 transition-colors ${
                    drawerTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'geral' ? 'Visão geral' : tab === 'postos' ? 'Postos' : tab === 'colaboradores' ? 'Colaboradores' : 'Avaliações'}
                </button>
              ))}
            </div>

            {/* Tab: Visão geral */}
            {drawerTab === 'geral' && (
              <div className="space-y-3">
                {/* Meta details */}
                <div className="space-y-1.5 text-[11px] p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CNPJ</span>
                    <span className="font-semibold text-slate-700">{selectedClient.cnpj}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Segmento</span>
                    <span className="font-semibold text-slate-700">{selectedClient.segment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Endereço</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]">{selectedClient.address}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Gestor do contrato</span>
                    <span className="font-semibold text-slate-700">{selectedClient.responsible}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telefone</span>
                    <span className="font-semibold text-slate-700">{selectedClient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-mail</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[180px]">{selectedClient.email}</span>
                  </div>
                </div>

                {/* 3 Mini Boxes */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2 text-center">
                    <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1">
                      <Building2 size={12} />
                    </div>
                    <div className="text-sm font-black text-slate-800">{selectedClient.posts}</div>
                    <div className="text-[10px] text-slate-400">Postos</div>
                  </div>

                  <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-2 text-center">
                    <div className="w-5 h-5 rounded bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-1">
                      <Users size={12} />
                    </div>
                    <div className="text-sm font-black text-slate-800">{selectedClient.employees}</div>
                    <div className="text-[10px] text-slate-400">Colaboradores</div>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-2 text-center">
                    <div className="w-5 h-5 rounded bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-1">
                      <Trophy size={12} />
                    </div>
                    <div className="text-sm font-black text-slate-800">{selectedClient.avgScore}</div>
                    <div className="text-[10px] text-slate-400">Média pontos</div>
                  </div>
                </div>

                {/* Evolução da Média de Pontos Chart */}
                <div className="p-2.5 rounded-lg border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp size={13} className="text-blue-600" />
                      <span>Evolução da Média de Pontos</span>
                    </span>
                  </div>

                  <div className="w-full min-h-24 flex items-center justify-center rounded-lg bg-blue-50/50 border border-blue-100 p-4 text-center">
                    <div>
                      <div className="text-2xl font-black text-blue-700">{Math.round(selectedClient.avgScore || 0)}</div>
                      <div className="text-[10px] text-slate-500 mt-1">Média consolidada da temporada atual</div>
                      <div className="text-[10px] text-slate-400 mt-1">A evolução histórica será exibida quando houver temporadas anteriores consolidadas.</div>
                    </div>
                  </div>
                </div>

                {/* Top 3 Colaboradores deste Cliente */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Trophy size={13} className="text-amber-500" />
                      <span>Top 3 Colaboradores deste Cliente</span>
                    </span>
                    <Link to="/ranking/por-cliente" className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-0.5">
                      <span>Ver ranking completo</span>
                      <ArrowRight size={10} />
                    </Link>
                  </div>

                  <div className="space-y-1">
                    {top3.map((emp, i) => (
                      <div key={emp.id} className="flex items-center justify-between p-1.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                          <Avatar name={emp.name} src={emp.photo} size="xs" />
                          <span className="font-semibold text-slate-800 truncate text-[11px]">{emp.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">{emp.score} pontos</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'postos' && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-slate-700">Postos deste cliente</div>
                  <button onClick={() => { setEditing(selectedClient); setSelectedClient(null); }} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 font-bold text-white hover:bg-blue-700">
                    <Plus size={12} /> Gerenciar postos
                  </button>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  {data.posts.filter(post => selectedClient.postIds?.includes(post.id)).map(post => (
                    <li key={post.id}><span className="font-semibold text-slate-700">{post.name}</span>{post.address ? ` — ${post.address}` : ''}</li>
                  ))}
                </ul>
                {!data.posts.some(post => selectedClient.postIds?.includes(post.id)) && <p className="rounded-lg bg-amber-50 p-2 text-amber-800">Nenhum posto selecionado para esta empresa.</p>}
                <Link to="/clientes/gestao?tab=posts" className="inline-flex text-blue-600 font-semibold">Ver e editar todos os postos →</Link>
              </div>
            )}

            {drawerTab === 'colaboradores' && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1.5">
                <div className="font-bold text-slate-700">{selectedClient.employees} colaboradores vinculados.</div>
                <p className="text-[11px]">Consulte a aba de Colaboradores para a lista completa com filtros.</p>
              </div>
            )}

            {drawerTab === 'avaliacoes' && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 space-y-1.5">
                <div className="font-bold text-slate-700">Média geral: {selectedClient.avgScore} pontos</div>
                <p className="text-[11px]">{selectedClientCompleted} de {selectedClientEvaluations.length} avaliações registradas estão concluídas.</p>
              </div>
            )}
          </div>
          </DetailModal>
        )}
      </div>
      {(creating || editing) && (
        <Editor
          title={editing ? 'Editar cliente' : 'Novo cliente'}
          fields={[
            { key: 'name', label: 'Nome do cliente' },
            { key: 'cnpj', label: 'CNPJ', required: false },
            { key: 'segment', label: 'Segmento', required: false },
            { key: 'responsible', label: 'Responsável', required: false },
            { key: 'email', label: 'E-mail', type: 'email', required: false },
            { key: 'phone', label: 'Telefone', required: false },
            { key: 'postIds', label: 'Postos desta empresa', type: 'multi', options: data.posts.map(post => ({ value: post.id, label: post.name })), required: false, hint: 'Selecione os postos globais que existem nesta empresa.' },
            { key: 'status', label: 'Status', options: [
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' },
              { value: 'implantacao', label: 'Em implantação' },
            ] },
          ]}
          initial={editing || { status: 'ativo' }}
          onClose={() => { setEditing(undefined); setCreating(false); }}
          onSave={async value => {
            await api('/records/clients', value);
            await refresh();
            notify('Cliente e postos salvos.');
          }}
        />
      )}
    </div>
  );
}
