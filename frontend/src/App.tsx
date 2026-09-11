import { useEffect, useState } from "react";
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
import { Menu, Bell, Search, LogOut, LayoutDashboard, Star, Clock, Trophy } from "lucide-react";
import { Sidebar } from "./components/layout/Sidebar";
import { Avatar } from "./components/ui/Avatar";
import { api, DataProvider, useData } from "./app/state";
import { Auth } from "./app/Auth";
import { Catalog } from "./app/Catalogs";
import { Seasons } from "./app/Seasons";
import { Settings } from "./app/Settings";
import Avaliar from "./pages/avaliacoes/Avaliar";
import Pendentes from "./pages/avaliacoes/Pendentes";
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
      const explicit = element.getAttribute("data-help") || element.getAttribute("aria-label") || element.getAttribute("title");
      if (explicit) return explicit;
      const label = element.closest("label")?.querySelector("span")?.textContent?.trim() ||
        element.closest("label")?.textContent?.trim().split("*")[0] || "este campo";
      const text = (element.textContent || "").replace(/\s+/g, " ").trim();
      if (element.matches("select")) return `Escolha uma opção para ${label}.`;
      if (element.matches("input, textarea")) return `Preencha ${label}.`;
      if (element.matches("a")) return `Abre ${text || "esta área"}.`;
      const normalized = text.toLowerCase();
      if (normalized.includes("filtro")) return "Mostra ou oculta as opções para refinar os resultados.";
      if (normalized.includes("salvar")) return "Salva as informações preenchidas.";
      if (normalized.includes("editar")) return "Permite alterar as informações deste registro.";
      if (normalized.includes("novo") || normalized.includes("nova")) return "Abre o formulário para criar um novo registro.";
      if (normalized.includes("iniciar")) return "Inicia este período e libera os participantes elegíveis.";
      if (normalized.includes("encerrar")) return "Encerra o período e bloqueia novos envios.";
      if (normalized.includes("exportar")) return "Baixa os dados exibidos em uma planilha.";
      if (normalized.includes("limpar")) return "Remove os filtros selecionados.";
      if (normalized.includes("ver")) return "Abre os detalhes deste registro.";
      return text ? `Executa a ação “${text}”.` : "Executa esta ação.";
    };
    const show = (event: Event) => {
      const element = (event.target as Element | null)?.closest("button, a, input, select, textarea, [data-help]");
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setHelp({ text: description(element), left: Math.max(12, Math.min(rect.left, window.innerWidth - 300)), top: Math.min(window.innerHeight - 70, rect.bottom + 8) });
    };
    const hide = () => setHelp(undefined);
    document.addEventListener("mouseover", show);
    document.addEventListener("focusin", show);
    document.addEventListener("mouseout", hide);
    document.addEventListener("focusout", hide);
    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("focusin", show);
      document.removeEventListener("mouseout", hide);
      document.removeEventListener("focusout", hide);
    };
  }, []);
  return help ? <div role="tooltip" className="context-help-tooltip" style={{ left: help.left, top: help.top }}>{help.text}</div> : null;
}
function getTabInfo(pathname: string) {
  if (pathname === "/" || pathname === "") {
    return { section: "Geral", tab: "Dashboard" };
  }
  if (pathname.startsWith("/avaliacoes/avaliar")) {
    return { section: "Avaliações", tab: "Avaliar" };
  }
  if (pathname.startsWith("/avaliacoes/pendentes")) {
    return { section: "Avaliações", tab: "Pendentes" };
  }
  if (pathname.startsWith("/avaliacoes/concluidas")) {
    return { section: "Avaliações", tab: "Concluídas" };
  }
  if (pathname.startsWith("/avaliacoes/historico")) {
    return { section: "Avaliações", tab: "Histórico" };
  }
  if (pathname.startsWith("/avaliacoes/nao-avaliados")) {
    return { section: "Avaliações", tab: "Não Avaliados" };
  }
  if (pathname.startsWith("/ranking/geral")) {
    return { section: "Desempenho", tab: "Ranking Geral" };
  }
  if (pathname.startsWith("/ranking/cliente")) {
    return { section: "Desempenho", tab: "Ranking por Cliente" };
  }
  if (pathname.startsWith("/conquistas")) {
    return { section: "Desempenho", tab: "Conquistas" };
  }
  if (pathname.startsWith("/colaboradores/gestao")) {
    return { section: "Cadastros", tab: "Vínculos" };
  }
  if (pathname.startsWith("/colaboradores")) {
    return { section: "Cadastros", tab: "Colaboradores" };
  }
  if (pathname.startsWith("/clientes/gestao")) {
    return { section: "Cadastros", tab: "Postos" };
  }
  if (pathname.startsWith("/clientes")) {
    return { section: "Cadastros", tab: "Clientes" };
  }
  if (pathname.startsWith("/importacoes")) {
    return { section: "Dados", tab: "Importações" };
  }
  if (pathname.startsWith("/relatorios")) {
    return { section: "Dados", tab: "Relatórios" };
  }
  if (pathname.startsWith("/temporadas")) {
    return { section: "Administração", tab: "Temporadas" };
  }
  if (pathname.startsWith("/usuarios")) {
    return { section: "Administração", tab: "Usuários" };
  }
  if (pathname.startsWith("/configuracoes")) {
    return { section: "Administração", tab: "Configurações" };
  }
  return null;
}

