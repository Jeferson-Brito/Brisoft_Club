import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Users, MapPin, Briefcase, ShieldCheck, KeyRound, Check, Minus, Star, Zap } from "lucide-react";
import type { ReactNode } from "react";
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
import { EmployeeEditor } from "../components/employees/EmployeeEditor";
import { UserEditor } from "../components/users/UserEditor";
const active = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];
export function Catalog({ kind }: { kind: "employees" | "clients" | "users" }) {
  const { data, refresh, notify } = useData();
  const [params] = useSearchParams();
  const requestedTab = params.get("tab");
  const allowedTabs = kind === "clients" ? ["clients", "posts"] : kind === "employees" ? ["employees", "allocations"] : ["users", "roles"];
  const [tab, setTab] = useState(requestedTab && allowedTabs.includes(requestedTab) ? requestedTab : kind);
  const [editing, setEditing] = useState<Row | undefined>();
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<Row>();
  const options = (rows: Row[]) =>
    rows.map((r) => ({ value: r.id, label: r.name }));
  useEffect(() => {
    if (requestedTab && allowedTabs.includes(requestedTab)) setTab(requestedTab);
  }, [requestedTab, kind]);
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
      { key: "postIds", label: "Postos desta empresa", type: "multi", options: options(data.posts), required: false, hint: "Escolha os postos globais que existem nesta empresa." },
      { key: "status", label: "Status", options: active },
    ],
    posts: [
      { key: "name", label: "Nome do posto" },
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
        key: "clientId",
        label: "Empresa",
        options: options(data.clients),
        hint: "Empresa onde o colaborador trabalhará neste vínculo.",
        clears: ["postId"],
      },
      {
        key: "postId",
        label: "Posto",
        options: (value) => data.posts.filter((p) => p.clientIds?.includes(value.clientId)).map((p) => ({
          value: p.id,
          label: p.name,
        })),
        hint: "Primeiro escolha a empresa. Aqui aparecem somente os postos habilitados nela.",
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
    allocations: "Vínculos dos colaboradores",
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
      clientId: r.clientId || a?.clientId || "",
      postId: r.postId || a?.postId || "",
      supervisorId: r.supervisorId || a?.supervisorId || "",
      allocationStart: r.allocationStart || a?.start || "",
      client: data.clients.find((c) => c.id === (r.clientId || a?.clientId))
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
      { key: "clients", label: "Empresas", render: (r) => data.clients.filter((client) => r.clientIds?.includes(client.id)).map((client) => client.name).join(", ") || "Ainda não utilizado" },
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
  const catalogIcons: Record<string, ReactNode> = {
    employees: <Users size={20} className="text-[#f5b300]" />,
    clients: <Building2 size={20} className="text-[#f5b300]" />,
    posts: <MapPin size={20} className="text-[#f5b300]" />,
    allocations: <Briefcase size={20} className="text-[#f5b300]" />,
    users: <ShieldCheck size={20} className="text-[#f5b300]" />,
    roles: <KeyRound size={20} className="text-[#f5b300]" />,
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
        icon={catalogIcons[current]}
        description={
          current === "allocations"
            ? "Um vínculo informa em qual empresa e posto o colaborador trabalha. Ao movimentá-lo, o histórico anterior é preservado."
            : kind === "employees"
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
      {kind === "users" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Usuários ativos</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.users.filter(u => u.status === 'ativo').length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Check size={18} strokeWidth={3} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Usuários inativos</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.users.filter(u => u.status !== 'ativo').length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
              <Minus size={18} strokeWidth={3} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Perfis de acesso</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.roles.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#f5b300] flex items-center justify-center font-bold">
              <Star size={18} strokeWidth={2.5} />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500">Acessos registrados</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{data.audit.filter(a => a.action === 'login').length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#071e4d] flex items-center justify-center font-bold">
              <Zap size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      )}
      <div className="tabs inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-4 gap-1">
        {tabs.map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              current === t
                ? "bg-[#071e4d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
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
            {editable && current !== "allocations" && !(current === "users" && r.employeeId) && (
              <button className="text-button" onClick={() => setEditing(r)}>
                Editar
              </button>
            )}
            {current === "users" && r.employeeId && <span className="muted">Gerenciado no colaborador</span>}
          </>
        )}
      />
      {(creating || editing) && current === "employees" && (
        <EmployeeEditor
          initial={editing}
          clients={data.clients}
          posts={data.posts}
          users={data.users.filter(user => data.roles.find(role => role.id === user.roleId)?.permissions?.includes("evaluate"))}
          employeeDomain={data.employeeAccessDomain}
          canCreateLocation={data.role.permissions.includes("clients")}
          onClose={() => { setEditing(undefined); setCreating(false); }}
          onSave={async value => {
            const saved = await api("/employees/save", value);
            await refresh();
            notify(`Colaborador salvo. Login: ${saved.loginEmail}`);
          }}
        />
      )}
      {(creating || editing) && current !== "employees" && (
        current === "users" ? (
          <UserEditor
            initial={editing}
            roles={data.roles}
            clients={data.clients}
            posts={data.posts}
            onClose={() => { setEditing(undefined); setCreating(false); }}
            onSave={async value => {
              await api("/records/users", value);
              await refresh();
              notify("Usuário e abrangência salvos.");
            }}
          />
        ) : (
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
        )
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
