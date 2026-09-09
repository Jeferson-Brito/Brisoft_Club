import { useState } from 'react';
import { Calendar, CheckCircle2, Star, MessageSquare, Filter, ChevronDown, ChevronRight, ChevronLeft, Download, Eye, X, Award, MapPin, Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { evaluations } from '../../data/mock';
import type { Evaluation } from '../../types';

export default function Historico() {
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);

  // Extend evaluations array slightly to simulate history
  const historyData = [...evaluations, ...evaluations, ...evaluations].map((e, i) => ({
    ...e,
    id: i,
    date: `0${(i % 9) + 1}/02/2025`
  }));

  return (
    <div className="flex relative h-full">
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 space-y-5 ${selectedEval ? 'pr-80' : ''}`}>
        
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-medium mb-1">
              <span>Avaliações</span> <span className="mx-1">&gt;</span> <span className="text-slate-600 font-semibold">Histórico</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Histórico de Avaliações</h1>
            <p className="text-slate-500 text-sm mt-0.5">Consulte todas as avaliações realizadas, com filtros por temporada, ciclo, cliente e colaborador.</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between min-w-[280px]">
            <div>
              <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                Temporada:
                <select className="border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-2 focus:ring-blue-100 font-bold text-slate-800">
                  <option>2025/1</option>
                  <option>2024/2</option>
                </select>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">01/01/2025 - 28/02/2025</div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">3.482</div>
              <div className="text-xs font-medium text-slate-500">Avaliações realizadas</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 12% em relação à temporada anterior</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">3.216</div>
              <div className="text-xs font-medium text-slate-500">Avaliações concluídas</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">92% do total</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Star size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">266</div>
              <div className="text-xs font-medium text-slate-500">Com elogio</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">7,6% das avaliações</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">100%</div>
              <div className="text-xs font-medium text-slate-500">Taxa de resposta</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">de clientes ativos</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Filter size={16} className="text-blue-600" />
              <span>Filtros</span>
            </div>
            <button className="text-xs font-medium text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-1">
              Limpar filtros <ChevronDown size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Temporada</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>2025/1</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ciclo</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cliente</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Posto</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Colaborador</label>
              <input type="text" placeholder="Buscar por nome ou matrícula..." className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Avaliador</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Classificação</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Nota</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Com elogio</label>
              <select className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 outline-none">
                <option>Todos</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Período da avaliação</label>
              <div className="flex items-center gap-1">
                <input type="text" placeholder="dd/mm/aaaa" className="w-full min-w-0 text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-2 outline-none" />
                <span className="text-slate-400">-</span>
                <input type="text" placeholder="dd/mm/aaaa" className="w-full min-w-0 text-[11px] font-medium border border-slate-200 rounded-lg px-2 py-2 outline-none" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs flex items-center gap-1.5">
              <Search size={14} />
              Aplicar filtros
            </button>
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Star size={18} className="text-blue-600" />
            <span>Avaliações (3.482)</span>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
            <Download size={14} className="text-blue-600" />
            <span>Exportar Excel</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                  <th className="py-3.5 pl-5 pr-3">Data</th>
                  <th className="py-3.5 px-3">Colaborador</th>
                  <th className="py-3.5 px-3">Cliente / Posto</th>
                  <th className="py-3.5 px-3">Avaliador</th>
                  <th className="py-3.5 px-3 text-center">Notas</th>
                  <th className="py-3.5 px-3 text-center">Pontuação</th>
                  <th className="py-3.5 px-3 text-center">Classificação</th>
                  <th className="py-3.5 px-3 text-center">Elogio</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {historyData.slice(0, 8).map((item, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${selectedEval?.id === item.id ? 'bg-blue-50/30' : ''}`} onClick={() => setSelectedEval(item as Evaluation)}>
                    <td className="py-3 pl-5 pr-3 text-slate-600 font-medium">{item.date}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={item.employee} size="sm" />
                        <div>
                          <div className="font-bold text-slate-800">{item.employee}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Matrícula: {item.registration}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-700">{item.client}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.post}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-700">{item.evaluator}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">({item.evaluatorRole})</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex justify-center gap-1">
                        {item.scores.map((score, sIdx) => (
                          <span key={sIdx} className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                            score === 5 ? 'bg-emerald-100 text-emerald-700' : 
                            score === 4 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {score}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-black text-slate-800">{item.score}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`badge-${item.badge || 'prata'} !px-3`}>{item.badge ? item.badge.charAt(0).toUpperCase() + item.badge.slice(1) : ''}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.hasCompliment ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-[11px]">
                          🏆 Sim
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">— Não</span>
                      )}
                    </td>
                    <td className="py-3 pr-5 pl-3 text-right">
                      <button className="bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-2xs text-[11px] ml-auto">
                        <Eye size={12} strokeWidth={2.5} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>Mostrando 1 - 8 de 3.482 resultados</div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                <ChevronLeft size={15} />
              </button>
              <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">1</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">2</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">3</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">4</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">5</button>
              <span className="px-1">...</span>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">436</button>
              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Details */}
      {selectedEval && (
        <div className="fixed right-0 top-14 bottom-0 w-[400px] bg-white border-l border-slate-200 shadow-2xl z-40 transform transition-transform duration-300 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-[15px] font-bold text-slate-800">Detalhes da Avaliação</h2>
            <button onClick={() => setSelectedEval(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md hover:bg-slate-50">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4">
              <Avatar name={selectedEval.employee} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-lg truncate">{selectedEval.employee}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">Matrícula: {selectedEval.registration}</div>
              </div>
              <div className={`badge-${selectedEval.badge || 'prata'} px-3 py-1.5 text-sm`}>
                {selectedEval.badge === 'ouro' ? '🥇' : selectedEval.badge === 'prata' ? '🥈' : '🥉'} 
                {selectedEval.badge ? selectedEval.badge.charAt(0).toUpperCase() + selectedEval.badge.slice(1) : ''}
              </div>
            </div>

            {/* Sub tabs */}
            <div className="flex border-b border-slate-200">
              <button className="flex-1 pb-3 text-sm font-bold text-blue-600 border-b-2 border-blue-600">Avaliação</button>
              <button className="flex-1 pb-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Elogio</button>
              <button className="flex-1 pb-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors">Histórico</button>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-3">
                <Calendar className="text-slate-400 mt-0.5" size={16} />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Data da avaliação</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">{selectedEval.date} às 14:32</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Avatar name={selectedEval.evaluator} size="sm" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Avaliador</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">{selectedEval.evaluator}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="text-slate-400 mt-0.5" size={16} />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Cliente / Posto</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">{selectedEval.client}<br/>{selectedEval.post}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Award className="text-slate-400 mt-0.5" size={16} />
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">Temporada / Ciclo</div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5">2025/1 - 1º Bimestre</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* Notas e comentários */}
            <div>
              <h3 className="font-bold text-slate-800 text-sm mb-4">Notas e comentários</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-semibold text-slate-700 text-sm">Competência Técnica</div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      5 - Excelente <MessageSquare size={10} />
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p>Execução correta do POP e das atividades.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 font-medium italic border border-slate-100">
                    "Executa todas as atividades com excelente qualidade e conhecimento técnico."
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-semibold text-slate-700 text-sm">Postura no Posto</div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      5 - Excelente <MessageSquare size={10} />
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-500 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                    <p>Atenção, apresentação e uso de EPIs.</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 font-medium italic border border-slate-100">
                    "Sempre atento, uniforme em perfeito estado."
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* Score Highlight */}
            <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
              <div>
                <div className="text-3xl font-black text-slate-800">{selectedEval.score}</div>
                <div className="text-xs font-semibold text-slate-500">Pontuação total</div>
              </div>
              {selectedEval.hasCompliment && (
                <div className="bg-white px-4 py-2.5 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                    🏆 Com elogio
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 rounded-full mt-1">
                    +20 pontos
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button 
              onClick={() => setSelectedEval(null)}
              className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Voltar para a lista
            </button>
            <button className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white rounded-sm border-t-0 border-r-0 transform -rotate-45 mb-1"></span>
              Editar avaliação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
