import { randomUUID } from "node:crypto";
import { z } from "zod";
import { TenantStore, type RecordData, type Table } from "./db.ts";
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export const permissions = [
  "dashboard",
  "evaluate",
  "evaluations",
  "ranking",
  "clients",
  "employees",
  "seasons",
  "achievements",
  "imports",
  "reports",
  "users",
  "settings",
] as const;
const text = z.string().trim().min(1).max(200);
export const normalizeCpf = (value: string) => value.replace(/\D/g, "");
export function validCpf(value: string) {
  const cpf = normalizeCpf(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, number, index) => total + Number(number) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida",
  );
export const rulesSchema = z
  .object({
    name: text,
    provisional: z.boolean(),
    criteria: z
      .array(
        z.object({
          id: text,
          name: text,
          description: z.string().max(1500),
          weight: z.number().positive().max(100),
          requiredComment: z.boolean(),
          justifyBelow: z.number().min(0).max(100),
        }),
      )
      .min(1)
      .max(20),
    scale: z
      .array(
        z.object({
          value: z.number().min(0).max(100),
          label: text,
          points: z.number().min(0).max(1000),
        }),
      )
      .min(2)
      .max(10),
    complimentEnabled: z.boolean(),
    complimentPoints: z.number().min(0).max(1000),
    complimentApproval: z.boolean(),
    bronze: z.number().nonnegative(),
    silver: z.number().nonnegative(),
    gold: z.number().nonnegative(),
    diamondSeasons: z.number().int().min(2).max(10),
    minimumCycles: z.number().int().min(1).max(12),
    allowSkip: z.boolean(),
    allowUnable: z.boolean(),
    allowLate: z.boolean(),
    allowReevaluate: z.boolean().default(true),
    evaluatorWeights: z.record(z.string(), z.number().positive().max(100)),
    tieBreak: z
      .array(
        z.enum([
          "technical",
          "posture",
          "communication",
          "compliments",
          "oldest",
        ]),
      )
      .max(5),
    hideBeforePublication: z.boolean(),
    autoPublish: z.boolean(),
    autoClose: z.boolean(),
  })
  .refine(
    (r) => r.bronze < r.silver && r.silver < r.gold,
    "As faixas devem estar em ordem crescente",
  )
  .refine(
    (r) => new Set(r.scale.map((s) => s.value)).size === r.scale.length,
    "Notas repetidas",
  )
  .refine(
    (r) => new Set(r.criteria.map((s) => s.id)).size === r.criteria.length,
    "Critérios repetidos",
  );
