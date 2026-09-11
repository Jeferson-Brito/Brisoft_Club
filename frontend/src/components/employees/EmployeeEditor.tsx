import { useMemo, useState, type FormEvent } from 'react';
import { Camera, Plus, UserRound } from 'lucide-react';
import { Modal } from '../../app/ui';
import { Avatar } from '../ui/Avatar';
import type { Row } from '../../app/state';

type EmployeeDraft = {
  id?: string;
  name: string;
  cpf: string;
  registration: string;
  role: string;
  admissionDate: string;
  status: string;
  photo: string;
  clientId: string;
  postId: string;
  supervisorId: string;
  allocationStart: string;
  loginEmail?: string;
};

export function EmployeeEditor({
  initial,
  clients,
  posts,
  users,
  employeeDomain,
  canCreateLocation,
  onClose,
  onSave,
}: {
  initial?: Partial<EmployeeDraft>;
  clients: Row[];
  posts: Row[];
  users: Row[];
  employeeDomain: string;
  canCreateLocation: boolean;
  onClose: () => void;
  onSave: (value: Record<string, unknown>) => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [value, setValue] = useState<EmployeeDraft>({
    name: '', cpf: '', registration: '', role: '', admissionDate: today, status: 'ativo',
    photo: '', clientId: '', postId: '', supervisorId: '', allocationStart: today,
    ...initial,
  });
  const [newLocation, setNewLocation] = useState(false);
  const [location, setLocation] = useState({ clientName: '', segment: '', postName: '', code: '', address: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const availablePosts = useMemo(
    () => posts.filter(post => post.clientIds?.includes(value.clientId) && post.status === 'ativo'),
    [posts, value.clientId],
  );
  const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
  const loginPreview = value.loginEmail || (value.name && employeeDomain
    ? `${value.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '')}${employeeDomain}`
    : '');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!newLocation && (!value.clientId || !value.postId)) throw new Error('Selecione o cliente e o posto do colaborador.');
      await onSave({ ...value, newLocation: newLocation ? location : undefined });
      onClose();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function choosePhoto(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Escolha uma imagem PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A foto deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue(current => ({ ...current, photo: String(reader.result || '') }));
    reader.readAsDataURL(file);
  }

  return <Modal title={value.id ? 'Editar colaborador e alocação' : 'Novo colaborador'} onClose={onClose}>
    <form onSubmit={submit} className="space-y-5">
      <section className="rounded-xl border border-slate-200 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800"><UserRound size={18} className="text-blue-600" />Dados do colaborador</div>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Avatar name={value.name || 'Novo colaborador'} src={value.photo} size="xl" />
          <div className="space-y-2">
            <label className="inline-flex cursor-pointer flex-row items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <Camera size={16} /> Escolher foto
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => choosePhoto(event.target.files?.[0])} />
            </label>
            <div className="text-xs text-slate-500">PNG, JPEG ou WebP, até 2 MB.</div>
            {value.photo && <button type="button" onClick={() => setValue(current => ({ ...current, photo: '' }))} className="text-xs font-semibold text-rose-600">Remover foto</button>}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>Nome completo<input className={field} required value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} /></label>
          <label>CPF<input className={field} required inputMode="numeric" placeholder="000.000.000-00" value={value.cpf} onChange={e => setValue({ ...value, cpf: e.target.value })} /><span className="text-xs text-slate-500">Usado como senha somente no primeiro acesso.</span></label>
          <label>Matrícula<input className={field} required value={value.registration} onChange={e => setValue({ ...value, registration: e.target.value })} /></label>
          <label>Função<input className={field} required placeholder="Ex.: Vigilante" value={value.role} onChange={e => setValue({ ...value, role: e.target.value })} /></label>
          <label>Data de admissão<input className={field} type="date" required value={value.admissionDate} onChange={e => setValue({ ...value, admissionDate: e.target.value })} /></label>
          <label>Status<select className={field} value={value.status} onChange={e => setValue({ ...value, status: e.target.value })}><option value="ativo">Ativo</option><option value="licenca">Licença</option><option value="inativo">Inativo</option></select></label>
        </div>
        <div className={`mt-4 rounded-lg border p-3 text-sm ${employeeDomain ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {employeeDomain ? <><strong>Acesso criado automaticamente:</strong> {loginPreview || 'preencha o nome para visualizar o login'}. O colaborador deverá trocar a senha inicial no primeiro acesso.</> : <><strong>Domínio não configurado.</strong> Cadastre o domínio dos colaboradores em Configurações → Acesso de colaboradores.</>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 p-4">
        <div className="mb-1 text-sm font-bold text-slate-800">Cliente, posto e responsável</div>
        <p className="mb-4 text-xs text-slate-500">A alocação será criada junto com o colaborador. Se mudar depois, o histórico anterior será preservado.</p>
        {!newLocation ? <div className="grid gap-4 md:grid-cols-2">
          <label>Cliente<select className={field} required value={value.clientId} onChange={e => setValue({ ...value, clientId: e.target.value, postId: '' })}><option value="">Selecione o cliente</option>{clients.filter(client => client.status === 'ativo').map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Posto<select className={field} required value={value.postId} disabled={!value.clientId} onChange={e => setValue({ ...value, postId: e.target.value })}><option value="">{value.clientId ? 'Selecione o posto' : 'Escolha o cliente primeiro'}</option>{availablePosts.map(post => <option key={post.id} value={post.id}>{post.name}</option>)}</select></label>
          <label>Avaliador responsável<select className={field} value={value.supervisorId} onChange={e => setValue({ ...value, supervisorId: e.target.value })}><option value="">Sem responsável — todos os avaliadores da empresa</option>{users.filter(user => user.status === 'ativo').map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</select><span className="text-xs text-slate-500">Sem responsável, o primeiro avaliador que concluir bloqueia os demais neste ciclo.</span></label>
          <label>Início da alocação<input className={field} type="date" max={today} required value={value.allocationStart} onChange={e => setValue({ ...value, allocationStart: e.target.value })} /></label>
        </div> : <div className="grid gap-4 md:grid-cols-2">
          <label>Nome do novo cliente<input className={field} required value={location.clientName} onChange={e => setLocation({ ...location, clientName: e.target.value })} /></label>
          <label>Segmento<input className={field} placeholder="Ex.: Condomínio" value={location.segment} onChange={e => setLocation({ ...location, segment: e.target.value })} /></label>
          <label>Nome do primeiro posto<input className={field} required value={location.postName} onChange={e => setLocation({ ...location, postName: e.target.value })} /></label>
          <label>Código do posto<input className={field} value={location.code} onChange={e => setLocation({ ...location, code: e.target.value })} /></label>
          <label className="md:col-span-2">Endereço do posto<input className={field} value={location.address} onChange={e => setLocation({ ...location, address: e.target.value })} /></label>
          <label>Início da alocação<input className={field} type="date" max={today} required value={value.allocationStart} onChange={e => setValue({ ...value, allocationStart: e.target.value })} /></label>
        </div>}
        {canCreateLocation && <button type="button" onClick={() => setNewLocation(current => !current)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"><Plus size={15} />{newLocation ? 'Usar cliente já cadastrado' : 'Cadastrar novo cliente e posto aqui'}</button>}
        {!clients.length && !canCreateLocation && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Peça a um administrador para cadastrar um cliente e um posto antes de continuar.</p>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="btn secondary" onClick={onClose}>Cancelar</button><button className="btn" disabled={busy || !employeeDomain}>{busy ? 'Salvando…' : 'Salvar colaborador e criar acesso'}</button></div>
    </form>
  </Modal>;
}
