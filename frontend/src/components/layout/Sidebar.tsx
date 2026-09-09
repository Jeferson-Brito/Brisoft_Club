import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useData } from '../../app/state';
import {
  LayoutDashboard, Star, Trophy, Users, Building2, Calendar,
  Award, Upload, BarChart3, UserCog, Settings, ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: { label: string; path: string }[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
  {
    label: 'Avaliações', icon: <Star size={18} />,
    children: [
      { label: 'Avaliar', path: '/avaliacoes/avaliar' },
      { label: 'Pendentes', path: '/avaliacoes/pendentes' },
      { label: 'Concluídas', path: '/avaliacoes/concluidas' },
      { label: 'Histórico', path: '/avaliacoes/historico' },
    ],
  },
  {
    label: 'Ranking', icon: <Trophy size={18} />,
    children: [
      { label: 'Ranking Geral', path: '/ranking/geral' },
      { label: 'Por Cliente', path: '/ranking/por-cliente' },
      { label: 'Pódio', path: '/ranking/podio' },
      { label: 'Histórico', path: '/ranking/historico' },
    ],
  },
  { label: 'Colaboradores', icon: <Users size={18} />, path: '/colaboradores' },
  { label: 'Clientes', icon: <Building2 size={18} />, path: '/clientes' },
  { label: 'Temporadas', icon: <Calendar size={18} />, path: '/temporadas' },
  { label: 'Conquistas', icon: <Award size={18} />, path: '/conquistas' },
  { label: 'Importações', icon: <Upload size={18} />, path: '/importacoes' },
  { label: 'Relatórios', icon: <BarChart3 size={18} />, path: '/relatorios' },
  { label: 'Usuários e Acessos', icon: <UserCog size={18} />, path: '/usuarios' },
  { label: 'Configurações', icon: <Settings size={18} />, path: '/configuracoes' },
];

const QUOTES = [
  '"Grandes resultados são construídos por grandes pessoas."',
  '"Reconhecer talentos é construir um futuro mais forte."',
  '"Talento é resultado de atitude, e atitude transforma realidades."',
  '"Talentos constroem resultados extraordinários."',
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { data } = useData();
  const permissionFor: Record<string, string> = {'Dashboard':'dashboard','Avaliações':'evaluate','Ranking':'ranking','Colaboradores':'employees','Clientes':'clients','Temporadas':'seasons','Conquistas':'achievements','Importações':'imports','Relatórios':'reports','Usuários e Acessos':'users','Configurações':'settings'};
  const visibleNav = NAV.filter(item => data.role.permissions.includes(permissionFor[item.label]) || (item.label==='Avaliações' && data.role.permissions.includes('evaluations'))).map(item => ({...item,children:item.children?.filter(child => child.path!=='/avaliacoes/avaliar'||data.role.permissions.includes('evaluate'))}));
  const location = useLocation();
  const [open, setOpen] = useState<string[]>(['Avaliações', 'Ranking']);

  const toggle = (label: string) =>
    setOpen(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const isChildActive = (children: { path: string }[]) =>
    children.some(c => location.pathname.startsWith(c.path));

  const quote = QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length];

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? 64 : 220,
        background: '#0F1117',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity border-0"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
        >
          <span className="text-white font-black text-lg">★</span>
        </button>
        {!collapsed && (
          <div>
            <div className="text-white font-black text-sm leading-tight tracking-wide">CLUBE DE</div>
            <div className="text-white font-black text-sm leading-tight tracking-wide">TALENTOS</div>
            <div className="text-slate-500 text-[9px] font-medium tracking-widest mt-0.5">PESSOAS QUE FAZEM A DIFERENÇA</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNav.map(item => {
          if (item.path) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          }

          const isOpen = open.includes(item.label);
          const childActive = item.children ? isChildActive(item.children) : false;

          return (
            <div key={item.label}>
              <button
                onClick={() => toggle(item.label)}
                className={`sidebar-link w-full ${childActive && !isOpen ? 'text-blue-400' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </>
                )}
              </button>
              {!collapsed && isOpen && item.children && (
                <div className="mt-0.5 space-y-0.5">
                  {item.children.map(child => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      className={({ isActive }) => `sidebar-sub-link ${isActive ? 'active' : ''}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-current opacity-60 flex-shrink-0" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Quote at bottom */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/5">
          <p className="text-slate-500 text-[10px] italic leading-relaxed">{quote}</p>
        </div>
      )}
    </aside>
  );
}
