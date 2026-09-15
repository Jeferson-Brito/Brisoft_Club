import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useData } from '../../app/state';
import {
  Star, Trophy, Users,
  BarChart3, Settings, ChevronDown,
  ChevronLeft, ChevronRight, X, CheckCircle2, Clock,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string | string[];
  evaluatorOnly?: boolean;
  children?: { label: string; path: string; permission: string | string[] }[];
}

const NAV: NavItem[] = [
  {
    label: 'Cadastros', icon: <Users size={18} />,
    children: [
      { label: 'Colaboradores', path: '/colaboradores', permission: 'employees' },
      { label: 'Clientes', path: '/clientes', permission: 'clients' },
      { label: 'Postos', path: '/clientes/gestao?tab=posts', permission: 'clients' },
      { label: 'Vínculos de trabalho', path: '/colaboradores/gestao?tab=allocations', permission: 'employees' },
    ],
  },
  { label: 'Ranking', icon: <Trophy size={18} />, path: '/ranking/geral', permission: 'ranking' },
  { label: 'Avaliar', icon: <Star size={18} />, path: '/avaliacoes/avaliar', permission: 'evaluate', evaluatorOnly: true },
  { label: 'Concluídas', icon: <CheckCircle2 size={18} />, path: '/avaliacoes/concluidas', permission: ['evaluate', 'evaluations'], evaluatorOnly: true },
  { label: 'Não avaliados', icon: <Clock size={18} />, path: '/avaliacoes/nao-avaliados', permission: 'evaluations' },
  {
    label: 'Dados e relatórios', icon: <BarChart3 size={18} />,
    children: [
      { label: 'Importações', path: '/importacoes', permission: 'imports' },
    ],
  },
  {
    label: 'Administração', icon: <Settings size={18} />,
    children: [
      { label: 'Temporadas', path: '/temporadas', permission: 'seasons' },
      { label: 'Usuários e acessos', path: '/usuarios', permission: 'users' },
    ],
  },
  { label: 'Configurações', icon: <Settings size={18} />, path: '/configuracoes', permission: 'settings' },
];