export const defaultRules = rulesSchema.parse({
  name: "Regulamento inicial — ajustar antes de iniciar",
  provisional: true,
  criteria: [
    {
      id: "technical",
      name: "Competência Técnica",
      description: "Execução correta do POP, das atividades e funções.",
      weight: 1,
      requiredComment: false,
      justifyBelow: 3,
    },
    {
      id: "posture",
      name: "Postura no Posto",
      description: "Atenção, apresentação pessoal, uniforme e uso de EPIs.",
      weight: 1,
      requiredComment: false,
      justifyBelow: 3,
    },
    {
      id: "communication",
      name: "Comunicação",
      description: "Cordialidade, relacionamento e passagem de serviço.",
      weight: 1,
      requiredComment: false,
      justifyBelow: 3,
    },
  ],
  scale: [
    { value: 1, label: "Insatisfatório", points: 0 },
    { value: 2, label: "Ruim", points: 10 },
    { value: 3, label: "Regular", points: 20 },
    { value: 4, label: "Bom", points: 30 },
    { value: 5, label: "Excelente", points: 40 },
  ],
  complimentEnabled: true,
  complimentPoints: 0,
  complimentApproval: true,
  bronze: 70,
  silver: 80,
  gold: 90,
  diamondSeasons: 2,
  minimumCycles: 2,
  allowSkip: true,
  allowUnable: true,
  allowLate: false,
  allowReevaluate: true,
  evaluatorWeights: {},
  tieBreak: ["technical", "posture", "communication", "compliments", "oldest"],
  hideBeforePublication: true,
  autoPublish: false,
  autoClose: false,
});
export const schemas: Partial<Record<Table, z.ZodType>> = {
  clients: z.object({
    name: text,
    cnpj: z.string().max(30).default(""),
    segment: z.string().max(100).default(""),
    responsible: z.string().max(150).default(""),
    email: z.union([z.email(), z.literal("")]).default(""),
    phone: z.string().max(40).default(""),
    postIds: z.array(text).default([]),
    status: z.enum(["ativo", "inativo", "implantacao"]).default("ativo"),
  }),
  posts: z.object({
    name: text,
    code: z.string().max(50).default(""),
    address: z.string().max(400).default(""),
    status: z.enum(["ativo", "inativo"]).default("ativo"),
  }),
  clientPosts: z.object({ clientId: text, postId: text }),
  employees: z.object({
    name: text,
    cpf: z.string().transform(normalizeCpf).refine(validCpf, "CPF inválido"),
    registration: text,
    role: text,
    admissionDate: date,
    photo: z.string().max(2_800_000).refine(
      (value) => !value || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value),
      "Envie uma foto PNG, JPEG ou WebP válida",
    ).default(""),
    status: z.enum(["ativo", "inativo", "licenca"]).default("ativo"),
  }),
  allocations: z.object({
    employeeId: text,
    clientId: text,
    postId: text,
    supervisorId: z.string().default(""),
    start: date,
  }),
  penaltyTypes: z.object({
    name: text,
    description: z.string().trim().max(500).default(""),
    points: z.number().int().min(0).max(100000),
    status: z.enum(["ativo", "inativo"]).default("ativo"),
  }),
  seasons: z.object({ name: text, start: date, end: date, publishDate: date }),
  cycles: z.object({
    name: text,
    seasonId: text,
    start: date,
    end: date,
    deadline: date,
    clientStart: date.optional(),
    clientDeadline: date.optional(),
    supervisorStart: date.optional(),
    supervisorDeadline: date.optional(),
  }),
  roles: z.object({
    name: text,
    permissions: z.array(z.enum(permissions)),
    globalScope: z.boolean(),
  }),
  users: z.object({
    name: text,
    email: z.email().transform((v) => v.toLowerCase()),
    roleId: text,
    clientIds: z.array(text).default([]),
    postIds: z.array(text).default([]),
    status: z.enum(["ativo", "inativo"]).default("ativo"),
    password: z.string().min(10).max(128).optional(),
  }),
};
export async function audit(
  db: TenantStore,
  actor: string,
  action: string,
  entity: string,
  details: unknown = {},
) {
  await db.put("audit", {
    id: id(),
    actor,
    action,
    entity,
    details,
    date: now(),
  });
}
export async function must(db: TenantStore, table: Table, key: string) {
  const row = await db.get(table, key);
  if (!row) throw new HttpError(404, "Registro não encontrado");
  return row;
}
export function canSee(
  user: RecordData,
  role: RecordData,
  context: RecordData,
) {
  const profile = String(role.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    role.globalScope ||
    (profile === "cliente"
      ? user.clientIds?.includes(context.clientId)
      : user.postIds?.length
      ? user.postIds.includes(context.postId || context.id)
      : user.clientIds?.includes(context.clientId))
  );
}
export function scoreEvaluation(
  rules: any,
  answers: any[],
  compliment: string,
  approved: boolean,
) {
  assert(
    Array.isArray(answers) && answers.length === rules.criteria.length,
    "Preencha todos os critérios",
  );
  assert(
    new Set(answers.map((a) => a.criterionId)).size === answers.length,
    "Critérios duplicados",
  );
  const scored = rules.criteria.map((c: any) => {
    const a = answers.find((a) => a.criterionId === c.id);
    const option = rules.scale.find((s: any) => s.value === a?.value);
    assert(option, "Nota inválida");
    const comment = String(a.comment || "").trim();
    assert(comment.length <= 500, "Comentário excede 500 caracteres");
    assert(
      !(c.requiredComment || option.value < c.justifyBelow) ||
        comment.length >= 3,
      `Justifique a nota em ${c.name}`,
    );
    return {
      criterionId: c.id,
      name: c.name,
      value: option.value,
      points: option.points * c.weight,
      weight: c.weight,
      comment,
    };
  });
  assert(compliment.length <= 500, "Elogio excede 500 caracteres");
  assert(!compliment || rules.complimentEnabled, "Elogios desabilitados");
  const criteriaPoints = scored.reduce(
    (sum: number, a: any) => sum + a.points,
    0,
  );
  const complimentPoints = compliment && approved ? rules.complimentPoints : 0;
  return {
    answers: scored,
    criteriaPoints,
    complimentPoints,
    score: criteriaPoints + complimentPoints,
  };
}
export function classify(score: number, rules: any) {
  return score >= rules.gold
    ? "ouro"
    : score >= rules.silver
      ? "prata"
      : score >= rules.bronze
        ? "bronze"
        : null;
}
export function rankingRows(
  season: RecordData,
  cycles: RecordData[],
  participants: RecordData[],
  evaluations: RecordData[],
  employeeActions: RecordData[] = [],
) {
  const relevant = cycles.filter((c) => c.seasonId === season.id);
  const ids = new Set(relevant.map((c) => c.id));
  const groups = new Map<string, RecordData[]>();
  for (const p of participants.filter(
    (p) => ids.has(p.cycleId) && p.eligible !== false,
  )) {
    const g = groups.get(p.employeeId) || [];
    g.push(p);
    groups.set(p.employeeId, g);
  }
  const rows: RecordData[] = [];
  for (const [employeeId, ps] of groups) {
    const cycleScores: number[] = [];
    const criteria: Record<string, number> = {};
    let compliments = 0;
    let count = 0;
    let oldest = "9999";
    for (const p of ps) {
      const es = evaluations.filter(
        (e) => e.participantId === p.id && e.status === "enviada",
      );
      if (!es.length) continue;
      const weight = (e: RecordData) =>
        season.rules.evaluatorWeights[e.roleId] ?? 1;
      const totalWeight = es.reduce((s, e) => s + weight(e), 0);
      cycleScores.push(
        es.reduce((s, e) => s + e.score * weight(e), 0) / totalWeight,
      );
      for (const e of es) {
        count++;
        if (e.complimentApproved && e.compliment) compliments++;
        oldest = oldest < e.sentAt ? oldest : e.sentAt;
        for (const a of e.answers)
          criteria[a.criterionId] =
            (criteria[a.criterionId] || 0) +
            (a.points * weight(e)) / totalWeight;
      }
    }
    for (const criterionId of Object.keys(criteria)) {
      criteria[criterionId] /= cycleScores.length;
    }
    const rawScore = cycleScores.length
      ? cycleScores.reduce((a, b) => a + b, 0) / cycleScores.length
      : 0;
    const penaltyPoints = employeeActions
      .filter((a) => a.employeeId === employeeId && a.seasonId === season.id && a.type === "penalty" && a.status === "ativo")
      .reduce((sum, a) => sum + Number(a.points || 0), 0);
    const score = Math.max(0, rawScore - penaltyPoints);
    const eligible = cycleScores.length >= season.rules.minimumCycles;
    rows.push({
      id: employeeId,
      employeeId,
      ...ps[0].snapshot,
      score: Math.round(score * 100) / 100,
      rawScore: Math.round(rawScore * 100) / 100,
      penaltyPoints,
      cycles: cycleScores.length,
      evaluations: count,
      eligible,
      badge: eligible ? classify(score, season.rules) : (count > 0 ? classify(score, season.rules) : null),
      criteria,
      compliments,
      oldest,
    });
  }
  rows.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    if (a.score !== b.score) return b.score - a.score;
    for (const tie of season.rules.tieBreak) {
      const d =
        tie === "oldest"
          ? a.oldest.localeCompare(b.oldest)
          : tie === "compliments"
            ? b.compliments - a.compliments
            : (b.criteria[tie] || 0) - (a.criteria[tie] || 0);
      if (d) return d;
    }
    return a.employeeId.localeCompare(b.employeeId);
  });
  let position = 0;
  return rows.map((r): RecordData => ({ ...r, position: (r.eligible || r.evaluations > 0 || r.score > 0) ? ++position : null }));
}
