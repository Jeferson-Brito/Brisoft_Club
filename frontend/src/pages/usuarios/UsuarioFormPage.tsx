import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, UserCheck, Eye, EyeOff,
  Building2, AlertTriangle, Save, Sparkles, Check,
  BookOpen, CheckCircle2, Shield
} from 'lucide-react';
import { useData, api, type Row } from '../../app/state';
import { Avatar } from '../../components/ui/Avatar';
import { FormStepper, type StepItem } from '../../components/ui/FormStepper';

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const USER_STEPS: StepItem[] = [
  { number: 1, label: 'Dados e Login', sublabel: 'Identificação e credenciais' },
  { number: 2, label: 'Perfil de Acesso', sublabel: 'Função e permissões' },
  { number: 3, label: 'Abrangência', sublabel: 'Empresas e postos' },
  { number: 4, label: 'Revisar', sublabel: 'Resumo e confirmação' },
];

export default function UsuarioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data, refresh, notify } = useData();

  const isEditing = Boolean(id);
  const existing = useMemo(() => {
    if (!id) return undefined;
    return data.users.find((u: Row) => u.id === id);
  }, [id, data.users]);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    status: 'ativo',
    password: '',
    clientIds: [] as string[],
    postIds: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name || '',
        email: existing.email || '',
        phone: existing.phone || '',
        roleId: existing.roleId || '',
        status: existing.status || 'ativo',
        password: '',
        clientIds: existing.clientIds || [],
        postIds: existing.postIds || [],
      });
    }
  }, [existing]);

  const selectedRole = data.roles.find((r: Row) => r.id === formData.roleId);
  const profileName = normalize(selectedRole?.name || '');
  const isClientProfile = profileName === 'cliente';
  const isEvaluator = selectedRole?.permissions?.includes('evaluate');
  const isGlobal = selectedRole?.globalScope;

  // Posts filtered by selected clients
  const filteredPosts = useMemo(() => {
    if (!formData.clientIds.length) return [];
    return data.posts.filter((post: Row) =>
      post.clientIds?.some((cid: string) => formData.clientIds.includes(cid))
    );
  }, [data.posts, formData.clientIds]);

  const toggleClient = (clientId: string, checked: boolean) => {
    const updatedClientIds = checked
      ? [...formData.clientIds, clientId]
      : formData.clientIds.filter(id => id !== clientId);

    // Filter out posts that don't belong to remaining clients
    const updatedPostIds = formData.postIds.filter(postId =>
      data.posts.some((p: Row) => p.id === postId && p.clientIds?.some((cid: string) => updatedClientIds.includes(cid)))
    );

    setFormData(prev => ({ ...prev, clientIds: updatedClientIds, postIds: updatedPostIds }));
  };

  const togglePost = (postId: string) => {
    setFormData(prev => {
      const exists = prev.postIds.includes(postId);
      const postIds = exists
        ? prev.postIds.filter(id => id !== postId)
        : [...prev.postIds, postId];
      return { ...prev, postIds };
    });
  };

  // Phone mask
  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // Step Validation
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Informe o nome completo do usuário antes de prosseguir.');
        return;
      }
      if (!formData.email.trim()) {
        setError('Informe o e-mail de acesso do usuário antes de prosseguir.');
        return;
      }
      if (!isEditing && (!formData.password || formData.password.length < 8)) {
        setError('A senha inicial deve conter no mínimo 8 caracteres.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.roleId) {
        setError('Selecione o perfil de acesso do usuário para prosseguir.');
        return;
      }
    } else if (currentStep === 3) {
      if (!isGlobal && isClientProfile && formData.clientIds.length === 0) {
        setError('Selecione a empresa à qual este cliente pertence.');
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
      if (!formData.name.trim()) throw new Error('Informe o nome do usuário.');
      if (!formData.email.trim()) throw new Error('Informe o e-mail de acesso.');
      if (!formData.roleId) throw new Error('Selecione o perfil de acesso do usuário.');
      if (!isEditing && !formData.password) throw new Error('Informe a senha inicial do usuário.');

      const payload = {
        ...(isEditing ? { id } : {}),
        ...formData,
      };

      if (!payload.password) delete (payload as any).password;

      await api('/records/users', payload);
      await refresh();
      notify(`Usuário ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
      navigate('/usuarios');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const hasScopeWarning = !isGlobal && isEvaluator && formData.clientIds.length === 0;

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1";

  return (
    <div className="space-y-3.5 pb-10 max-w-7xl mx-auto page-enter">
      {/* ── Indicador Visual de Etapas (FormStepper) ── */}
      <FormStepper
        steps={USER_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step);
        }}
      />

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid Principal: Formulário por Etapa (Esquerda) vs Manual Contextual (Direita) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Coluna Esquerda: Formulário da Etapa */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ETAPA 1: DADOS E LOGIN */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Dados Pessoais e Credenciais de Acesso</h2>
                  <p className="text-[11px] text-slate-400">Informações de contato e autenticação do novo usuário.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Carlos Mendes"
                    className={inputCls}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    E-mail de Acesso <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@combate.com.br"
                    className={inputCls}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    className={inputCls}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Status da Conta <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={inputCls}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ativo">Ativo (acesso liberado)</option>
                    <option value="inativo">Inativo (bloqueado)</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>
                    {isEditing ? 'Nova Senha (opcional)' : 'Senha Inicial *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!isEditing}
                      minLength={8}
                      placeholder={isEditing ? '••••••••' : 'Mínimo 8 dígitos'}
                      className={`${inputCls} pr-10`}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: PERFIL DE ACESSO */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Definição do Perfil de Acesso</h2>
                  <p className="text-[11px] text-slate-400">Escolha o nível de permissão e função deste usuário no sistema.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>
                    Selecione o Perfil <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.roles
                      .filter((r: Row) => normalize(r.name) !== 'colaborador')
                      .map((role: Row) => {
                        const isSelected = formData.roleId === role.id;
                        const roleNorm = normalize(role.name);
                        return (
                          <div
                            key={role.id}
                            onClick={() => setFormData({
                              ...formData,
                              roleId: role.id,
                              clientIds: [],
                              postIds: [],
                            })}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="font-extrabold text-sm text-slate-900">{role.name}</div>
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {role.globalScope
                                ? 'Acesso administrativo global a cadastros, relatórios e configurações.'
                                : roleNorm === 'cliente'
                                ? 'Avalia colaboradores da sua própria empresa contratante durante os ciclos.'
                                : roleNorm === 'supervisor'
                                ? 'Avaliador operacional responsável pela supervisão e avaliação dos colaboradores.'
                                : 'Acesso operacional com permissões customizadas para este papel.'}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selectedRole && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-3">
                    <Sparkles size={16} className="text-[#f5b300] shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Perfil Selecionado: </span>
                      <span className="text-blue-700 font-extrabold">{selectedRole.name}</span>
                      <span className="text-slate-500 ml-1.5">
                        {isGlobal
                          ? '• Abrangência Global (todas as empresas)'
                          : isEvaluator
                          ? '• Habilitado para Avaliação de Colaboradores'
                          : '• Acesso Operacional Restrito'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 3: ABRANGÊNCIA E POSTOS */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Abrangência e Postos Habilitados</h2>
                  <p className="text-[11px] text-slate-400">Determina quais empresas e postos este usuário pode visualizar ou avaliar.</p>
                </div>
              </div>

              {hasScopeWarning && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-extrabold text-amber-900">Atenção: Nenhuma empresa selecionada para este avaliador</div>
                    <p className="text-[12px] text-amber-800 leading-relaxed">
                      Usuários com perfil de <strong>{selectedRole?.name}</strong> precisam ter ao menos uma empresa cliente vinculada abaixo. Sem isso, ao fazer login o usuário não verá colaboradores para avaliar durante os ciclos ativos.
                    </p>
                  </div>
                </div>
              )}

              {isGlobal ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3.5">
                  <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-950">Acesso Global Irrestrito</div>
                    <p className="text-emerald-800 text-xs leading-relaxed">
                      Este perfil possui acesso administrativo global. Não é necessário vincular empresas ou postos específicos, pois ele pode visualizar e gerenciar todos os colaboradores e registros do sistema.
                    </p>
                  </div>
                </div>
              ) : isClientProfile ? (
                <div className="space-y-3">
                  <label className={labelCls}>
                    Empresa do Cliente Sob Responsabilidade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className={inputCls}
                    value={formData.clientIds[0] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      clientIds: e.target.value ? [e.target.value] : [],
                      postIds: [],
                    })}
                  >
                    <option value="">Selecione a empresa</option>
                    {data.clients.map((c: Row) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Este usuário terá visão restrita aos colaboradores alocados exclusivamente nesta empresa contratante.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Seleção de Empresas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={labelCls}>Empresas Permitidas</span>
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = data.clients.map((c: Row) => c.id);
                          const isAll = formData.clientIds.length === allIds.length;
                          setFormData(prev => ({
                            ...prev,
                            clientIds: isAll ? [] : allIds,
                            postIds: isAll ? [] : prev.postIds,
                          }));
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                      >
                        {formData.clientIds.length === data.clients.length ? 'Desmarcar todas' : 'Selecionar todas'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {data.clients.map((client: Row) => {
                        const checked = formData.clientIds.includes(client.id);
                        return (
                          <label
                            key={client.id}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleClient(client.id, e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="truncate">{client.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Limitação opcional por postos */}
                  {formData.clientIds.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="mb-2">
                        <span className={labelCls}>Limitar a Postos Específicos (Opcional)</span>
                        <p className="text-[11px] text-slate-400">
                          Se nenhum posto for marcado, o usuário terá acesso a <strong>todos os postos</strong> das empresas selecionadas acima.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {filteredPosts.map((post: Row) => {
                          const clientName = data.clients.find((c: Row) => post.clientIds?.includes(c.id))?.name || '';
                          const checked = formData.postIds.includes(post.id);
                          return (
                            <label
                              key={post.id}
                              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePost(post.id)}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-bold">{post.name}</div>
                                {clientName && <div className="text-[10px] text-slate-400 truncate">{clientName}</div>}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  <h2 className="text-sm font-bold text-slate-800">Revisão do Cadastro de Usuário</h2>
                  <p className="text-[11px] text-slate-400">Confira todos os dados e credenciais antes de confirmar o salvamento.</p>
                </div>
              </div>

              {hasScopeWarning && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Avaliador sem empresas associadas: </span>
                      <span>Este usuário não terá colaboradores para avaliar no ciclo até que você defina a abrangência.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
                  >
                    Corrigir Etapa 3
                  </button>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Nome Completo:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{formData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">E-mail de Login:</span>
                  <span className="font-mono text-slate-700">{formData.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Telefone / WhatsApp:</span>
                  <span className="font-mono text-slate-800">{formData.phone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Perfil de Acesso:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[11px]">
                    {selectedRole?.name || 'Não selecionado'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Empresas Vinculadas:</span>
                  <span className="font-bold text-slate-800">
                    {isGlobal ? 'Todas (Acesso Global)' : `${formData.clientIds.length} empresa(s)`}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Postos Restritos:</span>
                  <span className="font-bold text-slate-800">
                    {formData.postIds.length > 0 ? `${formData.postIds.length} específico(s)` : 'Todos das empresas vinculadas'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Status da Conta:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    formData.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {formData.status === 'ativo' ? 'Ativo (Acesso Liberado)' : 'Inativo (Bloqueado)'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Pronto para gravação:</span>
                </div>
                <span className="font-extrabold">Credenciais e abrangência configuradas</span>
              </div>
            </div>
          )}

          {/* Botões de Rodapé para Navegação entre Etapas */}
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
                <span>Avançar para {USER_STEPS[currentStep].label}</span>
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
          
          {/* Ficha Resumida do Usuário */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="h-12 bg-gradient-to-r from-[#071e4d] via-[#153e8a] to-[#2563eb] px-3.5 py-2 flex items-end justify-between relative">
              <div className="text-white/90 text-[9px] uppercase tracking-wider font-extrabold">
                Ficha do Usuário
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${formData.status === 'ativo' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="px-3.5 pt-0 pb-3 space-y-2">
              <div className="flex items-end justify-between -mt-6 mb-1">
                <div className="ring-2 ring-white rounded-full">
                  <Avatar name={formData.name || 'Novo Usuário'} size="md" />
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-xs text-slate-900 leading-tight">
                  {formData.name || 'Nome do Usuário'}
                </h3>
                <p className="text-[11px] font-semibold text-blue-600">
                  {selectedRole?.name || 'Selecione o perfil na Etapa 2'}
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-100 space-y-1 text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 font-medium">E-mail</span>
                  <span className="font-mono text-slate-700 truncate max-w-[170px]">{formData.email || '—'}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400 font-medium">Empresas</span>
                  <span className="font-bold text-slate-800">
                    {isGlobal ? 'Global' : `${formData.clientIds.length} vinculada(s)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Dinâmico Contextual por Etapa */}
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
                <div className="font-bold text-slate-800 text-xs">Identificação e Credenciais</div>
                <p className="text-[11px]">
                  Preencha as informações cadastrais e defina o e-mail e senha de login do novo usuário.
                </p>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1 text-[11px] text-blue-900">
                  <div className="font-bold flex items-center gap-1">
                    <UserCheck size={13} />
                    <span>Autenticação:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[10px]">
                    <li><strong>E-mail:</strong> Chave de login no sistema.</li>
                    <li><strong>Senha:</strong> Mínimo de 8 caracteres.</li>
                    <li><strong>Ativo:</strong> Acesso imediato liberado.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 2 */}
            {currentStep === 2 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Papel no Clube de Talentos</div>
                <p className="text-[11px]">
                  O perfil define as telas e operações permitidas a este usuário.
                </p>
                <div className="space-y-1.5 text-[10px]">
                  <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <strong className="text-slate-800 block">Administrador:</strong>
                    <span className="text-slate-500">Acesso global a cadastros, temporadas e relatórios.</span>
                  </div>
                  <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <strong className="text-slate-800 block">Supervisor:</strong>
                    <span className="text-slate-500">Avaliador operacional das equipes sob sua supervisão.</span>
                  </div>
                  <div className="p-2 rounded-lg border border-slate-100 bg-slate-50">
                    <strong className="text-slate-800 block">Cliente:</strong>
                    <span className="text-slate-500">Representante da contratante que avalia os postos de serviço.</span>
                  </div>
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 3 */}
            {currentStep === 3 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Abrangência e Postos</div>
                <p className="text-[11px]">
                  Define quais empresas e postos este usuário tem autorização para gerenciar ou avaliar.
                </p>
                <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200 text-amber-900 space-y-1 text-[11px]">
                  <strong>Regra de Avaliação:</strong> Avaliadores só recebem colaboradores das empresas e postos vinculados aqui.
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 4 */}
            {currentStep === 4 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Revisão Final</div>
                <p className="text-[11px]">
                  Verifique o resumo das permissões e dados antes de confirmar.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800 text-[10px]">Checklist:</div>
                  <div>✓ Nome e e-mail preenchidos</div>
                  <div>✓ Perfil de acesso selecionado</div>
                  <div>✓ Abrangência e postos conferidos</div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

