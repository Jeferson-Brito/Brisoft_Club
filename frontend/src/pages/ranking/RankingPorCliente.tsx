import { useState } from 'react';
import {
  Building2, Users, Trophy, Star, BarChart3,
  Download, Crown, Search, ArrowRight, Info,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { usePhotoData } from '../../app/photo-data';
import { Link } from 'react-router-dom';

export default function RankingPorCliente() {
  const { clients, employees } = usePhotoData();
  const [selectedClientId, setSelectedClientId] = useState<string | number>('');
  const [clientSearch, setClientSearch] = useState('');

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0] || { id: '', name: 'Sem cliente', employees: 0, posts: 0, avgScore: 0, cnpj: '', responsible: '' };

  const clientEmployees = employees.filter(e => e.client === currentClient.name);
  const displayEmployees = clientEmployees;

  const ordered = [...displayEmployees].sort((a, b) => b.score - a.score);
  const clientEvaluated = ordered.filter(item => Number(item.score || 0) > 0);
  const isGold = (item: any) => ['ouro', 'diamante'].includes(String(item.badge || '').toLowerCase());
  const isSilver = (item: any) => String(item.badge || '').toLowerCase() === 'prata';
  const isBronze = (item: any) => String(item.badge || '').toLowerCase() === 'bronze';

  const clientGold = clientEvaluated.filter(isGold)[0] || null;
  const clientSilver = clientEvaluated.filter(isSilver)[0] || null;
  const clientBronze = clientEvaluated.filter(isBronze)[0] || null;

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );
  const evaluatedCount = employees.filter(item => item.score > 0).length;
  const evaluatedPct = employees.length ? Math.round(evaluatedCount / employees.length * 100) : 0;
  const clientEvaluatedCount = clientEmployees.filter(item => item.score > 0).length;
  const clientEvaluatedPct = clientEmployees.length ? Math.round(clientEvaluatedCount / clientEmployees.length * 100) : 0;
  const badgeCounts = ['ouro', 'prata', 'bronze', 'diamante'].reduce<Record<string, number>>((counts, badge) => {
    counts[badge] = clientEmployees.filter(item => item.badge === badge).length;
    return counts;
  }, {});
  const clientPosition = [...clients].sort((a, b) => b.avgScore - a.avgScore).findIndex(item => item.id === currentClient.id) + 1;

  return (
    <div className="space-y-3.5 page-enter">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <BarChart3 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{clients.filter(item => item.status === 'ativo').length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Clientes ativos</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">no programa</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{employees.length}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Colaboradores elegíveis</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">em todos os clientes</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-slate-800 leading-none">{evaluatedCount}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Colaboradores avaliados</div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evaluatedPct}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-none">{Math.round(currentClient.avgScore || 0)}</div>
            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate">Média geral de pontos</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">na temporada selecionada</div>
          </div>
        </div>
      </div>

      {/* ── Selected Client Detail Header ── */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-800 leading-tight">{currentClient.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {clientPosition || '—'}º no ranking de clientes
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                <span>CNPJ: {currentClient.cnpj}</span>
                <span className="mx-1.5">|</span>
                <span>Responsável: {currentClient.responsible}</span>
                <span className="mx-1.5">|</span>
                <span className="font-semibold text-slate-600">{currentClient.employees} colaboradores</span>
              </div>
            </div>
          </div>

          <Link to="/clientes" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto flex-shrink-0">
            <span>Ver detalhes do cliente</span>
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>

      {/* ── Main Section: Content + Clients Sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-start">
        {/* Left Column */}
        <div className="flex-1 min-w-0 w-full space-y-3">
          {/* Top 3 & Performance Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top 3 Client */}
            <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="text-amber-500">👑</span>
                <span>Top 3 - {currentClient.name}</span>
              </div>

              <div className="pt-2">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-end pt-1">
                  {/* 2º LUGAR (PRATA) */}
                  <div className="flex flex-col items-center min-w-0">
                    {clientSilver ? (
                      <div className="flex flex-col items-center w-full mb-1">
                        <span className="text-[9px] font-bold text-slate-500 mb-0.5">🥈 2º</span>
                        <div className="w-10 h-10 rounded-full ring-2 ring-slate-300 ring-offset-1 overflow-hidden shadow-2xs mb-1">
                          <Avatar name={clientSilver.name} src={clientSilver.photo} size="sm" />
                        </div>
                        <div className="font-bold text-slate-800 text-[10px] truncate max-w-full text-center px-0.5">{clientSilver.name}</div>
                        <div className="text-[11px] font-black text-slate-700 mt-0.5">{clientSilver.score} <span className="text-[8px] font-normal text-slate-400">pts</span></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full mb-1 opacity-50">
                        <span className="text-[9px] font-bold text-slate-400 mb-0.5">🥈 2º</span>
                        <div className="w-9 h-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mb-1">?</div>
                        <div className="text-[9px] text-slate-400">Aguardando</div>
                      </div>
                    )}
                    <div className="w-full h-14 rounded-t-lg bg-gradient-to-t from-slate-200 via-slate-100 to-white border-t-2 border-x border-slate-300 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-400/40 select-none">2</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Prata</span>
                    </div>
                  </div>

                  {/* 1º LUGAR (OURO) */}
                  <div className="flex flex-col items-center min-w-0 z-10">
                    {clientGold ? (
                      <div className="flex flex-col items-center w-full mb-1">
                        <Crown size={14} className="text-amber-500 fill-amber-400 mb-0.5" />
                        <span className="text-[9px] font-extrabold text-amber-700 mb-0.5">🥇 1º</span>
                        <div className="w-12 h-12 rounded-full ring-3 ring-amber-400 ring-offset-1 overflow-hidden shadow-xs mb-1">
                          <Avatar name={clientGold.name} src={clientGold.photo} size="md" />
                        </div>
                        <div className="font-extrabold text-slate-900 text-[11px] truncate max-w-full text-center px-0.5">{clientGold.name}</div>
                        <div className="text-xs font-black text-amber-700 mt-0.5">{clientGold.score} <span className="text-[8px] font-normal text-amber-500">pts</span></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full mb-1 opacity-50">
                        <Crown size={13} className="text-amber-500/60 mb-0.5" />
                        <span className="text-[9px] font-bold text-amber-700/70 mb-0.5">🥇 1º</span>
                        <div className="w-11 h-11 rounded-full border-2 border-dashed border-amber-400/70 flex items-center justify-center text-amber-600 text-xs mb-1 bg-amber-50/30">?</div>
                        <div className="text-[9px] text-slate-400">Aguardando</div>
                      </div>
                    )}
                    <div className="w-full h-20 rounded-t-xl bg-gradient-to-t from-amber-400 via-amber-300 to-amber-100 border-t-2 border-x border-amber-300 shadow-2xs flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-amber-800/40 select-none">1</span>
                      <span className="text-[8px] font-black text-amber-900 uppercase">Ouro</span>
                    </div>
                  </div>

                  {/* 3º LUGAR (BRONZE) */}
                  <div className="flex flex-col items-center min-w-0">
                    {clientBronze ? (
                      <div className="flex flex-col items-center w-full mb-1">
                        <span className="text-[9px] font-bold text-amber-800 mb-0.5">🥉 3º</span>
                        <div className="w-9 h-9 rounded-full ring-2 ring-amber-700/40 ring-offset-1 overflow-hidden shadow-2xs mb-1">
                          <Avatar name={clientBronze.name} src={clientBronze.photo} size="sm" />
                        </div>
                        <div className="font-bold text-slate-800 text-[10px] truncate max-w-full text-center px-0.5">{clientBronze.name}</div>
                        <div className="text-[11px] font-black text-amber-900 mt-0.5">{clientBronze.score} <span className="text-[8px] font-normal text-slate-400">pts</span></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full mb-1 opacity-50">
                        <span className="text-[9px] font-bold text-amber-800 mb-0.5">🥉 3º</span>
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-700 text-xs mb-1">?</div>
                        <div className="text-[9px] text-slate-400">Aguardando</div>
                      </div>
                    )}
                    <div className="w-full h-10 rounded-t-lg bg-gradient-to-t from-amber-100 via-amber-50 to-white border-t-2 border-x border-amber-200 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-amber-800/30 select-none">3</span>
                      <span className="text-[8px] font-bold text-amber-800/70 uppercase">Bronze</span>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-slate-200 rounded-b-md" />
              </div>
            </div>

            {/* Desempenho do Cliente */}
            <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <BarChart3 size={14} className="text-blue-600" />
                    <span>Desempenho do cliente</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{currentClient.employees} colaboradores</span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Avaliados</span>
                      <span className="font-bold text-emerald-600">{clientEvaluatedPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${clientEvaluatedPct}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Pendentes</span>
                      <span className="font-bold text-rose-500">{100 - clientEvaluatedPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${100 - clientEvaluatedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges Count */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                <span className="flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Ouro {badgeCounts.ouro}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Prata {badgeCounts.prata}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-amber-900 bg-orange-50 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-amber-700" />
                  <span>Bronze {badgeCounts.bronze}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Diamante {badgeCounts.diamante}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <BarChart3 size={14} className="text-blue-600" />
                <span>Ranking - {currentClient.name} ({currentClient.employees} colaboradores)</span>
              </div>
              <a href="/api/export/ranking" className="flex items-center gap-1 text-xs font-medium text-slate-600 border border-slate-200/80 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors">
                <Download size={12} />
                <span>Exportar Excel</span>
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] whitespace-nowrap">
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Função</th>
                      <th className="py-2.5 px-3">Posto</th>
                      <th className="py-2.5 px-3 text-center">Pontuação</th>
                      <th className="py-2.5 px-3 text-center">Classificação</th>
                      <th className="py-2.5 px-3 text-center">Avaliações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayEmployees.map((emp, idx) => {
                      const pos = idx + 1;
                      const posBadge =
                        pos === 1 ? 'w-5 h-5 rounded-full bg-amber-400 text-white font-black text-[10px] flex items-center justify-center mx-auto shadow-2xs' :
                        pos === 2 ? 'w-5 h-5 rounded-full bg-slate-300 text-slate-800 font-black text-[10px] flex items-center justify-center mx-auto' :
                        pos === 3 ? 'w-5 h-5 rounded-full bg-amber-700/80 text-white font-black text-[10px] flex items-center justify-center mx-auto' :
                        'font-bold text-slate-400 text-center block text-xs';

                      const scoreBadge =
                        emp.badge === 'ouro' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        emp.badge === 'prata' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        'bg-orange-100 text-orange-800 border-orange-200';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className={posBadge}>{pos}</span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={emp.name} src={emp.photo} size="sm" />
                              <span className="font-semibold text-slate-800 whitespace-nowrap">{emp.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{emp.registration}</td>
                          <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{emp.role}</td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{emp.post}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-center font-black text-slate-800">{emp.score}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${scoreBadge}`}>
                              {emp.badge ? emp.badge.charAt(0).toUpperCase() + emp.badge.slice(1) : '—'}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center font-semibold text-emerald-600">{emp.evaluations}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 border-t border-slate-100 text-xs text-slate-500">Mostrando {displayEmployees.length} de {currentClient.employees} resultados reais</div>
            </div>
          </div>
        </div>

        {/* Right Column: Clients List & Tip */}
        <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 space-y-3">
          {/* Clients List Card */}
          <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clientes</h3>

            {/* Search client */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="w-full text-xs pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* List */}
            <div className="space-y-1 pt-1 max-h-[420px] overflow-y-auto">
              {filteredClients.map((c, i) => {
                const isCurrent = c.id === currentClient.id;
                const clientEmployees = employees.filter(employee => employee.clientId === c.id);
                const clientEvaluated = clientEmployees.filter(employee => employee.score > 0).length;
                const evaluatedPct = clientEmployees.length ? Math.round(clientEvaluated / clientEmployees.length * 100) : 0;
                const badgeCls = evaluatedPct >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : evaluatedPct >= 60
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-blue-50/80 border border-blue-200/80 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold w-4 text-center flex-shrink-0 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                        {i + 1}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                        <Building2 size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{c.employees} colaboradores</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex-shrink-0 ${badgeCls}`}>
                      {evaluatedPct}%
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 text-center text-[11px] font-semibold text-slate-400">{filteredClients.length} de {clients.length} clientes exibidos</div>
          </div>

          {/* Tip Card */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-blue-900">Dica</div>
                <div className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                  Clique em um cliente para ver o ranking completo, detalhes por posto e a evolução nas últimas temporadas.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
