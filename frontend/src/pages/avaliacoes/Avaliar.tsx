import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, Send, X, User, MapPin, Hash, UserCheck, CheckCircle2, Calendar, Award, Check } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { api } from '../../app/state';
import { usePhotoData } from '../../app/photo-data';
import { Link, useSearchParams } from 'react-router-dom';

interface Ratings { [key: string]: number }

const RATING_COLORS: Record<number, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  1: { bg: 'bg-rose-50/50', border: 'border-rose-200', text: 'text-rose-700', activeBg: 'bg-rose-500', activeBorder: 'border-rose-600', activeText: 'text-white' },
  2: { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-700', activeBg: 'bg-orange-500', activeBorder: 'border-orange-600', activeText: 'text-white' },
  3: { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-700', activeBg: 'bg-amber-500', activeBorder: 'border-amber-600', activeText: 'text-white' },
  4: { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-700', activeBg: 'bg-blue-600', activeBorder: 'border-blue-700', activeText: 'text-white' },
  5: { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-700', activeBg: 'bg-emerald-600', activeBorder: 'border-emerald-700', activeText: 'text-white' },
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
  const criteria = (season?.rules?.criteria || []).map((criterion: any, index: number) => ({
    id: String(criterion.id),
    num: index + 1,
    name: criterion.name,
    desc: criterion.description || criterion.desc,
    weight: Number(criterion.weight || 1),
    requiredComment: Boolean(criterion.requiredComment),
    justifyBelow: Number(criterion.justifyBelow || 0),
  }));
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

  const handleSubmit = async () => {
    if (!employee || busy) return;
    setBusy(true);
    try {
      await api('/evaluations', {
        participantId: employee.participantId,
        status: 'enviada',
        answers: criteria.map((criterion: any) => ({ criterionId: criterion.id, value: ratings[criterion.id], comment: comments[criterion.id] || '' })),
        compliment,
        reason: '',
      });
      setDone(prev => [...prev, employee.id]);
      setRatings({});
      setComments({});
      setCompliment('');
      setConfirmed(true);
      notify('Avaliação registrada com sucesso.');
      await refresh();
      setTimeout(() => setConfirmed(false), 800);
      setCurrentIdx(0);
    } finally {
      setBusy(false);
    }
  };

  const allRated = criteria.every((criterion: any) => {
    const value = ratings[criterion.id];
    const comment = comments[criterion.id]?.trim() || '';
    return value !== undefined && (!(criterion.requiredComment || value < criterion.justifyBelow) || comment.length >= 3);
  });

  const employeeInfo = [
    { icon: <User size={13} className="text-slate-400 flex-shrink-0" />, label: 'Cliente', value: employee?.client },
    { icon: <MapPin size={13} className="text-slate-400 flex-shrink-0" />, label: 'Posto', value: employee?.post },
    { icon: <Hash size={13} className="text-slate-400 flex-shrink-0" />, label: 'Matrícula', value: employee?.registration },
    { icon: <UserCheck size={13} className="text-slate-400 flex-shrink-0" />, label: 'Supervisor', value: employee?.supervisor },
  ];

  if (!season || !cycle) {
    return <div className="page-enter bg-white border border-slate-200 rounded-xl p-8 text-center">
      <Calendar className="mx-auto text-blue-600 mb-3" size={32} />
      <h1 className="text-lg font-bold text-slate-800">Nenhum ciclo de avaliação ativo</h1>
      <p className="text-sm text-slate-500 mt-1">Crie uma temporada e ative um ciclo para iniciar avaliações com os dados reais do sistema.</p>
    </div>;
  }

  if (season.status !== 'ativa' || cycle.status !== 'ativo') {
    return <div className="page-enter bg-white border border-slate-200 rounded-xl p-8 text-center">
      <Calendar className="mx-auto text-blue-600 mb-3" size={32} />
      <h1 className="text-lg font-bold text-slate-800">As avaliações ainda não foram iniciadas</h1>
      <p className="text-sm text-slate-500 mt-1">A temporada e o ciclo estão planejados. Inicie os dois para liberar os colaboradores.</p>
      {data.role.permissions.includes('seasons') && <Link to="/temporadas" className="btn mt-4">Ir para temporadas e iniciar</Link>}
    </div>;
  }

  if (!employee) {
    return <div className="page-enter bg-white border border-slate-200 rounded-xl p-8 text-center">
      <CheckCircle2 className="mx-auto text-emerald-600 mb-3" size={32} />
      <h1 className="text-lg font-bold text-slate-800">Nenhum colaborador disponível para avaliar</h1>
      <p className="text-sm text-slate-500 mt-1">{data.participants.some(item => item.cycleId === cycle.id) ? 'Você já concluiu as avaliações disponíveis ou não possui vínculo com os participantes deste ciclo.' : 'Este ciclo ainda não possui participantes. Confira se os colaboradores têm cliente e posto vinculados durante o período.'}</p>
      {data.role.permissions.includes('employees') && <Link to="/colaboradores" className="btn secondary mt-4">Revisar colaboradores e alocações</Link>}
    </div>;
  }

  return (
    <div className="space-y-4 page-enter mobile-evaluation">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ── Main form column ── */}
        <div className="flex-1 min-w-0 w-full space-y-3.5">
          {/* Employee card */}
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
              {/* Photo / Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Avatar name={employee?.name ?? ''} src={employee?.photo} size="lg" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-800">{employee?.name}</h2>
                <p className="text-slate-500 font-medium text-xs mb-2">{employee?.role}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {employeeInfo.map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-1.5 truncate">
                      {icon}
                      <span className="text-slate-400 text-[11px]">{label}:</span>
                      <span className="text-slate-700 font-medium text-[11px] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress box */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2.5 text-center w-full sm:w-auto min-w-[140px] flex-shrink-0">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <User size={15} className="text-blue-600" />
                  <span className="text-base font-black text-blue-700">{evaluated + 1} de {total}</span>
                </div>
                <div className="text-[11px] text-slate-500 mb-1.5">colaboradores avaliados</div>
                <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <div className="text-[10px] text-blue-600 mt-1 font-bold">
                  {completionPct}% concluído
                </div>
              </div>
            </div>
          </div>

          {/* Criteria */}
          {confirmed ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <CheckCircle2 size={22} />
              </div>
              <div className="font-bold text-emerald-700 text-base">Avaliação registrada!</div>
              <div className="text-emerald-600 text-xs">Carregando próximo colaborador...</div>
            </div>
          ) : (
            <>
              {criteria.map((c: any) => (
                <div key={c.id} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-black flex items-center justify-center flex-shrink-0">
                        {c.num}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md flex-shrink-0">
                      Peso: {c.weight.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 ml-8 leading-relaxed">{c.desc}</p>

                  {/* Rating buttons */}
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2 rating-options mobile-rating-grid">
                    {scale.map((option: any) => {
                      const v = Number(option.value);
                      const isSelected = ratings[c.id] === v;
                      const col = RATING_COLORS[v] || RATING_COLORS[4];
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRatings(r => ({ ...r, [c.id]: v }))}
                          className={`flex flex-col items-center justify-center min-h-[46px] sm:min-h-[42px] py-1.5 px-1 rounded-xl border transition-all cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? `${col.activeBg} ${col.activeBorder} ${col.activeText} shadow-sm font-bold ring-2 ring-blue-300/60`
                              : `${col.bg} ${col.border} ${col.text} hover:brightness-95`
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-white text-slate-700 shadow-2xs'
                          }`}>
                            {v}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-semibold truncate max-w-full text-center leading-tight mt-0.5">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {ratings[c.id] && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-2.5 ml-1">
                      <span className="text-slate-400">Nota selecionada:</span>
                      <span className="font-bold text-blue-600">
                        {scale.find((s: any) => Number(s.value) === ratings[c.id])?.label} ({scale.find((s: any) => Number(s.value) === ratings[c.id])?.points} pts × peso {c.weight})
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <textarea
                      placeholder="Comentário (opcional, ou obrigatório para notas baixas)"
                      value={comments[c.id] ?? ''}
                      onChange={e => setComments(cm => ({ ...cm, [c.id]: e.target.value }))}
                      rows={2}
                      maxLength={500}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-slate-600 placeholder:text-slate-300"
                    />
                    <span className="absolute bottom-2 right-2.5 text-[10px] text-slate-400">{(comments[c.id] ?? '').length}/500</span>
                  </div>
                </div>
              ))}

              {/* Elogio */}
              <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-500 text-lg leading-none">★</span>
                  <h3 className="font-bold text-slate-800 text-sm">Elogio (opcional)</h3>
                </div>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  Se deseja registrar um elogio para este colaborador, escreva abaixo. Este elogio pode gerar pontuação adicional.
                </p>
                <div className="relative">
                  <textarea
                    placeholder="Digite o elogio aqui..."
                    value={compliment}
                    onChange={e => setCompliment(e.target.value)}
                    rows={2}
                    maxLength={500}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-slate-600 placeholder:text-slate-300"
                  />
                  <span className="absolute bottom-2 right-2.5 text-[10px] text-slate-400">{compliment.length}/500</span>
                </div>
              </div>

              {/* ── Action buttons directly after criteria for smooth mobile & desktop flow ── */}
              <div className="mobile-evaluation-actions flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200/80 rounded-xl p-3.5 sm:px-4 shadow-xs gap-3">
                <button
                  onClick={async () => {
                    if (!employee) return;
                    const reason = window.prompt('Informe por que não consegue avaliar:');
                    if (!reason || reason.trim().length < 3) return;
                    await api('/evaluations', { participantId: employee.participantId, status: 'impossivel', answers: [], compliment: '', reason });
                    await refresh();
                    notify('Impossibilidade registrada.');
                    setCurrentIdx(0);
                  }}
                  className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium hover:text-red-600 transition-colors py-2 px-3 rounded-lg hover:bg-red-50/50"
                >
                  <X size={14} />
                  Marcar como não consigo avaliar
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { if (currentIdx + 1 < total) setCurrentIdx(i => i + 1); }}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200/80 rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors w-full sm:w-auto min-h-[42px]"
                  >
                    Pular este colaborador <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!allRated || busy}
                    className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 rounded-xl px-5 py-2.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-98 w-full sm:w-auto min-h-[44px]"
                  >
                    {busy ? 'Enviando…' : 'Enviar avaliação e avançar'} <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel (Colaboradores e Ciclo) ── */}
        <div className="w-full lg:w-[280px] xl:w-[300px] flex-shrink-0 space-y-3.5">
          {/* Next collaborators */}
          <details className="lg:open bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 group" open>
            <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 lg:mb-2.5">
              <span>Próximos colaboradores ({total - evaluated})</span>
              <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform lg:hidden" />
            </summary>
            <div className="space-y-1 max-h-[320px] lg:max-h-[380px] overflow-y-auto pr-1">
              {toEvaluate.map((emp, i) => {
                const isDone = done.includes(emp.id);
                const isCurrent = i === currentIdx;
                return (
                  <div
                    key={emp.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isCurrent ? 'bg-blue-50/80 border border-blue-200/70' :
                      isDone ? 'opacity-60 bg-slate-50/60' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => !isDone && setCurrentIdx(i)}
                  >
                    <span className={`text-xs font-bold w-4 text-center flex-shrink-0 ${isCurrent ? 'text-blue-600' : 'text-slate-400'}`}>
                      {i + 1}
                    </span>

                    <div className="relative flex-shrink-0">
                      <Avatar name={emp.name} src={emp.photo} size="sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{emp.role} · {emp.post}</div>
                    </div>

                    {isDone && (
                      <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 text-center text-[11px] font-semibold text-slate-400">{total} colaboradores na fila</div>
          </details>

          {/* Cycle info */}
          <details className="lg:open bg-white rounded-xl p-3.5 shadow-xs border border-slate-200/80 group">
            <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-700 text-xs uppercase tracking-wider mb-1 lg:mb-2.5">
              <span>Informações do ciclo</span>
              <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform lg:hidden" />
            </summary>
            <div className="space-y-2 text-xs pt-1">
              {[
                 { icon: <Calendar size={13} className="text-slate-400 flex-shrink-0" />, label: 'Temporada', value: season?.name || '—' },
                 { icon: <Award size={13} className="text-slate-400 flex-shrink-0" />, label: 'Ciclo', value: cycle?.name || '—' },
                 { icon: <Calendar size={13} className="text-slate-400 flex-shrink-0" />, label: 'Período', value: cycle ? `${cycle.start} a ${cycle.end}` : '—' },
                 { icon: <Calendar size={13} className="text-slate-400 flex-shrink-0" />, label: 'Prazo final', value: cycle?.deadline || '—' },
                { icon: <CheckCircle2 size={13} className="text-slate-400 flex-shrink-0" />, label: 'Concluídas nesta sessão', value: `${evaluated} de ${total} (${completionPct}%)` },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    {icon}
                    <span>{label}</span>
                  </span>
                  <span className="text-slate-700 font-semibold">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </details>

          {/* Info box */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 font-bold text-xs flex-shrink-0 mt-0.5">ℹ</span>
              <div className="text-[11px] text-blue-700 leading-relaxed">
                <strong>Importante:</strong> Avalie com base no desempenho do colaborador durante o ciclo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
