import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { api, dateLabel, useData } from "./state";
import { Heading, Panel, Action, DataTable, Status, csvDownload } from "./ui";
export function Imports() {
  const { data, refresh, notify } = useData();
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<any>();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function inspect() {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error("Limite de 8 MB");
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await api("/imports/preview", {
        name: file.name,
        content,
        mapping: Object.keys(mapping).length ? mapping : undefined,
      });
      setPreview(result);
      setMapping(result.mapping);
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="Importações"
        icon={<Upload size={20} className="text-[#f5b300]" />}
        description="Importe colaboradores, clientes e postos com prévia e validação antes de salvar."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Importações realizadas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.imports.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#071e4d] flex items-center justify-center font-bold">
            <Upload size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Concluídas com sucesso</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.imports.filter(item => item.status === 'concluida').length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Aguardando confirmação</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.imports.filter(item => item.status === 'previa').length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#f5b300] flex items-center justify-center font-bold">
            <Clock3 size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Importações com erro</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.imports.filter(item => item.errors > 0).length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle size={18} />
          </div>
        </div>
      </div>
      <Panel>
        <div className="upload-zone">
          <FileSpreadsheet size={42} />
          <h2>Importar base de colaboradores</h2>
          <p>CSV ou XLSX · até 8 MB · 5.000 linhas</p>
          <input
            aria-label="Arquivo para importação"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0]);
              setPreview(undefined);
              setMapping({});
            }}
          />
          <small>
            Colunas: matrícula, CPF, nome, função, cliente e posto. Matrículas
            existentes serão atualizadas.
          </small>
          <div className="actions mt">
            <Action disabled={!file || busy} onClick={inspect}>
              <Upload size={16} />
              Analisar arquivo
            </Action>
            <button
              className="btn secondary"
              onClick={() =>
                csvDownload(
                  "modelo-colaboradores",
                  [
                    {
                      id: "modelo",
                      matricula: "EXEMPLO-001",
                      cpf: "52998224725",
                      nome: "Nome do colaborador",
                      funcao: "Vigilante",
                      cliente: "Nome do cliente",
                      posto: "Portaria",
                    },
                  ],
                  ["matricula", "cpf", "nome", "funcao", "cliente", "posto"].map(
                    (key) => ({ key, label: key }),
                  ),
                )
              }
            >
              Baixar modelo CSV
            </button>
          </div>
        </div>
      </Panel>
      {preview?.needsMapping && (
        <Panel title="Relacionar colunas">
          <div className="form-grid">
            {["matricula", "cpf", "nome", "funcao", "cliente", "posto"].map((key) => (
              <label key={key}>
                {key}
                <select
                  value={mapping[key] || ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">Selecione a coluna</option>
                  {preview.headers.map((h: string) => (
                    <option key={h}>{h}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <Action onClick={inspect}>Validar mapeamento</Action>
        </Panel>
      )}
      {preview?.rows && (
        <>
          <div className={preview.errors ? "notice error" : "notice"}>
            {preview.records} registros · {preview.errors} linhas com erro.{" "}
            {preview.errors
              ? "Corrija o arquivo e analise novamente."
              : "Confira os registros antes de confirmar."}
          </div>
          <DataTable
            title="Prévia da importação"
            rows={preview.rows.map((r: any) => ({
              ...r,
              id: String(r.line),
              errors: r.errors.join("; "),
            }))}
            columns={[
              { key: "line", label: "Linha" },
              { key: "matricula", label: "Matrícula" },
              { key: "cpf", label: "CPF" },
              { key: "nome", label: "Nome" },
              { key: "funcao", label: "Função" },
              { key: "cliente", label: "Cliente" },
              { key: "posto", label: "Posto" },
              { key: "errors", label: "Erros" },
            ]}
          />
          <Action
            disabled={preview.errors > 0 || preview.confirmed}
            onClick={async () => {
              await api(`/imports/${preview.id}/confirm`, {});
              setPreview({ ...preview, confirmed: true });
              await refresh();
              notify(
                "Importação concluída. Histórico de alocações preservado.",
              );
            }}
          >
            {preview.confirmed
              ? "Importação concluída"
              : "Confirmar importação"}
          </Action>
        </>
      )}
      <DataTable
        title="Histórico de importações"
        rows={data.imports}
        columns={[
          { key: "name", label: "Arquivo" },
          { key: "records", label: "Registros" },
          { key: "errors", label: "Erros" },
          { key: "date", label: "Data", render: (r) => dateLabel(r.date) },
          {
            key: "status",
            label: "Status",
            render: (r) => <Status value={r.status} />,
          },
        ]}
      />
    </>
  );
}
