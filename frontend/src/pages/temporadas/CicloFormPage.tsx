import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Clock, Calendar, Save, AlertTriangle, Sparkles
} from 'lucide-react';
import { useData, api, type Row } from '../../app/state';

export default function CicloFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [params] = useSearchParams();
  const seasonParam = params.get('seasonId');
  const { data, refresh, notify } = useData();

  const isEditing = Boolean(id);
  const existingCycle = useMemo(() => {
    if (!id) return undefined;
    return data.cycles.find((c: Row) => c.id === id);
  }, [id, data.cycles]);

  const [formData, setFormData] = useState({
    name: '',
    seasonId: seasonParam || '',
    start: '',
    end: '',
    deadline: '',
    clientStart: '',
    clientDeadline: '',
    supervisorStart: '',
    supervisorDeadline: '',
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingCycle) {
      setFormData({
        name: existingCycle.name || '',
        seasonId: existingCycle.seasonId || seasonParam || '',
        start: existingCycle.start || '',
        end: existingCycle.end || '',
        deadline: existingCycle.deadline || '',
        clientStart: existingCycle.clientStart || '',
        clientDeadline: existingCycle.clientDeadline || '',
        supervisorStart: existingCycle.supervisorStart || '',
        supervisorDeadline: existingCycle.supervisorDeadline || '',
      });
    } else if (seasonParam) {
      setFormData(prev => ({ ...prev, seasonId: seasonParam }));
    }
  }, [existingCycle, seasonParam]);

  const selectedSeason = data.seasons.find((s: Row) => s.id === formData.seasonId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (!formData.name.trim()) throw new Error('Informe o nome do ciclo.');
      if (!formData.seasonId) throw new Error('Selecione a temporada à qual este ciclo pertence.');
      if (!formData.start || !formData.end || !formData.deadline) {
        throw new Error('Preencha as datas de início, fim e prazo de avaliação.');
      }
      if (formData.start > formData.end) {
        throw new Error('A data de início do ciclo não pode ser posterior ao fim.');
      }

      const payload = {
        ...(isEditing ? { id } : {}),
        ...formData,
      };

      await api('/records/cycles', payload);
      await refresh();
      notify(`Ciclo de avaliação ${isEditing ? 'atualizado' : 'adicionado'} com sucesso!`);
      navigate('/temporadas');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all";
  const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto page-enter">
      {/* ── Barra Superior com Voltar e Ações ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/temporadas')}
            className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Voltar para a listagem"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              {isEditing ? `Editar Ciclo: ${formData.name || 'Sem nome'}` : 'Novo Ciclo de Avaliação'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure o período avaliativo e prazos para clientes e supervisores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <button
            type="button"
            onClick={() => navigate('/temporadas')}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const form = document.getElementById('cycle-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save size={16} className="text-[#f5b300]" />
            <span>{busy ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Ciclo'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Formulário Principal ── */}
      <form id="cycle-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <div className="lg:col-span-8 space-y-5">
          
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Dados do Ciclo de Avaliação</h2>
                <p className="text-[11px] text-slate-400">Vigência de serviço e prazo final para envio das notas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Temporada Vinculada <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className={inputCls}
                  value={formData.seasonId}
                  onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                >
                  <option value="">Selecione a temporada</option>
                  {data.seasons
                    .filter((s: Row) => ['ativa', 'planejada'].includes(s.status))
                    .map((s: Row) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                    ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Nome do Ciclo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex.: 2º Ciclo 2026"
                  className={inputCls}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Início do Ciclo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Fim do Ciclo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Prazo Geral para Avaliar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Após essa data, o ciclo é bloqueado para novas avaliações.
                </span>
              </div>
            </div>
          </div>

          {/* Prazos Específicos Opcionais */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Prazos Específicos por Perfil (Opcional)</h2>
                <p className="text-[11px] text-slate-400">Permite dar janelas de avaliação diferentes para clientes e supervisores.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Início Avaliação do Cliente</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.clientStart}
                  onChange={(e) => setFormData({ ...formData, clientStart: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Prazo Final do Cliente</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.clientDeadline}
                  onChange={(e) => setFormData({ ...formData, clientDeadline: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Início Avaliação do Supervisor/Fiscal</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.supervisorStart}
                  onChange={(e) => setFormData({ ...formData, supervisorStart: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Prazo Final do Supervisor/Fiscal</label>
                <input
                  type="date"
                  className={inputCls}
                  value={formData.supervisorDeadline}
                  onChange={(e) => setFormData({ ...formData, supervisorDeadline: e.target.value })}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Direita: Resumo */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 sticky top-6">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-3 border-b border-slate-100">
              <Sparkles size={16} className="text-[#f5b300]" />
              <span>Resumo do Ciclo</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Temporada</span>
                <span className="font-bold text-slate-800">{selectedSeason?.name || 'Não selecionada'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Ciclo</span>
                <span className="font-bold text-slate-800">{formData.name || 'A definir'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Vigência</span>
                <span className="text-slate-700">
                  {formData.start && formData.end ? `${formData.start} até ${formData.end}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Prazo Geral</span>
                <span className="font-bold text-blue-600">{formData.deadline || '—'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-500 leading-relaxed">
              Ao salvar o ciclo, ele ficará listado na aba <strong>Temporadas</strong>. Para que as avaliações comecem, basta clicar em "Iniciar ciclo" na listagem.
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
