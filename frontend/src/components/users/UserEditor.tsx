import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "../../app/ui";
import type { Row } from "../../app/state";

type Props = { initial?: Row; roles: Row[]; clients: Row[]; posts: Row[]; onClose: () => void; onSave: (value: any) => Promise<void> };
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function UserEditor({ initial, roles, clients, posts, onClose, onSave }: Props) {
  const [value, setValue] = useState<any>(initial || { name: "", email: "", password: "", roleId: "", status: "ativo", clientIds: [], postIds: [] });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const role = roles.find((item) => item.id === value.roleId);
  const profile = normalize(role?.name || "");
  const isClient = profile === "cliente";
  const isMultiCompany = ["supervisor", "fiscal"].includes(profile);
  const scoped = role && !role.globalScope;
  const filteredPosts = posts.filter((post) => post.clientIds?.some((clientId: string) => value.clientIds?.includes(clientId)));
  function toggleClient(id: string, checked: boolean) {
    const clientIds = checked ? [...(value.clientIds || []), id] : (value.clientIds || []).filter((item: string) => item !== id);
    setValue({ ...value, clientIds, postIds: (value.postIds || []).filter((postId: string) => posts.some((post) => post.id === postId && post.clientIds?.some((clientId: string) => clientIds.includes(clientId)))) });
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const body = { ...value }; if (!body.password) delete body.password; await onSave(body); onClose(); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <Modal title={initial ? "Editar usuário" : "Novo usuário"} onClose={onClose}>
    <form onSubmit={submit} className="stack">
      <div className="form-grid">
        <label>Nome *<input required value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></label>
        <label>E-mail *<input required type="email" value={value.email} onChange={(e) => setValue({ ...value, email: e.target.value })} /></label>
        <label>Perfil *<select required value={value.roleId} onChange={(e) => setValue({ ...value, roleId: e.target.value, clientIds: [], postIds: [] })}><option value="">Selecione</option>{roles.filter((item) => normalize(item.name) !== 'colaborador').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Status *<select value={value.status} onChange={(e) => setValue({ ...value, status: e.target.value })}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
        <label className="full">{initial ? "Nova senha (opcional)" : "Senha inicial *"}<div className="password-control"><input required={!initial} minLength={10} maxLength={128} type={visible ? "text" : "password"} value={value.password || ""} onChange={(e) => setValue({ ...value, password: e.target.value })} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Visualizar senha"}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {scoped && isClient && <label className="full">Empresa sob responsabilidade *<select required value={value.clientIds?.[0] || ""} onChange={(e) => setValue({ ...value, clientIds: e.target.value ? [e.target.value] : [], postIds: [] })}><option value="">Selecione uma empresa</option>{clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Este usuário verá somente essa empresa e seus colaboradores.</small></label>}
        {scoped && !isClient && <div className="full"><span className="field-title">Empresas permitidas *</span><div className="check-list">{clients.map((item) => <label key={item.id}><input type="checkbox" checked={(value.clientIds || []).includes(item.id)} onChange={(e) => toggleClient(item.id, e.target.checked)} />{item.name}</label>)}</div><small>{isMultiCompany ? "Supervisor e fiscal podem acessar e avaliar em várias empresas." : "Selecione a abrangência deste usuário."}</small></div>}
        {scoped && !isClient && value.clientIds?.length > 0 && <div className="full"><span className="field-title">Limitar a postos específicos (opcional)</span><div className="check-list">{filteredPosts.map((item) => <label key={item.id}><input type="checkbox" checked={(value.postIds || []).includes(item.id)} onChange={(e) => setValue({ ...value, postIds: e.target.checked ? [...(value.postIds || []), item.id] : (value.postIds || []).filter((id: string) => id !== item.id) })} />{clients.find((client) => client.id === item.clientId)?.name} / {item.name}</label>)}</div></div>}
        {role?.globalScope && <div className="full notice">Este perfil possui acesso global a todas as empresas.</div>}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="form-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn" disabled={busy}>{busy ? "Salvando…" : "Salvar usuário"}</button></div>
    </form>
  </Modal>;
}
