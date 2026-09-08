import { useState } from 'react';
import { Clock, Users, Calendar, Filter, ChevronDown, ChevronRight, ChevronLeft, Download, Search, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { pendingEvaluations } from '../../data/mock';

export default function Pendentes() {
  const [filterTab, setFilterTab] = useState<'todos' | 'atrasados' | 'iniciada'>('todos');
  const [selectedClient, setSelectedClient] = useState('Todos');
  const [selectedPost, setSelectedPost] = useState('Todos');
  const [selectedRole, setSelectedRole] = useState('Todos');
  const [selectedEvaluator, setSelectedEvaluator] = useState('Todos');

  const filtered = pendingEvaluations.filter(item => {
    if (filterTab === 'atrasados') return item.status === 'atrasado';
    if (filterTab === 'iniciada') return item.status === 'pendente';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 font-medium mb-1">
            <span>Avaliações</span> <span className="mx-1">&gt;</span> <span className="text-slate-600 font-semibold">Pendentes</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliações Pendentes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Acompanhe os colaboradores que ainda precisam ser avaliados na temporada atual.</p>
        </div>

        {/* Season card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-3 shadow-xs flex items-center justify-between min-w-[280px]">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Temporada Atual</div>
            <div className="text-base font-bold text-slate-800">2025/1 - 1º Bimestre</div>
            <div className="text-xs text-slate-400">01/01/2025 - 28/02/2025</div>
          </div>
          <span className="badge-ativo text-xs px-2.5 py-1">Em andamento</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">952</div>
            <div className="text-xs font-medium text-slate-500">Avaliações pendentes</div>
            <div className="text-[11px] text-red-500 font-semibold mt-0.5">↑ 12% em relação ao último período</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">78</div>
            <div className="text-xs font-medium text-slate-500">Clientes com pendências</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">de 87 clientes</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">283</div>
            <div className="text-xs font-medium text-slate-500">Colaboradores não avaliados</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">de 1.248 colaboradores</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">18</div>
            <div className="text-xs font-medium text-slate-500">dias restantes</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Até 28/02/2025</div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <option>Condomínio Parque Sul</option>
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
              <option>Acesso Lateral</option>
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
              <option>Porteiro</option>
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
              <option>Carlos Mendes</option>
              <option>Fernanda Alves</option>
              <option>Ricardo Souza</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Situação</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-blue-600 accent-blue-600" />
              <span>Não avaliado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 accent-blue-600" />
              <span>Avaliação iniciada</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 accent-blue-600" />
              <span>Atrasado</span>
            </label>
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl cursor-pointer transition-colors shadow-xs self-end">
            Aplicar filtros
          </button>
        </div>
      </div>

      {/* Tabs bar and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterTab('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              filterTab === 'todos' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Todos (952)
          </button>
          <button
            onClick={() => setFilterTab('atrasados')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'atrasados' ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Atrasados</span>
            <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">247</span>
          </button>
          <button
            onClick={() => setFilterTab('iniciada')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              filterTab === 'iniciada' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Avaliação iniciada</span>
            <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">668</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Ordenar por</span>
            <select className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold outline-none">
              <option>Prazo (mais próximo)</option>
              <option>Nome (A-Z)</option>
              <option>Cliente</option>
            </select>
          </div>
          <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
            <Download size={14} className="text-blue-600" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                <th className="py-3.5 px-3">Avaliador responsável</th>
                <th className="py-3.5 px-3">Situação</th>
                <th className="py-3.5 px-3">Prazo</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((item) => {
                const isLate = item.status === 'atrasado';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
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
                    <td className="py-3 px-3 text-slate-600">{item.role}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{item.client}</td>
                    <td className="py-3 px-3 text-slate-500">{item.post}</td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 font-medium">{item.evaluator}</div>
                      <div className="text-[10px] text-slate-400">({item.evaluatorRole})</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={isLate ? 'badge-atrasado' : 'badge-pendente'}>
                        {isLate ? 'Atrasado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-semibold ${isLate ? 'text-red-500' : 'text-slate-700'}`}>
                        {item.deadline}
                      </div>
                      <div className={`text-[10px] font-medium ${isLate ? 'text-red-400' : 'text-slate-400'}`}>
                        {isLate ? `(${Math.abs(item.daysLeft)} dias)` : `(${item.daysLeft} dias)`}
                      </div>
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/avaliacoes/avaliar"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs text-[11px]"
                        >
                          <Search size={12} />
                          <span>Avaliar</span>
                        </Link>
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>Mostrando 1 - 8 de 952 resultados</div>
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
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600 font-medium">119</button>
            <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-600">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