export function Sidebar({ collapsed, onToggle, onCloseMobile }: { collapsed: boolean; onToggle: () => void; onCloseMobile?: () => void }) {
  const { data } = useData();
  const location = useLocation();
  const hasPermission = (permission?: string | string[]) => !permission || (Array.isArray(permission)
    ? permission.some(item => data.role.permissions.includes(item))
    : data.role.permissions.includes(permission));
  const roleProfile = (data.role?.name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
  const isClientOrSupervisor = ['cliente', 'supervisor', 'fiscal'].some(p => roleProfile.includes(p));

  const visibleNav = NAV
    .filter(item => !item.evaluatorOnly || isClientOrSupervisor)
    .map(item => ({ ...item, children: item.children?.filter(child => hasPermission(child.permission)) }))
    .filter(item => item.path ? hasPermission(item.permission) : hasPermission(item.permission) && Boolean(item.children?.length));
  const activeGroups = visibleNav.filter(item => item.children?.some(child => location.pathname === child.path.split('?')[0])).map(item => item.label);
  const [open, setOpen] = useState<string[]>(activeGroups.length ? activeGroups : ['Cadastros']);

  useEffect(() => {
    setOpen(current => [...new Set([...current, ...activeGroups])]);
  }, [location.pathname]);

  const toggle = (label: string) =>
    setOpen(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  const isChildActive = (children: { path: string }[]) =>
    children.some(c => location.pathname === c.path.split('?')[0]);

  const isExactChildActive = (path: string) => {
    const [pathname, query = ''] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (!query) return !['/clientes/gestao', '/colaboradores/gestao'].includes(location.pathname);
    return new URLSearchParams(location.search).get('tab') === new URLSearchParams(query).get('tab');
  };

  return (
    <aside
      className={`sidebar-minimal ${collapsed ? 'is-collapsed' : ''} relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 bg-[#071e4d] text-white border-r border-white/10`}
      style={{
        width: collapsed ? 72 : 250,
      }}
    >
      {/* Botão de alternar barra lateral posicionado exatamente SOBRE a linha divisória */}
      <button
        type="button"
        onClick={onToggle}
        className="hidden md:flex absolute top-[19px] left-full -translate-x-1/2 z-50 w-7 h-7 items-center justify-center rounded-full bg-[#071e4d] border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:shadow-md hover:border-[#f5b300] hover:bg-[#0a2766] text-slate-300 hover:text-white transition-all duration-150 cursor-pointer active:scale-90"
        title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
      >
        {collapsed ? (
          <ChevronRight size={14} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={14} strokeWidth={2.5} />
        )}
      </button>

      {/* Logo e Identidade Visual Grupo Combate */}
      <div className={`sidebar-brand flex items-center ${collapsed ? 'justify-center' : 'justify-between'} border-b border-white/10 px-4`}>
        {collapsed ? (
          <Link to="/" className="flex items-center justify-center p-0.5" title="Clube de Talentos">
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              className="w-10 h-10 object-contain drop-shadow-xs transition-transform hover:scale-105"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2.5 min-w-0" title="Clube de Talentos">
              <img
                src="/logo/Logo_Club_Talentos_Transparente.png"
                alt="Clube de Talentos"
                className="w-9 h-9 object-contain flex-shrink-0 drop-shadow-xs"
              />
              <div className="sidebar-brand-copy min-w-0 flex flex-col">
                <strong className="truncate font-black text-white text-[13px] tracking-tight">Clube de Talentos</strong>
                <small className="truncate text-[#f5b300] text-[9px] font-extrabold uppercase tracking-wider">GRUPO COMBATE</small>
              </div>
            </Link>
          </div>
        )}
        {!collapsed && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ml-auto flex-shrink-0"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        {visibleNav.map(item => {
          if (item.path) {
            const isItemActive = location.pathname === item.path ||
              (item.path === '/ranking/geral' && location.pathname.startsWith('/ranking'));
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive || isItemActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
                data-tooltip={collapsed ? item.label : undefined}
                onClick={() => onCloseMobile?.()}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          }

          const isOpen = open.includes(item.label);
          const childActive = item.children ? isChildActive(item.children) : false;

          return (
            <div key={item.label} className="space-y-0.5">
              <button
                onClick={() => {
                  if (collapsed) onToggle();
                  if (!isOpen) toggle(item.label);
                  else if (!collapsed) toggle(item.label);
                }}
                className={`sidebar-link w-full ${childActive && !isOpen ? 'text-[#f5b300]' : ''}`}
                title={collapsed ? item.label : undefined}
                data-tooltip={collapsed ? item.label : undefined}
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
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`sidebar-sub-link ${isExactChildActive(child.path) ? 'active' : ''}`}
                      aria-current={isExactChildActive(child.path) ? 'page' : undefined}
                      onClick={event => {
                        event.currentTarget.blur();
                        onCloseMobile?.();
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Slogan e Grafismo Rodapé da Sidebar Conforme Imagem */}
      {!collapsed && (
        <div className="mt-auto p-4 relative overflow-hidden select-none border-t border-white/10 bg-[#06183d]/60">
          <div className="relative z-10 space-y-0.5 pl-2 pb-1">
            <p className="text-white/95 text-xs font-semibold tracking-tight">
              Juntos, valorizamos
            </p>
            <p className="text-[#f5b300] italic font-serif text-[15px] tracking-wide font-bold">
              o seu talento!
            </p>
          </div>
          {/* Listras diagonais no canto inferior esquerdo */}
          <div className="absolute bottom-0 left-0 w-28 h-24 pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 110 90" className="w-full h-full">
              <polygon points="0,55 0,30 55,90 30,90" fill="#f5b300" />
              <polygon points="0,25 0,0 85,90 60,90" fill="#c8102e" />
            </svg>
          </div>
        </div>
      )}
    </aside>
  );
}
