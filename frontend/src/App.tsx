import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link,
  useLocation,
} from "react-router-dom";
import { Menu, Bell, Search, LogOut } from "lucide-react";
import { Sidebar } from "./components/layout/Sidebar";
import { Avatar } from "./components/ui/Avatar";
import { api, DataProvider, useData } from "./app/state";
import { Auth } from "./app/Auth";
import { Catalog } from "./app/Catalogs";
import { Seasons } from "./app/Seasons";
import { Settings } from "./app/Settings";
import { Evaluate, EvaluationList } from "./app/Evaluations";
import { Dashboard, Rankings } from "./app/Insights";
import { Imports } from "./app/Imports";
import { Reports } from "./app/Reports";
import { Editor, Panel } from "./app/ui";
import "./app/style.css";
function Layout({ logout }: { logout: () => void }) {
  const { data, notify } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [password, setPassword] = useState(false);
  const [search, setSearch] = useState("");
  const location = useLocation();
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
          e.status !== "rascunho",
      ),
  ).length;
  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <div className={`sidebar-shell ${mobile ? "mobile-open" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
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
            <button
              className="icon-btn notification-button"
              aria-label="Notificações"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              {pending > 0 && <span>{pending}</span>}
            </button>
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
          {notifications && (
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
        <main className="page-content" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="app-footer">
          {data.organization} · Clube de Talentos
        </footer>
      </div>
      {password && (
        <Editor
          title="Alterar minha senha"
          fields={[
            { key: "current", label: "Senha atual", type: "password" },
            { key: "password", label: "Nova senha", type: "password" },
          ]}
          onClose={() => setPassword(false)}
          onSave={async (value) => {
            await api("/auth/password", value);
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
  permission: string;
  children: React.ReactNode;
}) {
  const { data } = useData();
  return data.role.permissions.includes(permission) ? (
    children
  ) : (
    <Panel>
      <h2>Acesso restrito</h2>
      <p>
        Seu perfil não possui acesso a esta área. Solicite ao administrador uma
        revisão das permissões.
      </p>
    </Panel>
  );
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
  const guard = (p: string, c: React.ReactNode) => (
    <Guard permission={p}>{c}</Guard>
  );
  return (
    <DataProvider onLogout={logout}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout logout={logout} />}>
            <Route index element={guard("dashboard", <Dashboard />)} />
            <Route
              path="avaliacoes/avaliar"
              element={guard("evaluate", <Evaluate />)}
            />
            <Route
              path="avaliacoes/pendentes"
              element={<EvaluationList mode="pending" />}
            />
            <Route
              path="avaliacoes/concluidas"
              element={<EvaluationList mode="completed" />}
            />
            <Route
              path="avaliacoes/historico"
              element={<EvaluationList mode="history" />}
            />
            {[
              ["geral", "general"],
              ["por-cliente", "client"],
              ["podio", "podium"],
              ["historico", "history"],
            ].map(([path, mode]) => (
              <Route
                key={path}
                path={`ranking/${path}`}
                element={guard(
                  "ranking",
                  <Rankings mode={mode as "general"} />,
                )}
              />
            ))}
            <Route
              path="colaboradores"
              element={guard(
                "employees",
                <Catalog key="employees" kind="employees" />,
              )}
            />
            <Route
              path="clientes"
              element={guard(
                "clients",
                <Catalog key="clients" kind="clients" />,
              )}
            />
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
