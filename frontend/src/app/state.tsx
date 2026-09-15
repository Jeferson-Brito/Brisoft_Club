import { LoadingScreen } from "../components/ui/LoadingScreen";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
export type Row = { id: string; [key: string]: any };
export type State = {
  organization: string;
  employeeAccessDomain: string;
  user: Row;
  role: Row;
  clients: Row[];
  posts: Row[];
  clientPosts: Row[];
  employees: Row[];
  allocations: Row[];
  penaltyTypes: Row[];
  employeeActions: Row[];
  participants: Row[];
  evaluations: Row[];
  seasons: Row[];
  cycles: Row[];
  rankings: Record<string, Row[]>;
  users: Row[];
  roles: Row[];
  imports: Row[];
  settings: Row | null;
  unevaluatedAlert: Row[];
  audit: Row[];
};
export async function api(path: string, body?: unknown) {
  const res = await fetch(`/api${path}`, {
    credentials: "same-origin",
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Não foi possível concluir");
  return data;
}
const Context = createContext<{
  data: State;
  refresh: () => Promise<void>;
  notify: (text: string) => void;
  updateEvaluationStatus: (evalId: string, newStatus: string) => void;
}>({} as never);
export const useData = () => useContext(Context);
const CACHE_KEY = "clube_state_cache";

function getCachedState(): State | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.user && parsed.role) {
      return parsed as State;
    }
  } catch {}
  return undefined;
}

export function DataProvider({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  const [data, setData] = useState<State | undefined>(() => getCachedState());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function refresh() {
    try {
      const fresh = await api("/state");
      setData(fresh);
      setError("");
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
      } catch {}
    } catch (e) {
      if (!data) {
        setError((e as Error).message);
      }
      throw e;
    }
  }

  function updateEvaluationStatus(evalId: string, newStatus: string) {
    setData((prev) => {
      if (!prev) return prev;
      const updatedEvals = (prev.evaluations || []).map((ev) =>
        ev.id === evalId ? { ...ev, status: newStatus } : ev
      );
      const nextState = { ...prev, evaluations: updatedEvals };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(nextState));
      } catch {}
      return nextState;
    });
  }
  useEffect(() => {
    void refresh().catch(() => {});
  }, []);
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(""), 6000);
      return () => clearTimeout(timeout);
    }
  }, [message]);
  if (!data)
    return (
      <LoadingScreen
        error={error}
        onRetry={() => void refresh().catch(() => {})}
        onLogout={onLogout}
      />
    );
  return (
    <Context.Provider value={{ data, refresh, notify: setMessage, updateEvaluationStatus }}>
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
          <button aria-label="Fechar aviso" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className="toast error">
          {error}
          <button onClick={onLogout}>Entrar novamente</button>
        </div>
      )}
    </Context.Provider>
  );
}
export const fmt = (v: any) =>
  typeof v === "number"
    ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
    : (v ?? "—");
export const dateLabel = (s: string) =>
  s
    ? new Date(s.length === 10 ? s + "T12:00:00" : s).toLocaleDateString(
        "pt-BR",
      )
    : "—";
