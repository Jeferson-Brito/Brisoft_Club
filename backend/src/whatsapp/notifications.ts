import { whatsappService } from "./baileys.ts";
import {
  templateCycleStarted,
  templatePendingReminder,
  templateCycleClosed,
} from "./templates.ts";

export interface ClientPendingSummary {
  clientId: string;
  clientName: string;
  phone: string | null;
  hasPhone: boolean;
  totalEmployees: number;
  pendingCount: number;
  pendingNames: string[];
}

export async function getPendingEvaluationsSummary(
  db: any,
  cycleId?: string,
): Promise<{
  cycle: any | null;
  season: any | null;
  clients: ClientPendingSummary[];
}> {
  const records = await db.allMany([
    "clients",
    "participants",
    "evaluations",
    "cycles",
    "seasons",
    "users",
    "roles",
  ]);

  const cycles = records.cycles || [];
  const targetCycle = cycleId
    ? cycles.find((c: any) => c.id === cycleId)
    : cycles.find((c: any) => c.status === "ativo") || cycles.at(-1);

  if (!targetCycle) {
    return { cycle: null, season: null, clients: [] };
  }

  const season = (records.seasons || []).find(
    (s: any) => s.id === targetCycle.seasonId,
  );
  const allClients = records.clients || [];
  const allUsers = records.users || [];
  const allRoles = records.roles || [];
  const clientRoleIds = new Set(
    allRoles
      .filter((r: any) => (r.name || "").toLowerCase().includes("cliente"))
      .map((r: any) => r.id),
  );

  const cycleParticipants = (records.participants || []).filter(
    (p: any) => p.cycleId === targetCycle.id && p.eligible !== false,
  );

  const cycleEvaluations = (records.evaluations || []).filter(
    (e: any) => e.cycleId === targetCycle.id && e.status !== "rascunho",
  );

  const summaries: ClientPendingSummary[] = [];

  for (const client of allClients) {
    const clientParticipants = cycleParticipants.filter(
      (p: any) => p.snapshot?.clientId === client.id,
    );
    if (clientParticipants.length === 0) continue;

    // Achar usuários do perfil cliente vinculados a esta empresa
    const clientUsers = allUsers.filter(
      (u: any) =>
        clientRoleIds.has(u.roleId) &&
        (u.clientIds || []).includes(client.id) &&
        u.status !== "inativo",
    );

    // Telefone: preferência do cadastro do cliente, senão do usuário vinculado
    let phone: string | null = client.phone?.trim() || null;
    if (!phone) {
      const userWithPhone = clientUsers.find((u: any) => u.phone?.trim());
      if (userWithPhone) phone = userWithPhone.phone.trim();
    }

    // Verificar participantes que já foram avaliados por alguém com perfil cliente
    const pendingNames: string[] = [];
    let pendingCount = 0;

    for (const p of clientParticipants) {
      const hasClientEvaluation = cycleEvaluations.some(
        (e: any) =>
          e.participantId === p.id &&
          clientUsers.some((u: any) => u.id === e.evaluatorId),
      );

      if (!hasClientEvaluation) {
        pendingCount++;
        pendingNames.push(p.snapshot?.name || "Colaborador");
      }
    }

    summaries.push({
      clientId: client.id,
      clientName: client.name,
      phone,
      hasPhone: Boolean(phone && whatsappService.cleanPhoneNumber(phone)),
      totalEmployees: clientParticipants.length,
      pendingCount,
      pendingNames,
    });
  }

  return { cycle: targetCycle, season, clients: summaries };
}

export async function sendPendingReminders(
  db: any,
  cycleId?: string,
  portalUrl?: string,
): Promise<{
  totalSent: number;
  totalFailed: number;
  results: { clientName: string; phone: string; success: boolean; error?: string }[];
}> {
  const { cycle, clients } = await getPendingEvaluationsSummary(db, cycleId);
  if (!cycle) {
    throw new Error("Nenhum ciclo encontrado para disparo de lembretes.");
  }

  const results: { clientName: string; phone: string; success: boolean; error?: string }[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const item of clients) {
    if (item.pendingCount === 0 || !item.hasPhone || !item.phone) continue;

    const message = templatePendingReminder({
      clientName: item.clientName,
      cycleName: cycle.name,
      deadline: cycle.clientDeadline || cycle.deadline,
      pendingCount: item.pendingCount,
      pendingNames: item.pendingNames,
      portalUrl,
    });

    const res = await whatsappService.sendMessage(
      item.phone,
      message,
      item.clientName,
      "lembrete_pendencias",
    );

    if (res.success) {
      totalSent++;
    } else {
      totalFailed++;
    }

    results.push({
      clientName: item.clientName,
      phone: item.phone,
      success: res.success,
      error: res.error,
    });
  }

  return { totalSent, totalFailed, results };
}

