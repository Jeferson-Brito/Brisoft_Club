export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();
  // Já está no formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    return trimmed;
  }
  // Formato YYYY-MM-DD (com ou sem timestamp ISO)
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

export function templateCycleStarted(params: {
  clientName: string;
  seasonName: string;
  cycleName: string;
  deadline: string;
  employeeCount: number;
  portalUrl?: string;
}): string {
  const url = params.portalUrl || "http://localhost:5173";
  const formattedDeadline = formatDateBR(params.deadline);
  return `Olá, *${params.clientName}*! 👋

O *Ciclo ${params.cycleName}* da *${params.seasonName}* do *Clube de Talentos (Grupo Combate)* foi iniciado!

📅 *Prazo para avaliação:* até ${formattedDeadline}
👥 *Colaboradores alocados no seu contrato:* ${params.employeeCount} pessoa(s)

Sua avaliação é fundamental para reconhecer os profissionais que prestam serviços na sua empresa.

👉 *Acesse para avaliar:* ${url}

_Mensagem automática enviada pelo Clube de Talentos - Grupo Combate_`;
}

export function templatePendingReminder(params: {
  clientName: string;
  cycleName: string;
  deadline: string;
  pendingCount: number;
  pendingNames?: string[];
  portalUrl?: string;
}): string {
  const url = params.portalUrl || "http://localhost:5173";
  const formattedDeadline = formatDateBR(params.deadline);
  const namesText =
    params.pendingNames && params.pendingNames.length > 0
      ? `\n*Pendentes:* ${params.pendingNames.slice(0, 5).join(", ")}${params.pendingNames.length > 5 ? ` e mais ${params.pendingNames.length - 5}...` : ""}`
      : "";

  return `Olá, *${params.clientName}*! ⏰

Lembramos que ainda constam *${params.pendingCount} colaborador(es)* aguardando sua avaliação no *Clube de Talentos (Grupo Combate)* referente ao *Ciclo ${params.cycleName}*.${namesText}

⚠️ *O prazo final encerra em:* ${formattedDeadline}

Leva apenas 2 minutinhos por colaborador e garante que a equipe receba o devido reconhecimento.

👉 *Avaliar agora:* ${url}

_Mensagem automática enviada pelo Clube de Talentos - Grupo Combate_`;
}

export function templateDeadlineWarning(params: {
  clientName: string;
  cycleName: string;
  deadline: string;
  pendingCount: number;
  portalUrl?: string;
}): string {
  const url = params.portalUrl || "http://localhost:5173";
  const formattedDeadline = formatDateBR(params.deadline);
  return `🚨 *Último Aviso de Prazo - Clube de Talentos*

Olá, *${params.clientName}*!

O prazo de avaliação do *Ciclo ${params.cycleName}* encerra *amanhã (${formattedDeadline})*!

Você ainda possui *${params.pendingCount} colaborador(es)* sem avaliação registrada. Caso a avaliação não seja enviada até o prazo, a nota do supervisor poderá ser replicada conforme o regulamento do programa.

👉 *Acesse agora para enviar suas notas:* ${url}

_Grupo Combate - Excelência em Serviços_`;
}

export function templateCycleClosed(params: {
  clientName: string;
  cycleName: string;
  seasonName: string;
}): string {
  return `Olá, *${params.clientName}*! 🏆

O *Ciclo ${params.cycleName}* da *${params.seasonName}* foi oficialmente encerrado!

Agradecemos imensamente pela sua participação e por dedicar seu tempo na avaliação dos nossos profissionais. O seu feedback é o que move a melhoria contínua dos nossos serviços no Grupo Combate.

_Clube de Talentos - Grupo Combate_`;
}
