import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useData } from '../../app/state';
import {
  Trophy, Users,
  BarChart3, Settings, ChevronDown,
  ChevronLeft, ChevronRight, X, CheckCircle2, Clock,
  ShieldCheck, Star,
} from 'lucide-react';
import { WhatsAppIcon } from '../ui/WhatsAppIcon';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string | string[];
  evaluatorOnly?: boolean;
  badge?: number | string;
  children?: { label: string; path: string; permission: string | string[] }[];
}

export function Sidebar({
  collapsed,
  onToggle,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onCloseMobile?: () => void;
}) {
  const { data } = useData();
  const location = useLocation();

  const hasPermission = (permission?: string | string[]) =>
    !permission ||
    (Array.isArray(permission)
      ? permission.some((item) => data.role.permissions.includes(item))
      : data.role.permissions.includes(permission));

  const roleProfile = (data.role?.name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
  const isClientOrSupervisor = ['cliente', 'supervisor', 'fiscal'].some((p) =>
    roleProfile.includes(p)
  );

  const unevaluatedCount = (data.unevaluatedAlert || []).length;

  const NAV: NavItem[] = [
    {
      label: 'Ranking Geral',
      icon: <Trophy size={20} strokeWidth={2} />,
      path: '/ranking/geral',
      permission: 'ranking',
    },
    {
      label: 'Cadastros',
      icon: <Users size={20} strokeWidth={2} />,
      children: [
        { label: 'Colaboradores', path: '/colaboradores', permission: 'employees' },
        { label: 'Clientes', path: '/clientes', permission: 'clients' },
        { label: 'Postos', path: '/clientes/gestao?tab=posts', permission: 'clients' },
        { label: 'Vínculos de trabalho', path: '/colaboradores/gestao?tab=allocations', permission: 'employees' },
      ],
    },
    {
      label: 'Avaliar',
      icon: <Star size={20} strokeWidth={2} />,
      path: '/avaliacoes/avaliar',
      permission: 'evaluate',
      evaluatorOnly: true,
    },
    {
      label: 'Concluídas',
      icon: <CheckCircle2 size={20} strokeWidth={2} />,
      path: '/avaliacoes/concluidas',
      permission: ['evaluate', 'evaluations'],
      evaluatorOnly: true,
    },
    {
      label: 'Não avaliados',
      icon: <Clock size={20} strokeWidth={2} />,
      path: '/avaliacoes/nao-avaliados',
      permission: 'evaluations',
      badge: unevaluatedCount > 0 ? unevaluatedCount : undefined,
    },
    {
      label: 'Dados e relatórios',
      icon: <BarChart3 size={20} strokeWidth={2} />,
      children: [
        { label: 'Importações', path: '/importacoes', permission: 'imports' },
      ],
    },
    {
      label: 'WhatsApp',
      icon: <WhatsAppIcon size={20} />,
      path: '/whatsapp',
      permission: 'settings',
    },
    {
      label: 'Administração',
      icon: <ShieldCheck size={20} strokeWidth={2} />,
      children: [
        { label: 'Temporadas', path: '/temporadas', permission: 'seasons' },
        { label: 'Usuários', path: '/usuarios', permission: 'users' },
      ],
    },
    {
      label: 'Configurações',
      icon: <Settings size={20} strokeWidth={2} />,
      path: '/configuracoes',
      permission: 'settings',
    },
  ];

  const visibleNav = NAV
    .filter((item) => !item.evaluatorOnly || isClientOrSupervisor)
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => hasPermission(child.permission)),
    }))
    .filter((item) =>
      item.path
        ? hasPermission(item.permission)
        : hasPermission(item.permission) && Boolean(item.children?.length)
    );

  const activeGroups = visibleNav
    .filter((item) =>
      item.children?.some((child) => location.pathname === child.path.split('?')[0])
    )
    .map((item) => item.label);

  const [open, setOpen] = useState<string[]>(
    activeGroups.length ? activeGroups : ['Cadastros']
  );

  useEffect(() => {
    setOpen((current) => [...new Set([...current, ...activeGroups])]);
  }, [location.pathname]);

  const toggle = (label: string) =>
    setOpen((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );

  const isChildActive = (children: { path: string }[]) =>
    children.some((c) => location.pathname === c.path.split('?')[0]);

  const isExactChildActive = (path: string) => {
    const [pathname, query = ''] = path.split('?');
    if (location.pathname !== pathname) return false;
    if (!query)
      return !['/clientes/gestao', '/colaboradores/gestao'].includes(
        location.pathname
      );
    return (
      new URLSearchParams(location.search).get('tab') ===
      new URLSearchParams(query).get('tab')
    );
  };

  const [activeFlyout, setActiveFlyout] = useState<{
    label: string;
    top: number;
    item: NavItem;
  } | null>(null);
  const [isClosingFlyout, setIsClosingFlyout] = useState(false);
  const hoverTimeoutRef = useRef<any>(null);
  const closeTimeoutRef = useRef<any>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);

  const openFlyout = (item: NavItem, top: number) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsClosingFlyout(false);
    setActiveFlyout({
      label: item.label,
      top,
      item,
    });
  };

  const closeFlyout = (immediate = false) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (immediate) {
      setIsClosingFlyout(false);
      setActiveFlyout(null);
      return;
    }
    setIsClosingFlyout(true);
    closeTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
      setIsClosingFlyout(false);
    }, 140);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, item: NavItem) => {
    const rect = e.currentTarget.getBoundingClientRect();
    openFlyout(item, rect.top);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      closeFlyout();
    }, 100);
  };

  // Fecha o modal flutuante se clicar fora dele ou se o sidebar for expandido
  useEffect(() => {
    if (!collapsed) {
      closeFlyout(true);
      return;
    }
    if (!activeFlyout) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (flyoutRef.current && !flyoutRef.current.contains(target)) {
        if (!target?.closest('.sidebar-rail-btn')) {
          closeFlyout();
        }
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [activeFlyout, collapsed]);

  return (
    <aside
      className={`sidebar-minimal ${
        collapsed ? 'is-collapsed' : ''
      } relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 bg-white text-slate-800 border-r border-slate-100 z-30 overflow-x-hidden`}
      style={{
        width: collapsed ? 64 : 220,
      }}
    >
      {/* Botão de alternar barra lateral posicionado na borda divisória superior */}
      <button
        type="button"
        onClick={onToggle}
        className="hidden md:flex absolute top-[18px] -right-3 z-50 w-6 h-6 items-center justify-center rounded-full bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 text-slate-400 hover:text-blue-600 transition-all duration-150 cursor-pointer active:scale-90"
        title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
      >
        {collapsed ? (
          <ChevronRight size={12} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={12} strokeWidth={2.5} />
        )}
      </button>

      {/* Topo / Logo */}
      <div
        className={`sidebar-brand flex items-center ${
          collapsed ? 'justify-center px-1.5' : 'justify-between px-3.5'
        } border-b border-slate-100/80 h-16 min-h-[64px]`}
      >
        {collapsed ? (
          <Link
            to="/"
            className="flex items-center justify-center p-1 rounded-2xl hover:bg-slate-50 transition-colors"
            title="Clube de Talentos"
          >
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              className="w-8 h-8 object-contain drop-shadow-xs transition-transform hover:scale-105"
            />
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link to="/" className="flex items-center gap-2 min-w-0" title="Clube de Talentos">
              <img
                src="/logo/Logo_Club_Talentos_Transparente.png"
                alt="Clube de Talentos"
                className="w-8 h-8 object-contain flex-shrink-0 drop-shadow-xs"
              />
              <div className="sidebar-brand-copy min-w-0 flex flex-col">
                <strong className="truncate font-black text-slate-800 text-[12.5px] tracking-tight">
                  Clube de Talentos
                </strong>
                <small className="truncate text-slate-400 text-[8.5px] font-bold uppercase tracking-wider">
                  GRUPO COMBATE
                </small>
              </div>
            </Link>
          </div>
        )}

        {!collapsed && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-auto flex-shrink-0"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Lista de Navegação */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden ${
          collapsed ? 'px-2 py-3 flex flex-col items-center gap-1.5' : 'px-2 py-3 space-y-1'
        } scrollbar-thin scrollbar-thumb-slate-200`}
      >
        {visibleNav.map((item) => {
          // ── MODO RECOLHIDO (Ícones centralizados) ──
          if (collapsed) {
            if (item.path) {
              const isItemActive =
                location.pathname === item.path ||
                (item.path === '/ranking/geral' && location.pathname.startsWith('/ranking'));

              return (
                <div key={item.label} className="relative flex items-center justify-center">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={`sidebar-rail-btn ${isItemActive ? 'active' : ''}`}
                    title={item.label}
                    aria-label={item.label}
                    onClick={() => onCloseMobile?.()}
                  >
                    {item.icon}

                    {/* Badge de Notificação */}
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </div>
              );
            }

            // Grupo com filhos no modo recolhido (ex: Cadastros, Administração)
            const childActive = item.children ? isChildActive(item.children) : false;

            return (
              <div
                key={item.label}
                className="relative flex items-center justify-center"
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    if (activeFlyout?.label === item.label && !isClosingFlyout) {
                      closeFlyout();
                    } else {
                      openFlyout(item, rect.top);
                    }
                  }}
                  className={`sidebar-rail-btn ${childActive ? 'active' : ''}`}
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-extrabold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          // ── MODO EXPANDIDO ──
          if (item.path) {
            const isItemActive =
              location.pathname === item.path ||
              (item.path === '/ranking/geral' && location.pathname.startsWith('/ranking'));

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `sidebar-link group ${isActive || isItemActive ? 'active' : ''}`
                }
                onClick={() => onCloseMobile?.()}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          }

          const isOpen = open.includes(item.label);
          const childActive = item.children ? isChildActive(item.children) : false;

          return (
            <div key={item.label} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggle(item.label)}
                className={`sidebar-link w-full ${
                  childActive && !isOpen ? 'text-blue-600 font-bold bg-blue-50/50' : ''
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate text-left">{item.label}</span>
                {isOpen ? (
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-slate-400 shrink-0" />
                )}
              </button>

              {isOpen && item.children && (
                <div className="mt-0.5 space-y-0.5 pl-1.5 border-l border-slate-100 ml-4">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`sidebar-sub-link ${
                        isExactChildActive(child.path) ? 'active' : ''
                      }`}
                      aria-current={isExactChildActive(child.path) ? 'page' : undefined}
                      onClick={(event) => {
                        event.currentTarget.blur();
                        onCloseMobile?.();
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 flex-shrink-0" />
                      <span className="truncate">{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Submenu Popover Flutuante fora do nav (posição fixed, sem clipping nem rolagem horizontal) */}
      {collapsed && activeFlyout && activeFlyout.item.children && (
        <div
          ref={flyoutRef}
          style={{
            position: 'fixed',
            top: Math.max(12, Math.min(window.innerHeight - 240, activeFlyout.top)),
            left: 64,
          }}
          className={`sidebar-flyout-menu ${
            isClosingFlyout ? 'is-closing' : ''
          } w-48 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-[9999]`}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
            setIsClosingFlyout(false);
          }}
          onMouseLeave={() => {
            closeFlyout();
          }}
        >
          <div className="space-y-0.5">
            {activeFlyout.item.children.map((child) => (
              <Link
                key={child.path}
                to={child.path}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  isExactChildActive(child.path)
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => {
                  closeFlyout(true);
                  onCloseMobile?.();
                }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isExactChildActive(child.path) ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
