import { useState, useEffect, useCallback } from "react";
import { api, useData } from "./state";
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  LogOut,
  Bell,
  Clock,
  Check,
  X,
  Building2,
  MessageSquare,
  Sliders,
  Save,
  Link as LinkIcon,
} from "lucide-react";

interface WhatsAppStatus {
  status: "disconnected" | "connecting" | "connected";
  connectedUser: string | null;
  qrCode: string | null;
  lastError: string | null;
  autoNotifications: boolean;
}

interface ClientSummary {
  clientId: string;
  clientName: string;
  phone: string | null;
  hasPhone: boolean;
  totalEmployees: number;
  pendingCount: number;
  pendingNames: string[];
}

interface PendingData {
  cycle: any | null;
  season: any | null;
  clients: ClientSummary[];
}

interface SendLog {
  id: string;
  recipientName: string;
  phone: string;
  messageType: string;
  status: "sent" | "failed";
  error?: string;
  sentAt: string;
}

interface BotConfig {
  enabled: boolean;
  autoCycleStart: boolean;
  autoReminders: boolean;
  reminderDaysBefore: number[];
  reminderTime: string;
  businessDaysOnly: boolean;
  autoCycleEnd: boolean;
  notifySupervisors: boolean;
  portalUrl: string;
}

const defaultBotConfig: BotConfig = {
  enabled: true,
  autoCycleStart: true,
  autoReminders: true,
  reminderDaysBefore: [5, 3, 1],
  reminderTime: "09:00",
  businessDaysOnly: true,
  autoCycleEnd: true,
  notifySupervisors: false,
  portalUrl: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
};

function formatDateBR(dateStr?: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}

