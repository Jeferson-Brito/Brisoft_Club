import { useState } from 'react';
import { CheckCircle2, Users, Star, FileText, Filter, ChevronDown, ChevronRight, ChevronLeft, Download, Eye, MoreVertical, Calendar } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { evaluations } from '../../data/mock';

export default function Concluidas() {
  const [filterTab, setFilterTab] = useState<'todas' | 'elogio' | 'semelogio' | 'canceladas'>('todas');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [selectedEvaluator, setSelectedEvaluator] = useState('Todos');
  
  const filtered = evaluations.filter(item => {
    if (filterTab === 'elogio') return item.hasCompliment;
    if (filterTab === 'semelogio') return !item.hasCompliment;
    if (filterTab === 'canceladas') return false; // Nenhuma cancelada no mock
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-medium mb-1">
            <span>Avaliações</span> <span className="mx-1">&gt;</span> <span className="text-slate-600 font-semibold">Concluídas</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliações Concluídas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Confira as avaliações já realizadas na temporada atual.</p>
        </div>

        {/* Season card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between min-w-[280px]">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
               <Calendar size={18} />
             </div>
             <div>
               <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Temporada Atual</div>
               <div className="text-base font-bold text-slate-800 leading-tight">2025/1 - 1º Bimestre</div>
               <div className="text-xs text-slate-400">01/01/2025 - 28/02/2025</div>
             </div>
          </div>
          <span className="badge-ativo text-xs px-2.5 py-1">Em andamento</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">1.548</div>
            <div className="text-xs font-medium text-slate-500">Avaliações concluídas</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 18% em relação ao último período</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">78</div>
            <div className="text-xs font-medium text-slate-500">Clientes com avaliações</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">de 87 clientes (90%)</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">1.120</div>
            <div className="text-xs font-medium text-slate-500">Com elogios</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">72% das avaliações</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">0</div>
            <div className="text-xs font-medium text-slate-500">Avaliações canceladas</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">neste período</div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Período</label>
            <div className="relative">
              <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value="01/01/2025 - 28/02/2025"
                readOnly
                className="w-full text-xs font-medium border border-slate-200 rounded-xl pl-3 pr-8 py-2 bg-white text-slate-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Cliente</label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Shopping Boa Vista</option>
              <option>Hospital Central</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Posto</label>
            <select
              value={selectedPost}
              onChange={e => setSelectedPost(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Portaria Principal</option>
              <option>Recepção</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Função</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Vigilante</option>
              <option>Recepcionista</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Avaliador</label>
            <select
              value={selectedEvaluator}
              onChange={e => setSelectedEvaluator(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Ana Souza</option>
              <option>Roberto Lima</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 items-end">
           <div className="md:col-span-2 flex items-center gap-2">
             <div className="flex-1">
               <label className="text-xs font-medium text-slate-600 block mb-1">Nota final</label>
               <input type="text" placeholder="Mínima" className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none" />
             </div>
             <div className="w-4 h-px bg-slate-300 mb-2"></div>
             <div className="flex-1">
               <label className="text-xs font-medium text-slate-600 block mb-1 opacity-0">-</label>
               <input type="text" placeholder="Máxima" className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none" />
             </div>
           </div>
           
           <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Classificação</label>
            <select
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Ouro</option>
              <option>Prata</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Com elogio</label>
            <select
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Todos</option>
              <option>Sim</option>
              <option>Não</option>
            </select>
          </div>

          <div>
             <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-xl cursor-pointer transition-colors shadow-xs">
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabs bar and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('todas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'todas' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Todas</span>
            <span className={filterTab === 'todas' ? 'bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full' : 'bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold'}>1.548</span>
          </button>
          <button
            onClick={() => setFilterTab('elogio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'elogio' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Com elogio</span>
            <span className={filterTab === 'elogio' ? 'bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full' : 'bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold'}>1.120</span>
          </button>
          <button
            onClick={() => setFilterTab('semelogio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'semelogio' ? 'bg-orange-500 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Sem elogio</span>
            <span className={filterTab === 'semelogio' ? 'bg-orange-400 text-white text-[10px] px-1.5 py-0.5 rounded-full' : 'bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold'}>428</span>
          </button>
          <button
            onClick={() => setFilterTab('canceladas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'canceladas' ? 'bg-red-500 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Canceladas</span>
            <span className={filterTab === 'canceladas' ? 'bg-red-400 text-white text-[10px] px-1.5 py-0.5 rounded-full' : 'bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold'}>0</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
            <Download size={14} className="text-blue-600" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold bg-slate-50/50">
                <th className="py-3.5 pl-4 pr-2 w-8">
                  <input type="checkbox" className="rounded text-blue-600 accent-blue-600" />
                </th>
                <th className="py-3.5 px-3">Colaborador</th>
                <th className="py-3.5 px-3">Matrícula</th>
                <th className="py-3.5 px-3">Função</th>
                <th className="py-3.5 px-3">Cliente</th>
                <th className="py-3.5 px-3">Posto</th>
                <th className="py-3.5 px-3">Avaliador</th>
                <th className="py-3.5 px-3">Data da avaliação</th>
                <th className="py-3.5 px-3">Notas</th>
                <th className="py-3.5 px-3">Pontuação</th>
                <th className="py-3.5 px-3">Classificação</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 pl-4 pr-2">
                    <input type="checkbox" className="rounded text-blue-600 accent-blue-600" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={item.employee} size="sm" />
                      <span className="font-semibold text-slate-800">{item.employee}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">{item.registration}</td>
                  <td className="py-3 px-3 text-slate-600">{item.employee === 'Daniel Ferreira' ? 'Porteiro' : item.employee === 'Fernanda Rocha' ? 'Zeladora' : item.employee.includes('Costa') ? 'Aux. Serviços Gerais' : 'Vigilante'}</td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{item.client}</td>
                  <td className="py-3 px-3 text-slate-500">{item.post}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-700 font-medium">{item.evaluator}</div>
                    <div className="text-[10px] text-slate-400">({item.evaluatorRole})</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>{item.date}</div>
                    <div className="text-[10px] text-slate-400">{(idx * 2 + 10) % 24}:{(idx * 17 + 15) % 60 < 10 ? '0' : ''}{(idx * 17 + 15) % 60}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
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
                  <td className="py-3 px-3 font-bold text-slate-800">{item.score}</td>
                  <td className="py-3 px-3">
                    <span className={`badge-${item.badge || 'prata'}`}>{item.badge ? item.badge.charAt(0).toUpperCase() + item.badge.slice(1) : ''}</span>
                  </td>
                  <td className="py-3 pr-4 pl-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs text-[11px] cursor-pointer">
                        <Eye size={12} />
                        <span>Ver</span>
                      </button>
                      <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>Mostrando 1 - 8 de 1.548 resultados</div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
              <ChevronLeft size={15} />
            </button>
            <button className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">1</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">2</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">3</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">4</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">5</button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">194</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
