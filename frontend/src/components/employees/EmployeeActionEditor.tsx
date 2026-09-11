import { useMemo, useState, type FormEvent } from "react";
import { Modal } from "../../app/ui";
import type { Row } from "../../app/state";

type Props = {
  employee: Row;
  seasons: Row[];
  cycles: Row[];
  penaltyTypes: Row[];
  onClose: () => void;
  onSave: (value: any) => Promise<void>;
};

export function EmployeeActionEditor({ employee, seasons, cycles, penaltyTypes, onClose, onSave }: Props) {
  const availableSeasons = seasons.filter((season) => !["publicada", "cancelada"].includes(season.status));
  const [value, setValue] = useState<any>({
    employeeId: employee.id,
    type: "penalty",
    seasonId: availableSeasons.find((season) => season.status === "ativa")?.id || availableSeasons[0]?.id || "",
    cycleId: "",
    penaltyTypeId: penaltyTypes.find((item) => item.status === "ativo")?.id || "",
    reason: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const seasonCycles = useMemo(() => cycles.filter((cycle) => cycle.seasonId === value.seasonId), [cycles, value.seasonId]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(value);
      onClose();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function fileChanged(file?: File) {
    if (!file) return setValue((current: any) => ({ ...current, attachment: undefined }));
    if (file.size > 3_000_000) return setError("O anexo deve ter no máximo 3 MB.");
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) return setError("Envie PDF, PNG, JPEG ou WebP.");
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
      reader.readAsDataURL(file);
    });
    setValue((current: any) => ({ ...current, attachment: { name: file.name, type: file.type, data } }));
  }
  return (
    <Modal title={`Registrar ocorrência · ${employee.name}`} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        <div className="form-grid">
          <label>Tipo de ocorrência *
            <select value={value.type} onChange={(event) => setValue({ ...value, type: event.target.value, cycleId: "" })}>
              <option value="penalty">Aplicar penalidade e descontar pontos</option>
              <option value="cycle_block">Impedir avaliação em um ciclo</option>
              <option value="season_suspension">Suspender da temporada</option>
            </select>
          </label>
          <label>Temporada *
            <select required value={value.seasonId} onChange={(event) => setValue({ ...value, seasonId: event.target.value, cycleId: "" })}>
              <option value="">Selecione</option>
              {availableSeasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
            </select>
          </label>
          {value.type === "penalty" && <label>Penalidade *
            <select required value={value.penaltyTypeId} onChange={(event) => setValue({ ...value, penaltyTypeId: event.target.value })}>
              <option value="">Selecione</option>
              {penaltyTypes.filter((item) => item.status === "ativo").map((item) => <option key={item.id} value={item.id}>{item.name} · −{item.points} pontos</option>)}
            </select>
          </label>}
          {value.type === "cycle_block" && <label>Ciclo *
            <select required value={value.cycleId} onChange={(event) => setValue({ ...value, cycleId: event.target.value })}>
              <option value="">Selecione</option>
              {seasonCycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.name}</option>)}
            </select>
          </label>}
          <label className="full">Motivo / observação *
            <textarea required minLength={3} maxLength={1000} rows={4} value={value.reason} onChange={(event) => setValue({ ...value, reason: event.target.value })} />
          </label>
          <label className="full">Documento de controle (opcional)
            <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => void fileChanged(event.target.files?.[0])} />
            <small>PDF ou imagem, até 3 MB. O arquivo ficará ligado a esta ocorrência.</small>
          </label>
        </div>
        {!availableSeasons.length && <p className="error">Cadastre uma temporada ainda não publicada antes de registrar a ocorrência.</p>}
        {value.type === "penalty" && !penaltyTypes.some((item) => item.status === "ativo") && <p className="error">Cadastre primeiro uma penalidade ativa em Configurações.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
          <button className="btn" disabled={busy || !availableSeasons.length}>{busy ? "Salvando…" : "Registrar ocorrência"}</button>
        </div>
      </form>
    </Modal>
  );
}
