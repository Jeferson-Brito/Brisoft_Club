import { useState } from "react";
import { api, dateLabel, useData, type Row } from "./state";
import {
  Heading,
  DataTable,
  Editor,
  NewButton,
  Status,
  Modal,
  Panel,
  type Field,
  type Column,
} from "./ui";
const active = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];
export function Catalog({ kind }: { kind: "employees" | "clients" | "users" }) {
  const { data, refresh, notify } = useData();
  const [tab, setTab] = useState(kind);
  const [editing, setEditing] = useState<Row | undefined>();
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Row>();
  const options = (rows: Row[]) =>
    rows.map((r) => ({ value: r.id, label: r.name }));
  const permission =
    kind === "employees"
      ? "employees"
      : kind === "clients"
        ? "clients"
        : "users";
  const editable =
    data.role.globalScope && data.role.permissions.includes(permission);
  const fields: Record<string, Field[]> = {
    clients: [
      { key: "name", label: "Nome do cliente" },
      { key: "cnpj", label: "CNPJ", required: false },
      { key: "segment", label: "Segmento", required: false },
      { key: "responsible", label: "Responsável", required: false },
      { key: "email", label: "E-mail", type: "email", required: false },
      { key: "phone", label: "Telefone", required: false },
      { key: "status", label: "Status", options: active },
    ],
    posts: [
      { key: "name", label: "Nome do posto" },
      { key: "clientId", label: "Cliente", options: options(data.clients) },
      { key: "code", label: "Código", required: false },
      { key: "address", label: "Endereço", required: false },
      { key: "status", label: "Status", options: active },
    ],
    employees: [
      { key: "name", label: "Nome completo" },
      { key: "registration", label: "Matrícula" },
      { key: "role", label: "Função" },
      { key: "admissionDate", label: "Admissão", type: "date" },
      {
        key: "status",
        label: "Status",
        options: [...active, { value: "licenca", label: "Licença" }],
      },
    ],
    allocations: [
      {
        key: "employeeId",
        label: "Colaborador",
        options: options(data.employees),
      },
      {
        key: "postId",
        label: "Posto",
        options: data.posts.map((p) => ({
          value: p.id,
          label: `${data.clients.find((c) => c.id === p.clientId)?.name} / ${p.name}`,
        })),
      },
      { key: "start", label: "Início da alocação", type: "date" },
      {
        key: "supervisorId",
        label: "Supervisor responsável",
        options: options(data.users),
        required: false,
        hint: "A movimentação encerra a alocação anterior e preserva o histórico.",
      },
    ],
    users: [
      { key: "name", label: "Nome" },
      { key: "email", label: "E-mail", type: "email" },
      { key: "roleId", label: "Perfil", options: options(data.roles) },
      {
        key: "password",
        label: editing ? "Nova senha (opcional)" : "Senha inicial",
        type: "password",
        required: !editing,
      },
      { key: "status", label: "Status", options: active },
      {
        key: "clientIds",
        label: "Clientes permitidos",
        type: "multi",
        options: options(data.clients),
      },
      {
        key: "postIds",
        label: "Postos permitidos",
        type: "multi",
        options: options(data.posts),
      },
    ],
    roles: [
      { key: "name", label: "Nome do perfil" },
      {
        key: "globalScope",
        label: "Acesso a todos os clientes e postos",
        type: "checkbox",
      },
      {
        key: "permissions",
        label: "Permissões",
        type: "multi",
        options: Object.entries({
          dashboard: "Dashboard",
          evaluate: "Realizar avaliações",
          evaluations: "Gerenciar avaliações",
          ranking: "Ranking",
          clients: "Gerenciar clientes",
          employees: "Colaboradores",
          seasons: "Temporadas e ciclos",
          achievements: "Conquistas",
          imports: "Importações",
          reports: "Relatórios",
          users: "Usuários e perfis",
          settings: "Configurações e auditoria",
        }).map(([value, label]) => ({ value, label })),
      },
    ],
  };
  const title: Record<string, string> = {
    employees: "Colaboradores",
    clients: "Clientes",
    posts: "Postos",
    allocations: "Alocações e movimentações",
    users: "Usuários e Acessos",
    roles: "Perfis e permissões",
  };
  const current = tab as string;
  const baseRows = (data as any)[current] as Row[];
  const rows = baseRows.map((r) => {
    const a = data.allocations.find((a) => a.employeeId === r.id && !a.end);
    const p = data.posts.find((p) => p.id === (r.postId || a?.postId));
    return {
      ...r,
      client: data.clients.find((c) => c.id === (r.clientId || p?.clientId))
        ?.name,
      post: p?.name,
      employee: data.employees.find((e) => e.id === r.employeeId)?.name,
      profile: data.roles.find((p) => p.id === r.roleId)?.name,
    };
  });
  const columns: Record<string, Column[]> = {
    clients: [
      { key: "name", label: "Cliente" },
      { key: "cnpj", label: "CNPJ" },
      { key: "segment", label: "Segmento" },
      { key: "responsible", label: "Responsável" },
      {
        key: "status",
        label: "Status",
        render: (r) => <Status value={r.status} />,
      },
    ],
    posts: [
      { key: "name", label: "Posto" },
      { key: "client", label: "Cliente" },
      { key: "code", label: "Código" },
      { key: "address", label: "Localização" },
      {
        key: "status",
        label: "Status",
        render: (r) => <Status value={r.status} />,
      },
    ],
    employees: [
      { key: "name", label: "Colaborador" },
      { key: "registration", label: "Matrícula" },
      { key: "role", label: "Função" },
      { key: "client", label: "Cliente" },
      { key: "post", label: "Posto" },
      {
        key: "status",
        label: "Status",
        render: (r) => <Status value={r.status} />,
      },
    ],
    allocations: [
      { key: "employee", label: "Colaborador" },
      { key: "client", label: "Cliente" },
      { key: "post", label: "Posto" },
      { key: "start", label: "Início", render: (r) => dateLabel(r.start) },
      {
        key: "end",
        label: "Fim",
        render: (r) => (r.end ? dateLabel(r.end) : "Atual"),
      },
    ],
    users: [
      { key: "name", label: "Nome" },
      { key: "email", label: "E-mail" },
      { key: "profile", label: "Perfil" },
      {
        key: "status",
        label: "Status",
        render: (r) => <Status value={r.status} />,
      },
    ],
    roles: [
      { key: "name", label: "Perfil" },
      {
        key: "globalScope",
        label: "Abrangência",
        render: (r) =>
          r.globalScope ? "Todos os clientes" : "Somente vínculos",
      },
      {
        key: "permissions",
        label: "Permissões",
        render: (r) => r.permissions.length,
      },
    ],
  };
  const tabs =
    kind === "clients"
      ? ["clients", "posts"]
      : kind === "employees"
        ? ["employees", "allocations"]
        : ["users", "roles"];
  return (
    <>
      <Heading
        title={title[current]}
        description={
          kind === "employees"
            ? "Gerencie pessoas, vínculos e histórico de movimentações."
            : kind === "clients"
              ? "Organize os clientes e os postos onde sua equipe atua."
              : "Controle quem acessa o sistema e o que cada perfil pode fazer."
        }
      >
        {editable && (
          <NewButton
            onClick={() => {
              setEditing(undefined);
              setCreating(true);
            }}
            label={
              current === "allocations" ? "Nova movimentação" : "Novo registro"
            }
          />
        )}
      </Heading>
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={current === t ? "active" : ""}
            onClick={() => setTab(t as typeof kind)}
          >
            {title[t]}
          </button>
        ))}
      </div>
      <DataTable
        title={title[current]}
        rows={rows}
        columns={columns[current]}
        actions={(r) => (
          <>
            {current === "employees" && (
              <button className="text-button" onClick={() => setDetail(r)}>
                Ver perfil
              </button>
            )}
            {editable && current !== "allocations" && (
              <button className="text-button" onClick={() => setEditing(r)}>
                Editar
              </button>
            )}
          </>
        )}
      />
      {(creating || editing) && (
        <Editor
          title={editing ? "Editar registro" : "Novo registro"}
          fields={fields[current]}
          initial={
            editing || {
              status: "ativo",
              admissionDate: new Date().toISOString().slice(0, 10),
              start: new Date().toISOString().slice(0, 10),
              clientIds: [],
              postIds: [],
              permissions: [],
              globalScope: false,
            }
          }
          onClose={() => {
            setEditing(undefined);
            setCreating(false);
          }}
          onSave={async (value) => {
            const body = { ...value };
            if (!body.password) delete body.password;
            await api(`/records/${current}`, body);
            await refresh();
            notify("Registro salvo.");
          }}
        />
      )}
      {detail && (
        <Modal title={detail.name} onClose={() => setDetail(undefined)}>
          <p>
            Matrícula {detail.registration} · {detail.role}
          </p>
          <Panel title="Histórico de alocações">
            {data.allocations
              .filter((a) => a.employeeId === detail.id)
              .map((a) => (
                <p key={a.id}>
                  {data.posts.find((p) => p.id === a.postId)?.name} ·{" "}
                  {dateLabel(a.start)} → {a.end ? dateLabel(a.end) : "Atual"}
                </p>
              ))}
          </Panel>
          <Panel title="Avaliações">
            {data.evaluations
              .filter(
                (e) =>
                  data.participants.find((p) => p.id === e.participantId)
                    ?.employeeId === detail.id,
              )
              .map((e) => (
                <p key={e.id}>
                  {dateLabel(e.sentAt)} · {e.evaluator} · {e.score} pontos{" "}
                  <Status value={e.status} />
                </p>
              ))}
          </Panel>
        </Modal>
      )}
    </>
  );
}
