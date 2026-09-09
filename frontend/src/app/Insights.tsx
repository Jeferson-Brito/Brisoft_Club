import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Users, Building2, CheckSquare } from "lucide-react";
import { KPICard } from "../components/ui/KPICard";
import { Avatar } from "../components/ui/Avatar";
import { dateLabel, useData, type Row } from "./state";
import { Heading, Panel, DataTable, Status, Stat } from "./ui";
export function Dashboard() {
  const { data } = useData();
  const [seasonId, setSeasonId] = useState(
    data.seasons.find((s) => s.status === "ativa")?.id ||
      data.seasons.at(-1)?.id ||
      "",
  );
  const season = data.seasons.find((s) => s.id === seasonId);
  const participants = data.participants.filter((p) => p.seasonId === seasonId);
  const es = data.evaluations.filter(
    (e) => e.seasonId === seasonId && e.status === "enviada",
  );
  const evaluated = new Set(es.map((e) => e.participantId));
  const percent = participants.length
    ? Math.round((evaluated.size / participants.length) * 100)
    : 0;
  const ranking = data.rankings[seasonId] || [];
  return (
    <>
      <Heading
        title="Dashboard"
        description={`Visão geral de ${data.organization}`}
      >
        <select
          aria-label="Temporada atual"
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
        >
          <option value="">Selecione uma temporada</option>
          {data.seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Heading>
      <div className="stats">
        <KPICard
          icon={<Users size={22} />}
          value={data.employees.length}
          label="Colaboradores"
          sub="Na sua área de acesso"
        />
        <KPICard
          icon={<Building2 size={22} />}
          value={data.clients.length}
          label="Clientes"
        />
        <KPICard
          icon={<CheckSquare size={22} />}
          iconVariant="green"
          value={`${percent}%`}
          label="Participantes avaliados"
          sub={`${evaluated.size} de ${participants.length} participações`}
        />
        <KPICard
          icon={<Trophy size={22} />}
          iconVariant="amber"
          value={ranking.filter((r) => r.badge).length}
          label="Colaboradores em destaque"
          sub="Na temporada selecionada"
        />
      </div>
      {!data.seasons.length && (
        <div className="notice">
          Comece pelos cadastros e pela escala de pontos. Em seguida, crie uma
          temporada e seus ciclos em <Link to="/temporadas">Temporadas</Link>.
        </div>
      )}
      <div className="dashboard-grid">
        <Panel title="Progresso das avaliações">
          <div
            className="progress-circle"
            style={{
              background: `conic-gradient(#1B6EF3 ${percent}%, #e9eff8 0)`,
            }}
          >
            <div>
              <strong>{percent}%</strong>
              <small>concluído</small>
            </div>
          </div>
          <p className="center">
            {evaluated.size} avaliados ·{" "}
            {Math.max(0, participants.length - evaluated.size)} pendentes
          </p>
          <Link className="text-button" to="/avaliacoes/pendentes">
            Ver pendências →
          </Link>
        </Panel>
        <Panel title="Avaliações por cliente">
          {data.clients.map((c) => {
            const ps = participants.filter((p) => p.snapshot.clientId === c.id);
            const n = ps.filter((p) => evaluated.has(p.id)).length;
            return (
              <div className="client-progress" key={c.id}>
                <div className="split">
                  <span>{c.name}</span>
                  <strong>
                    {ps.length ? Math.round((n / ps.length) * 100) : 0}%
                  </strong>
                </div>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${ps.length ? (n / ps.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {!data.clients.length && <p>Nenhum cliente cadastrado.</p>}
        </Panel>
        <Panel title="Status da temporada">
          {season ? (
            <>
              <h2>{season.name}</h2>
              <p>
                {dateLabel(season.start)} – {dateLabel(season.end)}
              </p>
              <Status value={season.status} />
              {data.cycles
                .filter((c) => c.seasonId === seasonId)
                .map((c) => (
                  <div className="timeline-item" key={c.id}>
                    <strong>{c.name}</strong>
                    <p>Prazo {dateLabel(c.deadline)}</p>
                    <Status value={c.status} />
                  </div>
                ))}
            </>
          ) : (
            <p>Selecione ou cadastre uma temporada.</p>
          )}
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <Panel title="Top 5 da temporada">
          {ranking
            .filter((r) => r.eligible)
            .slice(0, 5)
            .map((r, i) => (
              <div className="leader-row" key={r.id}>
                <strong>{i + 1}</strong>
                <Avatar name={r.name} size="sm" />
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.client}</small>
                </div>
                <b>{r.score}</b>
                <Status value={r.badge} />
              </div>
            ))}
          {!ranking.some((r) => r.eligible) && (
            <p>
              O ranking aparece após o mínimo de ciclos exigidos. Resultados
              podem estar ocultos até a publicação.
            </p>
          )}
          <Link className="text-button" to="/ranking/geral">
            Ver ranking completo →
          </Link>
        </Panel>
        <Panel title="Últimas avaliações">
          {es
            .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
            .slice(0, 5)
            .map((e) => (
              <div className="leader-row" key={e.id}>
                <Avatar name={e.snapshot.name} size="sm" />
                <div>
                  <strong>{e.snapshot.name}</strong>
                  <small>
                    {e.evaluator} · {dateLabel(e.sentAt)}
                  </small>
                </div>
                <b>{e.score} pts</b>
              </div>
            ))}
          {!es.length && <p>Nenhuma avaliação enviada nesta temporada.</p>}
          <Link className="text-button" to="/avaliacoes/historico">
            Ver histórico →
          </Link>
        </Panel>
      </div>
    </>
  );
}
export function Rankings({
  mode,
}: {
  mode: "general" | "client" | "podium" | "history" | "achievements";
}) {
  const { data } = useData();
  const eligibleSeasons =
    mode === "history"
      ? data.seasons.filter((s) => s.status === "publicada")
      : data.seasons;
  const [seasonId, setSeasonId] = useState(eligibleSeasons.at(-1)?.id || "");
  const [client, setClient] = useState("");
  const [badge, setBadge] = useState("");
  const season = data.seasons.find((s) => s.id === seasonId);
  const available = data.rankings[seasonId];
  const rows = (available || []).filter(
    (r) =>
      (!client || r.clientId === client) &&
      (!badge || r.badge === badge) &&
      (mode !== "achievements" || r.badge),
  );
  const title = {
    general: "Ranking Geral",
    client: "Ranking por Cliente",
    podium: "Pódio",
    history: "Histórico de Rankings",
    achievements: "Conquistas",
  }[mode];
  return (
    <>
      <Heading
        title={title}
        description="Resultados calculados com o regulamento preservado de cada temporada."
      />
      <div className="filters panel">
        <label>
          Temporada
          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
          >
            <option value="">Selecione</option>
            {eligibleSeasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cliente
          <select value={client} onChange={(e) => setClient(e.target.value)}>
            <option value="">Todos os clientes permitidos</option>
            {data.clients.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Classificação
          <select value={badge} onChange={(e) => setBadge(e.target.value)}>
            <option value="">Todas</option>
            {["bronze", "prata", "ouro", "diamante"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {season && (
        <div className="notice">
          {season.status === "publicada"
            ? "Resultado definitivo publicado."
            : "Resultado parcial — poderá mudar até o encerramento."}{" "}
          Mínimo: {season.rules?.minimumCycles || "—"} ciclos. Empates seguem o
          regulamento da temporada.
        </div>
      )}
      {!available ? (
        <Panel>
          <div className="empty">
            Resultado ainda não disponível.
            <small>
              A temporada precisa ser iniciada e o resultado deve estar liberado
              para seu perfil.
            </small>
          </div>
        </Panel>
      ) : (
        <>
          {mode === "achievements" && (
            <div className="stats">
              {["bronze", "prata", "ouro", "diamante"].map((b) => (
                <Stat
                  key={b}
                  label={`Talento ${b}`}
                  value={rows.filter((r) => r.badge === b).length}
                />
              ))}
            </div>
          )}
          {mode === "podium" && (
            <div className="podium">
              {rows
                .filter((r) => r.eligible)
                .slice(0, 3)
                .map((r, i) => (
                  <Panel key={r.id}>
                    <div className={`podium-person place-${i}`}>
                      <Trophy size={36} />
                      <Avatar name={r.name} size="xl" />
                      <span className="eyebrow">{i + 1}º LUGAR</span>
                      <h2>{r.name}</h2>
                      <p>
                        {r.client} · {r.post}
                      </p>
                      <strong>
                        {r.score} <small>pontos</small>
                      </strong>
                      <Status value={r.badge} />
                    </div>
                  </Panel>
                ))}
            </div>
          )}
          {mode === "client" && !client ? (
            data.clients.map((c) => (
              <DataTable
                key={c.id}
                title={c.name}
                rows={rows.filter((r) => r.clientId === c.id)}
                columns={rankingColumns}
              />
            ))
          ) : (
            <DataTable title={title} rows={rows} columns={rankingColumns} />
          )}
        </>
      )}
    </>
  );
}
const rankingColumns = [
  {
    key: "position",
    label: "Posição",
    render: (r: Row) => (r.position ? `${r.position}º` : "Parcial"),
  },
  { key: "name", label: "Colaborador" },
  { key: "role", label: "Função" },
  { key: "client", label: "Cliente" },
  { key: "score", label: "Média de pontos" },
  { key: "cycles", label: "Ciclos avaliados" },
  {
    key: "badge",
    label: "Classificação",
    render: (r: Row) =>
      r.eligible ? (
        <Status value={r.badge} />
      ) : (
        <span className="muted">Ciclos insuficientes</span>
      ),
  },
];
