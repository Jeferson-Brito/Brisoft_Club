import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Send, SkipForward, CheckCircle2 } from "lucide-react";
import { Avatar } from "../components/ui/Avatar";
import { api, dateLabel, useData, type Row } from "./state";
import { Heading, Panel, Action, DataTable, Status, Modal, Stat } from "./ui";
export function Evaluate() {
  const { data } = useData();
  const [params] = useSearchParams();
  const [cycleId, setCycleId] = useState(
    params.get("cycle") ||
      data.cycles.find((c) => c.status === "ativo")?.id ||
      "",
  );
  const [target, setTarget] = useState(params.get("participant") || "");
  const cycle = data.cycles.find((c) => c.id === cycleId);
  const season = data.seasons.find((s) => s.id === cycle?.seasonId);
  const all = data.participants.filter(
    (p) => p.cycleId === cycleId && p.eligible !== false,
  );
  const done = all.filter((p) =>
    data.evaluations.some(
      (e) =>
        e.participantId === p.id &&
        e.evaluatorId === data.user.id &&
        e.status !== "rascunho",
    ),
  );
  const pending = all.filter((p) => !done.includes(p));
  const current = pending.find((p) => p.id === target) || pending[0];
  return (
    <>
      <Heading
        title="Avaliação de Colaborador"
        description="Avalie uma pessoa por vez. Cada envio fica vinculado ao seu usuário."
      >
        <select
          aria-label="Ciclo de avaliação"
          value={cycleId}
          onChange={(e) => {
            setCycleId(e.target.value);
            setTarget("");
          }}
        >
          <option value="">Selecione o ciclo</option>
          {data.cycles
            .filter((c) => c.status === "ativo")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {data.seasons.find((s) => s.id === c.seasonId)?.name} · {c.name}
              </option>
            ))}
        </select>
      </Heading>
      {!cycle || !season?.rules ? (
        <Panel>
          <div className="empty">
            Nenhum ciclo aberto para avaliar.
            <small>
              O administrador precisa iniciar uma temporada e um ciclo com
              participantes.
            </small>
          </div>
        </Panel>
      ) : (
        <>
          <div className="stats three">
            <Stat label="Colaboradores do ciclo" value={all.length} />
            <Stat label="Avaliações registradas por você" value={done.length} />
            <Stat label="Pendentes" value={pending.length} />
          </div>
          {current ? (
            <EvaluationForm
              key={current.id}
              participant={current}
              rules={season.rules}
              pending={pending}
              onSelect={setTarget}
            />
          ) : (
            <Panel>
              <div className="success-empty">
                <CheckCircle2 size={48} />
                <h2>Tudo em dia!</h2>
                <p>Você concluiu as avaliações disponíveis neste ciclo.</p>
                <Link className="btn secondary" to="/avaliacoes/historico">
                  Ver histórico
                </Link>
              </div>
            </Panel>
          )}
        </>
      )}
    </>
  );
}
function EvaluationForm({
  participant,
  rules,
  pending,
  onSelect,
}: {
  participant: Row;
  rules: any;
  pending: Row[];
  onSelect: (id: string) => void;
}) {
  const { data, refresh, notify } = useData();
  const previous = data.evaluations.find(
    (e) =>
      e.participantId === participant.id &&
      e.evaluatorId === data.user.id &&
      e.status === "rascunho",
  );
  const [answers, setAnswers] = useState<
    Record<string, { value: number; comment: string }>
  >(() =>
    Object.fromEntries(
      (previous?.answers || []).map((a: any) => [
        a.criterionId,
        { value: a.value, comment: a.comment },
      ]),
    ),
  );
  const [compliment, setCompliment] = useState(previous?.compliment || "");
  const [dirty, setDirty] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [participant.id]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save(status = "enviada") {
    const result = await api("/evaluations", {
      participantId: participant.id,
      status,
      answers: Object.entries(answers).map(([criterionId, a]) => ({
        criterionId,
        ...a,
      })),
      compliment,
      reason,
    });
    setDirty(false);
    await refresh();
    notify(status === "rascunho" ? "Rascunho salvo." : "Avaliação registrada.");
    if (result.status !== "rascunho")
      onSelect(pending.find((p) => p.id !== participant.id)?.id || "");
  }
  function select(id: string) {
    if (id === participant.id) return;
    if (
      dirty &&
      !confirm(
        "Há alterações não salvas. Deseja descartá-las e trocar de colaborador?",
      )
    )
      return;
    onSelect(id);
  }
  const valid = rules.criteria.every((c: any) => {
    const a = answers[c.id];
    return (
      a &&
      rules.scale.some((s: any) => s.value === a.value) &&
      (!(c.requiredComment || a.value < c.justifyBelow) ||
        a.comment.trim().length >= 3)
    );
  });
  return (
    <div className="evaluation-layout">
      <div className="stack">
        <Panel>
          <div className="person-header">
            <Avatar name={participant.snapshot.name} src={participant.snapshot.photo} size="xl" />
            <div>
              <h2>{participant.snapshot.name}</h2>
              <p>{participant.snapshot.role}</p>
              <small>
                {participant.snapshot.client} · {participant.snapshot.post}
              </small>
              <p>Matrícula: {participant.snapshot.registration}</p>
            </div>
          </div>
        </Panel>
        {rules.criteria.map((c: any, i: number) => (
          <Panel key={c.id}>
            <div className="split">
              <h2>
                <span className="criterion-number">{i + 1}</span>
                {c.name}
              </h2>
              <small>Peso {c.weight}</small>
            </div>
            <p>{c.description}</p>
            <div className="rating-options">
              {rules.scale.map((s: any) => (
                <button
                  key={s.value}
                  aria-pressed={answers[c.id]?.value === s.value}
                  className={`rating-btn ${answers[c.id]?.value === s.value ? "selected" : ""}`}
                  onClick={() => {
                    setAnswers({
                      ...answers,
                      [c.id]: {
                        comment: answers[c.id]?.comment || "",
                        value: s.value,
                      },
                    });
                    setDirty(true);
                  }}
                >
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                  <small>{s.points} pontos</small>
                </button>
              ))}
            </div>
            <label>
              Comentário{" "}
              {c.requiredComment || answers[c.id]?.value < c.justifyBelow
                ? "(obrigatório)"
                : "(opcional)"}
              <textarea
                maxLength={500}
                rows={2}
                value={answers[c.id]?.comment || ""}
                onChange={(e) => {
                  setAnswers({
                    ...answers,
                    [c.id]: {
                      value: answers[c.id]?.value,
                      comment: e.target.value,
                    },
                  });
                  setDirty(true);
                }}
                placeholder="Descreva o desempenho observado…"
              />
            </label>
            <small>{answers[c.id]?.comment?.length || 0}/500 caracteres</small>
          </Panel>
        ))}
        {rules.complimentEnabled && (
          <Panel title="Elogio (opcional)">
            <p>
              {rules.complimentApproval
                ? "A pontuação adicional depende da aprovação de um responsável."
                : `O elogio acrescenta ${rules.complimentPoints} pontos.`}
            </p>
            <textarea
              aria-label="Elogio"
              maxLength={500}
              rows={3}
              value={compliment}
              onChange={(e) => {
                setCompliment(e.target.value);
                setDirty(true);
              }}
            />
            <small>{compliment.length}/500 caracteres</small>
          </Panel>
        )}
        <Panel>
          <div className="actions wrap">
            {rules.allowUnable && (
              <button
                className="text-button"
                onClick={() => setReasonOpen(true)}
              >
                Não consigo avaliar
              </button>
            )}
            <Action secondary onClick={() => save("rascunho")}>
              Salvar rascunho
            </Action>
            {rules.allowSkip && (
              <button
                className="btn secondary"
                disabled={pending.length < 2}
                onClick={() =>
                  select(
                    pending[
                      (pending.findIndex((p) => p.id === participant.id) + 1) %
                        pending.length
                    ].id,
                  )
                }
              >
                Pular <SkipForward size={15} />
              </button>
            )}
            <Action disabled={!valid} onClick={() => save()}>
              <Send size={15} />
              Enviar e ir ao próximo
            </Action>
          </div>
        </Panel>
      </div>
      <aside className="stack">
        <Panel title="Próximos colaboradores">
          {pending.map((p) => (
            <button
              key={p.id}
              className={`person-option ${p.id === participant.id ? "active" : ""}`}
              onClick={() => select(p.id)}
            >
              <Avatar name={p.snapshot.name} src={p.snapshot.photo} size="sm" />
              <span>
                <strong>{p.snapshot.name}</strong>
                <small>{p.snapshot.post}</small>
              </span>
            </button>
          ))}
        </Panel>
        <div className="notice">
          Avalie o desempenho real durante o ciclo. Os dados desta pessoa
          correspondem à alocação preservada no início do período.
        </div>
      </aside>
      {reasonOpen && (
        <Modal title="Não consigo avaliar" onClose={() => setReasonOpen(false)}>
          <label>
            Motivo
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </label>
          <div className="form-actions">
            <Action
              disabled={reason.trim().length < 3}
              onClick={() => save("impossivel")}
            >
              Registrar justificativa
            </Action>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function EvaluationList({
  mode,
}: {
  mode: "pending" | "completed" | "history";
}) {
  const { data, refresh, notify } = useData();
  const [cycle, setCycle] = useState("");
  const [client, setClient] = useState("");
  const [status, setStatus] = useState("");
  const [detail, setDetail] = useState<Row>();
  const managing = data.role.permissions.includes("evaluations");
  const rows =
    mode === "pending"
      ? data.participants
          .filter((p) => {
            const es = data.evaluations.filter(
              (e) =>
                e.participantId === p.id &&
                (managing || e.evaluatorId === data.user.id),
            );
            return (
              data.cycles.find((c) => c.id === p.cycleId)?.status === "ativo" &&
              !es.some((e) =>
                ["enviada", "impossivel", "cancelada"].includes(e.status),
              )
            );
          })
          .map((p) => {
            const c = data.cycles.find((c) => c.id === p.cycleId);
            return {
              ...p,
              ...p.snapshot,
              deadline: c?.deadline,
              status: data.evaluations.some(
                (e) => e.participantId === p.id && e.status === "rascunho",
              )
                ? "rascunho"
                : c?.deadline < new Date().toISOString().slice(0, 10)
                  ? "atrasado"
                  : "pendente",
            };
          })
      : data.evaluations
          .filter((e) => mode === "history" || e.status === "enviada")
          .map((e) => ({ ...e, ...e.snapshot }));
  const filtered = rows.filter(
    (r) =>
      (!cycle || r.cycleId === cycle) &&
      (!client || r.clientId === client) &&
      (!status || r.status === status),
  );
  const title =
    mode === "pending"
      ? "Avaliações Pendentes"
      : mode === "completed"
        ? "Avaliações Concluídas"
        : "Histórico de Avaliações";
  return (
    <>
      <Heading
        title={title}
        description={
          mode === "pending"
            ? "Acompanhe quem ainda precisa ser avaliado."
            : "Consulte notas, comentários e o contexto original de cada avaliação."
        }
      />
      <div className="filters panel">
        <label>
          Ciclo
          <select value={cycle} onChange={(e) => setCycle(e.target.value)}>
            <option value="">Todos</option>
            {data.cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cliente
          <select value={client} onChange={(e) => setClient(e.target.value)}>
            <option value="">Todos</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Situação
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {[...new Set(rows.map((r) => r.status))].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn secondary"
          onClick={() => {
            setCycle("");
            setClient("");
            setStatus("");
          }}
        >
          Limpar filtros
        </button>
      </div>
      <DataTable
        title={title}
        rows={filtered}
        columns={[
          { key: "name", label: "Colaborador" },
          { key: "registration", label: "Matrícula" },
          { key: "client", label: "Cliente" },
          { key: "post", label: "Posto" },
          ...(mode === "pending"
            ? [
                {
                  key: "deadline",
                  label: "Prazo",
                  render: (r: Row) => dateLabel(r.deadline),
                },
              ]
            : [
                { key: "evaluator", label: "Avaliador" },
                { key: "score", label: "Pontos" },
                {
                  key: "sentAt",
                  label: "Data",
                  render: (r: Row) => dateLabel(r.sentAt),
                },
              ]),
          {
            key: "status",
            label: "Situação",
            render: (r) => <Status value={r.status} />,
          },
        ]}
        actions={(r) =>
          mode === "pending" ? (
            data.role.permissions.includes("evaluate") ? (
              <Link
                className="btn compact"
                to={`/avaliacoes/avaliar?cycle=${r.cycleId}&participant=${r.id}`}
              >
                Avaliar
              </Link>
            ) : null
          ) : (
            <button className="text-button" onClick={() => setDetail(r)}>
              Ver detalhes
            </button>
          )
        }
      />
      {detail && (
        <Modal
          title="Detalhes da avaliação"
          onClose={() => setDetail(undefined)}
        >
          <div className="person-header">
            <Avatar name={detail.name} src={detail.photo} size="lg" />
            <div>
              <h2>{detail.name}</h2>
              <p>
                {detail.client} / {detail.post}
              </p>
              <small>
                {detail.evaluator} · {dateLabel(detail.sentAt)} · Regulamento v
                {detail.ruleVersion}
              </small>
            </div>
          </div>
          {detail.answers.map((a: any) => (
            <Panel key={a.criterionId}>
              <div className="split">
                <h2>{a.name || a.criterionId}</h2>
                <strong>
                  Nota {a.value} · {a.points ?? "—"} pontos
                </strong>
              </div>
              <p>{a.comment || "Sem comentário."}</p>
            </Panel>
          ))}
          {detail.compliment && (
            <Panel title="Elogio">
              <p>{detail.compliment}</p>
              <Status
                value={detail.complimentApproved ? "concluida" : "pendente"}
              />
              {managing &&
                !detail.complimentApproved &&
                detail.status === "enviada" && (
                  <Action
                    onClick={async () => {
                      await api(`/evaluations/${detail.id}/approve`, {});
                      await refresh();
                      setDetail(undefined);
                      notify("Elogio aprovado.");
                    }}
                  >
                    Aprovar elogio
                  </Action>
                )}
            </Panel>
          )}
          {detail.reason && (
            <Panel title="Justificativa">
              <p>{detail.reason}</p>
            </Panel>
          )}
          <p className="total-score">Total: {detail.score} pontos</p>
          {detail.revisions?.length > 0 && (
            <Panel title="Revisões preservadas">
              {detail.revisions.map((r: any, i: number) => (
                <p key={i}>
                  {dateLabel(r.date)} · {r.score} pontos · {r.reason}
                </p>
              ))}
            </Panel>
          )}
          {managing &&
            detail.status !== "rascunho" &&
            data.cycles.find((c) => c.id === detail.cycleId)?.status ===
              "ativo" && (
              <Action
                secondary
                onClick={async () => {
                  const reason = prompt(
                    "Motivo da reabertura para correção pelo avaliador:",
                  );
                  if (!reason) return;
                  await api(`/evaluations/${detail.id}/reopen`, { reason });
                  await refresh();
                  setDetail(undefined);
                  notify(
                    "Reaberta para o avaliador original. A versão anterior foi preservada.",
                  );
                }}
              >
                Reabrir para correção
              </Action>
            )}
          {managing && detail.status === "enviada" && (
            <Action
              secondary
              onClick={async () => {
                const reason = prompt(
                  "Motivo do cancelamento (mínimo de 3 caracteres):",
                );
                if (!reason) return;
                await api(`/evaluations/${detail.id}/cancel`, { reason });
                await refresh();
                setDetail(undefined);
                notify("Avaliação cancelada e preservada no histórico.");
              }}
            >
              Cancelar avaliação
            </Action>
          )}
        </Modal>
      )}
    </>
  );
}
