import { useState } from 'react';
import { ChevronRight, Send, SkipForward, XCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { toEvaluate } from '../../data/mock';

interface Ratings { [key: number]: number }

const CRITERIA = [
  {
    id: 1,
    num: 1,
    name: 'Competência Técnica',
    desc: 'Execução correta do Procedimento Operacional Padrão (POP), de suas atividades e funções.',
    weight: 1.0,
  },
  {
    id: 2,
    num: 2,
    name: 'Postura no Posto',
    desc: 'Atenção durante o serviço, postura alerta (não dormir ou cochilar) e apresentação pessoal, incluindo uso correto e conservação do uniforme, EPIs e asseio pessoal.',
    weight: 1.0,
  },
  {
    id: 3,
    num: 3,
    name: 'Comunicação',
    desc: 'Cordialidade e educação no atendimento, bom relacionamento com colegas e realização adequada da passagem de serviço, comunicando todas as ocorrências relevantes do plantão.',
    weight: 1.0,
  },
];

const LABELS = ['', 'Insatisfatório', 'Ruim', 'Regular', 'Bom', 'Excelente'];

export default function Avaliar() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratings, setRatings] = useState<Ratings>({});
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [compliment, setCompliment] = useState('');
  const [done, setDone] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const employee = toEvaluate[currentIdx];
  const total = toEvaluate.length;
  const evaluated = done.length;

  const handleSubmit = () => {
    setDone(prev => [...prev, employee.id]);
    setRatings({});
    setComments({});
    setCompliment('');
    setConfirmed(true);
    setTimeout(() => {
      setConfirmed(false);
      if (currentIdx + 1 < total) setCurrentIdx(i => i + 1);
    }, 800);
  };

  const allRated = CRITERIA.every(c => ratings[c.id]);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
        <span>Avaliações</span>
        <ChevronRight size={14} />
        <span className="text-slate-700 font-semibold">Avaliar</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliação de Colaborador</h1>
          <p className="text-slate-400 text-sm mt-1">Avalie os critérios abaixo e clique em "Enviar avaliação" para continuar.</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-right shadow-sm">
          <div className="text-xs font-semibold text-blue-600">Temporada 2025/1</div>
          <div className="text-xs text-slate-400">1º Bimestre (Jan/2025 – Fev/2025)</div>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Main form */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Employee card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-start gap-5">
              <Avatar name={employee?.name ?? ''} size="xl" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">{employee?.name}</h2>
                <p className="text-slate-400 font-medium text-sm mb-3">{employee?.role}</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  {[
                    ['Cliente', employee?.client],
                    ['Posto', employee?.post],
                    ['Matrícula', employee?.registration],
                    ['Supervisor', employee?.supervisor],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{k}:</span>
                      <span className="text-slate-700 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-center min-w-[140px]">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <span className="text-2xl font-black text-blue-600">{evaluated + 1} de {total}</span>
                </div>
                <div className="text-xs text-slate-500">colaboradores avaliados</div>
                <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((evaluated) / total) * 100}%` }} />
                </div>
                <div className="text-xs text-blue-500 mt-1 font-semibold">{Math.round((evaluated / total) * 100)}% concluído</div>
              </div>
            </div>
          </div>

          {/* Criteria */}
          {confirmed ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl">✓</div>
              <div className="font-bold text-emerald-700 text-lg">Avaliação registrada!</div>
              <div className="text-emerald-600 text-sm">Carregando próximo colaborador...</div>
            </div>
          ) : (
            <>
              {CRITERIA.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {c.num}
                      </span>
                      <h3 className="font-bold text-slate-800">{c.name}</h3>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Peso: {c.weight.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4 ml-10">{c.desc}</p>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setRatings(r => ({ ...r, [c.id]: v }))}
                        className={`rating-btn ${ratings[c.id] === v ? (v >= 5 ? 'selected-5' : v >= 4 ? 'selected-4' : 'selected') : ''}`}
                      >
                        <span className="text-base font-black">{v}</span>
                        <span className="text-[10px] font-medium">{LABELS[v]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea
                      placeholder="Comentário (opcional)"
                      value={comments[c.id] ?? ''}
                      onChange={e => setComments(cm => ({ ...cm, [c.id]: e.target.value }))}
                      rows={2}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-slate-600 placeholder:text-slate-300"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] text-slate-300">{(comments[c.id] ?? '').length}/500</span>
                  </div>
                </div>
              ))}

              {/* Elogio */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-400 text-xl">★</span>
                  <h3 className="font-bold text-slate-800">Elogio (opcional)</h3>
                </div>
                <p className="text-sm text-slate-400 mb-3">Se deseja registrar um elogio para este colaborador, escreva abaixo. Este elogio pode gerar pontuação adicional.</p>
                <div className="relative">
                  <textarea
                    placeholder="Digite o elogio aqui..."
                    value={compliment}
                    onChange={e => setCompliment(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 text-slate-600 placeholder:text-slate-300"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-300">{compliment.length}/500</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Next collaborators */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">Próximos colaboradores</h3>
            <div className="space-y-2">
              {toEvaluate.map((emp, i) => (
                <div
                  key={emp.id}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                    i === currentIdx ? 'bg-blue-50 border border-blue-100' :
                    done.includes(emp.id) ? 'opacity-40' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => !done.includes(emp.id) && setCurrentIdx(i)}
                >
                  <div className="relative">
                    <Avatar name={emp.name} size="sm" />
                    {done.includes(emp.id) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px]">✓</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">{emp.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{emp.role}</div>
                    <div className="text-[10px] text-slate-400 truncate">{emp.post}</div>
                  </div>
                  <span className="text-slate-400 font-bold text-sm">{i + 1}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-blue-600 font-semibold w-full text-center">
              Ver todos os colaboradores ({total})
            </button>
          </div>

          {/* Cycle info */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">Informações do ciclo</h3>
            <div className="space-y-2 text-xs">
              {[
                ['Temporada', '2025/1'],
                ['Ciclo', '1º Bimestre'],
                ['Período de avaliação', '01/01/2025 – 28/02/2025'],
                ['Prazo final', '28/02/2025'],
                ['Avaliações concluídas', `${evaluated} de ${total} (${Math.round(evaluated/total*100)}%)`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-medium">{k}</span>
                  <span className="text-slate-700 font-semibold text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(evaluated/total)*100}%` }} />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 text-lg flex-shrink-0">ℹ</span>
              <div className="text-xs text-blue-600">
                <strong>Importante:</strong> Avalie conforme o desempenho real do colaborador durante o período. Suas avaliações contribuem para o desenvolvimento de pessoas e para um ambiente de trabalho cada vez melhor.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      {!confirmed && (
        <div className="flex items-center justify-between mt-6 bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm">
          <button className="flex items-center gap-2 text-sm text-slate-500 font-semibold hover:text-red-500 transition-colors">
            <XCircle size={16} />
            Marcar como não consigo avaliar
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if (currentIdx + 1 < total) setCurrentIdx(i => i + 1); }}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
            >
              Pular este colaborador <SkipForward size={14} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allRated}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-xl px-5 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              Enviar avaliação e ir ao próximo <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
