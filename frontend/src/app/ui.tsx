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
  icon?: ReactNode;
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
  const v = (value || "").toLowerCase();
  const isAtivo = ["ativo", "ativa", "concluida", "enviada", "publicada"].includes(v);
  const isWarn = ["licenca", "planejada", "planejado", "rascunho", "previa", "implantacao"].includes(v);
  const isDanger = ["inativo", "cancelada", "impossivel"].includes(v);

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
    implantacao: "Em implantação",
    ouro: "Ouro",
    prata: "Prata",
    bronze: "Bronze",
    diamante: "Diamante",
  };

  const badgeCls = isAtivo
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
    : isWarn
    ? "bg-amber-50 text-amber-700 border border-amber-200/80"
    : isDanger
    ? "bg-rose-50 text-rose-700 border border-rose-200/80"
    : "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${badgeCls}`}>
      {label[v] || value || "Sem classificação"}
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
  icon,
  actions,
  search = true,
  createButton,
  subtabs,
}: {
  rows: Row[];
  columns: Column[];
  title?: string;
  icon?: ReactNode;
  actions?: (r: Row) => ReactNode;
  search?: boolean;
  createButton?: ReactNode;
  subtabs?: ReactNode;
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
    <div className="space-y-3.5 font-sans page-enter">
      {/* ── Barra Superior Padronizada: Sub-abas + Busca + Botão de Ação ── */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {subtabs}
            {search && (
              <div className="relative flex-1 max-w-md">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  aria-label={`Buscar ${title}`}
                  placeholder={`Buscar em ${title.toLowerCase()}...`}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  style={{ paddingLeft: "44px" }}
                  className="w-full pl-11 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all search-input"
                />
              </div>
            )}
          </div>

          {createButton && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {createButton}
            </div>
          )}
        </div>
      </div>

      {/* ── Info Bar + Exportar CSV ── */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          {icon && <span className="text-blue-600 flex-shrink-0">{icon}</span>}
          <span>{title}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => csvDownload(title, filtered, columns)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Download size={13} className="text-slate-500" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                {columns.map((c) => (
                  <th key={c.key} className="py-3 px-3.5 text-slate-600">
                    <button
                      type="button"
                      onClick={() => setSort(c.key)}
                      className="font-bold text-[11px] uppercase tracking-wider text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{c.label}</span>
                      {sort === c.key ? <span className="text-blue-600 font-black">↑</span> : null}
                    </button>
                  </th>
                ))}
                {actions && (
                  <th className="py-3 px-3.5 text-right font-bold text-[11px] uppercase tracking-wider text-slate-600">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.slice((current - 1) * 10, current * 10).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/80">
                  {columns.map((c) => (
                    <td key={c.key} className="py-3 px-3.5 text-slate-800 font-medium">
                      {c.render ? c.render(r) : fmt(r[c.key])}
                    </td>
                  ))}
                  {actions && (
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {actions(r)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="p-8 text-center text-slate-400 text-xs">
              <div className="font-semibold text-slate-600 mb-1">Nenhum registro encontrado</div>
              <div>Cadastre novos dados ou ajuste o termo de busca.</div>
            </div>
          )}
        </div>

        {/* ── Table Footer / Pagination ── */}
        <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <span>
            {filtered.length
              ? `${(current - 1) * 10 + 1}–${Math.min(current * 10, filtered.length)} de ${filtered.length} registros`
              : "0 registros"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-600 shadow-2xs"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700 px-1">
              {current} / {pages}
            </span>
            <button
              type="button"
              aria-label="Próxima página"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer text-slate-600 shadow-2xs"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const NewButton = ({
  onClick,
  label = "Novo registro",
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button
    type="button"
    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
    onClick={onClick}
  >
    <Plus size={16} strokeWidth={2.5} className="text-[#f5b300]" />
    <span>{label}</span>
  </button>
);
