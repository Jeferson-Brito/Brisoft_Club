import { useState } from "react";
import { api, dateLabel, useData } from "./state";
import { Heading, Panel, DataTable, Action, Editor } from "./ui";
export function Settings() {
  const { data, refresh, notify } = useData();
  const [rules, setRules] = useState(() =>
    structuredClone(data.settings!.rules),
  );
  const [tab, setTab] = useState("scale");
  const [penaltyEditor, setPenaltyEditor] = useState<any | null>(null);
  const [employeeDomain, setEmployeeDomain] = useState(data.settings?.employeeEmailDomain || "");
  const change = (key: string, value: any) =>
    setRules({ ...rules, [key]: value });
  return (
    <>
      <Heading
        title="Configurações"
        description="Defina a pontuação da empresa. Mudanças valem para temporadas ainda não iniciadas."
      >
        {!['penalties', 'access'].includes(tab) && <Action
          onClick={async () => {
            await api("/settings", rules);
            await refresh();
            notify(
              "Regulamento salvo. Temporadas iniciadas permanecem inalteradas.",
            );
          }}
        >
          Salvar regulamento
        </Action>}
      </Heading>
      {!['penalties', 'access'].includes(tab) && <div className="notice">
        O total de cada avaliação é a soma de{" "}
        <strong>pontos da nota × peso do critério</strong>, acrescida do elogio
        aprovado. A temporada usa a média dos ciclos; dentro de cada ciclo, a
        média ponderada dos avaliadores.
      </div>}
      <div className="tabs">
        {[
          ["scale", "Escala de notas"],
          ["criteria", "Critérios"],
          ["program", "Programa e ranking"],
          ["penalties", "Penalidades"],
          ["access", "Acesso de colaboradores"],
          ["history", "Versões e auditoria"],
        ].map(([key, name]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "scale" && (
        <Panel title="Quantos pontos vale cada nota?">
          <p>
            Os valores abaixo são escolhas da sua empresa. A nota e os pontos
            podem ser diferentes.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nota</th>
                  <th>Descrição</th>
                  <th>Pontos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rules.scale.map((s: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <input
                        aria-label={`Nota ${i + 1}`}
                        type="number"
                        min="0"
                        max="100"
                        value={s.value}
                        onChange={(e) =>
                          change(
                            "scale",
                            rules.scale.map((o: any, j: number) =>
                              j === i
                                ? { ...o, value: Number(e.target.value) }
                                : o,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Descrição da nota ${i + 1}`}
                        value={s.label}
                        onChange={(e) =>
                          change(
                            "scale",
                            rules.scale.map((o: any, j: number) =>
                              j === i ? { ...o, label: e.target.value } : o,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Pontos da nota ${s.value}`}
                        type="number"
                        min="0"
                        max="1000"
                        value={s.points}
                        onChange={(e) =>
                          change(
                            "scale",
                            rules.scale.map((o: any, j: number) =>
                              j === i
                                ? { ...o, points: Number(e.target.value) }
                                : o,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="text-button danger"
                        disabled={rules.scale.length <= 2}
                        onClick={() =>
                          change(
                            "scale",
                            rules.scale.filter((_: any, j: number) => j !== i),
                          )
                        }
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="btn secondary mt"
            disabled={rules.scale.length >= 10}
            onClick={() =>
              change("scale", [
                ...rules.scale,
                {
                  value: Math.max(...rules.scale.map((s: any) => s.value)) + 1,
                  label: "Nova nota",
                  points: 0,
                },
              ])
            }
          >
            Adicionar nota
          </button>
          <div className="notice mt">
            Máximo pelos critérios:{" "}
            <strong>
              {rules.criteria.reduce(
                (n: number, c: any) =>
                  n +
                  c.weight * Math.max(...rules.scale.map((s: any) => s.points)),
                0,
              )}{" "}
              pontos
            </strong>
            . Com elogio:{" "}
            <strong>
              {rules.criteria.reduce(
                (n: number, c: any) =>
                  n +
                  c.weight * Math.max(...rules.scale.map((s: any) => s.points)),
                0,
              ) + (rules.complimentEnabled ? rules.complimentPoints : 0)}{" "}
              pontos
            </strong>
            .
          </div>
        </Panel>
      )}
      {tab === "criteria" && (
        <>
          <div className="stack">
            {rules.criteria.map((c: any, i: number) => (
              <Panel key={c.id}>
                <div className="form-grid">
                  <label>
                    Nome
                    <input
                      value={c.name}
                      onChange={(e) =>
                        change(
                          "criteria",
                          rules.criteria.map((o: any, j: number) =>
                            j === i ? { ...o, name: e.target.value } : o,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Peso
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={c.weight}
                      onChange={(e) =>
                        change(
                          "criteria",
                          rules.criteria.map((o: any, j: number) =>
                            j === i
                              ? { ...o, weight: Number(e.target.value) }
                              : o,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="full">
                    Descrição
                    <textarea
                      value={c.description}
                      onChange={(e) =>
                        change(
                          "criteria",
                          rules.criteria.map((o: any, j: number) =>
                            j === i ? { ...o, description: e.target.value } : o,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Justificativa para nota abaixo de
                    <input
                      type="number"
                      value={c.justifyBelow}
                      onChange={(e) =>
                        change(
                          "criteria",
                          rules.criteria.map((o: any, j: number) =>
                            j === i
                              ? { ...o, justifyBelow: Number(e.target.value) }
                              : o,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={c.requiredComment}
                      onChange={(e) =>
                        change(
                          "criteria",
                          rules.criteria.map((o: any, j: number) =>
                            j === i
                              ? { ...o, requiredComment: e.target.checked }
                              : o,
                          ),
                        )
                      }
                    />
                    Sempre exigir comentário
                  </label>
                </div>
                <div className="actions mt">
                  <button
                    className="text-button"
                    disabled={!i}
                    onClick={() => {
                      const next = [...rules.criteria];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      change("criteria", next);
                    }}
                  >
                    Mover para cima
                  </button>
                  <button
                    className="text-button danger"
                    disabled={rules.criteria.length === 1}
                    onClick={() =>
                      change(
                        "criteria",
                        rules.criteria.filter((_: any, j: number) => j !== i),
                      )
                    }
                  >
                    Remover critério
                  </button>
                </div>
              </Panel>
            ))}
          </div>
          <button
            className="btn secondary mt"
            onClick={() =>
              change("criteria", [
                ...rules.criteria,
                {
                  id: crypto.randomUUID(),
                  name: "Novo critério",
                  description: "",
                  weight: 1,
                  requiredComment: false,
                  justifyBelow: 0,
                },
              ])
            }
          >
            Adicionar critério
          </button>
        </>
      )}
      {tab === "program" && (
        <div className="stack">
          <Panel title="Regulamento e reconhecimento">
            <div className="form-grid">
              <label>
                Nome do regulamento
                <input
                  value={rules.name}
                  onChange={(e) => change("name", e.target.value)}
                />
              </label>
              {[
                ["bronze", "Bronze a partir de"],
                ["silver", "Prata a partir de"],
                ["gold", "Ouro a partir de"],
                [
                  "diamondSeasons",
                  "Temporadas consecutivas Ouro para Diamante",
                ],
                ["minimumCycles", "Mínimo de ciclos avaliados para ranking"],
                ["complimentPoints", "Pontos por elogio aprovado"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min="0"
                    value={rules[key]}
                    onChange={(e) => change(key, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
            <label className="inline-check mt">
              <input
                type="checkbox"
                checked={!rules.provisional}
                onChange={(e) => change("provisional", !e.target.checked)}
              />
              Confirmo que revisei a pontuação e aprovo este regulamento para
              novas temporadas
            </label>
            <div className="check-list mt">
              {[
                ["complimentEnabled", "Permitir elogios"],
                ["complimentApproval", "Exigir aprovação de elogios"],
                [
                  "allowReevaluate",
                  "Permitir que avaliações já avaliadas possam ser reavaliadas por quem avaliou",
                ],
                ["allowSkip", "Permitir pular colaborador"],
                [
                  "allowUnable",
                  "Permitir justificar impossibilidade de avaliar",
                ],
                [
                  "allowLate",
                  "Aceitar avaliações após o prazo enquanto o ciclo estiver aberto",
                ],
                [
                  "hideBeforePublication",
                  "Ocultar ranking dos avaliadores até a publicação",
                ],
                [
                  "autoClose",
                  "Encerrar ciclos e temporada automaticamente após os prazos",
                ],
                [
                  "autoPublish",
                  "Publicar automaticamente na data de divulgação",
                ],
              ].map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={key === "allowReevaluate" ? rules[key] !== false : !!rules[key]}
                    onChange={(e) => change(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Peso por perfil de avaliador">
            <div className="form-grid">
              {data.roles.map((r) => (
                <label key={r.id}>
                  {r.name}
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={rules.evaluatorWeights[r.id] ?? 1}
                    onChange={(e) =>
                      change("evaluatorWeights", {
                        ...rules.evaluatorWeights,
                        [r.id]: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Desempate (após a pontuação)">
            <p>
              Ordem aplicada:{" "}
              {rules.tieBreak
                .map(
                  (s: string) =>
                    ({
                      technical: "Competência Técnica",
                      posture: "Postura",
                      communication: "Comunicação",
                      compliments: "Elogios",
                      oldest: "Avaliação mais antiga",
                    })[s],
                )
                .join(" → ")}
              .
            </p>
            {rules.tieBreak.map((s: string, i: number) => (
              <button
                key={s}
                className="btn secondary compact"
                disabled={i === 0}
                onClick={() => {
                  const next = [...rules.tieBreak];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  change("tieBreak", next);
                }}
              >
                ↑ {i + 1}.{" "}
                {
                  {
                    technical: "Competência Técnica",
                    posture: "Postura",
                    communication: "Comunicação",
                    compliments: "Elogios",
                    oldest: "Avaliação mais antiga",
                  }[s]
                }
              </button>
            ))}
          </Panel>
        </div>
      )}
      {tab === "penalties" && (
        <Panel title="Catálogo de penalidades">
          <p>
            Cadastre aqui os motivos e o desconto padrão. Depois, aplique a
            penalidade ou um bloqueio diretamente no perfil do colaborador.
          </p>
          <div className="actions mt">
            <button className="btn" onClick={() => setPenaltyEditor({ status: "ativo", points: 0 })}>
              Nova penalidade
            </button>
          </div>
          <DataTable
            title="Penalidades cadastradas"
            search={false}
            rows={data.penaltyTypes}
            columns={[
              { key: "name", label: "Nome" },
              { key: "description", label: "Descrição" },
              { key: "points", label: "Pontos descontados" },
              { key: "status", label: "Status" },
            ]}
            actions={(row) => (
              <button className="btn secondary compact" onClick={() => setPenaltyEditor(row)}>Editar</button>
            )}
          />
        </Panel>
      )}
      {tab === "access" && (
        <Panel title="Acesso automático dos colaboradores">
          <p>
            Defina o domínio usado para criar o login quando um colaborador for
            cadastrado. Exemplo: João da Silva será criado como
            joao.da.silva@empresa.com.br.
          </p>
          <div className="form-grid mt">
            <label>
              Domínio padrão
              <input
                value={employeeDomain}
                placeholder="@empresa.com.br"
                onChange={(event) => setEmployeeDomain(event.target.value)}
              />
              <small>O CPF será apenas a senha inicial e deverá ser trocado no primeiro acesso.</small>
            </label>
          </div>
          <div className="actions mt">
            <Action onClick={async () => {
              const result = await api('/settings/employee-access', { domain: employeeDomain });
              setEmployeeDomain(result.domain);
              await refresh();
              notify('Domínio dos colaboradores salvo.');
            }}>Salvar domínio</Action>
          </div>
          <div className="notice mt">
            A alteração vale para novos acessos. Logins já criados permanecem
            iguais para evitar que colaboradores percam o acesso.
          </div>
        </Panel>
      )}
      {tab === "history" && (
        <>
          <Panel title="Temporadas e versões preservadas">
            {data.seasons
              .filter((s) => s.rules)
              .map((s) => (
                <p key={s.id}>
                  {s.name} · Versão {s.ruleVersion} · {dateLabel(s.activatedAt)}{" "}
                  · {s.rules.name}
                </p>
              ))}
          </Panel>
          <DataTable
            title="Auditoria"
            rows={data.audit}
            columns={[
              {
                key: "date",
                label: "Data",
                render: (r) => new Date(r.date).toLocaleString("pt-BR"),
              },
              {
                key: "actor",
                label: "Usuário",
                render: (r) =>
                  data.users.find((u) => u.id === r.actor)?.name || r.actor,
              },
              { key: "action", label: "Ação" },
              { key: "entity", label: "Registro" },
            ]}
          />
        </>
      )}
      {penaltyEditor && (
        <Editor
          title={penaltyEditor.id ? "Editar penalidade" : "Nova penalidade"}
          initial={penaltyEditor}
          fields={[
            { key: "name", label: "Nome da penalidade" },
            { key: "description", label: "Descrição", required: false },
            { key: "points", label: "Pontos a descontar", type: "number" },
            { key: "status", label: "Status", options: [{ value: "ativo", label: "Ativa" }, { value: "inativo", label: "Inativa" }] },
          ]}
          onClose={() => setPenaltyEditor(null)}
          onSave={async (value) => {
            await api("/records/penaltyTypes", value);
            await refresh();
            notify("Penalidade salva.");
          }}
        />
      )}
    </>
  );
}
