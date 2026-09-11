import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, ChevronDown, Send, User, MapPin,
  UserCheck, CheckCircle2, Calendar, Star, FileText,
  Building2, RotateCcw, Save, X, Pencil, Check
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../app/state';
import { usePhotoData } from '../../app/photo-data';
import { Link, useSearchParams } from 'react-router-dom';

interface Ratings { [key: string]: number }

const RATING_COLORS: Record<number, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  1: { bg: 'bg-rose-50/70', border: 'border-rose-200', text: 'text-rose-700', activeBg: 'bg-rose-600', activeBorder: 'border-rose-700', activeText: 'text-white' },
  2: { bg: 'bg-orange-50/70', border: 'border-orange-200', text: 'text-orange-700', activeBg: 'bg-orange-500', activeBorder: 'border-orange-600', activeText: 'text-white' },
  3: { bg: 'bg-amber-50/70', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-500', activeBorder: 'border-amber-600', activeText: 'text-white' },
  4: { bg: 'bg-blue-50/70', border: 'border-blue-200', text: 'text-blue-700', activeBg: 'bg-blue-600', activeBorder: 'border-blue-700', activeText: 'text-white' },
  5: { bg: 'bg-emerald-50/70', border: 'border-emerald-200', text: 'text-emerald-700', activeBg: 'bg-emerald-600', activeBorder: 'border-emerald-700', activeText: 'text-white' },
};

