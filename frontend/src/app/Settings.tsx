import { useState } from "react";
import { api, useData } from "./state";
import { DataTable, Editor } from "./ui";
import { Manual } from "./Manual";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sliders,
  Mail,
  Trophy,
  AlertTriangle,
  FileText,
  Star,
  Calendar,
  Users,
} from "lucide-react";

export function Settings() {
  const { data, refresh, notify } = useData();
  const [rules, setRules] = useState(() =>
    structuredClone(data.settings!.rules),
  );
  const [tab, setTab] = useState("scale");
  const [penaltyEditor, setPenaltyEditor] = useState<any | null>(null);
  const [employeeDomain, setEmployeeDomain] = useState(data.settings?.employeeEmailDomain || "");
  const [isSaving, setIsSaving] = useState(false);

  const change = (key: string, value: any) =>
    setRules({ ...rules, [key]: value });

  const handleSaveRules = async () => {
    try {
      setIsSaving(true);
      await api("/settings", rules);
      await refresh();
      notify("Regulamento salvo. Temporadas iniciadas permanecem inalteradas.");
    } catch (err: any) {
      notify(err.message || "Erro ao salvar regulamento");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { key: "scale", name: "Escala de notas", icon: Star },
    { key: "criteria", name: "Critérios", icon: FileText },
    { key: "program", name: "Regras e programa", icon: Sliders },
    { key: "penalties", name: "Penalidades", icon: AlertTriangle },
    { key: "access", name: "Acesso de colaboradores", icon: Users || Mail },
    { key: "manual", name: "Manutenção", icon: Calendar },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 font-sans">
      {/* ── Barra de Navegação Fixa (Sticky) Conforme Imagem 1 ── */}
      <div className="sticky top-[65px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#f8fafc]/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
        {/* Segmented Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#071e4d] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#f5b300]" : "text-slate-400"}`} />
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Botão Salvar Regulamento em Azul Marinho com Borda Dourada */}
        {!['penalties', 'access', 'manual'].includes(tab) && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveRules}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] active:bg-[#06183d] text-white border border-[#f5b300] font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4 text-[#f5b300]" />
            {isSaving ? "Salvando..." : "Salvar regulamento"}
          </button>
        )}
      </div>

      {/* TAB 1: Escala de Notas */}
      {tab === "scale" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 m-0">Escala de Notas e Pontuação</h2>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                  Configure os valores de cada nota e os pontos correspondentes que o colaborador receberá.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={rules.scale.length >= 10}
              onClick={() =>
                change("scale", [
                  ...rules.scale,
                  {
                    value: Math.max(...rules.scale.map((s: any) => s.value)) + 1,
                    label: "Nova nota",
                    points: 0,
                  },
                ])
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              Adicionar nota
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#071e4d] text-white font-bold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3 w-32 rounded-l-lg">Nota</th>
                  <th className="px-4 py-3">Descrição / Rótulo</th>
                  <th className="px-4 py-3 w-48 text-center">Pontos Atribuídos</th>
                  <th className="px-4 py-3 w-20 text-center rounded-r-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.scale.map((s: any, i: number) => {
                  const badgeColors = [
                    'bg-rose-100 text-rose-700 border-rose-200',      // 1: Coral/Rosa
                    'bg-orange-100 text-orange-700 border-orange-200', // 2: Pêssego/Laranja
                    'bg-amber-100 text-amber-800 border-amber-200',   // 3: Amarelo
                    'bg-sky-100 text-sky-700 border-sky-200',         // 4: Azul Claro
                    'bg-emerald-100 text-emerald-800 border-emerald-200', // 5: Verde
                  ];
                  const badgeCls = badgeColors[i % badgeColors.length];

                  return (
                    <tr key={i} className="bg-white hover:bg-slate-50/80 border border-slate-200/80 transition rounded-xl shadow-2xs">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg font-black flex items-center justify-center text-sm border shadow-2xs ${badgeCls}`}>
                            {s.value}
                          </span>
                          <input
                            aria-label={`Nota ${i + 1}`}
                            type="number"
                            min="0"
                            max="100"
                            value={s.value}
                            onChange={(e) =>
                              change(
                                "scale",
                                rules.scale.map((o: any, j: number) =>
                                  j === i
                                    ? { ...o, value: Number(e.target.value) }
                                    : o,
                                ),
                              )
                            }
                            className="w-14 px-2 py-1.5 text-center font-bold text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#071e4d]/20 focus:border-[#071e4d] outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          aria-label={`Descrição da nota ${i + 1}`}
                          value={s.label}
                          placeholder="Ex: Excelente, Bom, Regular..."
                          onChange={(e) =>
                            change(
                              "scale",
                              rules.scale.map((o: any, j: number) =>
                                j === i ? { ...o, label: e.target.value } : o,
                              ),
                            )
                          }
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#071e4d]/20 focus:border-[#071e4d] outline-none font-medium"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative flex items-center max-w-[140px] mx-auto">
                          <input
                            aria-label={`Pontos da nota ${s.value}`}
                            type="number"
                            min="0"
                            max="1000"
                            value={s.points}
                            onChange={(e) =>
                              change(
                                "scale",
                                rules.scale.map((o: any, j: number) =>
                                  j === i
                                    ? { ...o, points: Number(e.target.value) }
                                    : o,
                                ),
                              )
                            }
                            className="w-full pr-10 px-3 py-2 font-bold text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#071e4d]/20 focus:border-[#071e4d] outline-none text-right"
                          />
                          <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
                            pts
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={rules.scale.length <= 2}
                          onClick={() =>
                            change(
                              "scale",
                              rules.scale.filter((_: any, j: number) => j !== i),
                            )
                          }
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 cursor-pointer"
                          title="Remover nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculator Summary Conforme Imagem 1 */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-100" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Resumo Teórico da Avaliação
                </span>
                <div className="text-xs text-slate-600 font-medium">
                  Máximo pelos critérios:{" "}
                  <strong className="text-slate-900 font-bold">
                    {rules.criteria.reduce(
                      (n: number, c: any) =>
                        n +
                        c.weight * Math.max(...rules.scale.map((s: any) => s.points)),
                      0,
                    )}{" "}
                    pontos
                  </strong>
                  {" "}· Com elogio aprovado:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {rules.criteria.reduce(
                      (n: number, c: any) =>
                        n +
                        c.weight * Math.max(...rules.scale.map((s: any) => s.points)),
                      0,
                    ) + (rules.complimentEnabled ? rules.complimentPoints : 0)}{" "}
                    pontos
                  </strong>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-blue-200 text-slate-700 text-xs font-bold shadow-2xs">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>{rules.scale.length} notas configuradas</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Critérios */}
      {tab === "criteria" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 m-0">Critérios de Avaliação</h2>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                  Defina as competências avaliadas pelos clientes e supervisores no formulário de cada ciclo.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  change("criteria", [
                    ...rules.criteria,
                    {
                      id: crypto.randomUUID(),
                      name: "Novo critério",
                      description: "",
                      weight: 1,
                      requiredComment: false,
                      justifyBelow: 0,
                    },
                  ])
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Adicionar critério
              </button>
            </div>

            <div className="space-y-4">
              {rules.criteria.map((c: any, i: number) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        #{i + 1}
                      </span>
                      <strong className="text-sm font-bold text-slate-800">
                        {c.name || "Critério sem nome"}
                      </strong>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Peso {c.weight}x
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!i}
                        onClick={() => {
                          const next = [...rules.criteria];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          change("criteria", next);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition disabled:opacity-20"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={i === rules.criteria.length - 1}
                        onClick={() => {
                          const next = [...rules.criteria];
                          [next[i + 1], next[i]] = [next[i], next[i + 1]];
                          change("criteria", next);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition disabled:opacity-20"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={rules.criteria.length === 1}
                        onClick={() =>
                          change(
                            "criteria",
                            rules.criteria.filter((_: any, j: number) => j !== i),
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-20 ml-1"
                        title="Remover critério"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Nome do critério</label>
                      <input
                        value={c.name}
                        placeholder="Ex: Assiduidade e Pontualidade"
                        onChange={(e) =>
                          change(
                            "criteria",
                            rules.criteria.map((o: any, j: number) =>
                              j === i ? { ...o, name: e.target.value } : o,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Peso multiplicador</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={c.weight}
                        onChange={(e) =>
                          change(
                            "criteria",
                            rules.criteria.map((o: any, j: number) =>
                              j === i
                                ? { ...o, weight: Number(e.target.value) }
                                : o,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-3">
                      <label className="text-xs font-semibold text-slate-600">Descrição orientativa para o avaliador</label>
                      <textarea
                        rows={2}
                        value={c.description}
                        placeholder="Instrua o cliente e o supervisor sobre como avaliar este ponto..."
                        onChange={(e) =>
                          change(
                            "criteria",
                            rules.criteria.map((o: any, j: number) =>
                              j === i ? { ...o, description: e.target.value } : o,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">Justificativa obrigatória para nota abaixo de</label>
                      <input
                        type="number"
                        min="0"
                        value={c.justifyBelow}
                        onChange={(e) =>
                          change(
                            "criteria",
                            rules.criteria.map((o: any, j: number) =>
                              j === i
                                ? { ...o, justifyBelow: Number(e.target.value) }
                                : o,
                            ),
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center pt-5">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={c.requiredComment}
                          onChange={(e) =>
                            change(
                              "criteria",
                              rules.criteria.map((o: any, j: number) =>
                                j === i
                                  ? { ...o, requiredComment: e.target.checked }
                                  : o,
                              ),
                            )
                          }
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        Sempre exigir comentário escrito neste critério
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Regras e Programa */}
      {tab === "program" && (
        <div className="space-y-6">
          {/* Section A: Regulamento e Medalhas */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800 m-0">Regulamento e Cortes de Reconhecimento</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                Configure as faixas de pontos necessárias para alcançar cada medalha e os parâmetros do programa.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-slate-600">Nome do regulamento</label>
                <input
                  value={rules.name}
                  placeholder="Ex: Regulamento Geral 2026"
                  onChange={(e) => change("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-semibold"
                />
              </div>

              {/* Bronze Card */}
              <div className="p-4 rounded-xl border border-amber-800/20 bg-amber-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    🥉 Bronze
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold">Corte mínimo</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={rules.bronze}
                    onChange={(e) => change("bronze", Number(e.target.value))}
                    className="w-full pr-12 px-3 py-2 font-bold text-sm bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">pts</span>
                </div>
              </div>

              {/* Silver Card */}
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    🥈 Prata
                  </span>
                  <span className="text-[11px] text-slate-600 font-semibold">Corte mínimo</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={rules.silver}
                    onChange={(e) => change("silver", Number(e.target.value))}
                    className="w-full pr-12 px-3 py-2 font-bold text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">pts</span>
                </div>
              </div>

              {/* Gold Card */}
              <div className="p-4 rounded-xl border border-yellow-300 bg-yellow-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-yellow-950 flex items-center gap-1.5">
                    🥇 Ouro
                  </span>
                  <span className="text-[11px] text-amber-700 font-semibold">Corte mínimo</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={rules.gold}
                    onChange={(e) => change("gold", Number(e.target.value))}
                    className="w-full pr-12 px-3 py-2 font-bold text-sm bg-white border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">pts</span>
                </div>
              </div>

              {/* Diamond Seasons */}
              <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-950 flex items-center gap-1.5">
                    💎 Diamante
                  </span>
                  <span className="text-[11px] text-cyan-700 font-semibold">Temporadas</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rules.diamondSeasons}
                    onChange={(e) => change("diamondSeasons", Number(e.target.value))}
                    className="w-full pr-20 px-3 py-2 font-bold text-sm bg-white border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">Ouros seguidos</span>
                </div>
              </div>

              {/* Minimum Cycles */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Mínimo de ciclos avaliados</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={rules.minimumCycles}
                    onChange={(e) => change("minimumCycles", Number(e.target.value))}
                    className="w-full pr-16 px-3 py-2 font-bold text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">ciclos</span>
                </div>
              </div>

              {/* Compliment Points */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <span className="text-xs font-bold text-emerald-950 block">Pontos por elogio aprovado</span>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={rules.complimentPoints}
                    onChange={(e) => change("complimentPoints", Number(e.target.value))}
                    className="w-full pr-12 px-3 py-2 font-bold text-sm bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                  <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">bônus</span>
                </div>
              </div>
            </div>

            {/* Confirmation toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={!rules.provisional}
                  onChange={(e) => change("provisional", !e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                Confirmo que revisei a pontuação e aprovo este regulamento para novas temporadas
              </label>
            </div>
          </div>

          {/* Section B: Toggles & Opções */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 m-0">Parâmetros de Funcionamento e Automação</h3>
              <p className="text-xs text-slate-500 m-0 mt-1">Marque as opções ativas para as próximas temporadas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["complimentEnabled", "Permitir envio de elogios pelos avaliadores", "Se ativo, o campo de elogio aparece no formulário de avaliação."],
                ["complimentApproval", "Exigir aprovação de elogios pelo analista", "Elogios só pontuam após aprovação manual da equipe de RH."],
                ["allowReevaluate", "Permitir reavaliação de notas enviadas", "Permite que quem enviou a nota possa editá-la enquanto o ciclo estiver aberto."],
                ["allowSkip", "Permitir pular colaborador", "Avaliador pode postergar a avaliação de um colaborador na lista pendente."],
                ["allowUnable", "Permitir justificar impossibilidade de avaliar", "Permite marcar 'Impossível avaliar' (ex: afastamento, férias) com motivo."],
                ["allowLate", "Aceitar avaliações após o prazo", "Aceita submissão fora do prazo específico enquanto o ciclo geral estiver aberto."],
                ["hideBeforePublication", "Ocultar ranking até a publicação", "Avaliadores só visualizam a classificação geral após o encerramento oficial."],
                ["autoClose", "Encerrar ciclos automaticamente no prazo", "O sistema finaliza o ciclo e aplica a replicação de notas automaticamente."],
                ["autoPublish", "Publicar automaticamente na data de divulgação", "Libera a divulgação oficial assim que a data programada for atingida."],
              ].map(([key, label, desc]) => {
                const isSpecial = key === "allowReevaluate";
                const isChecked = key === "allowReevaluate" ? rules[key] !== false : !!rules[key];
                return (
                  <label
                    key={key}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      isSpecial
                        ? "bg-indigo-50/60 border-indigo-200 hover:bg-indigo-50"
                        : isChecked
                          ? "bg-slate-50/80 border-slate-300 hover:bg-slate-50"
                          : "bg-white border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => change(key, e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <strong className={`text-xs sm:text-sm block ${isSpecial ? "text-indigo-950 font-bold" : "text-slate-800 font-semibold"}`}>
                        {label}
                      </strong>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        {desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section C: Pesos por Avaliador */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 m-0">Peso por Perfil de Avaliador</h3>
              <p className="text-xs text-slate-500 m-0 mt-1">Multiplicador da nota conforme o papel (ex: peso do Cliente vs Supervisor).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.roles.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">{r.name}</span>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={rules.evaluatorWeights[r.id] ?? 1}
                      onChange={(e) =>
                        change("evaluatorWeights", {
                          ...rules.evaluatorWeights,
                          [r.id]: Number(e.target.value),
                        })
                      }
                      className="w-full pr-10 px-3 py-2 font-bold text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    />
                    <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">peso</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section D: Critérios de Desempate */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 m-0">Ordem de Prioridade no Desempate</h3>
              <p className="text-xs text-slate-500 m-0 mt-1">
                Critérios sequenciais usados quando colaboradores empatam com a mesma pontuação final no ranking.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {rules.tieBreak.map((s: string, i: number) => {
                const names: Record<string, string> = {
                  technical: "Competência Técnica",
                  posture: "Postura",
                  communication: "Comunicação",
                  compliments: "Elogios",
                  oldest: "Avaliação mais antiga",
                };
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={i === 0}
                    onClick={() => {
                      const next = [...rules.tieBreak];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      change("tieBreak", next);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                      i === 0
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 cursor-default"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                    title={i > 0 ? "Clique para subir de prioridade" : "Prioridade máxima"}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {names[s] || s}
                    {i > 0 && <ArrowUp className="w-3.5 h-3.5 text-slate-400 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Penalidades */}
      {tab === "penalties" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 m-0">Catálogo de Penalidades</h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
                Cadastre aqui os tipos e os descontos padrões de pontos por infração ou desvio de conduta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPenaltyEditor({ status: "ativo", points: 0 })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Nova penalidade
            </button>
          </div>

          <DataTable
            title="Penalidades cadastradas"
            search={false}
            rows={data.penaltyTypes}
            columns={[
              { key: "name", label: "Nome" },
              { key: "description", label: "Descrição" },
              {
                key: "points",
                label: "Pontos Descontados",
                render: (r) => (
                  <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full text-xs">
                    -{r.points} pts
                  </span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    r.status === "ativo"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {r.status === "ativo" ? "Ativa" : "Inativa"}
                  </span>
                ),
              },
            ]}
            actions={(row) => (
              <button
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition border border-slate-200"
                onClick={() => setPenaltyEditor(row)}
              >
                Editar
              </button>
            )}
          />
        </div>
      )}

      {/* TAB 5: Acesso de Colaboradores */}
      {tab === "access" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800 m-0">Acesso Automático dos Colaboradores</h2>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-1">
              Defina o domínio institucional utilizado para gerar o e-mail de acesso na criação do colaborador.
            </p>
          </div>

          <div className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Domínio institucional padrão</label>
              <div className="relative flex items-center">
                <input
                  value={employeeDomain}
                  placeholder="@empresa.com.br"
                  onChange={(event) => setEmployeeDomain(event.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                />
              </div>
              <small className="text-xs text-slate-500 block">
                Exemplo: O colaborador "João da Silva" receberá o login <strong>joao.da.silva{employeeDomain || "@empresa.com.br"}</strong>.
              </small>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              O CPF cadastrado servirá como senha inicial provisória e deverá ser alterado no primeiro login.
            </div>

            <button
              type="button"
              onClick={async () => {
                const result = await api('/settings/employee-access', { domain: employeeDomain });
                setEmployeeDomain(result.domain);
                await refresh();
                notify('Domínio dos colaboradores salvo.');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              Salvar domínio
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: Manual */}
      {tab === "manual" && <Manual />}

      {/* Modal: Editor de Penalidade */}
      {penaltyEditor && (
        <Editor
          title={penaltyEditor.id ? "Editar penalidade" : "Nova penalidade"}
          initial={penaltyEditor}
          fields={[
            { key: "name", label: "Nome da penalidade" },
            { key: "description", label: "Descrição", required: false },
            { key: "points", label: "Pontos a descontar", type: "number" },
            { key: "status", label: "Status", options: [{ value: "ativo", label: "Ativa" }, { value: "inativo", label: "Inativa" }] },
          ]}
          onClose={() => setPenaltyEditor(null)}
          onSave={async (value) => {
            await api("/records/penaltyTypes", value);
            await refresh();
            notify("Penalidade salva.");
          }}
        />
      )}
    </div>
  );
}