function Layout({ logout }: { logout: () => void }) {
  const { data, notify, refresh } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [password, setPassword] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
  const tabInfo = getTabInfo(location.pathname);
  const evaluator = data.role.permissions.includes("evaluate");
  useEffect(() => {
    setMobile(false);
    setSearch("");
  }, [location.pathname]);
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
        <header className="app-topbar">
          <button
            className="icon-btn"
            aria-label="Alternar menu"
            onClick={() =>
              window.innerWidth < 900
                ? setMobile(!mobile)
                : setCollapsed(!collapsed)
            }
          >
            <Menu size={20} />
          </button>
          {tabInfo && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1 bg-slate-100/90 rounded-lg border border-slate-200/70 flex-shrink-0 shadow-2xs">
              <span className="text-slate-400 hidden sm:inline">{tabInfo.section}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-slate-700 font-semibold">{tabInfo.tab}</span>
            </div>
          )}
          <div className="global-search">
            <Search size={17} />
            <input
              aria-label="Busca global"
              placeholder="Buscar colaboradores e clientes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <div className="search-results">
                {data.role.permissions.includes("employees") &&
                  data.employees
                    .filter((e) =>
                      `${e.name} ${e.registration}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((e) => (
                      <Link key={e.id} to="/colaboradores">
                        {e.name}
                        <small>Colaborador · {e.registration}</small>
                      </Link>
                    ))}
                {data.role.permissions.includes("clients") &&
                  data.clients
                    .filter((c) =>
                      c.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((c) => (
                      <Link key={c.id} to="/clientes">
                        {c.name}
                        <small>Cliente</small>
                      </Link>
                    ))}
                <small>
                  Abra a lista e utilize os filtros para localizar o registro.
                </small>
              </div>
            )}
          </div>
          <div className="topbar-right">
            {evaluator && (
              <button
                className="icon-btn notification-button"
                aria-label="Notificações"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {pending > 0 && <span>{pending}</span>}
              </button>
            )}
            <button
              className="user-button"
              onClick={() => setPassword(true)}
              title="Alterar minha senha"
            >
              <Avatar name={data.user.name} size="sm" />
              <span>
                <strong>{data.user.name}</strong>
                <small>{data.role.name}</small>
              </span>
            </button>
            <button className="icon-btn" aria-label="Sair" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
          {evaluator && notifications && (
            <div className="notification-panel">
              <h3>Seu acompanhamento</h3>
              <p>{pending} colaboradores disponíveis para avaliação.</p>
              <Link
                to="/avaliacoes/pendentes"
                onClick={() => setNotifications(false)}
              >
                Ver pendências →
              </Link>
            </div>
          )}
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
            to="/"
            end
            className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutDashboard size={19} />
            <span className="text-[10px] mt-0.5">Início</span>
          </NavLink>

          {evaluator && (
            <NavLink
              to="/avaliacoes/avaliar"
              className={({ isActive }) => `relative flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
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

          {evaluator && (
            <NavLink
              to="/avaliacoes/pendentes"
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Clock size={19} />
              <span className="text-[10px] mt-0.5">Pendentes</span>
            </NavLink>
          )}

          {data.role.permissions.includes("ranking") && (
            <NavLink
              to="/ranking/geral"
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Trophy size={19} />
              <span className="text-[10px] mt-0.5">Ranking</span>
            </NavLink>
          )}

          <button
            onClick={() => setMobile(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Abrir menu completo"
          >
            <Menu size={19} />
            <span className="text-[10px] mt-0.5">Mais</span>
          </button>
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
              element={guard("evaluate", <Pendentes />)}
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
