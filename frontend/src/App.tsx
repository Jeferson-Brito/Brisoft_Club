import { LoadingScreen } from "./components/ui/LoadingScreen";
import { useEffect, useState, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";
import { Bell, LogOut, Star, Trophy, CheckCircle2, ChevronDown, KeyRound, ChevronRight, ArrowUp } from "lucide-react";
import { Sidebar } from "./components/layout/Sidebar";
import { Avatar } from "./components/ui/Avatar";
import { api, DataProvider, useData } from "./app/state";
import { Auth } from "./app/Auth";
import { Catalog } from "./app/Catalogs";
import { Seasons } from "./app/Seasons";
import { Settings } from "./app/Settings";
import Avaliar from "./pages/avaliacoes/Avaliar";
import Concluidas from "./pages/avaliacoes/Concluidas";
import NaoAvaliados from "./pages/avaliacoes/NaoAvaliados";
import RankingGeral from "./pages/ranking/RankingGeral";
import Colaboradores from "./pages/colaboradores/Colaboradores";
import Clientes from "./pages/clientes/Clientes";
import { Rankings } from "./app/Insights";
import { Imports } from "./app/Imports";
import { Reports } from "./app/Reports";
import { Editor, Panel } from "./app/ui";
import "./app/style.css";


function Layout({ logout }: { logout: () => void }) {
  const { data, notify, refresh } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [password, setPassword] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      setShowScrollTop(scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const evaluator = data.role.permissions.includes("evaluate");

  useEffect(() => {
    setMobile(false);
    setUserMenuOpen(false);
    setNotifications(false);
  }, [location.pathname]);

  // Click outside to close user dropdown menu and notifications panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideUserMenu = (userMenuRef.current && userMenuRef.current.contains(target)) ||
                             (mobileUserMenuRef.current && mobileUserMenuRef.current.contains(target));
      if (!insideUserMenu) {
        setUserMenuOpen(false);
      }
      const insideNotifications = (notificationsRef.current && notificationsRef.current.contains(target)) ||
                                  (mobileNotificationsRef.current && mobileNotificationsRef.current.contains(target));
      if (!insideNotifications) {
        setNotifications(false);
      }
    };
    if (userMenuOpen || notifications) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userMenuOpen, notifications]);

  const pending = data.participants.filter(
    (p) =>
      data.cycles.find((c) => c.id === p.cycleId)?.status === "ativo" &&
      !data.evaluations.some(
        (e) =>
          e.participantId === p.id &&
          e.evaluatorId === data.user.id &&
          !e.replicated &&
          e.status !== "rascunho",
      ),
  ).length;

  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <div className={`sidebar-shell ${mobile ? "mobile-open" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onCloseMobile={() => setMobile(false)}
        />
      </div>
      {mobile && (
        <button
          className="mobile-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="app-main">
        <header className="app-topbar hidden md:flex items-center justify-end relative overflow-hidden bg-[#071e4d] border-b border-white/10 px-6">
          {/* Faixas Diagonais Corporativas Grupo Combate no Topo Conforme Imagem */}
          <div className="absolute top-0 right-48 h-full w-56 pointer-events-none overflow-hidden hidden md:block z-10 select-none">
            <svg viewBox="0 0 200 65" className="h-full w-full" preserveAspectRatio="none">
              <polygon points="85,0 125,0 75,65 35,65" fill="#c8102e" />
              <polygon points="130,0 160,0 110,65 80,65" fill="#f5b300" />
            </svg>
          </div>

          <div className="topbar-right ml-auto flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
                <button
                  className="icon-btn notification-button cursor-pointer text-white hover:bg-white/10 p-2 rounded-xl relative transition-colors"
                  aria-label="Notificações"
                  onClick={() => setNotifications((prev) => !prev)}
                >
                  <Bell size={20} className="text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                    {pending > 0 ? (pending > 9 ? '9+' : pending) : 2}
                  </span>
                </button>

                {notifications && (
                  <div className="notification-panel">
                    <h3>Seu acompanhamento</h3>
                    <p>{pending} colaboradores disponíveis para avaliação.</p>
                    <Link
                      to="/avaliacoes/avaliar"
                      onClick={() => setNotifications(false)}
                    >
                      Avaliar agora →
                    </Link>
                  </div>
                )}
              </div>
            {/* Menu suspenso ao clicar na foto do usuário */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="user-button flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="Menu do usuário"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-[#f5b300] text-[#071e4d] font-black text-xs flex items-center justify-center shadow-xs">
                  {data.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <span className="hidden sm:inline-block text-left leading-tight">
                  <strong className="block text-xs font-bold text-white">{data.user.name}</strong>
                  <small className="block text-[10px] text-slate-300 font-medium">{data.role.name}</small>
                </span>
                <ChevronDown size={14} className={`text-slate-300 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-[0_20px_48px_-8px_rgba(15,23,42,0.16),0_4px_16px_rgba(15,23,42,0.06)] border border-slate-100/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-gradient-to-b from-slate-50/90 via-slate-50/40 to-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={data.user.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {data.user.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100/90 truncate">
                            {data.role.name}
                          </span>
                          {data.user.login && (
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              @{data.user.login}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setPassword(true);
                      }}
                      className="w-full group flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100/80 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                          <KeyRound size={15} />
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                            Alterar minha senha
                          </span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Segurança e credenciais
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full group flex items-center justify-between p-2 rounded-xl text-left hover:bg-rose-50/80 active:bg-rose-100/70 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 group-hover:scale-105 transition-all">
                          <LogOut size={15} />
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-semibold text-rose-600 group-hover:text-rose-700 transition-colors">
                            Sair do sistema
                          </span>
                          <span className="block text-[10px] text-rose-400 font-normal">
                            Finalizar sessão com segurança
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Header Exclusivo Mobile (Padrão Marketing Navy #071e4d) ── */}
        <header className="md:hidden sticky top-0 z-40 h-16 bg-[#071e4d] px-4 flex items-center justify-between select-none shadow-md">
          {/* Logo + Title */}
          <Link to="/" className="flex items-center gap-2.5 z-20">
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              className="h-9 w-auto object-contain drop-shadow-sm"
            />
            <span className="text-white font-bold text-[15px] tracking-tight">
              Clube de Talentos
            </span>
          </Link>

          {/* Right: Notifications + User Avatar */}
          <div className="flex items-center gap-3 z-20">
            {/* Bell with red badge & Interactive Dropdown */}
            <div className="relative" ref={mobileNotificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotifications((prev) => !prev);
                }}
                className="relative text-white p-1 hover:opacity-80 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                aria-label="Notificações"
              >
                <Bell size={20} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {pending > 0 ? (pending > 9 ? '9+' : pending) : 2}
                </span>
              </button>

              {/* Mobile Notifications Dropdown Panel */}
              {notifications && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-[0_20px_48px_-8px_rgba(15,23,42,0.2),0_4px_16px_rgba(15,23,42,0.08)] border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-blue-600" />
                      <h3 className="font-bold text-xs text-slate-800">Seu acompanhamento</h3>
                    </div>
                    {pending > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100">
                        {pending} pendente{pending > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                    {pending > 0
                      ? `${pending} colaborador(es) aguardando sua avaliação neste ciclo.`
                      : 'Você concluiu todas as avaliações deste ciclo!'}
                  </p>
                  {evaluator && (
                    <Link
                      to="/avaliacoes/avaliar"
                      onClick={() => setNotifications(false)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all shadow-sm"
                    >
                      <span>Avaliar agora</span>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Avatar Circle DA & Interactive Dropdown */}
            <div className="relative" ref={mobileUserMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifications(false);
                  setUserMenuOpen((prev) => !prev);
                }}
                className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-black ring-2 ring-white/40 shadow-xs active:scale-95 transition-transform cursor-pointer"
                aria-label="Menu do usuário"
                aria-expanded={userMenuOpen}
              >
                {data.user?.name ? (data.user.name.split(' ').length > 1 ? data.user.name.split(' ')[0][0] + data.user.name.split(' ').slice(-1)[0][0] : data.user.name.slice(0, 2)).toUpperCase() : 'DA'}
              </button>

              {/* Mobile User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-[0_20px_48px_-8px_rgba(15,23,42,0.22),0_4px_16px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-gradient-to-b from-slate-50/90 via-slate-50/40 to-white border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={data.user.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                          {data.user.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100/90 truncate">
                            {data.role.name}
                          </span>
                          {data.user.login && (
                            <span className="text-[10px] text-slate-400 font-normal truncate">
                              @{data.user.login}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setPassword(true);
                      }}
                      className="w-full group flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100/80 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                          <KeyRound size={15} />
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                            Alterar minha senha
                          </span>
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Segurança e credenciais
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full group flex items-center justify-between p-2 rounded-xl text-left hover:bg-rose-50/80 active:bg-rose-100/70 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 group-hover:scale-105 transition-all">
                          <LogOut size={15} />
                        </div>
                        <div className="truncate">
                          <span className="block text-xs font-semibold text-rose-600 group-hover:text-rose-700 transition-colors">
                            Sair do sistema
                          </span>
                          <span className="block text-[10px] text-rose-400 font-normal">
                            Finalizar sessão com segurança
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-rose-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tri-color Diagonal Ribbon in Top-Right Corner */}
          <div className="pointer-events-none select-none absolute inset-0 overflow-hidden z-10">
            <svg
              className="absolute top-0 right-0 w-24 h-24"
              viewBox="0 0 100 100"
              fill="none"
            >
              <polygon points="100,0 65,0 100,65" fill="#040e26" />
              <polygon points="65,0 45,0 100,45 100,65" fill="#c8102e" />
              <polygon points="45,0 30,0 100,30 100,45" fill="#f5b300" />
            </svg>
          </div>
        </header>
        <main className="page-content bg-white md:rounded-tl-[28px] shadow-sm min-h-[calc(100vh-65px)] p-4 sm:p-6 pb-20 md:pb-6" key={location.pathname}>
          <Outlet />
        </main>
        

        {/* ── Barra de Navegação Inferior para Mobile (Mais compacta e elegante) ── */}
        <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071e4d] border-t border-slate-800/90 shadow-[0_-4px_16px_rgba(0,0,0,0.25)] px-2 pt-1 pb-1 flex flex-col items-center">
          <div className="w-full flex items-center justify-around">
            {/* Ranking Tab */}
            <NavLink
              to="/ranking/geral"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-0.5 px-3 transition-colors ${
                  isActive ? 'text-[#f5b300]' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Trophy size={18} className={isActive ? 'text-[#f5b300]' : 'text-slate-300'} />
                  <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-[#f5b300]' : 'text-slate-300'}`}>
                    Ranking
                  </span>
                  {isActive ? (
                    <span className="w-6 h-[2px] bg-[#f5b300] rounded-full mt-0.5" />
                  ) : (
                    <span className="w-6 h-[2px] bg-transparent mt-0.5" />
                  )}
                </>
              )}
            </NavLink>

            {/* Avaliar Tab */}
            {evaluator && (
              <NavLink
                to="/avaliacoes/avaliar"
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-0.5 px-3 transition-colors ${
                    isActive ? 'text-[#f5b300]' : 'text-slate-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Star size={18} className={isActive ? 'text-[#f5b300]' : 'text-slate-300'} />
                      <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center shadow-xs">
                        {pending > 0 ? (pending > 9 ? '9+' : pending) : 2}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-[#f5b300]' : 'text-slate-300'}`}>
                      Avaliar
                    </span>
                    {isActive ? (
                      <span className="w-6 h-[2px] bg-[#f5b300] rounded-full mt-0.5" />
                    ) : (
                      <span className="w-6 h-[2px] bg-transparent mt-0.5" />
                    )}
                  </>
                )}
              </NavLink>
            )}

            {/* Concluídas Tab */}
            <NavLink
              to="/avaliacoes/concluidas"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-0.5 px-3 transition-colors ${
                  isActive ? 'text-[#f5b300]' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <CheckCircle2 size={18} className={isActive ? 'text-[#f5b300]' : 'text-slate-300'} />
                  <span className={`text-[10px] mt-0.5 font-bold ${isActive ? 'text-[#f5b300]' : 'text-slate-300'}`}>
                    Concluídas
                  </span>
                  {isActive ? (
                    <span className="w-6 h-[2px] bg-[#f5b300] rounded-full mt-0.5" />
                  ) : (
                    <span className="w-6 h-[2px] bg-transparent mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Botão flutuante para voltar ao topo (aparece ao rolar para baixo) */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
            className="fixed z-40 bottom-20 right-4 md:bottom-7 md:right-7 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-[0_10px_25px_-4px_rgba(27,110,243,0.5),0_4px_10px_rgba(15,23,42,0.15)] border border-white/20 transition-all duration-200 cursor-pointer animate-in fade-in zoom-in-75 duration-200"
          >
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
      
      {(password || data.user.mustChangePassword) && (
        <Editor
          title={data.user.mustChangePassword ? "Crie sua nova senha" : "Alterar minha senha"}
          fields={[
            { key: "current", label: "Senha atual", type: "password" },
            { key: "password", label: "Nova senha", type: "password" },
          ]}
          requiredAction={Boolean(data.user.mustChangePassword)}
          onClose={() => { if (!data.user.mustChangePassword) setPassword(false); }}
          onSave={async (value) => {
            await api("/auth/password", value);
            await refresh();
            setPassword(false);
            notify("Senha atualizada.");
          }}
        />
      )}
    </div>
  );
}
function Guard({
  permission,
  children,
}: {
  permission: string | string[];
  children: React.ReactNode;
}) {
  const { data } = useData();
  const allowed = Array.isArray(permission)
    ? permission.some(item => data.role.permissions.includes(item))
    : data.role.permissions.includes(permission);
  return allowed ? children : <Navigate to="/" replace />;
}
function StartPage() {
  const { data } = useData();
  const profile = String(data.role.name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (profile === "colaborador")
    return <Navigate to="/ranking/geral" replace />;
  if (profile !== "administrador" && data.role.permissions.includes("evaluate"))
    return <Navigate to="/avaliacoes/avaliar" replace />;
  if (data.role.permissions.includes("ranking"))
    return <Navigate to="/ranking/geral" replace />;
  if (data.role.permissions.includes("evaluate"))
    return <Navigate to="/avaliacoes/avaliar" replace />;
  if (data.role.permissions.includes("employees"))
    return <Navigate to="/colaboradores" replace />;
  return <Panel><h2>Acesso configurado</h2><p>Seu perfil ainda não possui uma área disponível.</p></Panel>;
}
const AUTH_CACHE_KEY = "clube_auth_cache";

function getCachedAuth() {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.user) return parsed;
  } catch {}
  return undefined;
}

export default function App() {
  const [auth, setAuth] = useState<any>(() => getCachedAuth());
  const [error, setError] = useState("");
  async function check() {
    try {
      const res = await api("/auth/status");
      setAuth(res);
      setError("");
      try {
        if (res && res.user) {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(res));
        } else {
          localStorage.removeItem(AUTH_CACHE_KEY);
          localStorage.removeItem("clube_state_cache");
        }
      } catch {}
    } catch (e) {
      if (!auth) setError((e as Error).message);
    }
  }
  useEffect(() => {
    void check();
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", {});
      try {
        localStorage.removeItem(AUTH_CACHE_KEY);
        localStorage.removeItem("clube_state_cache");
      } catch {}
      setAuth({ initialized: true, user: null });
      await check();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!auth)
    return (
      <LoadingScreen
        error={error}
        onRetry={() => void check()}
      />
    );
  if (!auth.user)
    return <Auth initialized={auth.initialized} onSuccess={check} />;
  const guard = (p: string | string[], c: React.ReactNode) => (
    <Guard permission={p}>{c}</Guard>
  );
  return (
    <DataProvider onLogout={logout}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout logout={logout} />}>
            <Route index element={<StartPage />} />
            <Route
              path="avaliacoes/avaliar"
              element={guard("evaluate", <Avaliar />)}
            />
            <Route
              path="avaliacoes/pendentes"
              element={<Navigate to="/avaliacoes/avaliar" replace />}
            />
            <Route
              path="avaliacoes/concluidas"
              element={guard("evaluate", <Concluidas />)}
            />
            <Route path="avaliacoes/historico" element={<Navigate to="/avaliacoes/concluidas" replace />} />
            <Route
              path="avaliacoes/nao-avaliados"
              element={guard("evaluations", <NaoAvaliados />)}
            />
            <Route
              path="ranking/geral"
              element={guard("ranking", <RankingGeral />)}
            />
            <Route
              path="ranking/por-cliente"
              element={<Navigate to="/ranking/geral" replace />}
            />
            <Route
              path="ranking/podio"
              element={<Navigate to="/ranking/geral" replace />}
            />
            <Route
              path="ranking/historico"
              element={<Navigate to="/ranking/geral" replace />}
            />
            <Route
              path="colaboradores"
              element={guard(
                "employees",
                <Colaboradores />,
              )}
            />
            <Route
              path="clientes"
              element={guard(
                "clients",
                <Clientes />,
              )}
            />
            <Route path="colaboradores/gestao" element={guard("employees", <Catalog key="employees-admin" kind="employees" />)} />
            <Route path="clientes/gestao" element={guard("clients", <Catalog key="clients-admin" kind="clients" />)} />
            <Route
              path="usuarios"
              element={guard("users", <Catalog key="users" kind="users" />)}
            />
            <Route path="temporadas" element={guard("seasons", <Seasons />)} />
            <Route
              path="conquistas"
              element={guard("achievements", <Rankings mode="achievements" />)}
            />
            <Route path="importacoes" element={guard("imports", <Imports />)} />
            <Route path="relatorios" element={guard("reports", <Reports />)} />
            <Route
              path="configuracoes"
              element={guard("settings", <Settings />)}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
