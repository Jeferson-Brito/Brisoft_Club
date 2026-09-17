import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api, dateLabel, useData, type Row } from "./state";
import {
  Panel,
  NewButton,
  Status,
  Action,
  DataTable,
} from "./ui";
import { CyclePreActivationModal } from "../components/seasons/CyclePreActivationModal";

export function Seasons() {
  const navigate = useNavigate();
  const { data, refresh, notify } = useData();
  const [participants, setParticipants] = useState<string>();
  const [pendingActivation, setPendingActivation] = useState<{
    season: Row;
    cycle?: Row;
  } | null>(null);

  async function action(path: string, label: string, body: Record<string, unknown> = {}) {
    if (!confirm(label)) return;
    await api(path, body);
    await refresh();
    notify("Operação concluída.");
  }

  function requestActivation(season: Row, cycle?: Row) {
    // 1. Colaboradores ativos sem alocação ou sem cliente/posto
    const unallocated = data.employees.filter((emp: Row) => {
      if (emp.status !== 'ativo') return false;
      const a = data.allocations.find((al: Row) => al.employeeId === emp.id && !al.end);
      return !a || !a.clientId || !a.postId;
    });

    // 2. Usuários clientes sem empresa ou sem colaboradores
    const clientIssues = data.users.filter((u: Row) => {
      const role = data.roles.find((r: Row) => r.id === u.roleId);
      const profile = (role?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (profile !== 'cliente' || u.status !== 'ativo') return false;
      if (!u.clientIds || u.clientIds.length === 0) return true;
      return !data.allocations.some((a: Row) => u.clientIds.includes(a.clientId) && !a.end);
    });

    // 3. Supervisores sem empresas ou sem colaboradores
    const supervisorIssues = data.users.filter((u: Row) => {
      const role = data.roles.find((r: Row) => r.id === u.roleId);
      if (!role?.permissions?.includes('evaluate') || role.globalScope || u.status !== 'ativo') return false;
      const profile = (role?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (profile === 'cliente') return false;
      if (!u.clientIds || u.clientIds.length === 0) return true;
      return !data.allocations.some((a: Row) => {
        if (a.end) return false;
        if (!u.clientIds.includes(a.clientId)) return false;
        if (u.postIds && u.postIds.length > 0 && !u.postIds.includes(a.postId)) return false;
        return true;
      });
    });

    // 4. Empresas clientes sem postos
    const clientWithoutPosts = data.clients.filter((c: Row) => c.status === 'ativo' && (!c.postIds || !c.postIds.length));

    const hasIssues = unallocated.length > 0 || clientIssues.length > 0 || supervisorIssues.length > 0 || clientWithoutPosts.length > 0;

    if (hasIssues) {
      setPendingActivation({ season, cycle });
    } else {
      const startsSeason = season.status === "planejada";
      const confirmMsg = cycle
        ? (startsSeason ? "Iniciar a temporada e este ciclo agora? Os colaboradores alocados durante o período serão incluídos." : "Iniciar este ciclo com os colaboradores alocados durante o período?")
        : "Iniciar a temporada e confirmar o regulamento atual? As regras serão preservadas para esta temporada.";
      if (confirm(confirmMsg)) {
        void executeActivation(season, cycle);
      }
    }
  }

  async function executeActivation(season: Row, cycle?: Row) {
    const startsSeason = season.status === "planejada";
    try {
      if (cycle) {
        if (startsSeason) await api(`/seasons/${season.id}/activate`, { confirmRules: true });
        await api(`/cycles/${cycle.id}/activate`, {});
        notify("Ciclo iniciado e participantes liberados para avaliação.");
      } else {
        await api(`/seasons/${season.id}/activate`, { confirmRules: true });
        notify("Temporada iniciada.");
      }
    } finally {
      await refresh();
      setPendingActivation(null);
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
  return (
    <>
      <div className="flex justify-end mb-4">
        <NewButton
          label="Nova temporada"
          onClick={() => navigate("/temporadas/novo")}
        />
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
                    onClick={() => requestActivation(s)}
                  >
                    Iniciar temporada
                  </Action>
                  <button
                    className="btn secondary"
                    onClick={() => navigate(`/temporadas/${s.id}/editar`)}
                  >
                    Editar
                  </button>
                </>
              )}
              {["ativa", "planejada"].includes(s.status) && (
                <button
                  className="btn secondary"
                  onClick={() => navigate(`/temporadas/ciclos/novo?seasonId=${s.id}`)}
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
                            onClick={() => requestActivation(s, c)}
                          >
                            {s.status === "planejada" ? "Iniciar temporada e ciclo" : "Iniciar ciclo"}
                          </Action>
                          <button
                            className="text-button"
                            onClick={() => navigate(`/temporadas/ciclos/${c.id}/editar`)}
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

      {pendingActivation && (
        <CyclePreActivationModal
          open={Boolean(pendingActivation)}
          season={pendingActivation.season}
          cycle={pendingActivation.cycle}
          data={data}
          onClose={() => setPendingActivation(null)}
          onConfirm={() => executeActivation(pendingActivation.season, pendingActivation.cycle)}
        />
      )}
    </>
  );
}
