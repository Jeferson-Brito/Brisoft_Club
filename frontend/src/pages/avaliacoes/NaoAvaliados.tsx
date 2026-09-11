import { AlertTriangle, Users, Building2, Phone } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useData } from '../../app/state';

export default function NaoAvaliados() {
  const { data } = useData();
  const alerts: any[] = (data as any).unevaluatedAlert || [];

  // Agrupar por ciclo para exibição organizada
  const cyclesById = new Map(data.cycles.map((c: any) => [c.id, c]));
  const groupedByCycle = alerts.reduce((acc: Record<string, any[]>, item: any) => {
    const key = item.cycleId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const cycleGroups = Object.entries(groupedByCycle).map(([cycleId, items]) => ({
    cycle: cyclesById.get(cycleId),
    items,
  }));

  return (
    <div className="space-y-4 page-enter">
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-amber-800 text-sm mb-0.5">Ação necessária antes de encerrar a temporada</div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Os colaboradores abaixo não foram avaliados por nenhum cliente ou supervisor/fiscal.
              Entre em contato com os responsáveis para que realizem as avaliações antes do prazo.
              Se o prazo já passou, ao encerrar o ciclo o sistema replicará automaticamente a nota disponível.
              Caso nenhum avalie, o colaborador <strong>não será pontuado</strong> no ranking desta temporada.
            </p>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-emerald-600" />
          </div>
          <h2 className="font-bold text-slate-800 text-base mb-1">Todos os colaboradores foram avaliados!</h2>
          <p className="text-slate-500 text-xs">
            Não há colaboradores elegíveis sem avaliação nos ciclos ativos ou recentemente encerrados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cycleGroups.map(({ cycle, items }) => (
            <div key={cycle?.id} className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
              {/* Cycle header */}
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50/70 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">{cycle?.name || 'Ciclo'}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                    cycle?.status === 'ativo'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {cycle?.status === 'ativo' ? 'Em andamento' : 'Encerrado'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-700">
                  <Users size={13} />
                  <span className="font-bold">{items.length} sem avaliação</span>
                </div>
              </div>

              {/* Mobile Cards (telas menores que md) */}
              <div className="block md:hidden divide-y divide-slate-100 p-3 space-y-3">
                {items.map((item: any) => (
                  <div key={item.participantId} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={item.name || '?'} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate">{item.name || '—'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.post || '—'}</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex-shrink-0">
                        <AlertTriangle size={8} />
                        Sem avaliação
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pl-9">
                      <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                      <span>{item.client || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (telas médias e grandes) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100 text-[11px]">
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Cliente</th>
                      <th className="py-2.5 px-3">Posto</th>
                      <th className="py-2.5 px-3 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item: any) => (
                      <tr key={item.participantId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={item.name || '?'} size="sm" />
                            <span className="font-semibold text-slate-800">{item.name || '—'}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Building2 size={12} className="text-slate-400 flex-shrink-0" />
                            {item.client || '—'}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-500">{item.post || '—'}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <AlertTriangle size={8} />
                            Sem avaliação
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Phone size={12} className="text-slate-400 flex-shrink-0" />
                <span>Entre em contato com os clientes e supervisores responsáveis para solicitar as avaliações.</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
