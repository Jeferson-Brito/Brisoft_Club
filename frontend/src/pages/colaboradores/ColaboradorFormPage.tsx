import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Camera, UserRound, Building2, ShieldCheck,
  Sparkles, AlertTriangle, Plus, Info, Save, ArrowRight,
  BookOpen, CheckCircle2
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useData, api, type Row } from '../../app/state';
import { FormStepper, type StepItem } from '../../components/ui/FormStepper';

const EMPLOYEE_STEPS: StepItem[] = [
  { number: 1, label: 'Dados Pessoais', sublabel: 'Identificação e Cargo' },
  { number: 2, label: 'Alocação', sublabel: 'Empresa e Posto' },
  { number: 3, label: 'Acesso', sublabel: 'Login e Credenciais' },
  { number: 4, label: 'Revisar', sublabel: 'Crachá e Confirmação' },
];

export default function ColaboradorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data, refresh, notify } = useData();

  const isEditing = Boolean(id);
  const existing = useMemo(() => {
    if (!id) return undefined;
    return data.employees.find((e: Row) => e.id === id);
  }, [id, data.employees]);

  const currentAllocation = useMemo(() => {
    if (!id) return undefined;
    return data.allocations.find((a: Row) => a.employeeId === id && !a.end);
  }, [id, data.allocations]);

  const [currentStep, setCurrentStep] = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const employeeDomain = data.employeeAccessDomain || '';

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    registration: '',
    role: '',
    admissionDate: today,
    status: 'ativo',
    photo: '',
    clientId: '',
    postId: '',
    supervisorId: '',
    allocationStart: today,
  });

  const [newLocation, setNewLocation] = useState(false);
  const [location, setLocation] = useState({ clientName: '', segment: '', postName: '', code: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Populate data when editing
  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name || '',
        cpf: existing.cpf || '',
        registration: existing.registration || '',
        role: existing.role || '',
        admissionDate: existing.admissionDate || today,
        status: existing.status || 'ativo',
        photo: existing.photo || '',
        clientId: currentAllocation?.clientId || '',
        postId: currentAllocation?.postId || '',
        supervisorId: currentAllocation?.supervisorId || '',
        allocationStart: currentAllocation?.start || today,
      });
    }
  }, [existing, currentAllocation, today]);

  // Posts filtered by selected client
  const availablePosts = useMemo(() => {
    if (!formData.clientId) return [];
    return data.posts.filter((post: Row) =>
      post.clientIds?.includes(formData.clientId) && post.status === 'ativo'
    );
  }, [data.posts, formData.clientId]);

  // Evaluator users
  const evaluators = useMemo(() => {
    return data.users.filter((user: Row) =>
      data.roles.find((role: Row) => role.id === user.roleId)?.permissions?.includes('evaluate') &&
      user.status === 'ativo'
    );
  }, [data.users, data.roles]);

  // Live preview login computation
  const normalizedLoginName = useMemo(() => {
    if (!formData.name) return '';
    return formData.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '');
  }, [formData.name]);

  const loginEmailPreview = useMemo(() => {
    if (!normalizedLoginName) return '';
    const domain = employeeDomain ? employeeDomain : '@clube.combatetalentos.com.br';
    return `${normalizedLoginName}${domain.startsWith('@') ? domain : `@${domain}`}`;
  }, [normalizedLoginName, employeeDomain]);

  // File upload for photo
  const handlePhotoSelect = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Escolha uma imagem nos formatos PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('A foto deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, photo: String(reader.result || '') }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // CPF format helper
  const handleCpfChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 9) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length > 6) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  // Step validation
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Informe o nome completo do colaborador.');
        return;
      }
      if (!formData.cpf.trim() || formData.cpf.replace(/\D/g, '').length !== 11) {
        setError('Informe um CPF válido com 11 dígitos.');
        return;
      }
      if (!formData.registration.trim()) {
        setError('Informe a matrícula funcional do colaborador.');
        return;
      }
      if (!formData.role.trim()) {
        setError('Informe o cargo ou função do colaborador.');
        return;
      }
    } else if (currentStep === 2) {
      if (!newLocation && (!formData.clientId || !formData.postId)) {
        setError('Selecione a empresa e o posto de trabalho do colaborador.');
        return;
      }
      if (newLocation && (!location.clientName.trim() || !location.postName.trim())) {
        setError('Preencha o nome do cliente e do posto a serem cadastrados.');
        return;
      }
    }
    setCurrentStep(prev => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (!newLocation && (!formData.clientId || !formData.postId)) {
        throw new Error('Selecione a empresa/cliente e o posto de trabalho do colaborador.');
      }

      const payload = {
        ...(isEditing ? { id } : {}),
        ...formData,
        newLocation: newLocation ? location : undefined,
      };

      const saved = await api('/employees/save', payload);
      await refresh();
      notify(`Colaborador ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso! Login: ${saved.loginEmail || loginEmailPreview}`);
      navigate('/colaboradores');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const selectedClientName = data.clients.find((c: Row) => c.id === formData.clientId)?.name || (newLocation ? location.clientName : 'Não definido');
  const selectedPostName = data.posts.find((p: Row) => p.id === formData.postId)?.name || (newLocation ? location.postName : 'Não definido');
  const selectedSupervisorName = evaluators.find((u: Row) => u.id === formData.supervisorId)?.name || 'Todos os avaliadores';

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1";

  return (
    <div className="space-y-3.5 pb-10 max-w-7xl mx-auto page-enter">
      {/* ── Stepper Visual no Topo ── */}
      <FormStepper
        steps={EMPLOYEE_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid Principal: Formulário + Manual Dinâmico Lateral ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Coluna Esquerda: Conteúdo da Etapa Atual */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ETAPA 1: DADOS PESSOAIS E PROFISSIONAIS */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserRound size={16} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-800">Dados Pessoais e Profissionais</h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Informações de identificação funcional e cadastral.</p>
                </div>
              </div>

              {/* Foto e Upload */}
              <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                <Avatar name={formData.name || 'Novo Colaborador'} src={formData.photo} size="lg" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer shadow-2xs">
                      <Camera size={13} className="text-blue-600" />
                      <span>{formData.photo ? 'Alterar foto' : 'Enviar foto'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                      />
                    </label>
                    {formData.photo && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Formatos suportados: PNG, JPG ou WebP até 2 MB.
                  </p>
                </div>
              </div>

              {/* Campos de Dados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Carlos Eduardo da Silva"
                    className={inputCls}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    CPF <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    className={inputCls}
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Utilizado como senha temporária no 1º acesso.
                  </span>
                </div>

                <div>
                  <label className={labelCls}>
                    Matrícula Funcional <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: 10428"
                    className={inputCls}
                    value={formData.registration}
                    onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Função / Cargo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Vigilante Patrimonial"
                    className={inputCls}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Data de Admissão <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Status Funcional <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={inputCls}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ativo">Ativo (em operação)</option>
                    <option value="licenca">Licença / Afastado temporariamente</option>
                    <option value="inativo">Inativo / Desligado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: ALOCAÇÃO E POSTO */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Alocação e Posto de Trabalho</h2>
                  <p className="text-[11px] text-slate-400">Define em qual cliente e posto o colaborador atua.</p>
                </div>
              </div>

              {!newLocation ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>
                      Empresa / Cliente <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className={inputCls}
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value, postId: '' })}
                    >
                      <option value="">Selecione a empresa</option>
                      {data.clients
                        .filter((c: Row) => c.status === 'ativo')
                        .map((c: Row) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Posto de Trabalho <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      disabled={!formData.clientId}
                      className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}
                      value={formData.postId}
                      onChange={(e) => setFormData({ ...formData, postId: e.target.value })}
                    >
                      <option value="">
                        {formData.clientId ? 'Selecione o posto' : 'Escolha a empresa primeiro'}
                      </option>
                      {availablePosts.map((p: Row) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Supervisor / Fiscal Responsável
                    </label>
                    <select
                      className={inputCls}
                      value={formData.supervisorId}
                      onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                    >
                      <option value="">Sem responsável direto (todos os avaliadores)</option>
                      {evaluators.map((u: Row) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Responsável primário por avaliar este colaborador.
                    </span>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Início da Alocação <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      max={today}
                      required
                      className={inputCls}
                      value={formData.allocationStart}
                      onChange={(e) => setFormData({ ...formData, allocationStart: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div>
                    <label className={labelCls}>Nome do Novo Cliente *</label>
                    <input
                      required
                      className={inputCls}
                      placeholder="Ex.: Condomínio Residencial Parque"
                      value={location.clientName}
                      onChange={(e) => setLocation({ ...location, clientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Segmento</label>
                    <input
                      className={inputCls}
                      placeholder="Ex.: Condomínio, Indústria"
                      value={location.segment}
                      onChange={(e) => setLocation({ ...location, segment: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nome do Posto *</label>
                    <input
                      required
                      className={inputCls}
                      placeholder="Ex.: Portaria Principal"
                      value={location.postName}
                      onChange={(e) => setLocation({ ...location, postName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Código do Posto</label>
                    <input
                      className={inputCls}
                      placeholder="Ex.: PST-01"
                      value={location.code}
                      onChange={(e) => setLocation({ ...location, code: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {data.role.permissions.includes('clients') && (
                <button
                  type="button"
                  onClick={() => setNewLocation(!newLocation)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{newLocation ? 'Voltar e selecionar cliente existente' : 'Cadastrar novo cliente e posto rapidamente aqui'}</span>
                </button>
              )}
            </div>
          )}

          {/* ETAPA 3: ACESSO AO SISTEMA E CREDENCIAIS */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Acesso ao Clube de Talentos</h2>
                  <p className="text-[11px] text-slate-400">Credencial institucional gerada automaticamente.</p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${employeeDomain ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'} space-y-3`}>
                <div className="flex items-start gap-3">
                  <Info size={18} className={`shrink-0 mt-0.5 ${employeeDomain ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">
                      {loginEmailPreview ? (
                        <>E-mail institucional de login: <span className="underline font-mono">{loginEmailPreview}</span></>
                      ) : (
                        'Preencha o nome completo na Etapa 1 para visualizar o login.'
                      )}
                    </p>
                    <p className="text-[11px] opacity-80">
                      O colaborador utilizará este login e seu <strong>CPF (apenas números)</strong> como senha inicial. No primeiro acesso, o sistema exigirá a troca para uma senha pessoal definitiva.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-800">O que o colaborador poderá fazer no portal?</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>Visualizar sua pontuação e histórico de notas recebidas em cada ciclo;</li>
                  <li>Acompanhar sua posição no Ranking Geral e medalhas do programa;</li>
                  <li>Consultar ocorrências ou elogios registrados em seu prontuário.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ETAPA 4: REVISAR E SALVAR */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Revisão do Cadastro do Colaborador</h2>
                  <p className="text-[11px] text-slate-400">Confira a ficha completa antes de salvar.</p>
                </div>
              </div>

              {/* Ficha Consolidada */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Nome Completo:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{formData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">CPF:</span>
                  <span className="font-mono text-slate-700">{formData.cpf}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Matrícula:</span>
                  <span className="font-bold text-slate-800">{formData.registration}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Cargo / Função:</span>
                  <span className="font-bold text-blue-600">{formData.role}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Empresa:</span>
                  <span className="font-bold text-slate-800">{selectedClientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Posto:</span>
                  <span className="font-bold text-slate-800">{selectedPostName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Supervisor:</span>
                  <span className="font-bold text-slate-800">{selectedSupervisorName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Login de Acesso:</span>
                  <span className="font-mono text-blue-600 font-bold">{loginEmailPreview}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Pronto para participação ativa:</span>
                </div>
                <span className="font-extrabold">Elegível nas temporadas vigentes</span>
              </div>
            </div>
          )}

          {/* Botões de Rodapé para Navegação */}
          <div className="flex items-center justify-between pt-1">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft size={13} />
                <span>Voltar</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <span>Avançar para {EMPLOYEE_STEPS[currentStep].label}</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#071e4d] hover:bg-[#0c2e75] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Save size={14} className="text-[#f5b300]" />
                <span>{busy ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Confirmar e Salvar'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Coluna Direita: Manual Dinâmico Contextual Fixo / Sticky */}
        <div className="lg:col-span-4 sticky top-[102px] self-start space-y-3 max-h-[calc(100vh-115px)] overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <BookOpen size={15} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">Manual da Etapa {currentStep}</h3>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Guia Rápido
              </span>
            </div>

            {/* MANUAL ETAPA 1 */}
            {currentStep === 1 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Dados Pessoais e Foto</div>
                <p className="text-[11px]">
                  O cadastro individual compõe a identidade do colaborador no Clube de Talentos. A foto enviada aparecerá no pódio, ranking e cards de avaliação.
                </p>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1 text-[11px] text-blue-900">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-[#f5b300]" />
                    <span>CPF e Segurança</span>
                  </div>
                  <p>
                    O CPF garante a unicidade do colaborador e funciona como senha de segurança inicial.
                  </p>
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 2 */}
            {currentStep === 2 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Alocação e Posto</div>
                <p className="text-[11px]">
                  A alocação determina em qual empresa e posto o colaborador trabalha para que clientes e supervisores consigam avaliá-lo nos ciclos ativos.
                </p>
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 text-[11px] text-amber-900 space-y-1">
                  <strong>Histórico Preservado:</strong> Se transferido no futuro, as avaliações passadas permanecem intactas no histórico.
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 3 */}
            {currentStep === 3 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Acesso do Colaborador</div>
                <p className="text-[11px]">
                  O colaborador recebe login formatado para acessar a plataforma e consultar suas notas, crachá e ranking.
                </p>
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                  <strong>Troca Obrigatória:</strong> No primeiro login, o sistema solicita uma nova senha pessoal de acesso.
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 4 */}
            {currentStep === 4 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Conferência e Salvamento</div>
                <p className="text-[11px]">
                  Revise os dados antes de gravar. Após salvar, o colaborador estará habilitado para participar dos ciclos da temporada.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500">
                  Caso precise atualizar algo depois, use o botão "Editar" na listagem de colaboradores.
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
