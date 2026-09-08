import { Users, Building2, CheckSquare, Trophy, AlertCircle, ChevronRight, Calendar } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { employees } from '../data/mock';
import { Link } from 'react-router-dom';

/* ── Mini donut SVG ─────────────────────────────────────────────────── */
function DonutChart({ pct }: { pct: number }) {
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={128} height={128} className="rotate-[-90deg] drop-shadow-sm">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={14} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#10b981" strokeWidth={14}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

/* ── Horizontal progress bar ────────────────────────────────────────── */
function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/* ── Static data ────────────────────────────────────────────────────── */
const clientProgress = [
  { name: 'Shopping Boa Vista',       pct: 100, color: '#10b981' },
  { name: 'Hospital Central',         pct: 85,  color: '#10b981' },
  { name: 'Centro Empresarial Alpha', pct: 70,  color: '#1B6EF3' },
  { name: 'Condomínio Parque Sul',    pct: 55,  color: '#f59e0b' },
  { name: 'Indústria Paulista',       pct: 40,  color: '#ef4444' },
];

const topCollab = employees.slice(0, 5);

const lastEvals = [
  { name: 'Lucas Ferreira',   client: 'Shopping Boa Vista',       date: '10/04/2025', nota: 5 },
  { name: 'Mariana Alves',    client: 'Hospital Central',          date: '10/04/2025', nota: 4 },
  { name: 'Rogério Lima',     client: 'Condomínio Parque Sul',     date: '09/04/2025', nota: 3 },
  { name: 'Patrícia Souza',   client: 'Indústria Paulista',        date: '09/04/2025', nota: 5 },
  { name: 'Daniel Martins',   client: 'Centro Empresarial Alpha',  date: '08/04/2025', nota: 4 },
];

const pendencias = [
  { label: 'Avaliações pendentes',         count: 952, color: 'bg-red-500' },
  { label: 'Clientes sem avaliação',       count: 18,  color: 'bg-orange-500' },
  { label: 'Inconsistências na importação', count: 7,  color: 'bg-amber-500' },
  { label: 'Colaboradores sem alocação',   count: 12,  color: 'bg-orange-400' },
  { label: 'Solicitações de acesso',       count: 3,   color: 'bg-blue-500' },
];

const notaColor = (n: number) => n >= 5 ? '#059669' : n >= 4 ? '#10b981' : n >= 3 ? '#f59e0b' : '#ef4444';

/* ── Section card wrapper ───────────────────────────────────────────── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── Card header row ────────────────────────────────────────────────── */
function CardHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-bold text-slate-800 text-sm leading-tight">{title}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão geral do Clube de Talentos</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-500 font-semibold">Temporada Atual:</div>
          <select className="mt-1 text-sm font-bold text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-100 shadow-xs">
            <option>1ª Temporada 2025</option>
            <option>2ª Temporada 2024</option>
          </select>
          <div className="text-[11px] text-slate-400 mt-0.5">(Jan/2025 – Abr/2025)</div>
        </div>
      </div>

      {/* ── KPI Cards — 4 colunas ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Colaboradores */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Users size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-slate-800 leading-tight">1.248</div>
            <div className="text-sm text-slate-500 font-medium mt-0.5">Colaboradores</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <span>↑</span> +5% em relação à temporada anterior
            </div>
          </div>
        </Card>

        {/* Clientes */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Building2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-slate-800 leading-tight">87</div>
            <div className="text-sm text-slate-500 font-medium mt-0.5">Clientes</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
              <span>↑</span> +3% em relação à temporada anterior
            </div>
          </div>
        </Card>

        {/* Avaliações */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckSquare size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-slate-800 leading-tight">62%</div>
            <div className="text-sm text-slate-500 font-medium mt-0.5">Avaliações concluídas</div>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }} />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">1.548 de 2.500 avaliações</div>
          </div>
        </Card>

        {/* Destaque */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
            <Trophy size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black text-slate-800 leading-tight">152</div>
            <div className="text-sm text-slate-500 font-medium mt-0.5">Colaboradores em destaque</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="badge-ouro">48 Ouro</span>
              <span className="badge-prata">62 Prata</span>
              <span className="badge-bronze">32 Bronze</span>
              <span className="badge-diamante">10 💎</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Row 2 — 3 colunas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Progresso das Avaliações */}
        <Card className="p-5">
          <CardHeader
            icon={<CheckSquare size={18} />}
            title="Progresso das Avaliações"
            sub="Acompanhe o andamento das avaliações da temporada atual."
          />
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative flex-shrink-0">
              <DonutChart pct={62} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800">62%</span>
                <span className="text-[10px] text-slate-400 font-medium">Concluídas</span>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-500">Concluídas</span>
                <span className="ml-auto font-bold text-slate-800 text-sm">1.548</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-blue-300 flex-shrink-0" />
                <span className="text-xs text-slate-500">Pendentes</span>
                <span className="ml-auto font-bold text-slate-800 text-sm">952</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-slate-200 flex-shrink-0" />
                <span className="text-xs text-slate-500">Não iniciadas</span>
                <span className="ml-auto font-bold text-slate-800 text-sm">0</span>
              </div>
            </div>
          </div>
          <Link to="/avaliacoes/concluidas" className="mt-5 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Ver todas as avaliações <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Avaliações por Cliente */}
        <Card className="p-5">
          <CardHeader
            icon={<Building2 size={18} />}
            title="Avaliações por Cliente (Top 5)"
            sub="Percentual de avaliações concluídas por cliente."
          />
          <div className="space-y-3.5">
            {clientProgress.map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium w-36 truncate flex-shrink-0">{c.name}</span>
                <HBar pct={c.pct} color={c.color} />
                <span className="text-xs font-bold w-9 text-right flex-shrink-0" style={{ color: c.color }}>{c.pct}%</span>
              </div>
            ))}
          </div>
          <Link to="/clientes" className="mt-5 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Ver todos os clientes <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Status da Temporada */}
        <Card className="p-5">
          <CardHeader
            icon={<Calendar size={18} />}
            title="Status da Temporada"
          />
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800">1ª Temporada 2025</div>
              <span className="badge-andamento">Em andamento</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Jan/2025 – Abr/2025</div>
          </div>

          <div className="space-y-4">
            {[
              { name: '1º Bimestre',   sub: 'Jan/2025 – Fev/2025', status: 'concluida', color: '#10b981', pct: undefined },
              { name: '2º Bimestre',   sub: 'Mar/2025 – Abr/2025', status: 'andamento', color: '#1B6EF3', pct: 62 },
              { name: 'Resultado Final', sub: '03/05/2025',         status: 'aguardando', color: '#94a3b8', pct: undefined },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: step.color + '1A', border: `2px solid ${step.color}`, color: step.color }}
                >
                  {step.status === 'concluida' && '✓'}
                  {step.status === 'andamento' && <span className="w-2 h-2 rounded-full" style={{ background: step.color }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700">{step.name}</span>
                    {step.status === 'concluida'  && <span className="badge-concluida whitespace-nowrap">Concluído</span>}
                    {step.status === 'andamento'  && <span className="badge-andamento whitespace-nowrap">Em andamento</span>}
                    {step.status === 'aguardando' && <span className="badge-encerrada whitespace-nowrap">Aguardando</span>}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{step.sub}</div>
                  {step.pct !== undefined && (
                    <div className="mt-1.5">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${step.pct}%`, background: step.color }} />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{step.pct}%</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3 — 3 colunas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top 5 Colaboradores */}
        <Card className="p-5">
          <CardHeader
            icon={<Trophy size={18} />}
            title="Top 5 – Colaboradores da Temporada"
            sub="Melhores médias até o momento."
          />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="text-left pb-2.5 font-semibold w-6">#</th>
                <th className="text-left pb-2.5 font-semibold">Colaborador</th>
                <th className="text-left pb-2.5 font-semibold">Média</th>
                <th className="text-left pb-2.5 font-semibold">Conquista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topCollab.map((e, i) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white ${
                      i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-200 !text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={e.name} size="xs" />
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[90px]">{e.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 font-bold text-slate-700 text-sm">{e.avgScore.toFixed(1)}</td>
                  <td className="py-2.5">
                    {e.badge && <Badge type={e.badge} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/ranking/geral" className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Ver ranking completo <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Últimas Avaliações */}
        <Card className="p-5">
          <CardHeader
            icon={<CheckSquare size={18} />}
            title="Últimas Avaliações"
            sub="Avaliações realizadas recentemente."
          />
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider">
                <th className="text-left pb-2.5 font-semibold">Colaborador</th>
                <th className="text-left pb-2.5 font-semibold">Cliente</th>
                <th className="text-left pb-2.5 font-semibold">Data</th>
                <th className="text-right pb-2.5 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lastEvals.map((ev, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={ev.name} size="xs" />
                      <span className="font-semibold text-slate-700 truncate max-w-[80px]">{ev.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-slate-500 truncate max-w-[90px]">{ev.client}</td>
                  <td className="py-2.5 pr-2 text-slate-400 whitespace-nowrap">{ev.date}</td>
                  <td className="py-2.5 text-right">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[11px] font-black text-white"
                      style={{ background: notaColor(ev.nota) }}
                    >
                      {ev.nota}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/avaliacoes/historico" className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Ver histórico <ChevronRight size={14} />
          </Link>
        </Card>

        {/* Pendências */}
        <Card className="p-5">
          <CardHeader
            icon={<AlertCircle size={18} className="text-red-500" />}
            title="Pendências"
            sub="Ações que precisam de atenção."
          />
          <div className="space-y-2">
            {pendencias.map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-600 leading-tight">{item.label}</span>
                <span className={`${item.color} text-white text-xs font-bold px-2.5 py-0.5 rounded-full min-w-[32px] text-center flex-shrink-0 ml-3`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          <Link to="/avaliacoes/pendentes" className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            Ver todas as pendências <ChevronRight size={14} />
          </Link>
        </Card>
      </div>

    </div>
  );
}
