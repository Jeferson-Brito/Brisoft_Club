import { useState } from "react";
import { CalendarDays, CirclePlay, BarChart3, Users, Trash2 } from "lucide-react";
import { api, dateLabel, useData, type Row } from "./state";
import {
  Heading,
  Panel,
  NewButton,
  Editor,
  Status,
  Action,
  DataTable,
} from "./ui";
export function Seasons() {
  const { data, refresh, notify } = useData();
  const [form, setForm] = useState<"seasons" | "cycles">();
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<Row>();
  const [participants, setParticipants] = useState<string>();
  async function action(path: string, label: string, body: Record<string, unknown> = {}) {
    if (!confirm(label)) return;
    await api(path, body);
    await refresh();
    notify("Operação concluída.");
  }
  async function activateCycle(season: Row, cycle: Row) {
    const startsSeason = season.status === "planejada";
    if (!confirm(startsSeason
      ? "Iniciar a temporada e este ciclo agora? Os colaboradores alocados durante o período serão incluídos."
      : "Iniciar este ciclo com os colaboradores alocados durante o período?")) return;
    try {
      if (startsSeason) await api(`/seasons/${season.id}/activate`, { confirmRules: true });
      await api(`/cycles/${cycle.id}/activate`, {});
      notify("Ciclo iniciado e participantes liberados para avaliação.");
    } finally {
      await refresh();
    }
  }
  async function removeSeason(season: Row) {
    if (!confirm(`Excluir a temporada ${season.name} permanentemente? Todos os ciclos, participantes e avaliações desta temporada serão removidos.`)) return;
    try {
      await api(`/records/seasons/${season.id}/delete`, { confirm: true });
      setParticipants(undefined);
      await refresh();
      notify("Temporada excluída.");
    } catch (error) {
      notify((error as Error).message);
    }
  }
  const seasonFields = [
    { key: "name", label: "Nome da temporada" },
    { key: "start", label: "Início", type: "date" },
    { key: "end", label: "Fim", type: "date" },
    { key: "publishDate", label: "Data de divulgação", type: "date" },
  ];
  const cycleFields = [
    { key: "name", label: "Nome do ciclo" },
    {
      key: "seasonId",
      label: "Temporada",
      options: data.seasons
        .filter((s) => ["ativa", "planejada"].includes(s.status))
        .map((s) => ({ value: s.id, label: s.name })),
    },
    { key: "start", label: "Início do ciclo", type: "date" },
    { key: "end", label: "Fim do ciclo", type: "date" },
    { key: "deadline", label: "Prazo geral para avaliar", type: "date" },
    { key: "clientStart", label: "Início avaliação do cliente (opcional)", type: "date" },
    { key: "clientDeadline", label: "Prazo final do cliente (opcional)", type: "date" },
    { key: "supervisorStart", label: "Início avaliação do supervisor/fiscal (opcional)", type: "date" },
    { key: "supervisorDeadline", label: "Prazo final do supervisor/fiscal (opcional)", type: "date" },
  ];
  return (
    <>
      <Heading
        title="Temporadas"
        icon={<CalendarDays size={20} className="text-[#f5b300]" />}
        description="Organize os ciclos, congele as regras e publique os resultados."
      >
        <NewButton
          label="Nova temporada"
          onClick={() => {
            setEditing(undefined);
            setForm("seasons");
          }}
        />
      </Heading>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Temporadas cadastradas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.seasons.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#071e4d] flex items-center justify-center font-bold">
            <CalendarDays size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Temporada ativa</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.seasons.filter(s => s.status === 'ativa').length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CirclePlay size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Resultados consolidados</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.seasons.filter(s => ['encerrada', 'publicada'].includes(s.status)).length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#f5b300] flex items-center justify-center font-bold">
            <BarChart3 size={18} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500">Participações registradas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{data.participants.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users size={18} />
          </div>
        </div>
      </div>
      {!data.seasons.length && (
        <Panel>
          <div className="empty">
            Comece criando uma temporada.
            <small>
              Depois cadastre os ciclos e revise o regulamento nas
              Configurações.
            </small>
          </div>
        </Panel>
      )}
      <div className="season-grid">
        {data.seasons.map((s) => (
          <Panel key={s.id}>
            <div className="split">
              <h2>{s.name}</h2>
              <Status value={s.status} />
            </div>
            <p>
              {dateLabel(s.start)} – {dateLabel(s.end)}
            </p>
            <small>
              Divulgação: {dateLabel(s.publishDate)} ·{" "}
              {s.rules
                ? `Regulamento v${s.ruleVersion} preservado`
                : "Regulamento será congelado ao iniciar"}
            </small>
            <div className="actions mt">
              {s.status === "planejada" && (
                <>
                  <Action
                    onClick={() =>
                      action(
                        `/seasons/${s.id}/activate`,
                        "Iniciar a temporada e confirmar o regulamento atual? As regras serão preservadas para esta temporada.",
                        { confirmRules: true },
                      )
                    }
                  >
                    Iniciar temporada
                  </Action>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setEditing(s);
                      setForm("seasons");
                    }}
                  >
                    Editar
                  </button>
                </>
              )}
              {["ativa", "planejada"].includes(s.status) && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    setSelected(s.id);
                    setEditing(undefined);
                    setForm("cycles");
                  }}
                >
                  Adicionar ciclo
                </button>
              )}
              {s.status === "ativa" && (
                <Action
                  secondary
                  onClick={() =>
                    action(
                      `/seasons/${s.id}/close`,
                      "Encerrar a temporada? Novas avaliações serão bloqueadas.",
                    )
                  }
                >
                  Encerrar temporada
                </Action>
              )}
              {s.status === "encerrada" && (
                <Action
                  onClick={() =>
                    action(
                      `/seasons/${s.id}/publish`,
                      "Publicar e congelar o resultado? Esta ação preserva o ranking definitivo.",
                    )
                  }
                >
                  Publicar resultado
                </Action>
              )}
              <button
                className="text-button danger"
                onClick={() => void removeSeason(s)}
                data-help="Exclui permanentemente a temporada, seus ciclos e todas as avaliações relacionadas."
              >
                <Trash2 size={14} /> Excluir
              </button>
            </div>
            <div className="cycle-list">
              {data.cycles
                .filter((c) => c.seasonId === s.id)
                .sort((a, b) => a.start.localeCompare(b.start))
                .map((c) => (
                  <div key={c.id} className="cycle">
                    <div>
                      <strong>{c.name}</strong>
                      <p>
                        {dateLabel(c.start)} – {dateLabel(c.end)}
                      </p>
                      <small>Prazo geral: {dateLabel(c.deadline)}</small>
                      {(c.clientStart || c.clientDeadline) && (
                        <small style={{ display: 'block', color: '#475569', fontSize: '11px' }}>
                          Cliente: {c.clientStart ? dateLabel(c.clientStart) : dateLabel(c.start)} até {dateLabel(c.clientDeadline || c.deadline)}
                        </small>
                      )}
                      {(c.supervisorStart || c.supervisorDeadline) && (
                        <small style={{ display: 'block', color: '#475569', fontSize: '11px' }}>
                          Supervisor/Fiscal: {c.supervisorStart ? dateLabel(c.supervisorStart) : dateLabel(c.start)} até {dateLabel(c.supervisorDeadline || c.deadline)}
                        </small>
                      )}
                    </div>
                    <Status value={c.status} />
                    <div className="actions">
                      {c.status === "planejado" && (
                        <>
                          <Action
                            secondary
                            onClick={() => activateCycle(s, c)}
                          >
                            {s.status === "planejada" ? "Iniciar temporada e ciclo" : "Iniciar ciclo"}
                          </Action>
                          <button
                            className="text-button"
                            onClick={() => {
                              setEditing(c);
                              setForm("cycles");
                            }}
                          >
                            Editar
                          </button>
                        </>
                      )}
                      {c.status === "ativo" && (
                        <Action
                          secondary
                          onClick={() =>
                            action(
                              `/cycles/${c.id}/close`,
                              "Encerrar este ciclo e bloquear envios?",
                            )
                          }
                        >
                          Encerrar
                        </Action>
                      )}
                      {c.status === "encerrado" && s.status === "ativa" && (
                        <Action
                          secondary
                          onClick={() =>
                            action(
                              `/cycles/${c.id}/reopen`,
                              "Reabrir este ciclo? Colaboradores ativos, alocados e com pelo menos três meses de empresa serão sincronizados.",
                            )
                          }
                        >
                          Reabrir ciclo
                        </Action>
                      )}
                      <button
                        className="text-button"
                        onClick={() =>
                          setParticipants(
                            participants === c.id ? undefined : c.id,
                          )
                        }
                      >
                        Participantes (
                        {
                          data.participants.filter((p) => p.cycleId === c.id)
                            .length
                        }
                        )
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {participants &&
              data.cycles.some(
                (c) => c.id === participants && c.seasonId === s.id,
              ) && (
                <DataTable
                  rows={data.participants
                    .filter((p) => p.cycleId === participants)
                    .map((p) => ({ ...p, ...p.snapshot }))}
                  title="Participantes congelados"
                  columns={[
                    { key: "name", label: "Colaborador" },
                    { key: "client", label: "Cliente" },
                    { key: "post", label: "Posto" },
                  ]}
                />
              )}
          </Panel>
        ))}
      </div>
      {form && (
        <Editor
          title={form === "seasons" ? "Temporada" : "Ciclo de avaliação"}
          fields={form === "seasons" ? seasonFields : cycleFields}
          initial={editing || { seasonId: selected }}
          onClose={() => setForm(undefined)}
          onSave={async (value) => {
            await api(`/records/${form}`, value);
            await refresh();
            notify("Período salvo.");
          }}
        />
      )}
    </>
  );
}
