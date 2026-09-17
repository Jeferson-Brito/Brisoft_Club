import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, Phone, MapPin,
  Plus, Save, AlertTriangle, Sparkles, ArrowRight,
  BookOpen, CheckCircle2
} from 'lucide-react';
import { useData, api, type Row } from '../../app/state';
import { FormStepper, type StepItem } from '../../components/ui/FormStepper';

const CLIENT_STEPS: StepItem[] = [
  { number: 1, label: 'Empresa', sublabel: 'Identificação e CNPJ' },
  { number: 2, label: 'Contatos', sublabel: 'Gestor e WhatsApp' },
  { number: 3, label: 'Postos', sublabel: 'Locais de Atendimento' },
  { number: 4, label: 'Revisar', sublabel: 'Ficha e Confirmação' },
];

export default function ClienteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data, refresh, notify } = useData();

  const isEditing = Boolean(id);
  const existing = useMemo(() => {
    if (!id) return undefined;
    return data.clients.find((c: Row) => c.id === id);
  }, [id, data.clients]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    segment: '',
    responsible: '',
    email: '',
    phone: '',
    postIds: [] as string[],
    status: 'ativo',
  });

  const [newPostName, setNewPostName] = useState('');
  const [newPostCode, setNewPostCode] = useState('');
  const [newPostAddress, setNewPostAddress] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name || '',
        cnpj: existing.cnpj || '',
        segment: existing.segment || '',
        responsible: existing.responsible || '',
        email: existing.email || '',
        phone: existing.phone || '',
        postIds: existing.postIds || [],
        status: existing.status || 'ativo',
      });
    }
  }, [existing]);

  // CNPJ format mask
  const handleCnpjChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 12) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    } else if (digits.length > 8) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else if (digits.length > 5) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }
    setFormData(prev => ({ ...prev, cnpj: formatted }));
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

  const togglePost = (postId: string) => {
    setFormData(prev => {
      const exists = prev.postIds.includes(postId);
      const postIds = exists
        ? prev.postIds.filter(id => id !== postId)
        : [...prev.postIds, postId];
      return { ...prev, postIds };
    });
  };

  // Quick create post inside the client screen
  const handleQuickCreatePost = async () => {
    if (!newPostName.trim()) {
      setError('Informe o nome do posto.');
      return;
    }
    try {
      setBusy(true);
      const res = await api('/records/posts', {
        name: newPostName.trim(),
        code: newPostCode.trim(),
        address: newPostAddress.trim(),
        status: 'ativo',
      });
      await refresh();
      if (res?.id) {
        setFormData(prev => ({ ...prev, postIds: [...prev.postIds, res.id] }));
      }
      setNewPostName('');
      setNewPostCode('');
      setNewPostAddress('');
      setShowNewPostForm(false);
      notify('Novo posto cadastrado e vinculado.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Step validation
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Informe o nome do cliente / razão social antes de avançar.');
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
      if (!formData.name.trim()) throw new Error('Informe o nome do cliente / razão social.');

      const payload = {
        ...(isEditing ? { id } : {}),
        ...formData,
      };

      await api('/records/clients', payload);
      await refresh();
      notify(`Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
      navigate('/clientes');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1";

  return (
    <div className="space-y-3.5 pb-10 max-w-7xl mx-auto page-enter">
      {/* ── Stepper Visual no Topo ── */}
      <FormStepper
        steps={CLIENT_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid Principal de Duas Colunas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Coluna Esquerda: Formulário da Etapa Atual */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ETAPA 1: IDENTIFICAÇÃO DA EMPRESA */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Identificação da Empresa Cliente</h2>
                  <p className="text-[11px] text-slate-400">Dados corporativos e fiscais da organização parceira.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Nome do Cliente / Razão Social <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Condomínio Residencial Parque das Flores"
                    className={inputCls}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>CNPJ</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    className={inputCls}
                    value={formData.cnpj}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                  />
                </div>

                <div>
                  <label className={labelCls}>Segmento / Ramo de Atuação</label>
                  <input
                    type="text"
                    placeholder="Ex.: Condomínio, Indústria, Shopping, Hospital"
                    className={inputCls}
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Status Operacional</label>
                  <select
                    className={inputCls}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ativo">Ativo (em operação)</option>
                    <option value="implantacao">Em implantação / Fase inicial</option>
                    <option value="inativo">Inativo (encerrado)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: CONTATO E NOTIFICAÇÕES */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Contatos e Canais de Comunicação</h2>
                  <p className="text-[11px] text-slate-400">Responsável pelo contrato e número para avisos automatizados.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Responsável / Síndico / Gestor do Contrato</label>
                  <input
                    type="text"
                    placeholder="Ex.: Mariana Silva (Gerente Predial)"
                    className={inputCls}
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>E-mail de Contato</label>
                  <input
                    type="email"
                    placeholder="contato@cliente.com.br"
                    className={inputCls}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>Telefone / WhatsApp para Notificações</label>
                  <input
                    type="text"
                    inputMode="tel"
                    placeholder="(11) 99999-8888"
                    className={inputCls}
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Usado para avisos automáticos de início e encerramento de ciclos.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: POSTOS DE TRABALHO HABILITADOS */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Postos de Trabalho Habilitados</h2>
                    <p className="text-[11px] text-slate-400">Selecione os postos que pertencem a esta empresa parceira.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{showNewPostForm ? 'Fechar formulário' : 'Novo Posto'}</span>
                </button>
              </div>

              {showNewPostForm && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-blue-900">Cadastrar novo posto para este cliente</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Nome do Posto *</label>
                      <input
                        className={inputCls}
                        placeholder="Ex.: Portaria Social 01"
                        value={newPostName}
                        onChange={(e) => setNewPostName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Código</label>
                      <input
                        className={inputCls}
                        placeholder="Ex.: PST-01"
                        value={newPostCode}
                        onChange={(e) => setNewPostCode(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className={labelCls}>Endereço do Posto</label>
                      <input
                        className={inputCls}
                        placeholder="Ex.: Av. das Nações Unidas, 1200"
                        value={newPostAddress}
                        onChange={(e) => setNewPostAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowNewPostForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickCreatePost}
                      disabled={busy || !newPostName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      Salvar e Selecionar Posto
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {data.posts.map((post: Row) => {
                    const isSelected = formData.postIds.includes(post.id);
                    return (
                      <label
                        key={post.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePost(post.id)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold">{post.name}</div>
                          {post.address && (
                            <div className="text-[11px] text-slate-400 truncate">{post.address}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {!data.posts.length && (
                  <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400">
                    Nenhum posto cadastrado ainda. Use o botão "+ Novo Posto" acima para cadastrar o primeiro posto desta empresa.
                  </div>
                )}
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
                  <h2 className="text-sm font-bold text-slate-800">Revisão do Cadastro do Cliente</h2>
                  <p className="text-[11px] text-slate-400">Confira as informações da empresa antes de salvar.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Nome / Razão Social:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{formData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">CNPJ:</span>
                  <span className="font-mono text-slate-700">{formData.cnpj || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Segmento:</span>
                  <span className="font-bold text-slate-800">{formData.segment || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Gestor Responsável:</span>
                  <span className="font-bold text-slate-800">{formData.responsible || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-medium">Telefone / WhatsApp:</span>
                  <span className="font-mono text-slate-800">{formData.phone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-medium">Postos Vinculados:</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[11px]">
                    {formData.postIds.length} posto{formData.postIds.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Pronto para operação:</span>
                </div>
                <span className="font-extrabold">Habilitado para alocação de colaboradores</span>
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
                <span>Avançar para {CLIENT_STEPS[currentStep].label}</span>
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

        {/* Coluna Direita: MANUAL DINÂMICO CONTEXTUAL FIXO / STICKY */}
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
                <div className="font-bold text-slate-800 text-xs">Identificação da Empresa</div>
                <p className="text-[11px]">
                  Cadastre os dados da contratante. A organização dos dados fiscais facilita relatórios e agrupamentos por nichos.
                </p>
                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1 text-[11px] text-blue-900">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-[#f5b300]" />
                    <span>Segmentação</span>
                  </div>
                  <p>
                    O segmento permite comparar o desempenho de equipes por nichos nos relatórios gerenciais.
                  </p>
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 2 */}
            {currentStep === 2 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Contatos e Notificações</div>
                <p className="text-[11px]">
                  O WhatsApp cadastrado recebe alertas automatizados quando um ciclo abre ou está perto de encerrar.
                </p>
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                  <strong>Engajamento:</strong> Avisos diretos via WhatsApp garantem respostas rápidas nas avaliações.
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 3 */}
            {currentStep === 3 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Postos de Atendimento</div>
                <p className="text-[11px]">
                  Uma empresa cliente pode ter múltiplos postos (ex.: Portaria Social, Recepção, Monitoramento).
                </p>
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100 text-[11px] text-amber-900 space-y-1">
                  <strong>Atenção:</strong> Pelo menos um posto precisa estar vinculado para alocar colaboradores.
                </div>
              </div>
            )}

            {/* MANUAL ETAPA 4 */}
            {currentStep === 4 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Conferência e Finalização</div>
                <p className="text-[11px]">
                  Revise a ficha da empresa. Ao salvar, a parceira estará habilitada a receber colaboradores e avaliadores.
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500">
                  Após salvar, você já pode alocar colaboradores nos postos cadastrados.
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