export async function sendCycleStartedAlerts(
  db: any,
  cycleId: string,
  portalUrl?: string,
): Promise<{
  totalSent: number;
  totalFailed: number;
  results: { clientName: string; phone: string; success: boolean; error?: string }[];
}> {
  const { cycle, season, clients } = await getPendingEvaluationsSummary(db, cycleId);
  if (!cycle || !season) {
    throw new Error("Ciclo ou temporada não encontrados.");
  }

  const results: { clientName: string; phone: string; success: boolean; error?: string }[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const item of clients) {
    if (!item.hasPhone || !item.phone) continue;

    const message = templateCycleStarted({
      clientName: item.clientName,
      seasonName: season.name,
      cycleName: cycle.name,
      deadline: cycle.clientDeadline || cycle.deadline,
      employeeCount: item.totalEmployees,
      portalUrl,
    });

    const res = await whatsappService.sendMessage(
      item.phone,
      message,
      item.clientName,
      "inicio_ciclo",
    );

    if (res.success) {
      totalSent++;
    } else {
      totalFailed++;
    }

    results.push({
      clientName: item.clientName,
      phone: item.phone,
      success: res.success,
      error: res.error,
    });
  }

  return { totalSent, totalFailed, results };
}

export async function sendCycleClosedAlerts(
  db: any,
  cycleId: string,
): Promise<{
  totalSent: number;
  totalFailed: number;
  results: { clientName: string; phone: string; success: boolean; error?: string }[];
}> {
  const { cycle, season, clients } = await getPendingEvaluationsSummary(db, cycleId);
  if (!cycle || !season) {
    throw new Error("Ciclo ou temporada não encontrados.");
  }

  const results: { clientName: string; phone: string; success: boolean; error?: string }[] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const item of clients) {
    if (!item.hasPhone || !item.phone) continue;

    const message = templateCycleClosed({
      clientName: item.clientName,
      cycleName: cycle.name,
      seasonName: season.name,
    });

    const res = await whatsappService.sendMessage(
      item.phone,
      message,
      item.clientName,
      "encerramento_ciclo",
    );

    if (res.success) totalSent++;
    else totalFailed++;

    results.push({
      clientName: item.clientName,
      phone: item.phone,
      success: res.success,
      error: res.error,
    });
  }

  return { totalSent, totalFailed, results };
}

export interface WhatsAppBotConfig {
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

export const defaultWhatsAppConfig: WhatsAppBotConfig = {
  enabled: true,
  autoCycleStart: true,
  autoReminders: true,
  reminderDaysBefore: [5, 3, 1],
  reminderTime: "09:00",
  businessDaysOnly: true,
  autoCycleEnd: true,
  notifySupervisors: false,
  portalUrl: "http://localhost:5173",
};

const lastSentDailyReminders = new Map<string, string>();

export async function checkWhatsAppAutomations(db: any): Promise<void> {
  if (whatsappService.getStatus().status !== "connected") return;

  const settings = (await db.all("settings"))[0];
  const config: WhatsAppBotConfig = {
    ...defaultWhatsAppConfig,
    ...(settings?.whatsappConfig || {}),
  };

  if (!config.enabled || !config.autoReminders) return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  if (config.businessDaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return;
  }

  const currentHour = now.getHours();
  const targetHour = parseInt(config.reminderTime.split(":")[0] || "9", 10);
  if (currentHour < targetHour) return;

  const todayStr = now.toISOString().slice(0, 10);
  const cycles = (await db.all("cycles")).filter((c: any) => c.status === "ativo");

  for (const cycle of cycles) {
    const key = `${cycle.id}:${todayStr}`;
    if (lastSentDailyReminders.has(key)) continue;

    const deadlineStr = cycle.clientDeadline || cycle.deadline;
    if (!deadlineStr) continue;

    const diffMs = new Date(deadlineStr).getTime() - new Date(todayStr).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (config.reminderDaysBefore.includes(diffDays)) {
      console.log(`WhatsApp Automático: Disparando lembretes para o ciclo "${cycle.name}" faltando ${diffDays} dia(s).`);
      lastSentDailyReminders.set(key, todayStr);
      try {
        await sendPendingReminders(db, cycle.id, config.portalUrl);
      } catch (err) {
        console.error("Erro ao enviar lembretes automáticos do WhatsApp:", err);
      }
    }
  }
}

