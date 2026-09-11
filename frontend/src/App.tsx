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
import { Menu, Bell, LogOut, LayoutDashboard, Star, Trophy, CheckCircle2, ChevronDown, KeyRound } from "lucide-react";
import { Sidebar } from "./components/layout/Sidebar";
import { Avatar } from "./components/ui/Avatar";
import { api, DataProvider, useData } from "./app/state";
import { Auth } from "./app/Auth";
import { Catalog } from "./app/Catalogs";
import { Seasons } from "./app/Seasons";
import { Settings } from "./app/Settings";
import Avaliar from "./pages/avaliacoes/Avaliar";
import Concluidas from "./pages/avaliacoes/Concluidas";
import Historico from "./pages/avaliacoes/Historico";
import NaoAvaliados from "./pages/avaliacoes/NaoAvaliados";
import RankingGeral from "./pages/ranking/RankingGeral";
import Dashboard from "./pages/Dashboard";
import Colaboradores from "./pages/colaboradores/Colaboradores";
import Clientes from "./pages/clientes/Clientes";
import { Rankings } from "./app/Insights";
import { Imports } from "./app/Imports";
import { Reports } from "./app/Reports";
import { Editor, Panel } from "./app/ui";
import "./app/style.css";

function ContextHelp() {
  const [help, setHelp] = useState<{ text: string; left: number; top: number }>();
  useEffect(() => {
    const description = (element: Element) => {
      if (element.closest(".sidebar-minimal, .sidebar-shell, aside, nav, .bottom-nav, .mobile-bottom-nav, .app-header, header")) {
        return "";
      }
      const explicit = element.getAttribute("data-help") || element.getAttribute("aria-label") || element.getAttribute("title");
      if (explicit) return explicit;
      const label = element.closest("label")?.querySelector("span")?.textContent?.trim() ||
        element.closest("label")?.textContent?.trim().split("*")[0] || "este campo";
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      if (element.matches("select")) return `Escolha uma opção para ${label}.`;
      if (element.matches("input, textarea")) return `Preencha ${label}.`;
      if (element.matches("a")) return `Abre ${text || "esta área"}.`;
      if (element.matches("button")) return `Executa a ação de ${text || label}.`;
      return "";
    };
    const handler = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest("button, input, select, textarea, a");
      if (!target || target.closest(".sidebar-minimal, .sidebar-shell, aside, nav, .bottom-nav, .mobile-bottom-nav, .app-header, header")) {
        setHelp(undefined);
        return;
      }
      const text = description(target);
      if (!text) {
        setHelp(undefined);
        return;
      }
      const rect = target.getBoundingClientRect();
      const left = Math.min(Math.max(rect.left + rect.width / 2, 130), window.innerWidth - 130);
      const top = Math.max(12, rect.top - 38);
      setHelp({ text, left, top });
    };
    window.addEventListener("mouseover", handler);
    return () => window.removeEventListener("mouseover", handler);
  }, []);
  return help ? <div role="tooltip" className="context-help-tooltip" style={{ left: help.left, top: help.top }}>{help.text}</div> : null;
}

function Layout({ logout }: { logout: () => void }) {
  const { data, notify, refresh } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [password, setPassword] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const evaluator = data.role.permissions.includes("evaluate");

  useEffect(() => {
    setMobile(false);
    setUserMenuOpen(false);
    setNotifications(false);
  }, [location.pathname]);

  // Click outside to close user dropdown menu and notifications panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotifications(false);
      }
    };
    if (userMenuOpen || notifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
        <header className="app-topbar flex items-center justify-between">
          <button
            className="icon-btn desktop-only-sidebar-toggle hidden md:inline-flex"
            aria-label="Alternar menu"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </button>

          {/* Logo no cabeçalho na versão mobile à esquerda */}
          <Link
            to="/"
            className="md:hidden flex items-center gap-2 py-0.5 flex-shrink-0"
            aria-label="Clube de Talentos"
          >
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              className="h-10 w-auto object-contain drop-shadow-xs"
            />
          </Link>

          <div className="topbar-right ml-auto flex items-center gap-3">
            {evaluator && (
              <div className="relative" ref={notificationsRef}>
                <button
                  className="icon-btn notification-button cursor-pointer"
                  aria-label="Notificações"
                  onClick={() => setNotifications((prev) => !prev)}
                >
                  <Bell size={19} />
                  {pending > 0 && <span>{pending}</span>}
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
            )}

            {/* Menu suspenso ao clicar na foto do usuário */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="user-button flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="Menu do usuário"
                aria-expanded={userMenuOpen}
              >
                <Avatar name={data.user.name} size="sm" />
                <span className="hidden sm:inline-block text-left leading-tight">
                  <strong className="block text-xs font-bold text-slate-800">{data.user.name}</strong>
                  <small className="block text-[10px] text-slate-400">{data.role.name}</small>
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">{data.user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{data.role.name}</p>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setPassword(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium cursor-pointer"
                    >
                      <KeyRound size={15} className="text-slate-400" />
                      <span>Alterar minha senha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer border-t border-slate-100/80 mt-1 pt-2"
                    >
                      <LogOut size={15} className="text-rose-500" />
                      <span>Sair do sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-content pb-20 md:pb-6" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="app-footer hidden md:block">
          {data.organization} · Clube de Talentos
        </footer>

        {/* ── Barra de Navegação Inferior para Mobile ── */}
        <nav className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] px-2 py-1 flex items-center justify-around">
          <NavLink
            to="/ranking/geral"
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <Trophy size={19} />
            <span className="text-[10px] mt-0.5">Ranking</span>
          </NavLink>

          {evaluator && (
            <NavLink
              to="/avaliacoes/avaliar"
              className={({ isActive }) => `relative flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Star size={19} />
              <span className="text-[10px] mt-0.5">Avaliar</span>
              {pending > 0 && (
                <span className="absolute top-0.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {pending > 9 ? '9+' : pending}
                </span>
              )}
            </NavLink>
          )}

          {evaluator ? (
            <NavLink
              to="/avaliacoes/concluidas"
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <CheckCircle2 size={19} />
              <span className="text-[10px] mt-0.5">Concluídas</span>
            </NavLink>
          ) : (
            <NavLink
              to="/"
              end
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutDashboard size={19} />
              <span className="text-[10px] mt-0.5">Início</span>
            </NavLink>
          )}
        </nav>
      </div>
      <ContextHelp />
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
  if (data.role.permissions.includes("dashboard")) return <Dashboard />;
  if (data.role.permissions.includes("ranking"))
    return <Navigate to="/ranking/geral" replace />;
  return <Panel><h2>Acesso configurado</h2><p>Seu perfil ainda não possui uma área disponível.</p></Panel>;
}
export default function App() {
  const [auth, setAuth] = useState<any>();
  const [error, setError] = useState("");
  async function check() {
    try {
      setAuth(await api("/auth/status"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void check();
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", {});
      await check();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (!auth)
    return (
      <div className="loading">
        {error || "Carregando…"}
        {error && (
          <button className="btn" onClick={check}>
            Tentar novamente
          </button>
        )}
      </div>
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
            <Route
              path="avaliacoes/historico"
              element={guard("evaluate", <Historico />)}
            />
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
