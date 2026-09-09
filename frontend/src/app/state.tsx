import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
export type Row = { id: string; [key: string]: any };
export type State = {
  organization: string;
  user: Row;
  role: Row;
  clients: Row[];
  posts: Row[];
  employees: Row[];
  allocations: Row[];
  participants: Row[];
  evaluations: Row[];
  seasons: Row[];
  cycles: Row[];
  rankings: Record<string, Row[]>;
  users: Row[];
  roles: Row[];
  imports: Row[];
  settings: Row | null;
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
}>({} as never);
export const useData = () => useContext(Context);
export function DataProvider({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  const [data, setData] = useState<State>();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function refresh() {
    try {
      setData(await api("/state"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      throw e;
    }
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
      <div className="loading">
        {error || "Carregando Clube de Talentos…"}
        {error && (
          <>
            <button onClick={() => void refresh().catch(() => {})}>
              Tentar novamente
            </button>
            <button onClick={onLogout}>Voltar ao login</button>
          </>
        )}
      </div>
    );
  return (
    <Context.Provider value={{ data, refresh, notify: setMessage }}>
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
