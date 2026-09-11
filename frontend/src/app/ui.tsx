import { useEffect, useRef, useState } from "react";
import type { ReactNode, FormEvent } from "react";
import {
  Plus,
  Search,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { fmt, useData, type Row } from "./state";
export function Heading({
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="flex justify-end items-center mb-3">
      <div className="actions">{children}</div>
    </div>
  );
}
export function Panel({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <section className="panel">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Status({ value }: { value: string | null }) {
  const label: Record<string, string> = {
    ativo: "Ativo",
    ativa: "Ativa",
    planejada: "Planejada",
    planejado: "Planejado",
    encerrada: "Encerrada",
    encerrado: "Encerrado",
    publicada: "Publicado",
    rascunho: "Em preenchimento",
    enviada: "Concluída",
    cancelada: "Cancelada",
    impossivel: "Não consegue avaliar",
    previa: "Prévia",
    concluida: "Concluída",
    inativo: "Inativo",
    licenca: "Licença",
    ouro: "Ouro",
    prata: "Prata",
    bronze: "Bronze",
    diamante: "Diamante",
  };
  return (
    <span className={`pill pill-${value || "none"}`}>
      {label[value || ""] || value || "Sem classificação"}
    </span>
  );
}
export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: any;
  sub?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <strong>{fmt(value)}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}
export function Action({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => Promise<unknown> | void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { notify } = useData();
  return (
    <button
      disabled={busy || disabled}
      className={secondary ? "btn secondary" : "btn"}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } catch (e) {
          notify((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Aguarde…" : children}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  dismissible = true,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={(event) => { if (!dismissible) event.preventDefault(); else onClose(); }}>
      <div className="modal-title">
        <h2>{title}</h2>
        {dismissible && <button className="icon-btn" aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </button>}
      </div>
      {children}
    </dialog>
  );
}

export function DetailModal({
  label,
  children,
  onClose,
}: {
  label: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // ignore if already open
      }
    }
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    dialog?.addEventListener("cancel", handleCancel);
    return () => {
      dialog?.removeEventListener("cancel", handleCancel);
      if (dialog && dialog.open) {
        try {
          dialog.close();
        } catch {
          // ignore
        }
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="detail-modal"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="detail-modal-content">{children}</div>
    </dialog>
  );
}
export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: { value: string; label: string }[] | ((value: Record<string, any>) => { value: string; label: string }[]);
  required?: boolean;
  hint?: string;
  clears?: string[];
};
export function Editor({
  title,
  fields,
  initial = {},
  onSave,
  onClose,
  requiredAction = false,
}: {
  title: string;
  fields: Field[];
  initial?: Record<string, any>;
  onSave: (value: any) => Promise<void>;
  onClose: () => void;
  requiredAction?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(value);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose} dismissible={!requiredAction}>
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields.map((f) => {
            const fieldOptions = typeof f.options === "function" ? f.options(value) : f.options;
            return (
            <label key={f.key} className={f.type === "multi" ? "full" : ""}>
              <span>
                {f.label}
                {f.required !== false && f.type !== "checkbox" ? " *" : ""}
              </span>
              {f.type === "multi" ? (
                <div className="check-list">
                  {fieldOptions?.map((o) => (
                    <label key={o.value}>
                      <input
                        type="checkbox"
                        checked={(value[f.key] || []).includes(o.value)}
                        onChange={(e) =>
                          setValue({
                            ...value,
                            [f.key]: e.target.checked
                              ? [...(value[f.key] || []), o.value]
                              : (value[f.key] || []).filter(
                                  (v: string) => v !== o.value,
                                ),
                          })
                        }
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!value[f.key]}
                  onChange={(e) =>
                    setValue({ ...value, [f.key]: e.target.checked })
                  }
                />
              ) : fieldOptions ? (
                <select
                  required={f.required !== false}
                  value={value[f.key] || ""}
                  onChange={(e) => {
                    const next = { ...value, [f.key]: e.target.value };
                    for (const key of f.clears || []) next[key] = "";
                    setValue(next);
                  }}
                >
                  <option value="">Selecione</option>
                  {fieldOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "password" ? (
                <div className="password-control">
                  <input
                    type={visiblePasswords.includes(f.key) ? "text" : "password"}
                    required={f.required !== false}
                    maxLength={128}
                    minLength={10}
                    value={value[f.key] ?? ""}
                    onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords(current => current.includes(f.key) ? current.filter(key => key !== f.key) : [...current, f.key])}
                    aria-label={visiblePasswords.includes(f.key) ? "Ocultar senha" : "Visualizar senha"}
                    title={visiblePasswords.includes(f.key) ? "Ocultar senha" : "Visualizar senha"}
                  >
                    {visiblePasswords.includes(f.key) ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              ) : (
                <input
                  type={f.type || "text"}
                  required={f.required !== false}
                  maxLength={200}
                  value={value[f.key] ?? ""}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      [f.key]:
                        f.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    })
                  }
                />
              )}{" "}
              {f.hint && <small>{f.hint}</small>}
            </label>
            );
          })}
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {!requiredAction && <button type="button" className="btn secondary" onClick={onClose}>
            Cancelar
          </button>}
          <button className="btn" disabled={busy}>
            {busy ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export type Column = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
};
export function csvDownload(name: string, rows: Row[], columns: Column[]) {
  const escape = (v: any) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  const csv =
    "\uFEFF" +
    [
      columns.map((c) => escape(c.label)).join(";"),
      ...rows.map((r) => columns.map((c) => escape(r[c.key])).join(";")),
    ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function DataTable({
  rows,
  columns,
  title = "Registros",
  actions,
  search = true,
}: {
  rows: Row[];
  columns: Column[];
  title?: string;
  actions?: (r: Row) => ReactNode;
  search?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");
  const filtered = rows
    .filter((r) =>
      Object.values(r).some((v) =>
        String(v ?? "")
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()),
      ),
    )
    .sort((a, b) =>
      sort
        ? String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), "pt-BR", {
            numeric: true,
          })
        : 0,
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <h2>
          {title} <span className="count">{filtered.length}</span>
        </h2>
        <div className="actions">
          {search && (
            <div className="search-box">
              <Search size={16} />
              <input
                aria-label={`Buscar ${title}`}
                placeholder="Buscar nesta lista…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          )}
          <button
            className="btn secondary compact"
            onClick={() => csvDownload(title, filtered, columns)}
          >
            <Download size={15} /> CSV
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <button onClick={() => setSort(c.key)}>
                    {c.label}
                    {sort === c.key ? " ↑" : ""}
                  </button>
                </th>
              ))}
              {actions && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.slice((current - 1) * 10, current * 10).map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(r) : fmt(r[c.key])}</td>
                ))}
                {actions && (
                  <td>
                    <div className="row-actions">{actions(r)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <div className="empty">
            Nenhum registro encontrado.
            <small>Cadastre dados ou ajuste os filtros para começar.</small>
          </div>
        )}
      </div>
      <div className="table-footer">
        <span>
          {filtered.length
            ? `${(current - 1) * 10 + 1}–${Math.min(current * 10, filtered.length)}`
            : "0"}{" "}
          de {filtered.length} resultados
        </span>
        <div className="actions">
          <button
            aria-label="Página anterior"
            className="icon-btn"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {current} / {pages}
          </span>
          <button
            aria-label="Próxima página"
            className="icon-btn"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
export const NewButton = ({
  onClick,
  label = "Novo registro",
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button className="btn" onClick={onClick}>
    <Plus size={17} />
    {label}
  </button>
);
