import { useState } from "react";
import { useData, type Row } from "./state";
import { Heading, DataTable, Panel, Action } from "./ui";
export function Reports() {
  const { data } = useData();
  const [kind, setKind] = useState("evaluations");
  const [season, setSeason] = useState("");
  const [client, setClient] = useState("");
  let rows: Row[] =
    kind === "employees"
      ? data.employees.map((e) => {
          const a = data.allocations.find(
            (a) => a.employeeId === e.id && !a.end,
          );
          return {
            ...e,
            clientId: a?.clientId,
            client: data.clients.find((c) => c.id === a?.clientId)?.name,
          };
        })
      : kind === "ranking"
        ? Object.entries(data.rankings)
            .filter(([key]) => !season || key === season)
            .flatMap(([key, rows]) =>
              rows.map((r) => ({
                ...r,
                id: `${key}-${r.id}`,
                seasonId: key,
                season: data.seasons.find((s) => s.id === key)?.name,
              })),
            )
        : kind === "pending"
          ? data.participants
              .filter(
                (p) =>
                  !data.evaluations.some(
                    (e) => e.participantId === p.id && e.status === "enviada",
                  ),
              )
              .map((p) => ({ ...p, ...p.snapshot }))
          : data.evaluations.map((e) => ({ ...e, ...e.snapshot }));
  rows = rows.filter(
    (r) =>
      (!season || r.seasonId === season || kind === "employees") &&
      (!client || r.clientId === client),
  );
  const columns =
    kind === "employees"
      ? [
          { key: "name", label: "Nome" },
          { key: "registration", label: "Matrícula" },
          { key: "role", label: "Função" },
          { key: "client", label: "Cliente" },
          { key: "status", label: "Status" },
        ]
      : [
          { key: "name", label: "Colaborador" },
          { key: "client", label: "Cliente" },
          { key: "post", label: "Posto" },
          ...(kind === "pending" ? [] : [{ key: "score", label: "Pontos" }]),
          { key: "status", label: "Situação" },
        ];
  return (
    <>
      <Heading
        title="Relatórios"
        description="Consulte, filtre e exporte os dados disponíveis para seu perfil."
      >
        <button className="btn secondary" onClick={() => window.print()}>
          Imprimir / salvar PDF
        </button>
        <Action
          onClick={async () => {
            const res = await fetch(
              `/api/export/${kind}?season=${encodeURIComponent(season)}&client=${encodeURIComponent(client)}`,
            );
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.error);
            }
            const url = URL.createObjectURL(await res.blob());
            const a = document.createElement("a");
            a.href = url;
            a.download = `${kind}.xlsx`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Exportar Excel
        </Action>
      </Heading>
      <Panel>
        <div className="filters">
          <label>
            Relatório
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="evaluations">Avaliações</option>
              <option value="employees">Colaboradores</option>
              <option value="ranking">Ranking e conquistas</option>
              <option value="pending">Pendências</option>
            </select>
          </label>
          <label>
            Temporada
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">Todas</option>
              {data.seasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
        </div>
      </Panel>
      <div className="screen-only">
        <DataTable
          title="Resultado do relatório"
          rows={rows}
          columns={columns}
        />
      </div>
      <div className="print-only">
        <h2>{data.organization} · Relatório</h2>
        <p>
          {rows.length} registros · {new Date().toLocaleDateString("pt-BR")}
        </p>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.key}>{r[c.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
