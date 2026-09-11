import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useData } from '../../app/state';
import {
  LayoutDashboard, Star, Trophy, Users,
  BarChart3, Settings, ChevronDown,
  ChevronRight, X,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string | string[];
  children?: { label: string; path: string; permission: string | string[] }[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/', permission: 'dashboard' },
  {
    label: 'Cadastros', icon: <Users size={18} />,
    children: [
      { label: 'Colaboradores', path: '/colaboradores', permission: 'employees' },
      { label: 'Clientes', path: '/clientes', permission: 'clients' },
      { label: 'Postos', path: '/clientes/gestao?tab=posts', permission: 'clients' },
      { label: 'Vínculos de trabalho', path: '/colaboradores/gestao?tab=allocations', permission: 'employees' },
    ],
  },
  {
    label: 'Avaliações', icon: <Star size={18} />,
    permission: 'evaluate',
    children: [
      { label: 'Avaliar', path: '/avaliacoes/avaliar', permission: 'evaluate' },
      { label: 'Concluídas', path: '/avaliacoes/concluidas', permission: ['evaluate', 'evaluations'] },
      { label: 'Histórico', path: '/avaliacoes/historico', permission: ['evaluate', 'evaluations'] },
      { label: 'Não avaliados', path: '/avaliacoes/nao-avaliados', permission: 'evaluations' },
    ],
  },
  {
    label: 'Desempenho', icon: <Trophy size={18} />,
    children: [
      { label: 'Ranking', path: '/ranking/geral', permission: 'ranking' },
      { label: 'Conquistas', path: '/conquistas', permission: 'achievements' },
    ],
  },
  {
    label: 'Dados e relatórios', icon: <BarChart3 size={18} />,
    children: [
      { label: 'Importações', path: '/importacoes', permission: 'imports' },
      { label: 'Relatórios', path: '/relatorios', permission: 'reports' },
    ],
  },
  {
    label: 'Administração', icon: <Settings size={18} />,
    children: [
      { label: 'Temporadas', path: '/temporadas', permission: 'seasons' },
      { label: 'Usuários e acessos', path: '/usuarios', permission: 'users' },
      { label: 'Configurações', path: '/configuracoes', permission: 'settings' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle, onCloseMobile }: { collapsed: boolean; onToggle: () => void; onCloseMobile?: () => void }) {
  const { data } = useData();
  const location = useLocation();
  const hasPermission = (permission?: string | string[]) => !permission || (Array.isArray(permission)
    ? permission.some(item => data.role.permissions.includes(item))
    : data.role.permissions.includes(permission));
  const visibleNav = NAV
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
      className={`sidebar-minimal ${collapsed ? 'is-collapsed' : ''} flex flex-col h-screen flex-shrink-0 transition-all duration-300`}
      style={{
        width: collapsed ? 72 : 250,
      }}
    >
      {/* Logo */}
      <div className={`sidebar-brand flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {collapsed ? (
          <Link to="/" className="flex items-center justify-center p-0.5" title="Clube de Talentos">
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              className="w-11 h-11 object-contain drop-shadow-xs transition-transform hover:scale-105"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2.5 min-w-0" title="Clube de Talentos">
              {/* No desktop expandido usa logo sem nome; no drawer mobile usa a logo completa */}
              <img
                src="/logo/Logo_Club_Talentos_Transparente_sem_nome.png"
                alt="Clube de Talentos"
                className="hidden md:block w-9 h-9 object-contain flex-shrink-0 drop-shadow-xs"
              />
              <img
                src="/logo/Logo_Club_Talentos_Transparente.png"
                alt="Clube de Talentos"
                className="md:hidden w-10 h-10 object-contain flex-shrink-0 drop-shadow-xs"
              />
              <div className="sidebar-brand-copy min-w-0">
                <strong className="truncate font-black text-slate-800 text-[13px] tracking-tight">Clube de Talentos</strong>
                <small className="truncate text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{data.organization}</small>
              </div>
            </Link>
          </div>
        )}
        {!collapsed && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors ml-auto flex-shrink-0"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && <div className="sidebar-section-label">Navegação</div>}
        {visibleNav.map(item => {
          if (item.path) {
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
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
            <div key={item.label}>
              <button
                onClick={() => {
                  if (collapsed) onToggle();
                  if (!isOpen) toggle(item.label);
                  else if (!collapsed) toggle(item.label);
                }}
                className={`sidebar-link w-full ${childActive && !isOpen ? 'text-blue-400' : ''}`}
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
                      <span className="w-1 h-1 rounded-full bg-current opacity-60 flex-shrink-0" />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