export function WhatsAppSettings() {
  const { notify } = useData();
  const [statusData, setStatusData] = useState<WhatsAppStatus>({
    status: "disconnected",
    connectedUser: null,
    qrCode: null,
    lastError: null,
    autoNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<PendingData>({
    cycle: null,
    season: null,
    clients: [],
  });
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>(defaultBotConfig);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"connection" | "reminders" | "config" | "templates" | "logs">("connection");

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await api("/whatsapp/status");
      setStatusData(data);
    } catch {
      // Ignorar se endpoint ainda não respondeu
    }
  }, []);

  // Fetch pending summary
  const fetchPending = useCallback(async () => {
    try {
      const data = await api("/whatsapp/pending-summary");
      setPendingData(data);
    } catch {
      // Falha silenciosa
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const data = await api("/whatsapp/logs");
      setLogs(data.logs || []);
    } catch {
      // Falha silenciosa
    }
  }, []);

  // Fetch bot config
  const fetchConfig = useCallback(async () => {
    try {
      const data = await api("/whatsapp/config");
      setBotConfig((prev) => ({ ...prev, ...data }));
    } catch {
      // Falha silenciosa
    }
  }, []);

  // Polling enquanto aberto
  useEffect(() => {
    fetchStatus();
    fetchPending();
    fetchLogs();
    fetchConfig();

    const interval = setInterval(() => {
      fetchStatus();
      if (activeSubTab === "logs") fetchLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchPending, fetchLogs, fetchConfig, activeSubTab]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const data = await api("/whatsapp/connect", {});
      setStatusData(data);
      notify("Conexão iniciada. Escaneie o QR Code exibido.");
    } catch (err: any) {
      notify(err.message || "Erro ao iniciar conexão WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const data = await api("/whatsapp/disconnect", {});
      setStatusData(data);
      notify("WhatsApp desconectado com sucesso.");
    } catch (err: any) {
      notify(err.message || "Erro ao desconectar WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const saved = await api("/whatsapp/config", botConfig);
      setBotConfig(saved);
      notify("Configurações do WhatsApp Bot salvas com sucesso!");
    } catch (err: any) {
      notify(err.message || "Erro ao salvar configurações do bot");
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    setBotConfig((prev) => {
      const days = prev.reminderDaysBefore.includes(day)
        ? prev.reminderDaysBefore.filter((d) => d !== day)
        : [...prev.reminderDaysBefore, day].sort((a, b) => b - a);
      return { ...prev, reminderDaysBefore: days };
    });
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return notify("Informe o número de telefone com DDD.");
    setSendingTest(true);
    try {
      const res = await api("/whatsapp/test", {
        phone: testPhone.trim(),
        message: testMsg.trim() || undefined,
      });
      if (res.success) {
        notify("Mensagem de teste enviada com sucesso!");
        fetchLogs();
      } else {
        notify(res.error || "Falha ao enviar mensagem de teste.");
      }
    } catch (err: any) {
      notify(err.message || "Erro ao disparar teste.");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendReminders = async () => {
    if (!statusData.status || statusData.status !== "connected") {
      return notify("Conecte o WhatsApp antes de realizar disparos.");
    }
    const clientsWithPhoneAndPending = pendingData.clients.filter(
      (c) => c.pendingCount > 0 && c.hasPhone,
    );
    if (clientsWithPhoneAndPending.length === 0) {
      return notify("Não há clientes com telefone cadastrado e avaliações pendentes.");
    }

    if (
      !confirm(
        `Deseja enviar lembretes para ${clientsWithPhoneAndPending.length} cliente(s) com pendências?`,
      )
    ) {
      return;
    }

    setSendingReminders(true);
    try {
      const res = await api("/whatsapp/send-reminders", {
        cycleId: pendingData.cycle?.id,
        portalUrl: botConfig.portalUrl || window.location.origin,
      });
      notify(
        `Disparos concluídos! Enviados: ${res.totalSent} | Falhas: ${res.totalFailed}`,
      );
      fetchPending();
      fetchLogs();
    } catch (err: any) {
      notify(err.message || "Erro ao disparar lembretes.");
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSendCycleAlert = async (type: "started" | "closed") => {
    if (statusData.status !== "connected") {
      return notify("Conecte o WhatsApp antes de realizar disparos.");
    }
    if (!pendingData.cycle) {
      return notify("Nenhum ciclo ativo encontrado.");
    }

    const label = type === "started" ? "início de ciclo" : "encerramento de ciclo";
    if (!confirm(`Confirmar disparo de aviso de ${label} para todos os clientes cadastrados?`)) {
      return;
    }

    setSendingAlert(true);
    try {
      const res = await api("/whatsapp/send-cycle-alert", {
        cycleId: pendingData.cycle.id,
        alertType: type,
        portalUrl: botConfig.portalUrl || window.location.origin,
      });
      notify(`Alertas enviados! Sucessos: ${res.totalSent} | Falhas: ${res.totalFailed}`);
      fetchLogs();
    } catch (err: any) {
      notify(err.message || "Erro ao disparar alerta.");
    } finally {
      setSendingAlert(false);
    }
  };

  const isConnected = statusData.status === "connected";
  const isConnecting = statusData.status === "connecting";

  const pendingCount = pendingData.clients.filter((c) => c.pendingCount > 0).length;

  const tabs = [
    {
      key: "connection",
      name: "Conexão & Aparelho",
      desc: isConnected ? "WhatsApp Conectado" : isConnecting ? "Conectando..." : "Status e QR Code",
      icon: Smartphone,
    },
    {
      key: "reminders",
      name: "Lembretes & Disparos",
      desc: "Envio de notificações",
      icon: Bell,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      key: "config",
      name: "Configurações do Bot",
      desc: "Automações e prazos",
      icon: Sliders,
    },
    {
      key: "templates",
      name: "Modelos de Mensagem",
      desc: "Textos dos comunicados",
      icon: MessageSquare,
    },
    {
      key: "logs",
      name: "Histórico de Envios",
      desc: "Registro de disparos",
      icon: Clock,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto font-sans flex flex-col lg:flex-row gap-5 items-start h-auto md:h-full overflow-hidden">
      {/* Coluna Esquerda: Menu Lateral Fixo com Largura Reduzida */}
      <div className="w-full lg:w-[215px] shrink-0 bg-white rounded-2xl border border-slate-200/80 p-2 space-y-1 shadow-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveSubTab(t.key as any);
                if (t.key === "config") fetchConfig();
                if (t.key === "logs") fetchLogs();
                if (t.key === "reminders") fetchPending();
              }}
              className={`w-full p-2 rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer group ${
                isActive
                  ? "bg-blue-50/90 border border-blue-200/80 shadow-2xs"
                  : "bg-transparent hover:bg-slate-50 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-600 shadow-2xs"
                    : "bg-slate-100 text-slate-500 group-hover:text-slate-700"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-bold block leading-tight truncate ${
                      isActive ? "text-blue-950" : "text-slate-800 group-hover:text-slate-950"
                    }`}
                  >
                    {t.name}
                  </span>
                  {t.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white shrink-0">
                      {t.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] block mt-0.5 leading-tight truncate ${
                    isActive ? "text-blue-600 font-medium" : "text-slate-400"
                  }`}
                >
                  {t.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Coluna Direita: Conteúdo da Aba Ativa com Rolagem Independente */}
      <div className="flex-1 min-w-0 w-full h-full overflow-y-auto space-y-6 pr-1 pb-10 scrollbar-thin scrollbar-thumb-slate-200">
        {/* ── Sub-Aba 1: Conexão & Aparelho ── */}
        {activeSubTab === "connection" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card Esquerdo: Status da Conexão */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 m-0">
                      Status do WhatsApp Corporativo
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                      Conecte o número do Grupo Combate para envio dos alertas aos clientes.
                    </p>
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                    isConnected
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isConnecting
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected
                        ? "bg-emerald-500 animate-pulse"
                        : isConnecting
                        ? "bg-amber-500 animate-ping"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {isConnected
                      ? "Conectado"
                      : isConnecting
                      ? "Conectando..."
                      : "Desconectado"}
                  </span>
                </div>
              </div>

            {isConnected ? (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-950 m-0">
                      Dispositivo conectado e pronto para envios!
                    </h4>
                    <p className="text-xs text-emerald-800 m-0 leading-relaxed">
                      O bot está pareado com o WhatsApp:{" "}
                      <strong className="font-extrabold text-emerald-900">
                        {statusData.connectedUser || "Ativo"}
                      </strong>
                      . As mensagens aos clientes serão enviadas a partir deste número.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
                  >
                    <LogOut size={16} />
                    <span>Desconectar WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={fetchStatus}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>Atualizar status</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-slate-700 leading-relaxed m-0">
                    Para conectar o bot, clique no botão abaixo para gerar o <strong>QR Code</strong> e escaneie no aplicativo do WhatsApp do celular:
                  </p>

                  <ol className="text-xs text-slate-600 space-y-2 pl-4 list-decimal">
                    <li>Abra o <strong>WhatsApp</strong> no celular que enviará as mensagens.</li>
                    <li>Toque em <strong>Mais opções</strong> (três pontinhos no Android) ou <strong>Configurações</strong> (no iPhone).</li>
                    <li>Toque em <strong>Aparelhos conectados</strong> e depois em <strong>Conectar um aparelho</strong>.</li>
                    <li>Aponte a câmera do celular para o QR Code exibido ao lado.</li>
                  </ol>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <QrCode size={18} className="text-[#f5b300]" />
                    <span>{loading ? "Iniciando sessão..." : "Gerar QR Code de Conexão"}</span>
                  </button>
                </div>

                {statusData.lastError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{statusData.lastError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Direito: Área do QR Code / Teste de Disparo */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0">
                  {isConnected ? "Enviar Mensagem de Teste" : "Pareamento via QR Code"}
                </h3>
                <p className="text-xs text-slate-500 m-0 mt-0.5 font-medium">
                  {isConnected
                    ? "Valide a entrega de mensagens em seu aparelho."
                    : "Escaneie o código abaixo com a câmera do WhatsApp."}
                </p>
              </div>
            </div>

            {statusData.qrCode && !isConnected ? (
              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <img
                  src={statusData.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 rounded-xl shadow-xs border border-slate-200 bg-white p-2"
                />
                <span className="text-xs text-slate-500 animate-pulse font-medium">
                  Aguardando leitura no celular...
                </span>
              </div>
            ) : isConnecting && !statusData.qrCode && !isConnected ? (
              <div className="flex flex-col items-center justify-center p-8 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-blue-950 m-0">
                    Finalizando Conexão e Autenticando...
                  </h4>
                  <p className="text-xs text-blue-800 m-0 mt-1">
                    QR Code lido com sucesso! O WhatsApp está sincronizando a sessão. Aguarde alguns segundos...
                  </p>
                </div>
              </div>
            ) : isConnected ? (
              <form onSubmit={handleSendTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Destino (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 11999998888 ou (11) 99999-9999"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensagem de Teste (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Deixe em branco para usar a mensagem padrão do Clube de Talentos..."
                    value={testMsg}
                    onChange={(e) => setTestMsg(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingTest}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send size={14} className="text-[#f5b300]" />
                  <span>{sendingTest ? "Enviando..." : "Disparar Mensagem de Teste"}</span>
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3 text-center">
                <QrCode size={48} strokeWidth={1.5} className="text-slate-300" />
                <p className="text-xs max-w-xs text-slate-500 m-0">
                  Clique em <strong>"Gerar QR Code de Conexão"</strong> ao lado para iniciar a leitura.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Sub-Aba 2: Lembretes & Disparos ── */}
      {activeSubTab === "reminders" && (
        <div className="space-y-6">
          {/* Card Resumo do Ciclo Ativo */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 m-0">
                    Central de Disparos por Ciclo
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                    Envie lembretes personalizados para clientes que ainda possuem avaliações pendentes.
                  </p>
                </div>
              </div>

              {pendingData.cycle && (
                <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-bold shrink-0">
                  <span>Ciclo: <strong>{pendingData.cycle.name}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Prazo: <strong>{formatDateBR(pendingData.cycle.clientDeadline || pendingData.cycle.deadline)}</strong></span>
                </div>
              )}
            </div>

            {/* Ações de Envio Rápido */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSendReminders}
                disabled={sendingReminders || !isConnected}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Bell size={16} className="text-[#f5b300]" />
                <span>
                  {sendingReminders ? "Disparando..." : "Enviar Lembrete para Clientes com Pendências"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSendCycleAlert("started")}
                disabled={sendingAlert || !isConnected}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send size={15} />
                <span>Avisar Início de Ciclo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendCycleAlert("closed")}
                disabled={sendingAlert || !isConnected}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Check size={15} />
                <span>Avisar Encerramento</span>
              </button>

              <button
                type="button"
                onClick={fetchPending}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer ml-auto"
                title="Recarregar dados"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {!isConnected && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <span>
                  O WhatsApp está desconectado. Vá na sub-aba <strong>Conexão & Aparelho</strong> para conectar o bot antes de disparar.
                </span>
              </div>
            )}
          </div>

          {/* Tabela de Clientes e Pendências */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                <span>Quadro de Pendências por Cliente ({pendingData.clients.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Apenas empresas com colaboradores alocados no ciclo ativo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Cliente Contratante</th>
                    <th className="py-3 px-4">WhatsApp de Contato</th>
                    <th className="py-3 px-4 text-center">Colaboradores</th>
                    <th className="py-3 px-4 text-center">Pendentes</th>
                    <th className="py-3 px-4">Status de Contato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingData.clients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        Nenhum cliente com colaboradores alocados no ciclo selecionado.
                      </td>
                    </tr>
                  ) : (
                    pendingData.clients.map((c) => (
                      <tr key={c.clientId} className="hover:bg-slate-50/60 transition-all">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {c.clientName}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          {c.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-amber-600 italic">
                              Sem telefone cadastrado
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                          {c.totalEmployees}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {c.pendingCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900">
                              {c.pendingCount} pendente(s)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                              <Check size={14} /> Concluído
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {c.hasPhone ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              Apto para receber
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs">
                              <X size={14} className="text-slate-300" />
                              Cadastre o telefone em Clientes
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Aba 3: Configurações & Permissões do Bot ── */}
      {activeSubTab === "config" && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 m-0">
                    Configurações e Automações do Bot
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                    Defina regras de disparos automáticos, horários e dias de antecedência.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#071e4d] hover:bg-[#0c2e75] active:bg-[#06183d] text-white border border-[#f5b300] font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Save size={16} className="text-[#f5b300]" />
                <span>{savingConfig ? "Salvando..." : "Salvar"}</span>
              </button>
            </div>

            {/* Grid de Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Automação Geral */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Automação Geral do Bot</h3>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Habilita os disparos automáticos em segundo plano.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={botConfig.enabled}
                      onChange={(e) => setBotConfig({ ...botConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#071e4d]" />
                  </label>
                </div>

                <div className="border-t border-slate-200/60 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 m-0">Aviso Automático de Abertura de Ciclo</h4>
                      <p className="text-[11px] text-slate-500 m-0">Envia WhatsApp ao cliente quando o ciclo for iniciado.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!botConfig.enabled}
                        checked={botConfig.autoCycleStart}
                        onChange={(e) => setBotConfig({ ...botConfig, autoCycleStart: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#071e4d]" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 m-0">Aviso Automático de Encerramento de Ciclo</h4>
                      <p className="text-[11px] text-slate-500 m-0">Envia mensagem de agradecimento ao fechar o ciclo.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!botConfig.enabled}
                        checked={botConfig.autoCycleEnd}
                        onChange={(e) => setBotConfig({ ...botConfig, autoCycleEnd: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#071e4d]" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 m-0">Notificar Também Supervisores</h4>
                      <p className="text-[11px] text-slate-500 m-0">Envia avisos aos supervisores de campo com pendências.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!botConfig.enabled}
                        checked={botConfig.notifySupervisors}
                        onChange={(e) => setBotConfig({ ...botConfig, notifySupervisors: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#071e4d]" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Card 2: Regras e Antecedência dos Lembretes */}
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 m-0">Lembretes Automáticos de Prazo</h3>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Envia avisos periódicos enquanto houver pendências.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!botConfig.enabled}
                      checked={botConfig.autoReminders}
                      onChange={(e) => setBotConfig({ ...botConfig, autoReminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#071e4d]" />
                  </label>
                </div>

                <div className="border-t border-slate-200/60 pt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Antecedência dos Lembretes (quantos dias antes do prazo enviar):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[7, 5, 3, 2, 1, 0].map((d) => {
                        const isSelected = botConfig.reminderDaysBefore.includes(d);
                        const label = d === 0 ? "No dia do prazo" : d === 1 ? "1 dia (véspera)" : `${d} dias antes`;
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={!botConfig.enabled || !botConfig.autoReminders}
                            onClick={() => toggleReminderDay(d)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#071e4d] text-white shadow-2xs"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                            } disabled:opacity-40`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Horário Preferencial de Disparo:
                      </label>
                      <input
                        type="time"
                        disabled={!botConfig.enabled || !botConfig.autoReminders}
                        value={botConfig.reminderTime}
                        onChange={(e) => setBotConfig({ ...botConfig, reminderTime: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none disabled:opacity-40"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
                      <span className="text-xs font-bold text-slate-800">Apenas em Dias Úteis:</span>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          disabled={!botConfig.enabled || !botConfig.autoReminders}
                          checked={botConfig.businessDaysOnly}
                          onChange={(e) => setBotConfig({ ...botConfig, businessDaysOnly: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#071e4d]" />
                        <span className="ml-2 text-xs text-slate-500">Não enviar fins de semana</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: URL Base do Portal */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 m-0">Link Base do Portal nas Mensagens</h3>
                </div>
                <p className="text-xs text-slate-500 m-0">
                  Este link é inserido dentro das mensagens do WhatsApp para o cliente clicar e abrir diretamente a página de avaliação:
                </p>
                <div className="max-w-xl">
                  <input
                    type="url"
                    required
                    value={botConfig.portalUrl}
                    onChange={(e) => setBotConfig({ ...botConfig, portalUrl: e.target.value })}
                    placeholder="http://localhost:5173 ou https://clube.grupocombate.com.br"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Em ambiente local você pode deixar como <code>{window.location.origin}</code>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Sub-Aba 4: Modelos de Mensagem ── */}
      {activeSubTab === "templates" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 m-0">
                Modelos de Mensagem WhatsApp
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                Visualize os textos padrão enviados aos clientes nas diferentes fases da temporada.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Modelo 1: Início de Ciclo */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-800">
                  1. Abertura de Ciclo
                </span>
                <span className="text-xs text-slate-400">Disparo Inicial</span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Disparado quando a temporada e o ciclo são iniciados:
              </p>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 font-sans text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-2xs">
                {`Olá, *[Nome do Cliente]*! 👋\n\nO *Ciclo [Nome]* da *Temporada [Ano]* do *Clube de Talentos (Grupo Combate)* foi iniciado!\n\n📅 *Prazo para avaliação:* até [Data Final]\n👥 *Colaboradores alocados:* [Qtd] pessoa(s)\n\nSua avaliação é fundamental para reconhecer os profissionais que prestam serviços na sua empresa.\n\n👉 *Acesse para avaliar:* [Link do Portal]`}
              </div>
            </div>

            {/* Card Modelo 2: Lembrete de Pendências */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-900">
                  2. Lembrete de Pendências
                </span>
                <span className="text-xs text-slate-400">Durante a Vigência</span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Disparado para os clientes que ainda não concluíram 100% das avaliações:
              </p>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 font-sans text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-2xs">
                {`Olá, *[Nome do Cliente]*! ⏰\n\nLembramos que ainda constam *[X] colaborador(es)* aguardando sua avaliação no *Clube de Talentos* referente ao *Ciclo [Nome]*.\n\n⚠️ *O prazo final encerra em:* [Data Final]\n\nLeva apenas 2 minutinhos por colaborador e garante que a equipe receba o devido reconhecimento.\n\n👉 *Avaliar agora:* [Link do Portal]`}
              </div>
            </div>

            {/* Card Modelo 3: Último Aviso */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 text-rose-800">
                  3. Último Aviso de Prazo
                </span>
                <span className="text-xs text-slate-400">Véspera do Encerramento</span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Disparado faltando 24h para o término do prazo:
              </p>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 font-sans text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-2xs">
                {`🚨 *Último Aviso de Prazo - Clube de Talentos*\n\nOlá, *[Nome do Cliente]*!\n\nO prazo de avaliação do *Ciclo [Nome]* encerra *amanhã ([Data Final])*!\n\nVocê ainda possui colaboradores sem avaliação registrada. Caso não seja enviada, a nota do supervisor poderá ser replicada conforme o regulamento.\n\n👉 *Acesse o portal:* [Link]`}
              </div>
            </div>

            {/* Card Modelo 4: Encerramento */}
            <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-800">
                  4. Encerramento de Ciclo
                </span>
                <span className="text-xs text-slate-400">Agradecimento</span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Disparado após a consolidação do ciclo:
              </p>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 font-sans text-xs text-slate-700 whitespace-pre-line leading-relaxed shadow-2xs">
                {`Olá, *[Nome do Cliente]*! 🏆\n\nO *Ciclo [Nome]* da temporada foi oficialmente encerrado!\n\nAgradecemos imensamente pela sua participação e por dedicar seu tempo na avaliação dos nossos profissionais. O seu feedback é o que move a melhoria contínua dos nossos serviços no Grupo Combate.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-Aba 5: Histórico de Envios ── */}
      {activeSubTab === "logs" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 m-0">
                  Histórico de Disparos
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
                  Registro detalhado dos comunicados enviados aos clientes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shrink-0"
            >
              <RefreshCw size={14} /> <span>Atualizar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Destinatário</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      Nenhuma mensagem enviada até o momento.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(log.sentAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {log.recipientName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono">
                        {log.phone}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-600 capitalize">
                        {log.messageType.replace("_", " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-500" /> Enviada
                          </span>
                        ) : (
                          <span
                            title={log.error}
                            className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                          >
                            <AlertCircle size={13} className="text-rose-500" /> Falha
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
