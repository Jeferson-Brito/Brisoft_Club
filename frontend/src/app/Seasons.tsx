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
    { key: "start", label: "Início", type: "date" },
    { key: "end", label: "Fim", type: "date" },
    { key: "deadline", label: "Prazo para avaliar", type: "date" },
  ];
  return (
    <>
      <Heading
        title="Temporadas"
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
      <div className="photo-summary">
        <div className="photo-stat"><CalendarDays /><span><strong>{data.seasons.length}</strong><small>Temporadas cadastradas</small></span></div>
        <div className="photo-stat green"><CirclePlay /><span><strong>{data.seasons.filter(s => s.status === 'ativa').length}</strong><small>Temporada ativa</small></span></div>
        <div className="photo-stat"><BarChart3 /><span><strong>{data.seasons.filter(s => ['encerrada', 'publicada'].includes(s.status)).length}</strong><small>Resultados consolidados</small></span></div>
        <div className="photo-stat"><Users /><span><strong>{data.participants.length}</strong><small>Participações registradas</small></span></div>
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
                      <small>Prazo: {dateLabel(c.deadline)}</small>
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