export default function Avaliar() {
  const { toEvaluate, season, cycle, data, refresh, notify } = usePhotoData();
  const [params] = useSearchParams();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratings, setRatings] = useState<Ratings>({});
  const [comments, setComments] = useState<{ [key: string]: string }>({});
  const [compliment, setCompliment] = useState('');
  const [done, setDone] = useState<Array<string | number>>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Wizard state: current criterion index (0 to criteria.length - 1) or 'summary'
  const [currentCriterionIdx, setCurrentCriterionIdx] = useState(0);
  const [step, setStep] = useState<'criterion' | 'summary'>('criterion');
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const draftModalRef = useRef<HTMLDivElement>(null);

  const hasAnyData = useMemo(() => {
    return (
      Object.keys(ratings).length > 0 ||
      Object.values(comments).some(c => Boolean(c?.trim())) ||
      Boolean(compliment?.trim())
    );
  }, [ratings, comments, compliment]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (draftModalRef.current && !draftModalRef.current.contains(e.target as Node)) {
        setDraftModalOpen(false);
      }
    };
    if (draftModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [draftModalOpen]);

  const criteria = useMemo(() => (season?.rules?.criteria || []).map((criterion: any, index: number) => ({
    id: String(criterion.id),
    num: index + 1,
    name: criterion.name,
    desc: criterion.description || criterion.desc,
    weight: Number(criterion.weight || 1),
    requiredComment: Boolean(criterion.requiredComment),
    justifyBelow: Number(criterion.justifyBelow || 0),
  })), [season?.rules?.criteria]);

  const scale = season?.rules?.scale || [];

  useEffect(() => {
    const requested = params.get('participant');
    const index = toEvaluate.findIndex(item => item.id === requested);
    if (index >= 0) setCurrentIdx(index);
  }, [params, toEvaluate]);

  const employee = toEvaluate[currentIdx];
  const total = toEvaluate.length;
  const evaluated = done.length;
  const completionPct = total ? Math.round(evaluated / total * 100) : 0;

  // Key for local storage draft persistence per user and collaborator
  const draftStorageKey = employee && data?.user?.id
    ? `clube_eval_draft_v2_${data.user.id}_${employee.participantId}`
    : null;

  // 1. Carregar rascunho salvo ao inicializar ou mudar de colaborador
  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      const raw = localStorage.getItem(draftStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setRatings(parsed.ratings || {});
        setComments(parsed.comments || {});
        setCompliment(parsed.compliment || '');
        if (typeof parsed.currentCriterionIdx === 'number' && parsed.currentCriterionIdx < criteria.length) {
          setCurrentCriterionIdx(parsed.currentCriterionIdx);
        } else {
          setCurrentCriterionIdx(0);
        }
        setStep(parsed.step === 'summary' ? 'summary' : 'criterion');
        setHasSavedDraft(true);
        return;
      }
    } catch {
      // Ignorar erros de parse
    }

    // Se não há rascunho local, verificar se o colaborador já possui avaliação gravada no banco (ex: avaliação reaberta)
    const existing = data?.evaluations?.find(
      (item: any) => item.participantId === employee?.participantId && item.evaluatorId === data.user?.id
    );
    if (existing && existing.answers && existing.answers.length > 0) {
      const initialRatings: Ratings = {};
      const initialComments: { [key: string]: string } = {};
      existing.answers.forEach((ans: any) => {
        if (ans.criterionId) {
          initialRatings[String(ans.criterionId)] = Number(ans.score ?? ans.value ?? 0);
          if (ans.comment) initialComments[String(ans.criterionId)] = ans.comment;
        }
      });
      setRatings(initialRatings);
      setComments(initialComments);
      setCompliment(existing.compliment || '');
      setCurrentCriterionIdx(0);
      setStep('criterion');
      setHasSavedDraft(true);
      return;
    }

    // Se não há rascunho nem avaliação prévia, reiniciar para estado limpo
    setRatings({});
    setComments({});
    setCompliment('');
    setCurrentCriterionIdx(0);
    setStep('criterion');
    setHasSavedDraft(false);
  }, [draftStorageKey, criteria.length, employee?.participantId, data?.evaluations, data?.user?.id]);

  // 2. Salvar rascunho automaticamente a cada mudança
  useEffect(() => {
    if (!draftStorageKey || !employee) return;
    const hasInput = Object.keys(ratings).length > 0 || Object.keys(comments).length > 0 || Boolean(compliment);
    if (hasInput) {
      localStorage.setItem(draftStorageKey, JSON.stringify({
        ratings,
        comments,
        compliment,
        currentCriterionIdx,
        step,
        updatedAt: new Date().toISOString(),
      }));
      setHasSavedDraft(true);
    }
  }, [ratings, comments, compliment, currentCriterionIdx, step, draftStorageKey, employee]);

  const handleClearDraft = () => {
    if (!draftStorageKey) return;
    if (window.confirm('Deseja descartar as notas e respostas preenchidas deste colaborador?')) {
      localStorage.removeItem(draftStorageKey);
      setRatings({});
      setComments({});
      setCompliment('');
      setCurrentCriterionIdx(0);
      setStep('criterion');
      setHasSavedDraft(false);
      notify('Rascunho descartado.');
    }
  };

  const currentCriterion = criteria[currentCriterionIdx] || criteria[0];
  const currentVal = currentCriterion ? ratings[currentCriterion.id] : undefined;
  const currentComment = currentCriterion ? (comments[currentCriterion.id]?.trim() || '') : '';
  const isCommentRequiredForCurrent = currentCriterion && (
    currentCriterion.requiredComment ||
    (currentVal !== undefined && currentVal < currentCriterion.justifyBelow)
  );
  const canAdvanceCurrentCriterion = currentVal !== undefined && (!isCommentRequiredForCurrent || currentComment.length >= 3);

  const allRated = criteria.length > 0 && criteria.every((criterion: any) => {
    const value = ratings[criterion.id];
    const comment = comments[criterion.id]?.trim() || '';
    return value !== undefined && (!(criterion.requiredComment || value < criterion.justifyBelow) || comment.length >= 3);
  });

  const totalScoreCalculated = criteria.reduce((acc: number, c: any) => {
    const val = ratings[c.id];
    if (!val) return acc;
    const opt = scale.find((s: any) => Number(s.value) === val);
    return acc + (Number(opt?.points || 0) * c.weight);
  }, 0).toFixed(1);

  const handleSubmit = async () => {
    if (!employee || busy) return;
    if (!allRated) {
      notify('Por favor, atribua nota a todos os critérios antes de enviar.');
      setStep('criterion');
      return;
    }
    setBusy(true);
    try {
      await api('/evaluations', {
        participantId: employee.participantId,
        status: 'enviada',
        answers: criteria.map((criterion: any) => ({
          criterionId: criterion.id,
          value: ratings[criterion.id],
          comment: comments[criterion.id] || '',
        })),
        compliment,
        reason: '',
      });

      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }

      setDone(prev => [...prev, employee.id]);
      setRatings({});
      setComments({});
      setCompliment('');
      setCurrentCriterionIdx(0);
      setStep('criterion');
      setHasSavedDraft(false);
      setConfirmed(true);
      notify('Avaliação registrada com sucesso.');
      await refresh();
      setTimeout(() => setConfirmed(false), 1200);
      setCurrentIdx(0);
    } finally {
      setBusy(false);
    }
  };

  if (!season || !cycle) {
    return (
      <div className="page-enter bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs max-w-lg mx-auto my-8">
        <Calendar className="mx-auto text-blue-600 mb-3" size={36} />
        <h1 className="text-lg font-bold text-slate-800">Nenhum ciclo de avaliação ativo</h1>
        <p className="text-sm text-slate-500 mt-1">Crie uma temporada e ative um ciclo para iniciar avaliações com os dados reais do sistema.</p>
      </div>
    );
  }

  if (season.status !== 'ativa' || cycle.status !== 'ativo') {
    return (
      <div className="page-enter bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs max-w-lg mx-auto my-8">
        <Calendar className="mx-auto text-blue-600 mb-3" size={36} />
        <h1 className="text-lg font-bold text-slate-800">As avaliações ainda não foram iniciadas</h1>
        <p className="text-sm text-slate-500 mt-1">A temporada e o ciclo estão planejados. Inicie os dois para liberar os colaboradores.</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-enter bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs max-w-lg mx-auto my-8">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-lg font-bold text-slate-800">Todas as avaliações foram concluídas!</h1>
        <p className="text-sm text-slate-500 mt-1">Você não possui novos colaboradores pendentes para avaliar neste ciclo.</p>
        <div className="flex items-center justify-center gap-3 mt-5">
          <Link to="/avaliacoes/concluidas" className="btn secondary text-xs">Ver avaliações enviadas</Link>
          <Link to="/ranking/geral" className="btn primary text-xs">Acessar Ranking</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 page-enter mobile-evaluation pb-8">
      {/* ── Fixed / Sticky Employee Header Card ── */}
      <div
        className="sticky z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/90 transition-all"
        style={{ position: 'sticky', top: 'var(--topbar-h, 58px)' }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Avatar + Colaborador Info */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setPhotoModalOpen(true)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-md ring-2 ring-blue-500/20 hover:ring-blue-500/60 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="Clique para ampliar a foto do colaborador"
              >
                <Avatar name={employee?.name ?? ''} src={employee?.photo} size="lg" />
              </button>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full pointer-events-none" title="Ativo no ciclo" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-extrabold text-slate-800 leading-tight truncate">
                  {employee?.name}
                </h2>
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  {employee?.role || 'Colaborador'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-1 font-medium">
                <div className="flex items-center gap-1 truncate" title={`Cliente: ${employee?.client}`}>
                  <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{employee?.client}</span>
                </div>
                <div className="flex items-center gap-1 truncate" title={`Posto: ${employee?.post}`}>
                  <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{employee?.post}</span>
                </div>
                {employee?.supervisor && employee?.supervisor !== '—' && (
                  <div className="hidden sm:flex items-center gap-1 truncate" title={`Supervisor: ${employee?.supervisor}`}>
                    <UserCheck size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{employee?.supervisor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Progress box + Auto-save indicator */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex-shrink-0">
            {hasSavedDraft && hasAnyData && (
              <div className="relative" ref={draftModalRef}>
                <button
                  type="button"
                  onClick={() => setDraftModalOpen(prev => !prev)}
                  className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-center text-emerald-600 transition-colors shadow-2xs cursor-pointer"
                  aria-label="Status do rascunho"
                  title="Rascunho salvo (clique para ver detalhes)"
                >
                  <Save size={13} />
                </button>

                {draftModalOpen && (
                  <div
                    className="absolute right-0 top-full mt-1.5 z-40 bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xl w-60 text-left animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <Save size={13} className="text-emerald-600 flex-shrink-0" />
                        <span>Rascunho salvo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDraftModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                        aria-label="Fechar"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Suas respostas estão salvas automaticamente neste aparelho.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleClearDraft();
                        setDraftModalOpen(false);
                      }}
                      className="mt-2.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer pt-1.5 border-t border-slate-100 w-full"
                    >
                      <RotateCcw size={11} />
                      <span>Limpar rascunho</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-center min-w-[105px] sm:min-w-[130px] shadow-2xs ml-auto sm:ml-0">
              <div className="text-[11px] sm:text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
                <User size={12} className="text-blue-600" />
                <span>{evaluated + 1} de {total}</span>
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium">avaliados</div>
              <div className="w-full bg-slate-200 h-1 sm:h-1.5 rounded-full mt-0.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ── Main form column ── */}
        <div className="flex-1 min-w-0 w-full space-y-3.5">
          {confirmed ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                <CheckCircle2 size={26} />
              </div>
              <div className="font-extrabold text-emerald-800 text-lg">Avaliação registrada com sucesso!</div>
              <div className="text-emerald-600 text-xs">Carregando próximo colaborador da lista...</div>
            </div>
          ) : step === 'criterion' ? (
            /* ─────────────────────────────────────────────────────────────
               STEP 1: ONE CRITERION AT A TIME (WIZARD)
            ───────────────────────────────────────────────────────────── */
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
              {/* Stepper Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black shadow-2xs">
                    {currentCriterionIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Critério {currentCriterionIdx + 1} de {criteria.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSavedDraft && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-[11px] text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Descartar rascunho deste colaborador"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Stepper Dots/Bar */}
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${criteria.length}, minmax(0, 1fr))` }}>
                {criteria.map((c: any, i: number) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      // Permite navegar para critérios anteriores ou se o critério já foi respondido
                      if (i <= currentCriterionIdx || ratings[currentCriterion.id] !== undefined) {
                        setCurrentCriterionIdx(i);
                      }
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === currentCriterionIdx
                        ? 'bg-blue-600 ring-2 ring-blue-300'
                        : ratings[c.id] !== undefined
                        ? 'bg-emerald-500 hover:opacity-80'
                        : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Critério ${i + 1}: ${c.name} ${ratings[c.id] ? `(Nota: ${ratings[c.id]})` : ''}`}
                  />
                ))}
              </div>

              {/* Criterion Title & Description */}
              <div className="pt-1">
                <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                  {currentCriterion.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/50">
                  {currentCriterion.desc}
                </p>
              </div>

              {/* Rating Scale Buttons (1 to 5) */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-700">
                  Selecione a nota para este critério:
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                  {scale.map((option: any) => {
                    const v = Number(option.value);
                    const isSelected = ratings[currentCriterion.id] === v;
                    const col = RATING_COLORS[v] || RATING_COLORS[4];
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setRatings(prev => {
                            if (prev[currentCriterion.id] === v) {
                              const next = { ...prev };
                              delete next[currentCriterion.id];
                              return next;
                            }
                            return { ...prev, [currentCriterion.id]: v };
                          });
                        }}
                        className={`relative flex flex-col items-center justify-center min-h-[62px] sm:min-h-[58px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? `${col.activeBg} ${col.activeBorder} ${col.activeText} shadow-md font-bold ring-4 ring-blue-300/60 scale-[1.02]`
                            : `${col.bg} ${col.border} ${col.text} hover:brightness-95`
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-white rounded-full flex items-center justify-center shadow-xs text-emerald-600 animate-in zoom-in-50 duration-150">
                            <Check size={11} className="stroke-[3.5]" />
                          </span>
                        )}
                        <span className={`text-sm sm:text-base font-black mb-0.5 leading-none ${
                          isSelected ? 'text-white' : 'text-slate-800'
                        }`}>
                          {v}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-center leading-tight truncate max-w-full">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Criterion Specific Comment */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Comentário sobre este critério {isCommentRequiredForCurrent ? <span className="text-rose-600 font-bold">(Obrigatório para nota baixa)</span> : <span className="text-slate-400 font-normal">(opcional)</span>}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {(comments[currentCriterion.id] ?? '').length}/500
                  </span>
                </div>
                <textarea
                  placeholder={isCommentRequiredForCurrent ? "Descreva o motivo desta pontuação para este critério..." : "Escreva observações ou detalhes sobre este critério (opcional)..."}
                  value={comments[currentCriterion.id] ?? ''}
                  onChange={e => setComments(prev => ({ ...prev, [currentCriterion.id]: e.target.value }))}
                  rows={2}
                  maxLength={500}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-slate-700 placeholder:text-slate-300"
                />
              </div>

              {/* Navigation Buttons (Voltar / Próximo) */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {currentCriterionIdx > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentCriterionIdx(i => i - 1)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>Voltar</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!canAdvanceCurrentCriterion) return;
                    if (currentCriterionIdx < criteria.length - 1) {
                      setCurrentCriterionIdx(i => i + 1);
                    } else {
                      setStep('summary');
                    }
                  }}
                  disabled={!canAdvanceCurrentCriterion}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer ml-auto min-h-[42px]"
                >
                  <span>
                    {currentCriterionIdx < criteria.length - 1 ? 'Próximo critério' : 'Ver resumo da avaliação'}
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               STEP 2: SUMMARY VIEW (RESUMO ANTES DE ENVIAR)
            ───────────────────────────────────────────────────────────── */
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
              {/* Summary Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} />
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-base">
                      Resumo da Avaliação
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Revise as notas e comentários atribuídos antes de concluir o envio.
                  </p>
                </div>

                <div className="text-right bg-blue-50/80 border border-blue-200/70 rounded-xl px-3.5 py-1.5 flex-shrink-0 shadow-2xs">
                  <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Pontos Calculados</div>
                  <div className="text-base font-black text-blue-800">{totalScoreCalculated} pts</div>
                </div>
              </div>

              {/* Criteria Summary Items */}
              <div className="space-y-2.5">
                {criteria.map((c: any, i: number) => {
                  const val = ratings[c.id];
                  const opt = scale.find((s: any) => Number(s.value) === val);
                  const col = RATING_COLORS[val] || RATING_COLORS[4];
                  const comment = comments[c.id];

                  return (
                    <div
                      key={c.id}
                      className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all hover:border-slate-300"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-500 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-2xs flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate">{c.name}</span>
                        </div>
                        {comment ? (
                          <p className="text-[11px] text-slate-600 mt-1 italic pl-7 line-clamp-2">
                            "{comment}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-0.5 pl-7">Sem comentário adicional</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${col.bg} ${col.border} ${col.text}`}>
                          {val ? `${val} - ${opt?.label || ''}` : 'Não avaliado'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentCriterionIdx(i);
                            setStep('criterion');
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        >
                          Ajustar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compliment / Elogio Box */}
              <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <h4 className="text-xs font-bold text-amber-950">Elogio Especial (Opcional)</h4>
                </div>
                <p className="text-[11px] text-amber-900/80">
                  Deseja registrar um elogio em destaque para este colaborador?
                </p>
                <textarea
                  placeholder="Escreva um elogio ou reconhecimento especial aqui..."
                  value={compliment}
                  onChange={e => setCompliment(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full text-xs border border-amber-200 bg-white rounded-xl p-2.5 resize-none outline-none focus:ring-2 focus:ring-amber-300 text-slate-700 placeholder:text-slate-300"
                />
              </div>

              {/* Summary Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentCriterionIdx(criteria.length - 1);
                    setStep('criterion');
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer w-full sm:w-auto"
                >
                  <ChevronLeft size={16} />
                  <span>Voltar aos critérios</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer w-full sm:w-auto min-h-[44px]"
                >
                  {busy ? 'Enviando avaliação…' : 'Confirmar e Enviar Avaliação'}
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Colaboradores já avaliados (Permite Reavaliar) ── */}
        {data?.evaluations && cycle?.id && (
          (() => {
            const completedInCycle = data.evaluations
              .filter((e: any) => e.cycleId === cycle.id && e.evaluatorId === data.user?.id && e.status === 'enviada')
              .map((e: any) => ({
                id: e.id,
                participantId: e.participantId,
                employee: e.snapshot?.name || '—',
                photo: e.snapshot?.photo || '',
                role: e.snapshot?.role || '—',
                score: e.score || 0,
              }));
            if (!completedInCycle.length) return null;
            return (
              <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0">
                <details className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 group" open>
                  <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 lg:mb-2.5">
                    <span>Já avaliados ({completedInCycle.length})</span>
                    <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="space-y-1.5 pt-1 max-h-[360px] overflow-y-auto pr-1">
                    {completedInCycle.map((ev: any) => (
                      <div key={ev.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={ev.employee} src={ev.photo} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{ev.employee}</div>
                            <div className="text-[10px] text-slate-400 truncate">{ev.role} · {ev.score} pts</div>
                          </div>
                        </div>
                        {(() => {
                          const activeSeason = data.seasons?.find((s: any) => s.status === 'ativa');
                          const allowReevaluate =
                            data.role.permissions.includes('evaluations') ||
                            (activeSeason?.rules?.allowReevaluate !== false &&
                              data.settings?.rules?.allowReevaluate !== false);
                          if (!allowReevaluate) {
                            return (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                                Concluída
                              </span>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = window.confirm(`Deseja reabrir a avaliação de ${ev.employee} para alterar nota, comentários ou elogio?`);
                                if (!confirmed) return;
                                try {
                                  await api(`/evaluations/${ev.id}/reopen`, { reason: 'Reavaliação solicitada pelo usuário' });
                                  await refresh();
                                  notify('Avaliação reaberta com sucesso! Carregando dados...');
                                } catch (err: any) {
                                  notify(err?.message || 'Erro ao reabrir avaliação.');
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                              title="Reabrir e alterar nota desta avaliação"
                            >
                              <Pencil size={11} />
                              <span>Reavaliar</span>
                            </button>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            );
          })()
        )}
      </div>

      {/* ── Modal de visualização ampliada da foto do colaborador ── */}
      {photoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPhotoModalOpen(false)}
        >
          <div
            className="relative bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200/90 max-w-xs sm:max-w-sm w-full text-center space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPhotoModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar ampliação"
            >
              <X size={18} />
            </button>

            <div className="w-48 h-48 sm:w-60 sm:h-60 mx-auto rounded-2xl overflow-hidden bg-slate-900 shadow-md ring-4 ring-blue-100 flex items-center justify-center">
              {employee?.photo ? (
                <img
                  src={employee.photo}
                  alt={employee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-blue-600 to-indigo-700">
                  <span className="text-5xl font-black">{employee?.name?.charAt(0)}</span>
                  <span className="text-xs text-blue-200 mt-2">Sem foto cadastrada</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
                {employee?.name}
              </h3>
              <p className="text-xs text-blue-600 font-bold mt-0.5">
                {employee?.role || 'Colaborador'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {employee?.client} · {employee?.post}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Matrícula: {employee?.registration}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
