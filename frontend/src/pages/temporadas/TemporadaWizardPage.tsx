import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Sparkles, AlertTriangle,
  Save, Plus, Trash2, CheckCircle2, Clock, Users,
  Building2, ShieldCheck, ArrowRight, BookOpen, Check
} from 'lucide-react';
import { useData, api, type Row } from '../../app/state';
import { FormStepper, type StepItem } from '../../components/ui/FormStepper';

interface CycleDraft {
  id?: string;
  name: string;
  start: string;
  end: string;
  deadline: string;
  clientStart?: string;
  clientDeadline?: string;
  supervisorStart?: string;
  supervisorDeadline?: string;
}

const WIZARD_STEPS: StepItem[] = [
  { number: 1, label: 'Temporada', sublabel: 'Identificação e Vigência' },
  { number: 2, label: 'Ciclos', sublabel: 'Divisão Avaliativa' },
  { number: 3, label: 'Participantes', sublabel: 'Empresas e Equipes' },
  { number: 4, label: 'Revisar', sublabel: 'Confirmação Final' },
];

export default function TemporadaWizardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { data, refresh, notify } = useData();

  const isEditing = Boolean(id);
  const existingSeason = useMemo(() => {
    if (!id) return undefined;
    return data.seasons.find((s: Row) => s.id === id);
  }, [id, data.seasons]);

  const [currentStep, setCurrentStep] = useState(1);
  const currentYear = new Date().getFullYear();
  const defaultStart = `${currentYear}-01-01`;
  const defaultEnd = `${currentYear}-12-31`;

  const [seasonData, setSeasonData] = useState({
    name: `Temporada ${currentYear}`,
    start: defaultStart,
    end: defaultEnd,
    publishDate: defaultEnd,
  });

  const [preset, setPreset] = useState<'semestral' | 'trimestral' | 'anual' | 'custom'>('semestral');
  const [cycles, setCycles] = useState<CycleDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Helper to split an evaluation window between client and supervisor without overlap
  const splitEvaluationPeriods = (start: string, end: string) => {
    if (!start || !end) {
      return { clientStart: start, clientDeadline: end, supervisorStart: start, supervisorDeadline: end };
    }
    const dStart = new Date(start + 'T12:00:00').getTime();
    const dEnd = new Date(end + 'T12:00:00').getTime();
    const span = Math.max(86400000 * 2, dEnd - dStart);
    // Avaliação costuma ocorrer no final do período do ciclo ou nos últimos 30-45 dias
    const evalDuration = Math.min(span, 30 * 86400000);
    const evalStartMs = dEnd - evalDuration;
    const midMs = evalStartMs + evalDuration / 2;

    const cStart = new Date(evalStartMs).toISOString().slice(0, 10);
    const cEnd = new Date(midMs).toISOString().slice(0, 10);
    const sStart = new Date(midMs + 86400000).toISOString().slice(0, 10);
    const sEnd = new Date(dEnd).toISOString().slice(0, 10);

    return {
      clientStart: cStart < start ? start : cStart,
      clientDeadline: cEnd,
      supervisorStart: sStart,
      supervisorDeadline: sEnd,
    };
  };

  const hasOverlap = (c: CycleDraft) => {
    if (!c.clientStart || !c.clientDeadline || !c.supervisorStart || !c.supervisorDeadline) return false;
    return (c.clientStart <= c.supervisorDeadline && c.clientDeadline >= c.supervisorStart);
  };

  // Auto generate cycle preset with non-overlapping client & supervisor periods
  const generateCyclesForPreset = (
    type: 'semestral' | 'trimestral' | 'anual',
    startDate: string,
    endDate: string
  ) => {
    const year = startDate.slice(0, 4) || String(currentYear);
    if (type === 'semestral') {
      return [
        {
          name: `1º Ciclo ${year}`,
          start: `${year}-01-01`,
          end: `${year}-06-30`,
          deadline: `${year}-07-15`,
          clientStart: `${year}-06-01`,
          clientDeadline: `${year}-06-20`,
          supervisorStart: `${year}-06-21`,
          supervisorDeadline: `${year}-07-15`,
        },
        {
          name: `2º Ciclo ${year}`,
          start: `${year}-07-01`,
          end: `${year}-12-31`,
          deadline: `${year}-12-31`,
          clientStart: `${year}-11-20`,
          clientDeadline: `${year}-12-10`,
          supervisorStart: `${year}-12-11`,
          supervisorDeadline: `${year}-12-31`,
        },
      ];
    }
    if (type === 'trimestral') {
      return [
        {
          name: `1º Trimestre ${year}`,
          start: `${year}-01-01`,
          end: `${year}-03-31`,
          deadline: `${year}-04-10`,
          clientStart: `${year}-03-10`,
          clientDeadline: `${year}-03-24`,
          supervisorStart: `${year}-03-25`,
          supervisorDeadline: `${year}-04-10`,
        },
        {
          name: `2º Trimestre ${year}`,
          start: `${year}-04-01`,
          end: `${year}-06-30`,
          deadline: `${year}-07-10`,
          clientStart: `${year}-06-10`,
          clientDeadline: `${year}-06-24`,
          supervisorStart: `${year}-06-25`,
          supervisorDeadline: `${year}-07-10`,
        },
        {
          name: `3º Trimestre ${year}`,
          start: `${year}-07-01`,
          end: `${year}-09-30`,
          deadline: `${year}-10-10`,
          clientStart: `${year}-09-10`,
          clientDeadline: `${year}-09-24`,
          supervisorStart: `${year}-09-25`,
          supervisorDeadline: `${year}-10-10`,
        },
        {
          name: `4º Trimestre ${year}`,
          start: `${year}-10-01`,
          end: `${year}-12-31`,
          deadline: `${year}-12-31`,
          clientStart: `${year}-12-01`,
          clientDeadline: `${year}-12-15`,
          supervisorStart: `${year}-12-16`,
          supervisorDeadline: `${year}-12-31`,
        },
      ];
    }
    return [
      {
        name: `Ciclo Único ${year}`,
        start: startDate,
        end: endDate,
        deadline: endDate,
        clientStart: `${year}-11-01`,
        clientDeadline: `${year}-11-30`,
        supervisorStart: `${year}-12-01`,
        supervisorDeadline: `${year}-12-31`,
      },
    ];
  };

  // Initial load
  useEffect(() => {
    if (existingSeason) {
      setSeasonData({
        name: existingSeason.name || '',
        start: existingSeason.start || defaultStart,
        end: existingSeason.end || defaultEnd,
        publishDate: existingSeason.publishDate || defaultEnd,
      });
      const existingCycles = data.cycles
        .filter((c: Row) => c.seasonId === existingSeason.id)
        .sort((a: Row, b: Row) => a.start.localeCompare(b.start));
      if (existingCycles.length) {
        setCycles(existingCycles.map((c: Row) => ({
          id: c.id,
          name: c.name,
          start: c.start,
          end: c.end,
          deadline: c.deadline,
          clientStart: c.clientStart,
          clientDeadline: c.clientDeadline,
          supervisorStart: c.supervisorStart,
          supervisorDeadline: c.supervisorDeadline,
        })));
        setPreset('custom');
      } else {
        setCycles(generateCyclesForPreset('semestral', existingSeason.start, existingSeason.end));
      }
    } else {
      setCycles(generateCyclesForPreset('semestral', defaultStart, defaultEnd));
    }
  }, [existingSeason]);

  const handlePresetChange = (newPreset: 'semestral' | 'trimestral' | 'anual' | 'custom') => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      setCycles(generateCyclesForPreset(newPreset, seasonData.start, seasonData.end));
    }
  };

  const updateCycle = (index: number, field: keyof CycleDraft, val: string) => {
    setCycles(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const autoSplitCycle = (index: number) => {
    setCycles(prev => {
      const copy = [...prev];
      const target = copy[index];
      const split = splitEvaluationPeriods(target.start, target.end || target.deadline);
      copy[index] = {
        ...target,
        ...split,
      };
      return copy;
    });
    setError('');
  };

  const addCycle = () => {
    const nextNum = cycles.length + 1;
    const split = splitEvaluationPeriods(seasonData.start, seasonData.end);
    setCycles(prev => [
      ...prev,
      {
        name: `${nextNum}º Ciclo`,
        start: seasonData.start,
        end: seasonData.end,
        deadline: seasonData.end,
        ...split,
      },
    ]);
  };

  const removeCycle = (index: number) => {
    if (cycles.length <= 1) {
      setError('A temporada precisa de ao menos um ciclo de avaliação.');
      return;
    }
    setCycles(prev => prev.filter((_, i) => i !== index));
  };

  // Participant stats computation
  const activeClients = useMemo(() => data.clients.filter((c: Row) => c.status === 'ativo'), [data.clients]);
  const activePosts = useMemo(() => data.posts.filter((p: Row) => p.status === 'ativo'), [data.posts]);
  const evaluators = useMemo(() => data.users.filter((u: Row) =>
    data.roles.find((r: Row) => r.id === u.roleId)?.permissions?.includes('evaluate') && u.status === 'ativo'
  ), [data.users, data.roles]);
  const activeEmployees = useMemo(() => data.employees.filter((e: Row) => e.status === 'ativo'), [data.employees]);
  const allocatedEmployees = useMemo(() => {
    return activeEmployees.filter((emp: Row) => {
      const alloc = data.allocations.find((a: Row) => a.employeeId === emp.id && !a.end);
      return alloc && alloc.clientId && alloc.postId;
    });
  }, [activeEmployees, data.allocations]);

  // Validation before proceeding to next step
  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (!seasonData.name.trim()) {
        setError('Informe o nome da temporada antes de prosseguir.');
        return;
      }
      if (!seasonData.start || !seasonData.end) {
        setError('Informe o período completo da temporada.');
        return;
      }
      if (seasonData.start > seasonData.end) {
        setError('A data de início não pode ser posterior ao fim.');
        return;
      }
    } else if (currentStep === 2) {
      if (!cycles.length) {
        setError('Adicione pelo menos um ciclo de avaliação.');
        return;
      }
      for (let i = 0; i < cycles.length; i++) {
        const c = cycles[i];
        if (!c.name.trim() || !c.start || !c.end || !c.deadline) {
          setError(`Preencha o nome e todas as datas do ${i + 1}º ciclo.`);
          return;
        }
        if (c.start > c.end) {
          setError(`O ciclo "${c.name}" tem data inicial após a data final.`);
          return;
        }
        if (!c.clientStart || !c.clientDeadline || !c.supervisorStart || !c.supervisorDeadline) {
          setError(`Informe os períodos de avaliação do Cliente e do Supervisor do ciclo "${c.name}".`);
          return;
        }
        if (c.clientStart > c.clientDeadline) {
          setError(`No ciclo "${c.name}", o início da avaliação do cliente é posterior ao prazo limite.`);
          return;
        }
        if (c.supervisorStart > c.supervisorDeadline) {
          setError(`No ciclo "${c.name}", o início da avaliação do supervisor é posterior ao prazo limite.`);
          return;
        }
        if (hasOverlap(c)) {
          setError(`No ciclo "${c.name}", o período de avaliação do Cliente se sobrepõe ao do Supervisor. Por regra do sistema, no período em que o cliente avalia o supervisor não pode avaliar e vice-versa.`);
          return;
        }
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
      const seasonPayload = {
        ...(isEditing ? { id } : {}),
        ...seasonData,
      };
      const savedSeason = await api('/records/seasons', seasonPayload);
      const targetSeasonId = isEditing ? id! : (savedSeason?.id || savedSeason?.record?.id);

      if (!isEditing && targetSeasonId) {
        for (const cycle of cycles) {
          await api('/records/cycles', {
            name: cycle.name,
            seasonId: targetSeasonId,
            start: cycle.start,
            end: cycle.end,
            deadline: cycle.deadline,
            clientStart: cycle.clientStart,
            clientDeadline: cycle.clientDeadline,
            supervisorStart: cycle.supervisorStart,
            supervisorDeadline: cycle.supervisorDeadline,
          });
        }
      }

      await refresh();
      notify(`Temporada e ciclos ${isEditing ? 'atualizados' : 'criados'} com sucesso!`);
      navigate('/temporadas');
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
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Grid Principal: Conteúdo da Etapa + Manual Dinâmico Lateral ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Coluna Esquerda: Formulário da Etapa Atual */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ETAPA 1: DADOS DA TEMPORADA */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Trophy size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Identificação e Período da Temporada</h2>
                  <p className="text-[11px] text-slate-400">Defina o nome de identificação anual e o intervalo de vigência.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Nome da Temporada <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Temporada 2026"
                    className={inputCls}
                    value={seasonData.name}
                    onChange={(e) => setSeasonData({ ...seasonData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Data de Início da Temporada <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={seasonData.start}
                    onChange={(e) => setSeasonData({ ...seasonData, start: e.target.value })}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Data de Encerramento da Temporada <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={seasonData.end}
                    onChange={(e) => setSeasonData({ ...seasonData, end: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>
                    Data de Divulgação Oficial do Resultado
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={seasonData.publishDate}
                    onChange={(e) => setSeasonData({ ...seasonData, publishDate: e.target.value })}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Data formal de divulgação dos vencedores do pódio.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: CONFIGURAÇÃO DOS CICLOS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Divisão dos Ciclos Avaliativos</h2>
                    <p className="text-[11px] text-slate-400">Escolha o modelo de ciclos ou personalize as datas.</p>
                  </div>
                </div>

                {!isEditing && (
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => handlePresetChange('semestral')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        preset === 'semestral' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semestral (2)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('trimestral')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        preset === 'trimestral' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Trimestral (4)
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetChange('anual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        preset === 'anual' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Anual (1)
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {cycles.map((cycle, index) => {
                  const overlap = hasOverlap(cycle);

                  return (
                    <div
                      key={index}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 ${
                        overlap
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            required
                            className="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5"
                            value={cycle.name}
                            onChange={(e) => updateCycle(index, 'name', e.target.value)}
                          />
                        </div>

                        {!isEditing && cycles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCycle(index)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title="Remover ciclo"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Vigência Geral do Ciclo */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Início do Ciclo *</label>
                          <input
                            type="date"
                            required
                            className={inputCls}
                            value={cycle.start}
                            onChange={(e) => updateCycle(index, 'start', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Fim do Ciclo *</label>
                          <input
                            type="date"
                            required
                            className={inputCls}
                            value={cycle.end}
                            onChange={(e) => updateCycle(index, 'end', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Prazo Geral Limite *</label>
                          <input
                            type="date"
                            required
                            className={inputCls}
                            value={cycle.deadline}
                            onChange={(e) => updateCycle(index, 'deadline', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Períodos Separados: Cliente vs Supervisor */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Período do Cliente */}
                        <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md">
                              <Building2 size={12} />
                              Período do Cliente
                            </span>
                            <span className="text-[10px] text-blue-600 font-medium">Janela Exclusiva</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Início Avaliação *</label>
                              <input
                                type="date"
                                required
                                className={inputCls}
                                value={cycle.clientStart || ''}
                                onChange={(e) => updateCycle(index, 'clientStart', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Prazo do Cliente *</label>
                              <input
                                type="date"
                                required
                                className={inputCls}
                                value={cycle.clientDeadline || ''}
                                onChange={(e) => updateCycle(index, 'clientDeadline', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Período do Supervisor */}
                        <div className="p-3 rounded-xl border border-purple-100 bg-purple-50/40 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md">
                              <ShieldCheck size={12} />
                              Período do Supervisor / Fiscal
                            </span>
                            <span className="text-[10px] text-purple-600 font-medium">Janela Exclusiva</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Início Avaliação *</label>
                              <input
                                type="date"
                                required
                                className={inputCls}
                                value={cycle.supervisorStart || ''}
                                onChange={(e) => updateCycle(index, 'supervisorStart', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Prazo Supervisor *</label>
                              <input
                                type="date"
                                required
                                className={inputCls}
                                value={cycle.supervisorDeadline || ''}
                                onChange={(e) => updateCycle(index, 'supervisorDeadline', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alerta de Sobreposição */}
                      {overlap && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Atenção:</strong> Os períodos do Cliente e do Supervisor não devem coincidir (no período do cliente o supervisor não pode avaliar e vice-versa).
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => autoSplitCycle(index)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-2xs transition-all"
                          >
                            Separar períodos automaticamente
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={addCycle}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all cursor-pointer w-full justify-center"
                  >
                    <Plus size={15} />
                    <span>Adicionar outro ciclo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 3: UNIVERSO DE PARTICIPANTES PREVISTO */}
          {currentStep === 3 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Universo de Participantes Previsto</h2>
                  <p className="text-[11px] text-slate-400">Verifique a base de colaboradores, clientes e avaliadores que participarão.</p>
                </div>
              </div>

              {/* Cards de Contagem */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                  <Building2 size={20} className="text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-800">{activeClients.length}</div>
                  <div className="text-[11px] text-slate-500">Empresas Parceiras</div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                  <Clock size={20} className="text-emerald-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-800">{activePosts.length}</div>
                  <div className="text-[11px] text-slate-500">Postos Ativos</div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                  <ShieldCheck size={20} className="text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-800">{evaluators.length}</div>
                  <div className="text-[11px] text-slate-500">Avaliadores</div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                  <Users size={20} className="text-amber-600 mx-auto mb-1" />
                  <div className="text-lg font-black text-slate-800">{allocatedEmployees.length}</div>
                  <div className="text-[11px] text-slate-500">Colab. Aptos</div>
                </div>
              </div>

              {/* Alerta de integridade caso haja colaboradores sem posto */}
              {activeEmployees.length > allocatedEmployees.length && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={17} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>{activeEmployees.length - allocatedEmployees.length} colaborador(es) sem alocação ou posto:</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Eles ficarão fora das avaliações até serem alocados a um posto de trabalho. Você poderá alocá-los na aba de Colaboradores a qualquer momento.
                    </p>
                  </div>
                </div>
              )}

              {/* Lista dos primeiros colaboradores aptos */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">Amostra de Colaboradores Vinculados:</div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1 border border-slate-100 rounded-xl bg-slate-50/30">
                  {allocatedEmployees.slice(0, 10).map((emp: Row) => {
                    const alloc = data.allocations.find((a: Row) => a.employeeId === emp.id && !a.end);
                    const clientName = data.clients.find((c: Row) => c.id === alloc?.clientId)?.name || '—';
                    const postName = data.posts.find((p: Row) => p.id === alloc?.postId)?.name || '—';
                    return (
                      <div key={emp.id} className="p-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800">{emp.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">({emp.registration})</span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{clientName} · {postName}</div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                          Apto para avaliar
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: REVISAR E CONFIRMAR */}
          {currentStep === 4 && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Revisão Final da Temporada</h2>
                  <p className="text-[11px] text-slate-400">Confira todos os dados antes de finalizar a criação.</p>
                </div>
              </div>

              {/* Bloco Resumo da Temporada */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Nome da Temporada:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{seasonData.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Período Anual:</span>
                  <span className="font-bold text-slate-800">{seasonData.start} até {seasonData.end}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Data de Divulgação:</span>
                  <span className="font-bold text-blue-600">{seasonData.publishDate}</span>
                </div>
              </div>

              {/* Bloco Resumo dos Ciclos */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2">Cronograma dos Ciclos Configurados:</div>
                <div className="space-y-2">
                  {cycles.map((c, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-blue-100 bg-blue-50/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-blue-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Vigência: {c.start} a {c.end}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Prazo geral</span>
                          <span className="font-bold text-slate-800">{c.deadline}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/50 text-[11px]">
                        <div className="p-1.5 rounded-lg bg-white/80 border border-blue-100">
                          <span className="font-bold text-blue-800 block">🏢 Cliente:</span>
                          <span className="text-slate-600">{c.clientStart || '—'} até {c.clientDeadline || '—'}</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-white/80 border border-purple-100">
                          <span className="font-bold text-purple-800 block">🛡️ Supervisor:</span>
                          <span className="text-slate-600">{c.supervisorStart || '—'} até {c.supervisorDeadline || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total de Participantes */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Base inicial pronta:</span>
                </div>
                <span className="font-extrabold">{allocatedEmployees.length} colaboradores · {activeClients.length} empresas · {evaluators.length} avaliadores</span>
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
                <span>Avançar para {WIZARD_STEPS[currentStep].label}</span>
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
                <span>{busy ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar e Confirmar'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Coluna Direita: Manual Dinâmico (Fixo / Sticky) */}
        <div className="lg:col-span-4 sticky top-[102px] self-start space-y-3 max-h-[calc(100vh-115px)] overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3">
            
            {/* Cabeçalho do Manual */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <BookOpen size={15} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-xs">Manual da Etapa {currentStep}</h3>
              </div>
              <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Guia Rápido
              </span>
            </div>

            {/* CONTEÚDO DO MANUAL: ETAPA 1 */}
            {currentStep === 1 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">O que é a Temporada?</div>
                <p className="text-[11px]">
                  A temporada é o <strong>ciclo anual master</strong> do programa onde todas as avaliações se somam para gerar o Ranking Geral e os troféus.
                </p>

                <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100 space-y-1 text-[11px] text-blue-900">
                  <div className="font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-[#f5b300]" />
                    <span>Preservação de Regras</span>
                  </div>
                  <p>
                    Ao iniciar, regulamento e pesos são congelados para garantir integridade durante todo o ano.
                  </p>
                </div>
              </div>
            )}

            {/* CONTEÚDO DO MANUAL: ETAPA 2 */}
            {currentStep === 2 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Períodos Separados por Perfil</div>
                <p className="text-[11px]">
                  Por regra do sistema, <strong>no período em que o cliente avalia o supervisor não pode avaliar, e vice-versa</strong>.
                </p>

                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/80 space-y-1 text-[11px] text-amber-950">
                  <div className="font-bold flex items-center gap-1">
                    <Clock size={12} className="text-amber-600" />
                    <span>Janelas Exclusivas:</span>
                  </div>
                  <p>
                    Configure datas distintas e não coincidentes para o Cliente e para o Supervisor. Caso haja sobreposição, o assistente alertará imediatamente.
                  </p>
                </div>
              </div>
            )}

            {/* CONTEÚDO DO MANUAL: ETAPA 3 */}
            {currentStep === 3 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Quem participa das avaliações?</div>
                <p className="text-[11px]">
                  O sistema captura todos os colaboradores com <strong>status ativo e alocação válida</strong>.
                </p>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <Check size={13} className="text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Clientes:</strong> Avaliam equipes em seus postos contratados.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check size={13} className="text-blue-500 shrink-0 mt-0.5" />
                    <span><strong>Supervisores:</strong> Avaliam equipes em seus postos sob gestão.</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTEÚDO DO MANUAL: ETAPA 4 */}
            {currentStep === 4 && (
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Pronto para confirmar!</div>
                <p className="text-[11px]">
                  Ao salvar, a temporada será criada com o status de <strong>Planejada</strong>.
                </p>

                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-bold">Quando iniciar as avaliações?</div>
                  <p>
                    Na data prevista do 1º ciclo, acesse <strong>Temporadas</strong> e clique em <em>"Iniciar temporada e ciclo"</em>.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
