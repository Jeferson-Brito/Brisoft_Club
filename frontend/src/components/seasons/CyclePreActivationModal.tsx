import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Users, Building2, ShieldAlert,
  CheckCircle2, ExternalLink, X, Play
} from 'lucide-react';
import { type Row } from '../../app/state';

interface Props {
  open: boolean;
  season: Row;
  cycle?: Row;
  data: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function CyclePreActivationModal({
  open,
  season,
  cycle,
  data,
  onClose,
  onConfirm,
}: Props) {
  const [tab, setTab] = useState<'colaboradores' | 'clientes' | 'supervisores' | 'empresas'>('colaboradores');
  const [busy, setBusy] = useState(false);

  // 1. Colaboradores ativos sem alocação ou sem cliente/posto
  const unallocatedEmployees = useMemo(() => {
    return data.employees.filter((emp: Row) => {
      if (emp.status !== 'ativo') return false;
      const activeAlloc = data.allocations.find((a: Row) => a.employeeId === emp.id && !a.end);
      return !activeAlloc || !activeAlloc.clientId || !activeAlloc.postId;
    });
  }, [data.employees, data.allocations]);

  // 2. Usuários perfil Cliente com pendências
  const clientEvaluatorsWithIssues = useMemo(() => {
    return data.users.filter((user: Row) => {
      const role = data.roles.find((r: Row) => r.id === user.roleId);
      const profile = normalize(role?.name || '');
      if (profile !== 'cliente' || user.status !== 'ativo') return false;

      // Sem empresas
      if (!user.clientIds || user.clientIds.length === 0) return true;

      // Nenhuma das empresas tem colaboradores ativos alocados
      const hasEmployees = data.allocations.some((a: Row) =>
        user.clientIds.includes(a.clientId) && !a.end
      );
      return !hasEmployees;
    });
  }, [data.users, data.roles, data.allocations]);

  // 3. Supervisores e Fiscais com pendências
  const supervisorEvaluatorsWithIssues = useMemo(() => {
    return data.users.filter((user: Row) => {
      const role = data.roles.find((r: Row) => r.id === user.roleId);
      if (!role?.permissions?.includes('evaluate') || role.globalScope || user.status !== 'ativo') return false;
      const profile = normalize(role?.name || '');
      if (profile === 'cliente') return false;

      // Sem empresas
      if (!user.clientIds || user.clientIds.length === 0) return true;

      // Sem colaboradores acessíveis
      const hasAccessibleEmployees = data.allocations.some((a: Row) => {
        if (a.end) return false;
        if (!user.clientIds.includes(a.clientId)) return false;
        if (user.postIds && user.postIds.length > 0 && !user.postIds.includes(a.postId)) return false;
        return true;
      });
      return !hasAccessibleEmployees;
    });
  }, [data.users, data.roles, data.allocations]);

  // 4. Empresas clientes ativas sem postos
  const clientsWithoutPosts = useMemo(() => {
    return data.clients.filter((c: Row) => {
      if (c.status !== 'ativo') return false;
      return !c.postIds || c.postIds.length === 0;
    });
  }, [data.clients]);

  const totalIssues =
    unallocatedEmployees.length +
    clientEvaluatorsWithIssues.length +
    supervisorEvaluatorsWithIssues.length +
    clientsWithoutPosts.length;

  if (!open) return null;

  const handleStartAnyway = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header do Modal */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-50 to-white border-b border-amber-200/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Pendências Detectadas antes de Iniciar
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-200">
                  {totalIssues} pendência{totalIssues === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Ao iniciar <strong>{season.name}</strong> {cycle ? `· ${cycle.name}` : ''}, identificamos situações que podem deixar colaboradores ou avaliadores de fora deste ciclo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Abas das Pendências */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs px-4 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('colaboradores')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'colaboradores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} />
            <span>Colaboradores sem Posto</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${unallocatedEmployees.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
              {unallocatedEmployees.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('clientes')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'clientes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Clientes sem Colaboradores</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${clientEvaluatorsWithIssues.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
              {clientEvaluatorsWithIssues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('supervisores')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'supervisores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert size={14} />
            <span>Supervisores sem Posto/Colab.</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${supervisorEvaluatorsWithIssues.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
              {supervisorEvaluatorsWithIssues.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('empresas')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === 'empresas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Empresas sem Postos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${clientsWithoutPosts.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
              {clientsWithoutPosts.length}
            </span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          
          {/* Aba: Colaboradores sem posto */}
          {tab === 'colaboradores' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500 leading-relaxed mb-3">
                Os seguintes colaboradores estão cadastrados como <strong>ativos</strong>, mas não possuem um posto ou empresa definidos. Sem posto, eles <strong>não receberão avaliações</strong> neste ciclo:
              </div>

              {unallocatedEmployees.map((emp: Row) => (
                <div
                  key={emp.id}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{emp.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Matrícula: <span className="font-mono font-semibold">{emp.registration || '—'}</span> · Função: {emp.role || '—'}
                    </div>
                  </div>

                  <Link
                    to={`/colaboradores/${emp.id}/editar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    <span>Alocar Posto</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))}

              {!unallocatedEmployees.length && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                  <span>Todos os colaboradores ativos estão devidamente alocados a postos de trabalho!</span>
                </div>
              )}
            </div>
          )}

          {/* Aba: Clientes sem colaboradores */}
          {tab === 'clientes' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500 leading-relaxed mb-3">
                Os seguintes usuários com perfil <strong>Cliente</strong> não têm nenhuma empresa vinculada ou suas empresas não possuem colaboradores ativos alocados. Ao entrar no sistema, eles verão a lista de avaliação vazia:
              </div>

              {clientEvaluatorsWithIssues.map((user: Row) => {
                const clientNames = user.clientIds?.map((cid: string) => data.clients.find((c: Row) => c.id === cid)?.name).filter(Boolean).join(', ');
                return (
                  <div
                    key={user.id}
                    className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        E-mail: <span className="font-mono">{user.email}</span> · {clientNames ? `Empresas: ${clientNames}` : <span className="text-rose-600 font-bold">Nenhuma empresa vinculada</span>}
                      </div>
                    </div>

                    <Link
                      to={`/usuarios/${user.id}/editar`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                    >
                      <span>Vincular Empresa</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                );
              })}

              {!clientEvaluatorsWithIssues.length && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                  <span>Todos os usuários de clientes estão vinculados a empresas com colaboradores ativos!</span>
                </div>
              )}
            </div>
          )}

          {/* Aba: Supervisores sem postos ou colaboradores */}
          {tab === 'supervisores' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500 leading-relaxed mb-3">
                Os seguintes <strong>Supervisores ou Fiscais</strong> estão sem empresas atribuídas ou os postos selecionados não possuem colaboradores ativos para avaliação:
              </div>

              {supervisorEvaluatorsWithIssues.map((user: Row) => (
                <div
                  key={user.id}
                  className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      E-mail: <span className="font-mono">{user.email}</span> · {user.clientIds?.length ? `${user.clientIds.length} empresa(s), mas sem colaboradores ativos` : <span className="text-rose-600 font-bold">Nenhuma empresa atribuída</span>}
                    </div>
                  </div>

                  <Link
                    to={`/usuarios/${user.id}/editar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    <span>Ajustar Abrangência</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))}

              {!supervisorEvaluatorsWithIssues.length && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                  <span>Todos os supervisores e fiscais estão com abrangência completa e colaboradores vinculados!</span>
                </div>
              )}
            </div>
          )}

          {/* Aba: Empresas sem postos */}
          {tab === 'empresas' && (
            <div className="space-y-2.5">
              <div className="text-xs text-slate-500 leading-relaxed mb-3">
                As empresas abaixo estão ativas, porém <strong>não possuem postos cadastrados ou habilitados</strong>:
              </div>

              {clientsWithoutPosts.map((client: Row) => (
                <div
                  key={client.id}
                  className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{client.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      CNPJ: <span className="font-mono">{client.cnpj || '—'}</span> · Segmento: {client.segment || '—'}
                    </div>
                  </div>

                  <Link
                    to={`/clientes/${client.id}/editar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
                  >
                    <span>Adicionar Postos</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              ))}

              {!clientsWithoutPosts.length && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1.5" />
                  <span>Todas as empresas parceiras possuem postos de serviço configurados!</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Você pode abrir os links acima para corrigir as pendências em nova aba e clicar em Iniciar após concluir.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none"
            >
              Revisar Pendências
            </button>

            <button
              type="button"
              onClick={handleStartAnyway}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-sm transition-all duration-150 cursor-pointer active:scale-95 flex-1 sm:flex-none disabled:opacity-50"
            >
              <Play size={14} className="fill-white" />
              <span>{busy ? 'Iniciando...' : 'Iniciar Mesmo Assim'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
