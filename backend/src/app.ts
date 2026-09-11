import express from "express";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { validateWorkbookArchive } from "./xlsx-guard.ts";
import { z } from "zod";
import { Store, TenantStore, type RecordData, type Table } from "./db.ts";
import {
  id,
  now,
  today,
  HttpError,
  assert,
  defaultRules,
  rulesSchema,
  schemas,
  permissions,
  audit,
  must,
  canSee,
  scoreEvaluation,
  rankingRows,
  classify,
  normalizeCpf,
  validCpf,
} from "./domain.ts";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordValid(password: string, encoded: string) {
  try {
    const [salt, key] = encoded.split(":");
    if (!salt || !key || !/^[a-f0-9]{128}$/i.test(key)) return false;
    return timingSafeEqual(
      scryptSync(password, salt, 64),
      Buffer.from(key, "hex"),
    );
  } catch {
    return false;
  }
}
const safeUser = (u: RecordData) => {
  const { passwordHash: _, ...rest } = u;
  return rest;
};
const normalizedName = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const employeeLoginLocal = (name: string) =>
  normalizedName(name).trim().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "colaborador";
function completesMonthsOn(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return `${targetYear}-${String(normalizedMonth + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}
const hasMinimumTenure = (admissionDate: string, reference = today()) =>
  Boolean(admissionDate) && completesMonthsOn(admissionDate, 3) <= reference;
type Context = { db: TenantStore; user: RecordData; role: RecordData };
const cookie = (req: express.Request) =>
  req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("clube_session="))
    ?.slice(14) || "";
export function createApp(store: Store) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'",
    );
    if (process.env.NODE_ENV === "production")
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "12mb" }));
  app.use("/api", (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin
    ) {
      const expected =
        process.env.APP_ORIGIN || `${req.protocol}://${req.get("host")}`;
      const allowedOrigins = new Set([expected]);
      try {
        const configured = new URL(expected);
        if (["localhost", "127.0.0.1"].includes(configured.hostname)) {
          const port = configured.port ? `:${configured.port}` : "";
          allowedOrigins.add(`${configured.protocol}//localhost${port}`);
          allowedOrigins.add(`${configured.protocol}//127.0.0.1${port}`);
        }
      } catch {
        // Uma APP_ORIGIN inválida continuará aceitando somente o valor literal.
      }
      const origin = req.headers.origin;
      const isAllowedDevOrigin =
        process.env.NODE_ENV !== "production" &&
        Boolean(
          origin &&
            (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
              /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
              /^https?:\/\/.*?\.(loca\.lt|devtunnels\.ms|ngrok(-free)?\.app|trycloudflare\.com|pinggy\.link|app\.github\.dev)(:\d+)?$/.test(origin))
        );

      if (
        !allowedOrigins.has(req.headers.origin) &&
        !isAllowedDevOrigin
      )
        return next(new HttpError(403, "Origem não autorizada"));
    }
    next();
  });
  const route =
    (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
    (req: express.Request, res: express.Response, next: express.NextFunction) =>
      store.exclusive(() => fn(req, res)).catch(next);
  const context = async (
    req: express.Request,
    permission?: string,
  ): Promise<Context> => {
    const token = cookie(req);
    const session = token
      ? await store.get("sessions", hash(token))
      : undefined;
    assert(session && session.expires > now(), "Entre para continuar", 401);
    const user = await store.get("users", session.userId);
    assert(user && user.status === "ativo", "Acesso indisponível", 401);
    const db = new TenantStore(store, user.tenantId);
    let role = await must(db, "roles", user.roleId);
    const profile = normalizedName(role.name);
    const evaluatorProfile = ["cliente", "supervisor", "fiscal"].includes(profile);
    const enforcedPermissions = evaluatorProfile
      ? ["evaluate", "ranking"]
      : role.permissions.filter((item: string) => item !== "evaluate");
    if (
      ["administrador", "analista combate", "colaborador", "cliente", "supervisor", "fiscal"].includes(profile) &&
      (enforcedPermissions.length !== role.permissions.length ||
        enforcedPermissions.some((item: string, index: number) => item !== role.permissions[index]))
    )
      role = await db.put("roles", { ...role, permissions: enforcedPermissions, updatedAt: now() });
    assert(
      !permission || !user.mustChangePassword,
      "Troque sua senha inicial antes de continuar",
      403,
    );
    assert(
      !permission || role.permissions.includes(permission),
      "Você não tem permissão para esta ação",
      403,
    );
    return { db, user, role };
  };
  async function startSession(res: express.Response, user: RecordData) {
    const token = randomBytes(32).toString("hex");
    await store.put("sessions", {
      id: hash(token),
      userId: user.id,
      tenantId: user.tenantId,
      expires: new Date(Date.now() + 8 * 3600000).toISOString(),
    });
    res.cookie("clube_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600000,
      path: "/",
    });
  }
  app.get(
    "/api/health",
    route(async (_req, res) => {
      await store.query("SELECT 1 AS healthy");
      res.json({ ok: true, database: store.postgres ? "postgres" : "sqlite" });
    }),
  );
  app.get(
    "/api/auth/status",
    route(async (req, res) => {
      const initialized = (await store.all("organizations")).length > 0;
      try {
        const c = await context(req);
        res.json({ initialized, user: safeUser(c.user), role: c.role });
      } catch {
        res.json({ initialized, user: null });
      }
    }),
  );
  app.post(
    "/api/auth/setup",
    route(async (req, res) => {
      assert(
        (await store.all("organizations")).length === 0,
        "A empresa já foi configurada",
        409,
      );
      const input = z
        .object({
          company: z.string().trim().min(2).max(120),
          name: z.string().trim().min(2).max(100),
          email: z.email(),
          password: z.string().min(10).max(128),
        })
        .parse(req.body);
      const user = await store.transaction(async () => {
        const tenantId = id();
        await store.put("organizations", {
          id: tenantId,
          slug: "principal",
          name: input.company,
        });
        const db = new TenantStore(store, tenantId);
        const admin = await db.put("roles", {
          id: id(),
          name: "Administrador",
          permissions: permissions.filter((permission) => permission !== "evaluate"),
          globalScope: true,
        });
        await db.put("roles", {
          id: id(),
          name: "Analista Combate",
          permissions: permissions.filter(
            (p) => !["users", "settings", "evaluate"].includes(p),
          ),
          globalScope: true,
        });
        for (const name of ["Cliente", "Supervisor", "Fiscal"])
          await db.put("roles", {
            id: id(),
            name,
            permissions: ["evaluate", "ranking"],
            globalScope: false,
          });
        await db.put("roles", {
          id: id(),
          name: "Colaborador",
          permissions: ["dashboard", "ranking"],
          globalScope: false,
        });
        const u = await db.put("users", {
          id: id(),
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: passwordHash(input.password),
          roleId: admin.id,
          status: "ativo",
          clientIds: [],
          postIds: [],
          createdAt: now(),
        });
        await db.put("settings", {
          id: `${tenantId}-rules`,
          rules: defaultRules,
          employeeEmailDomain: "",
          version: 1,
          updatedAt: now(),
        });
        await audit(db, u.id, "configuracao_inicial", tenantId, {});
        return u;
      });
      await startSession(res, user);
      res.status(201).json({ user: safeUser(user) });
    }),
  );
  const attempts = new Map<string, { count: number; until: number }>();
  app.post(
    "/api/auth/login",
    route(async (req, res) => {
      const input = z
        .object({ email: z.email(), password: z.string().max(128) })
        .parse(req.body);
      const key = `${req.ip}:${input.email.toLowerCase()}`;
      const entry = attempts.get(key);
      assert(
        !entry || entry.until < Date.now() || entry.count < 8,
        "Muitas tentativas. Aguarde 15 minutos.",
        429,
      );
      const user = (await store.all("users")).find(
        (u) => u.email === input.email.toLowerCase(),
      );
      if (
        !user ||
        user.status !== "ativo" ||
        !passwordValid(input.password, user.passwordHash)
      ) {
        attempts.set(key, {
          count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
          until: Date.now() + 900000,
        });
        throw new HttpError(401, "E-mail ou senha incorretos");
      }
      attempts.delete(key);
      await startSession(res, user);
      await audit(
        new TenantStore(store, user.tenantId),
        user.id,
        "login",
        user.id,
      );
      res.json({ user: safeUser(user) });
    }),
  );
  app.post(
    "/api/auth/logout",
    route(async (req, res) => {
      await store.remove("sessions", hash(cookie(req)));
      res.clearCookie("clube_session", { path: "/" });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/auth/password",
    route(async (req, res) => {
      const { db, user } = await context(req);
      const input = z
        .object({
          current: z.string().max(128),
          password: z.string().min(10).max(128),
        })
        .parse(req.body);
      assert(
        passwordValid(input.current, user.passwordHash),
        "Senha atual incorreta",
      );
      await db.put("users", {
        ...user,
        passwordHash: passwordHash(input.password),
        mustChangePassword: false,
      });
      for (const s of await db.all("sessions"))
        if (s.userId === user.id) await db.remove("sessions", s.id);
      await startSession(res, user);
      res.json({ ok: true });
    }),
  );
  async function seasonRanking(db: TenantStore, season: RecordData) {
    if (season.result) return season.result;
    return rankingRows(
      season,
      await db.all("cycles"),
      await db.all("participants"),
      await db.all("evaluations"),
      await db.all("employeeActions"),
    );
  }
  async function refreshParticipantEligibility(db: TenantStore, employeeId: string, seasonId: string) {
    const actions = (await db.all("employeeActions")).filter(
      (a) => a.employeeId === employeeId && a.seasonId === seasonId && a.status === "ativo" && ["cycle_block", "season_suspension"].includes(a.type),
    );
    for (const participant of (await db.all("participants")).filter(
      (p) => p.employeeId === employeeId && p.seasonId === seasonId,
    )) {
      const blocking = actions.find(
        (a) => a.type === "season_suspension" || (a.type === "cycle_block" && a.cycleId === participant.cycleId),
      );
      await db.put("participants", {
        ...participant,
        eligible: !blocking,
        ineligibility: blocking
          ? { actionId: blocking.id, type: blocking.type, reason: blocking.reason }
          : null,
      });
    }
  }
  async function syncEmployeeParticipants(
    db: TenantStore,
    employeeId: string,
    suppliedRecords?: Partial<Record<Table, RecordData[]>>,
  ) {
    const records: Partial<Record<Table, RecordData[]>> = suppliedRecords || await db.allMany([
      "employees", "allocations", "posts", "clientPosts", "clients", "cycles",
      "participants", "evaluations", "employeeActions",
    ]);
    const employee = records.employees!.find((item) => item.id === employeeId);
    if (!employee) return;
    const allocations = records.allocations!
      .filter((item) => item.employeeId === employeeId)
      .sort((a, b) => String(b.start).localeCompare(String(a.start)));
    for (const cycle of records.cycles!.filter((item) => item.status === "ativo")) {
      const existing = records.participants!.find(
        (item) => item.cycleId === cycle.id && item.employeeId === employeeId,
      );
      const hasFinalEvaluation = existing && records.evaluations!.some(
        (item) => item.participantId === existing.id && item.status !== "rascunho",
      );
      // Avaliações concluídas preservam o retrato histórico do momento do envio.
      if (hasFinalEvaluation) continue;
      const allocation = allocations.find(
        (item) => item.start <= cycle.end && (!item.end || item.end > cycle.start),
      );
      const post = allocation
        ? records.posts!.find((item) => item.id === allocation.postId)
        : undefined;
      const client = allocation
        ? records.clients!.find((item) => item.id === allocation.clientId)
        : undefined;
      const blocking = records.employeeActions!.find(
        (action) =>
          action.employeeId === employeeId &&
          action.seasonId === cycle.seasonId &&
          action.status === "ativo" &&
          (action.type === "season_suspension" ||
            (action.type === "cycle_block" && action.cycleId === cycle.id)),
      );
      const tenureEligible = hasMinimumTenure(employee.admissionDate);
      const validLink = employee.status === "ativo" && tenureEligible && allocation &&
        post?.status === "ativo" && client?.status === "ativo";
      if (!validLink) {
        if (existing) {
          const next = {
            ...existing,
            eligible: false,
            ineligibility: {
              type: tenureEligible ? "cadastro_alocacao" : "tempo_de_empresa",
              reason: tenureEligible
                ? "Colaborador sem cadastro e alocação ativos para este ciclo"
                : "Colaborador ainda não completou três meses de empresa",
            },
          };
          if (existing.eligible !== false || existing.ineligibility?.type !== next.ineligibility.type) {
            await db.put("participants", next);
            Object.assign(existing, next);
          }
        }
        continue;
      }
      const next = {
        ...existing,
        id: existing?.id || id(),
        cycleId: cycle.id,
        seasonId: cycle.seasonId,
        employeeId,
        allocationId: allocation.id,
        eligible: !blocking,
        ineligibility: blocking
          ? { actionId: blocking.id, type: blocking.type, reason: blocking.reason }
          : null,
        snapshot: {
          name: employee.name,
          photo: employee.photo || "",
          registration: employee.registration,
          role: employee.role,
          client: client.name,
          clientId: client.id,
          post: post.name,
          postId: post.id,
          supervisorId: allocation.supervisorId || "",
        },
      };
      const unchanged = existing &&
        existing.allocationId === next.allocationId &&
        existing.eligible === next.eligible &&
        existing.ineligibility?.actionId === next.ineligibility?.actionId &&
        existing.snapshot?.name === next.snapshot.name &&
        existing.snapshot?.photo === next.snapshot.photo &&
        existing.snapshot?.registration === next.snapshot.registration &&
        existing.snapshot?.role === next.snapshot.role &&
        existing.snapshot?.clientId === next.snapshot.clientId &&
        existing.snapshot?.postId === next.snapshot.postId &&
        existing.snapshot?.supervisorId === next.snapshot.supervisorId;
      if (!unchanged) {
        const saved = await db.put("participants", next);
        if (existing) Object.assign(existing, saved);
        else records.participants!.push(saved);
      }
    }
  }
  async function publish(db: TenantStore, userId: string, season: RecordData) {
    assert(
      ["encerrada", "publicada"].includes(season.status),
      "Encerre a temporada antes de publicar",
    );
    assert(!season.result, "Resultado já publicado", 409);
    let rows = await seasonRanking(db, season);
    const previous = (await db.all("seasons"))
      .filter((s) => s.start < season.start && s.status !== "cancelada")
      .sort((a, b) => b.start.localeCompare(a.start))
      .slice(0, season.rules.diamondSeasons - 1);
    rows = rows.map((r: RecordData) => ({
      ...r,
      badge:
        r.badge === "ouro" &&
        previous.length === season.rules.diamondSeasons - 1 &&
        previous.every((s) =>
          s.result?.some(
            (old: RecordData) =>
              old.employeeId === r.employeeId &&
              ["ouro", "diamante"].includes(old.badge),
          ),
        )
          ? "diamante"
          : r.badge,
    }));
    await db.put("seasons", {
      ...season,
      result: rows,
      status: "publicada",
      publishedAt: now(),
    });
    await audit(db, userId, "publicar_resultado", season.id);
  }
  // Replica a avaliação de um avaliador para o outro quando apenas um dos
  // dois tipos (cliente vs supervisor/fiscal) enviou dentro do prazo do ciclo.
  async function replicateMissingEvaluations(db: TenantStore, cycleId: string) {
    const roles = await db.all("roles");
    const clientRoleIds = new Set(
      roles.filter((r) => normalizedName(r.name) === "cliente").map((r) => r.id),
    );
    const supervisorRoleIds = new Set(
      roles
        .filter((r) => ["supervisor", "fiscal"].includes(normalizedName(r.name)))
        .map((r) => r.id),
    );
    const participants = (await db.all("participants")).filter(
      (p) => p.cycleId === cycleId && p.eligible !== false,
    );
    const allEvaluations = await db.all("evaluations");
    for (const participant of participants) {
      const pEvals = allEvaluations.filter(
        (e) => e.participantId === participant.id && e.status === "enviada" && !e.replicated,
      );
      if (!pEvals.length) continue;
      const clientEval = pEvals.find((e) => clientRoleIds.has(e.roleId));
      const supervisorEval = pEvals.find((e) => supervisorRoleIds.has(e.roleId));
      // Ambos já avaliaram — nada a replicar
      if (clientEval && supervisorEval) continue;
      const source = clientEval || supervisorEval;
      if (!source) continue;
      // Encontra o roleId do tipo que faltou avaliar
      const missingRoleId = clientEval
        ? [...supervisorRoleIds][0]
        : [...clientRoleIds][0];
      const missingRoleName = clientEval ? "Supervisor" : "Cliente";
      if (!missingRoleId) continue;
      // Verifica se já existe replicação anterior para evitar duplicatas
      const alreadyReplicated = allEvaluations.some(
        (e) => e.participantId === participant.id && e.replicated && e.replicatedFrom === source.id,
      );
      if (alreadyReplicated) continue;
      await db.put("evaluations", {
        ...source,
        id: id(),
        evaluatorId: "sistema",
        evaluator: `Sistema (nota replicada de ${source.evaluator})`,
        roleId: missingRoleId,
        evaluatorRole: missingRoleName,
        status: "enviada",
        replicated: true,
        replicatedFrom: source.id,
        sentAt: now(),
        createdAt: now(),
      });
      await audit(db, "sistema", "replicar_avaliacao", participant.id, {
        sourceEvaluatorId: source.evaluatorId,
        missingRoleName,
      });
    }
  }
  async function tick(db: TenantStore) {
    for (const season of await db.all("seasons")) {
      if (season.status === "ativa" && season.rules?.autoClose) {
        const cycles = (await db.all("cycles")).filter(
          (c) => c.seasonId === season.id,
        );
        for (const c of cycles)
          if (c.status === "ativo" && c.deadline < today()) {
            await replicateMissingEvaluations(db, c.id);
            await db.put("cycles", { ...c, status: "encerrado" });
          }
        if (
          season.end < today() &&
          cycles.every((c) => c.deadline < today() && c.status !== "planejado")
        )
          await db.put("seasons", { ...season, status: "encerrada" });
      }
      const s = await must(db, "seasons", season.id);
      if (
        s.status === "encerrada" &&
        s.rules?.autoPublish &&
        s.publishDate <= today()
      )
        await publish(db, "sistema", s);
    }
  }
  app.get(
    "/api/state",
    route(async (req, res) => {
      const { db, user, role } = await context(req);
      await tick(db);
      const org = await store.get("organizations", db.tenantId);
      const records = await db.allMany([
        "clients", "posts", "clientPosts", "allocations", "employees", "participants",
        "evaluations", "seasons", "cycles", "employeeActions", "penaltyTypes",
        "users", "roles", "imports", "settings", "audit",
      ]);
      // Autorrecuperação: mantém participantes de ciclos ativos sincronizados com
      // colaboradores e vínculos sem exigir que o usuário visite outra tela.
      if (records.cycles!.some((item) => item.status === "ativo"))
        for (const employee of records.employees!)
          await syncEmployeeParticipants(db, employee.id, records);
      const allClients = records.clients!, allPosts = records.posts!, allClientPosts = records.clientPosts!,
        allAllocations = records.allocations!, allEmployees = records.employees!,
        allParticipants = records.participants!, allEvaluations = records.evaluations!,
        seasons = records.seasons!, cycles = records.cycles!,
        employeeActions = records.employeeActions!, penaltyTypes = records.penaltyTypes!,
        allUsers = records.users!, allRoles = records.roles!, imports = records.imports!,
        settings = records.settings![0], auditRows = records.audit!;
      const employeeAccount = Boolean(user.employeeId);
      const clientPosts = allClientPosts.filter((link) =>
        canSee(user, role, { id: link.postId, postId: link.postId, clientId: link.clientId }),
      );
      const visiblePostIds = new Set(clientPosts.map((link) => link.postId));
      const posts = allPosts
        .filter((post) => role.globalScope || visiblePostIds.has(post.id))
        .map((post) => ({
          ...post,
          clientIds: allClientPosts.filter((link) => link.postId === post.id).map((link) => link.clientId),
        }));
      const postIds = new Set(posts.map((p) => p.id));
      const clients = allClients
        .filter((client) => role.globalScope || user.clientIds.includes(client.id))
        .map((client) => ({
          ...client,
          postIds: allClientPosts.filter((link) => link.clientId === client.id).map((link) => link.postId),
        }));
      const allocations = allAllocations.filter(
        (allocation) => role.globalScope || (
          postIds.has(allocation.postId) &&
          canSee(user, role, { id: allocation.postId, postId: allocation.postId, clientId: allocation.clientId })
        ),
      );
      const employeeIds = new Set(allocations.map((a) => a.employeeId));
      const employees = allEmployees.filter((e) =>
        employeeAccount ? e.id === user.employeeId : role.globalScope || employeeIds.has(e.id),
      ).map((employee) => role.globalScope ? employee : ({ ...employee, cpf: undefined }));
      const scopeParticipants = allParticipants.filter((p) => {
        if (!canSee(user, role, p.snapshot)) return false;
        if (employeeAccount) return p.employeeId === user.employeeId;
        return true;
      });
      const participants = scopeParticipants.filter((p) => {
        if (!role.globalScope && role.permissions.includes("evaluate")) {
          const profile = normalizedName(role.name);
          // Clientes veem todos os participantes do seu clientId (canSee já filtrou acima)
          if (profile === "cliente") return true;
          // Supervisores/Fiscais: apenas participantes atribuídos a eles ou sem atribuição
          const assigned = p.snapshot?.supervisorId;
          if (assigned && assigned !== user.id) return false;
        }
        return true;
      });
      const participantIds = new Set(scopeParticipants.map((p) => p.id));
      // Avaliação cega: avaliadores só enxergam a própria avaliação enquanto o ciclo estiver ativo.
      // Gestores (permissão "evaluations") e colaboradores veem tudo normalmente.
      const activeCycleIds = new Set(
        cycles.filter((c) => c.status === "ativo").map((c) => c.id),
      );
      const evaluations = allEvaluations.filter((e) => {
        if (!participantIds.has(e.participantId)) return false;
        // Gestores e colaboradores enxergam tudo
        if (role.permissions.includes("evaluations") || employeeAccount) return true;
        // Avaliadores em ciclo ativo: apenas sua própria avaliação
        if (role.permissions.includes("evaluate") && activeCycleIds.has(e.cycleId))
          return e.evaluatorId === user.id;
        // Ciclo encerrado/publicado: enxerga tudo no seu escopo
        return true;
      });
      const rankings: Record<string, unknown> = {};
      if (role.permissions.includes("ranking"))
        for (const s of seasons) {
          if (!s.rules) continue;
          if (
            s.rules.hideBeforePublication &&
            s.status !== "publicada" &&
            !role.globalScope
          )
            continue;
          const rows = s.result || rankingRows(s, cycles, allParticipants, allEvaluations, employeeActions);
          rankings[s.id] = rows.filter((r: RecordData) =>
            employeeAccount ? user.clientIds?.includes(r.clientId) : canSee(user, role, r),
          );
        }
      // Alerta de colaboradores sem nenhuma avaliação (para admins e analistas)
      const unevaluatedAlert = role.globalScope
        ? (() => {
            const alertCycleIds = new Set(
              cycles
                .filter((c) => ["ativo", "encerrado"].includes(c.status))
                .map((c) => c.id),
            );
            return allParticipants
              .filter(
                (p) =>
                  alertCycleIds.has(p.cycleId) &&
                  p.eligible !== false &&
                  !allEvaluations.some(
                    (e) => e.participantId === p.id && e.status === "enviada" && !e.replicated,
                  ),
              )
              .map((p) => ({
                participantId: p.id,
                cycleId: p.cycleId,
                employeeId: p.employeeId,
                name: p.snapshot?.name,
                client: p.snapshot?.client,
                clientId: p.snapshot?.clientId,
                post: p.snapshot?.post,
              }));
          })()
        : [];
      res.json({
        organization: org?.name,
        user: safeUser(user),
        role,
        clients,
        posts,
        clientPosts,
        employees,
        allocations,
        employeeAccessDomain: role.globalScope && role.permissions.includes("employees")
          ? settings?.employeeEmailDomain || ""
          : "",
        penaltyTypes: role.globalScope && role.permissions.includes("employees")
          ? penaltyTypes
          : [],
        employeeActions: role.globalScope && role.permissions.includes("employees")
          ? employeeActions
          : [],
        participants,
        evaluations,
        seasons: seasons.map((s) => ({ ...s, result: undefined })),
        cycles,
        rankings,
        unevaluatedAlert,
        users: role.permissions.includes("users")
          ? allUsers.map(safeUser)
          : [safeUser(user)],
        roles: role.permissions.includes("users")
          ? allRoles
          : [role],
        imports: role.permissions.includes("imports")
          ? imports
          : [],
        settings: role.permissions.includes("settings")
          ? settings
          : null,
        audit: role.permissions.includes("settings")
          ? auditRows
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 300)
          : [],
      });
    }),
  );
  const tablePermission: Partial<Record<Table, string>> = {
    clients: "clients",
    posts: "clients",
    clientPosts: "clients",
    employees: "employees",
    allocations: "employees",
    penaltyTypes: "settings",
    seasons: "seasons",
    cycles: "seasons",
    users: "users",
    roles: "users",
  };
  app.post(
    "/api/employee-actions",
    route(async (req, res) => {
      const { db, user, role } = await context(req, "employees");
      assert(role.globalScope, "Gestão de ocorrências reservada ao administrador", 403);
      const input = z.object({
        employeeId: z.uuid(),
        type: z.enum(["penalty", "cycle_block", "season_suspension"]),
        penaltyTypeId: z.string().default(""),
        seasonId: z.uuid(),
        cycleId: z.string().default(""),
        reason: z.string().trim().min(3).max(1000),
        attachment: z.object({
          name: z.string().trim().min(1).max(180),
          type: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
          data: z.string().max(4_300_000),
        }).optional(),
      }).parse(req.body);
      const result = await store.transaction(async () => {
        await must(db, "employees", input.employeeId);
        const season = await must(db, "seasons", input.seasonId);
        assert(season.status !== "publicada", "A temporada já foi publicada");
        let cycle: RecordData | undefined;
        if (input.type === "cycle_block") {
          assert(input.cycleId, "Selecione o ciclo");
          cycle = await must(db, "cycles", input.cycleId);
          assert(cycle.seasonId === season.id, "O ciclo não pertence à temporada");
        }
        let penaltyType: RecordData | undefined;
        if (input.type === "penalty") {
          assert(input.penaltyTypeId, "Selecione a penalidade");
          penaltyType = await must(db, "penaltyTypes", input.penaltyTypeId);
          assert(penaltyType.status === "ativo", "Esta penalidade está inativa");
        }
        if (input.attachment)
          assert(input.attachment.data.startsWith("data:"), "Arquivo inválido");
        const action = await db.put("employeeActions", {
          id: id(),
          employeeId: input.employeeId,
          type: input.type,
          penaltyTypeId: penaltyType?.id || "",
          penaltyName: penaltyType?.name || "",
          points: penaltyType?.points || 0,
          seasonId: season.id,
          cycleId: cycle?.id || null,
          reason: input.reason,
          attachment: input.attachment || null,
          status: "ativo",
          appliedAt: now(),
          appliedBy: user.id,
        });
        await refreshParticipantEligibility(db, input.employeeId, season.id);
        await audit(db, user.id, "aplicar_ocorrencia", action.id, { employeeId: input.employeeId, type: input.type });
        return action;
      });
      res.json(result);
    }),
  );
  app.post(
    "/api/employee-actions/:id/revoke",
    route(async (req, res) => {
      const { db, user, role } = await context(req, "employees");
      assert(role.globalScope, "Gestão de ocorrências reservada ao administrador", 403);
      await store.transaction(async () => {
        const action = await must(db, "employeeActions", String(req.params.id));
        assert(action.status === "ativo", "Ocorrência já cancelada");
        await db.put("employeeActions", { ...action, status: "cancelado", revokedAt: now(), revokedBy: user.id });
        await refreshParticipantEligibility(db, action.employeeId, action.seasonId);
        await audit(db, user.id, "cancelar_ocorrencia", action.id);
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/employees/save",
    route(async (req, res) => {
      const { db, user, role } = await context(req, "employees");
      assert(role.globalScope, "Gestão reservada a um perfil com acesso global", 403);
      const input = z.object({
        id: z.uuid().optional(),
        name: z.string().trim().min(1).max(200),
        cpf: z.string().transform(normalizeCpf).refine(validCpf, "CPF inválido"),
        registration: z.string().trim().min(1).max(200),
        role: z.string().trim().min(1).max(200),
        admissionDate: z.iso.date(),
        photo: z.string().max(2_800_000).refine(
          (value) => !value || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value),
          "Envie uma foto PNG, JPEG ou WebP válida",
        ).default(""),
        status: z.enum(["ativo", "inativo", "licenca"]).default("ativo"),
        clientId: z.string().default(""),
        postId: z.string().default(""),
        supervisorId: z.string().default(""),
        allocationStart: z.iso.date().optional(),
        newLocation: z.object({
          clientName: z.string().trim().min(1).max(200),
          segment: z.string().trim().max(100).default(""),
          postName: z.string().trim().min(1).max(200),
          code: z.string().trim().max(50).default(""),
          address: z.string().trim().max(400).default(""),
        }).optional(),
      }).parse(req.body);
      const key = input.id || id();
      const old = input.id ? await must(db, "employees", input.id) : undefined;
      const result = await store.transaction(async () => {
        assert(
          !(await db.all("employees")).some((employee) => employee.id !== key && employee.cpf === input.cpf),
          "Já existe um colaborador com este CPF",
          409,
        );
        let post: RecordData | undefined;
        if (input.newLocation) {
          assert(role.permissions.includes("clients"), "Seu perfil não pode criar clientes e postos", 403);
          const client = await db.put("clients", {
            id: id(),
            name: input.newLocation.clientName,
            cnpj: "",
            segment: input.newLocation.segment,
            responsible: "",
            email: "",
            phone: "",
            status: "ativo",
            createdAt: now(),
            updatedAt: now(),
          });
          post = await db.put("posts", {
            id: id(),
            name: input.newLocation.postName,
            code: input.newLocation.code,
            address: input.newLocation.address,
            status: "ativo",
            createdAt: now(),
            updatedAt: now(),
          });
          await db.put("clientPosts", {
            id: id(),
            clientId: client.id,
            postId: post.id,
            createdAt: now(),
          });
        } else if (input.postId) {
          post = await must(db, "posts", input.postId);
          assert(post.status === "ativo", "Selecione um posto ativo");
          assert(input.clientId, "Selecione a empresa do colaborador");
          assert(
            (await db.all("clientPosts")).some(
              (link) => link.clientId === input.clientId && link.postId === post!.id,
            ),
            "Este posto não está disponível para a empresa selecionada",
          );
        }
        const assignedUser = input.supervisorId ? await must(db, "users", input.supervisorId) : undefined;
        let saved = await db.put("employees", {
          ...old,
          id: key,
          name: input.name,
          cpf: input.cpf,
          registration: input.registration,
          role: input.role,
          admissionDate: input.admissionDate,
          photo: input.photo,
          status: input.status,
          createdAt: old?.createdAt || now(),
          updatedAt: now(),
        });
        const currentAllocation = (await db.all("allocations")).find(
          (allocation) => allocation.employeeId === key && !allocation.end,
        );
        const assignmentChanged = post && (
          !currentAllocation ||
          currentAllocation.postId !== post.id ||
          (currentAllocation.supervisorId || "") !== input.supervisorId
        );
        let activeAllocation = currentAllocation;
        if (saved.status !== "ativo" && currentAllocation) {
          await db.put("allocations", { ...currentAllocation, end: today() });
        } else if (assignmentChanged && post) {
          const start = input.allocationStart || today();
          assert(start <= today(), "Não é possível antecipar uma movimentação");
          if (currentAllocation) {
            assert(start >= currentAllocation.start, "Início anterior à alocação atual");
            await db.put("allocations", { ...currentAllocation, end: start });
          }
          activeAllocation = await db.put("allocations", {
            id: id(),
            employeeId: key,
            postId: post.id,
            clientId: input.clientId,
            supervisorId: input.supervisorId,
            start,
            end: null,
          });
        }
        const accessPost = post || (activeAllocation ? await must(db, "posts", activeAllocation.postId) : undefined);
        assert(accessPost, "Selecione o cliente e o posto do colaborador");
        if (assignedUser) {
          const assignedRole = await must(db, "roles", assignedUser.roleId);
          assert(
            assignedRole.permissions.includes("evaluate") && canSee(assignedUser, assignedRole, { id: accessPost.id, clientId: activeAllocation?.clientId || input.clientId, postId: accessPost.id }),
            "O avaliador selecionado não possui acesso a este cliente ou posto",
          );
        }
        const settings = (await db.all("settings"))[0];
        const domain = String(settings?.employeeEmailDomain || "");
        assert(domain, "Cadastre o domínio de acesso dos colaboradores em Configurações antes de continuar");
        let employeeRole = (await db.all("roles")).find((item) => normalizedName(item.name) === "colaborador");
        if (!employeeRole)
          employeeRole = await db.put("roles", {
            id: id(),
            name: "Colaborador",
            permissions: ["dashboard", "ranking"],
            globalScope: false,
          });
        const users = await db.all("users");
        const linkedUser = users.find((item) => item.id === old?.userId || item.employeeId === key);
        let loginEmail = linkedUser?.email;
        if (!loginEmail) {
          const base = employeeLoginLocal(input.name);
          loginEmail = `${base}${domain}`;
          if (users.some((item) => item.email === loginEmail)) loginEmail = `${base}.${input.cpf.slice(-4)}${domain}`;
          let suffix = 2;
          while (users.some((item) => item.email === loginEmail)) loginEmail = `${base}.${input.cpf.slice(-4)}.${suffix++}${domain}`;
        }
        const account = await db.put("users", {
          ...linkedUser,
          id: linkedUser?.id || id(),
          name: input.name,
          email: loginEmail,
          passwordHash: linkedUser?.passwordHash || passwordHash(input.cpf),
          mustChangePassword: linkedUser ? linkedUser.mustChangePassword : true,
          roleId: employeeRole.id,
          employeeId: key,
          status: saved.status === "ativo" ? "ativo" : "inativo",
          clientIds: [activeAllocation?.clientId || input.clientId],
          postIds: [accessPost.id],
          createdAt: linkedUser?.createdAt || now(),
          updatedAt: now(),
        });
        saved = await db.put("employees", { ...saved, userId: account.id, loginEmail });
        await syncEmployeeParticipants(db, key);
        await audit(db, user.id, old ? "editar_colaborador" : "criar_colaborador", `employees/${key}`, {
          postId: post?.id || "",
          userId: account.id,
        });
        return saved;
      });
      res.json(result);
    }),
  );
  app.post(
    "/api/records/:table",
    route(async (req, res) => {
      const table = String(req.params.table) as Table;
      assert(
        schemas[table] && tablePermission[table],
        "Recurso indisponível",
        404,
      );
      const { db, user, role } = await context(req, tablePermission[table]);
      assert(
        role.globalScope,
        "Gestão reservada a um perfil com acesso global",
        403,
      );
      const key = req.body.id ? z.uuid().parse(req.body.id) : id();
      const old = req.body.id ? await must(db, table, key) : undefined;
      const input = schemas[table]!.parse(req.body) as any;
      const result = await store.transaction(async () => {
        if (table === "posts") {
          const duplicate = (await db.all("posts")).find(
            (item) => item.id !== key && normalizedName(item.name) === normalizedName(input.name),
          );
          assert(!duplicate, "Já existe um posto global com este nome", 409);
        }
        if (table === "allocations") {
          const employee = await must(db, "employees", input.employeeId);
          await must(db, "clients", input.clientId);
          const post = await must(db, "posts", input.postId);
          assert(
            employee.status === "ativo" && post.status === "ativo",
            "Colaborador e posto devem estar ativos",
          );
          assert(
            input.start <= today(),
            "Não é possível antecipar uma movimentação",
          );
          assert(!old, "Movimentações são históricas; crie uma nova");
          assert(
            (await db.all("clientPosts")).some(
              (link) => link.clientId === input.clientId && link.postId === input.postId,
            ),
            "Este posto não está disponível para a empresa selecionada",
          );
          if (input.supervisorId) await must(db, "users", input.supervisorId);
          for (const a of await db.all("allocations"))
            if (a.employeeId === employee.id && !a.end) {
              assert(
                input.start >= a.start,
                "Início anterior à alocação atual",
              );
              await db.put("allocations", { ...a, end: input.start });
            }
          input.end = null;
        }
        if (table === "seasons") {
          assert(
            !old || old.status === "planejada",
            "Temporadas iniciadas não podem ser alteradas",
          );
          assert(
            input.start <= input.end && input.publishDate >= input.end,
            "Confira as datas da temporada",
          );
          input.status = "planejada";
        }
        if (table === "cycles") {
          const season = await must(db, "seasons", input.seasonId);
          assert(
            ["planejada", "ativa"].includes(season.status),
            "Temporada encerrada",
          );
          assert(!old || old.status === "planejado", "Ciclo já iniciado");
          assert(
            input.start >= season.start &&
              input.end <= season.end &&
              input.start <= input.end &&
              input.deadline >= input.end,
            "Datas do ciclo incompatíveis com a temporada",
          );
          const others = (await db.all("cycles")).filter(
            (c) => c.seasonId === season.id && c.id !== key,
          );
          assert(
            !others.some((c) => input.start <= c.end && input.end >= c.start),
            "Os ciclos não podem se sobrepor",
          );
          input.status = "planejado";
        }
        if (table === "users") {
          const targetRole = await must(db, "roles", input.roleId);
          for (const c of input.clientIds) await must(db, "clients", c);
          const availableLinks = await db.all("clientPosts");
          for (const postId of input.postIds) {
            await must(db, "posts", postId);
            assert(
              availableLinks.some((link) => link.postId === postId && input.clientIds.includes(link.clientId)),
              "Todo posto precisa estar disponível em uma empresa permitida",
            );
          }
          const profile = String(targetRole.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          assert(profile !== "colaborador", "O acesso de colaborador é criado automaticamente pelo cadastro do colaborador");
          if (profile === "cliente") {
            assert(input.clientIds.length === 1, "O perfil Cliente deve ter exatamente uma empresa vinculada");
            // Cliente sempre representa a empresa inteira; posto é restrição exclusiva
            // para perfis operacionais como Supervisor e Fiscal.
            input.postIds = [];
          }
          if (["supervisor", "fiscal"].includes(profile))
            assert(input.clientIds.length >= 1, "Vincule ao menos uma empresa para este perfil");
          assert(
          !(
              !targetRole.globalScope &&
              !input.clientIds.length &&
              !input.postIds.length
            ),
            "Vincule pelo menos um cliente ou posto",
          );
          assert(old || input.password, "Defina uma senha inicial");
          if (old?.id === user.id)
            assert(
              input.status === "ativo" &&
                targetRole.permissions.includes("users"),
              "Você não pode remover seu próprio acesso administrativo",
            );
          if (input.password) input.passwordHash = passwordHash(input.password);
          delete input.password;
        }
        if (table === "roles" && key === role.id)
          assert(
            input.permissions.includes("users") && input.globalScope,
            "Preserve sua permissão administrativa",
          );
        const saved = await db.put(table, {
          ...old,
          ...input,
          id: key,
          createdAt: old?.createdAt || now(),
          updatedAt: now(),
        });
        if (table === "clients") {
          const selectedPostIds = new Set<string>(input.postIds || []);
          for (const postId of selectedPostIds) await must(db, "posts", postId);
          for (const link of (await db.all("clientPosts")).filter((item) => item.clientId === saved.id))
            if (!selectedPostIds.has(link.postId)) {
              assert(
                !(await db.all("allocations")).some(
                  (allocation) => allocation.clientId === saved.id && allocation.postId === link.postId && !allocation.end,
                ),
                "Este posto possui colaboradores vinculados. Movimente-os antes de removê-lo da empresa",
                409,
              );
              await db.remove("clientPosts", link.id);
            }
          const currentLinks = await db.all("clientPosts");
          for (const postId of selectedPostIds)
            if (!currentLinks.some((link) => link.clientId === saved.id && link.postId === postId))
              await db.put("clientPosts", { id: id(), clientId: saved.id, postId, createdAt: now() });
        }
        if (table === "allocations")
          await syncEmployeeParticipants(db, saved.employeeId);
        if (table === "posts" || table === "clients") {
          const affectedPostIds = table === "posts"
            ? new Set([saved.id])
            : new Set((await db.all("clientPosts")).filter((link) => link.clientId === saved.id).map((link) => link.postId));
          const affectedEmployeeIds = new Set(
            (await db.all("allocations"))
              .filter((allocation) => affectedPostIds.has(allocation.postId))
              .map((allocation) => allocation.employeeId),
          );
          for (const employeeId of affectedEmployeeIds)
            await syncEmployeeParticipants(db, employeeId);
        }
        if (table === "users" && old)
          for (const s of await db.all("sessions"))
            if (s.userId === key && key !== user.id)
              await db.remove("sessions", s.id);
        await audit(db, user.id, old ? "editar" : "criar", `${table}/${key}`);
        return table === "users" ? safeUser(saved) : saved;
      });
      res.json(result);
    }),
  );
  app.post(
    "/api/records/:table/:id/delete",
    route(async (req, res) => {
      const table = z.enum(["clients", "employees", "seasons"]).parse(req.params.table) as
        | "clients"
        | "employees"
        | "seasons";
      const permission = table === "clients" ? "clients" : table === "employees" ? "employees" : "seasons";
      const { db, user, role } = await context(req, permission);
      assert(role.globalScope, "Exclusão reservada ao administrador", 403);
      z.object({ confirm: z.literal(true) }).parse(req.body);
      const target = await must(db, table, z.uuid().parse(req.params.id));
      const summary = await store.transaction(async () => {
        const records = await db.allMany([
          "clients", "posts", "clientPosts", "employees", "allocations", "users", "roles",
          "sessions", "seasons", "cycles", "participants", "evaluations", "employeeActions",
        ]);
        let removedEvaluations = 0;
        let removedParticipants = 0;
        const removeParticipants = async (participantRows: RecordData[]) => {
          const participantIds = new Set(participantRows.map((item) => item.id));
          for (const evaluation of records.evaluations!.filter((item) => participantIds.has(item.participantId))) {
            await db.remove("evaluations", evaluation.id);
            removedEvaluations++;
          }
          for (const participant of participantRows) {
            await db.remove("participants", participant.id);
            removedParticipants++;
          }
        };

        if (table === "employees") {
          const participantRows = records.participants!.filter((item) => item.employeeId === target.id);
          await removeParticipants(participantRows);
          for (const action of records.employeeActions!.filter((item) => item.employeeId === target.id))
            await db.remove("employeeActions", action.id);
          for (const allocation of records.allocations!.filter((item) => item.employeeId === target.id))
            await db.remove("allocations", allocation.id);
          for (const account of records.users!.filter((item) => item.employeeId === target.id)) {
            for (const session of records.sessions!.filter((item) => item.userId === account.id))
              await db.remove("sessions", session.id);
            const authored = records.evaluations!.some(
              (item) => item.evaluatorId === account.id && !participantRows.some((participant) => participant.id === item.participantId),
            );
            if (authored)
              await db.put("users", { ...account, employeeId: null, status: "inativo", updatedAt: now() });
            else await db.remove("users", account.id);
          }
          for (const season of records.seasons!)
            if (season.result?.some((item: RecordData) => item.employeeId === target.id))
              await db.put("seasons", {
                ...season,
                result: season.result.filter((item: RecordData) => item.employeeId !== target.id),
                updatedAt: now(),
              });
          await db.remove("employees", target.id);
        }

        if (table === "clients") {
          const allocationRows = records.allocations!.filter((item) => item.clientId === target.id);
          const allocationIds = new Set(allocationRows.map((item) => item.id));
          const participantRows = records.participants!.filter(
            (item) => item.snapshot?.clientId === target.id || allocationIds.has(item.allocationId),
          );
          await removeParticipants(participantRows);
          for (const allocation of allocationRows) await db.remove("allocations", allocation.id);
          for (const link of records.clientPosts!.filter((item) => item.clientId === target.id))
            await db.remove("clientPosts", link.id);
          for (const post of records.posts!.filter((item) => item.clientId === target.id))
            await db.put("posts", { ...post, clientId: null, updatedAt: now() });
          for (const account of records.users!.filter((item) => item.clientIds?.includes(target.id))) {
            const clientIds = account.clientIds.filter((clientId: string) => clientId !== target.id);
            const allowedPostIds = new Set(
              records.clientPosts!
                .filter((link) => clientIds.includes(link.clientId))
                .map((link) => link.postId),
            );
            const postIds = (account.postIds || []).filter((postId: string) => allowedPostIds.has(postId));
            const accountRole = records.roles!.find((item) => item.id === account.roleId);
            await db.put("users", {
              ...account,
              clientIds,
              postIds,
              status: !accountRole?.globalScope && !clientIds.length ? "inativo" : account.status,
              updatedAt: now(),
            });
          }
          for (const season of records.seasons!)
            if (season.result?.some((item: RecordData) => item.clientId === target.id))
              await db.put("seasons", {
                ...season,
                result: season.result.filter((item: RecordData) => item.clientId !== target.id),
                updatedAt: now(),
              });
          await db.remove("clients", target.id);
        }

        if (table === "seasons") {
          const cycleRows = records.cycles!.filter((item) => item.seasonId === target.id);
          const cycleIds = new Set(cycleRows.map((item) => item.id));
          await removeParticipants(records.participants!.filter((item) => cycleIds.has(item.cycleId)));
          for (const action of records.employeeActions!.filter((item) => item.seasonId === target.id))
            await db.remove("employeeActions", action.id);
          for (const cycle of cycleRows) await db.remove("cycles", cycle.id);
          await db.remove("seasons", target.id);
        }

        const result = { table, id: target.id, name: target.name, removedParticipants, removedEvaluations };
        await audit(db, user.id, `excluir_${table}`, `${table}/${target.id}`, result);
        return result;
      });
      res.json(summary);
    }),
  );
  app.post(
    "/api/settings",
    route(async (req, res) => {
      const { db, user } = await context(req, "settings");
      const rules = rulesSchema.parse(req.body);
      const settings = (await db.all("settings"))[0];
      await store.transaction(async () => {
        await db.put("settings", {
          ...settings,
          rules,
          version: settings.version + 1,
          updatedAt: now(),
        });
        const seasons = await db.all("seasons");
        for (const s of seasons) {
          if (s.status === "ativa" || s.status === "planejada") {
            await db.put("seasons", {
              ...s,
              rules: {
                ...s.rules,
                allowReevaluate: rules.allowReevaluate,
              },
              updatedAt: now(),
            });
          }
        }
        await audit(db, user.id, "alterar_regulamento", settings.id, {
          version: settings.version + 1,
          rules,
        });
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/settings/employee-access",
    route(async (req, res) => {
      const { db, user } = await context(req, "settings");
      const parsed = z.object({ domain: z.string().trim().min(3).max(120) }).parse(req.body);
      const domain = (parsed.domain.startsWith("@") ? parsed.domain : `@${parsed.domain}`).toLowerCase();
      assert(/^@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(domain), "Informe um domínio válido, como @empresa.com.br");
      const settings = (await db.all("settings"))[0];
      await db.put("settings", { ...settings, employeeEmailDomain: domain, updatedAt: now() });
      await audit(db, user.id, "alterar_dominio_colaboradores", settings.id, { domain });
      res.json({ domain });
    }),
  );
  app.post(
    "/api/seasons/:id/:action",
    route(async (req, res) => {
      const { db, user } = await context(req, "seasons");
      await store.transaction(async () => {
        const season = await must(db, "seasons", String(req.params.id));
        const action = req.params.action;
        const cycles = (await db.all("cycles")).filter(
          (c) => c.seasonId === season.id,
        );
        if (action === "activate") {
          assert(season.status === "planejada", "Temporada já iniciada");
          const settings = (await db.all("settings"))[0];
          const confirmation = z.object({ confirmRules: z.boolean().default(false) }).parse(req.body || {});
          assert(cycles.length > 0, "Cadastre pelo menos um ciclo antes de iniciar a temporada");
          let rules = settings.rules;
          let ruleVersion = settings.version;
          if (rules.provisional) {
            assert(confirmation.confirmRules, "Confirme o regulamento atual para iniciar a temporada");
            rules = { ...rules, provisional: false };
            ruleVersion += 1;
            await db.put("settings", {
              ...settings,
              rules,
              version: ruleVersion,
              updatedAt: now(),
            });
            await audit(db, user.id, "confirmar_regulamento", settings.id, { version: ruleVersion });
          }
          await db.put("seasons", {
            ...season,
            status: "ativa",
            rules,
            ruleVersion,
            activatedAt: now(),
          });
        } else if (action === "close") {
          assert(season.status === "ativa", "Temporada não está ativa");
          assert(
            cycles.every((c) => c.status === "encerrado"),
            "Encerre todos os ciclos primeiro",
          );
          await db.put("seasons", { ...season, status: "encerrada" });
        } else if (action === "publish") await publish(db, user.id, season);
        else throw new HttpError(404, "Ação desconhecida");
        await audit(db, user.id, String(action), season.id);
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/cycles/:id/:action",
    route(async (req, res) => {
      const { db, user } = await context(req, "seasons");
      await store.transaction(async () => {
        const cycle = await must(db, "cycles", String(req.params.id));
        const season = await must(db, "seasons", cycle.seasonId);
        assert(season.status === "ativa", "Inicie a temporada primeiro");
        if (req.params.action === "activate") {
          assert(cycle.status === "planejado", "Ciclo já iniciado");
          const employees = await db.all("employees");
          const allocations = await db.all("allocations");
          const employeeActions = (await db.all("employeeActions")).filter(
            (action) => action.seasonId === season.id && action.status === "ativo",
          );
          let count = 0;
          for (const e of employees.filter(
            (e) => e.status === "ativo" && hasMinimumTenure(e.admissionDate),
          )) {
            const a = allocations
              .filter(
                (a) =>
                  a.employeeId === e.id &&
                  a.start <= cycle.end &&
                  (!a.end || a.end > cycle.start),
              )
              .sort((a, b) => b.start.localeCompare(a.start))[0];
            if (!a) continue;
            const post = await must(db, "posts", a.postId);
            const client = await must(db, "clients", a.clientId);
            if (client.status !== "ativo" || post.status !== "ativo") continue;
            const blocking = employeeActions.find(
              (action) => action.employeeId === e.id &&
                (action.type === "season_suspension" ||
                  (action.type === "cycle_block" && action.cycleId === cycle.id)),
            );
            await db.put("participants", {
              id: id(),
              cycleId: cycle.id,
              seasonId: season.id,
              employeeId: e.id,
              allocationId: a.id,
              eligible: !blocking,
              ineligibility: blocking
                ? { actionId: blocking.id, type: blocking.type, reason: blocking.reason }
                : null,
              snapshot: {
                name: e.name,
                photo: e.photo || "",
                registration: e.registration,
                role: e.role,
                client: client.name,
                clientId: client.id,
                post: post.name,
                postId: post.id,
                supervisorId: a.supervisorId,
              },
            });
            if (!blocking) count++;
          }
          assert(count, "Nenhuma alocação elegível durante o período do ciclo");
          await db.put("cycles", { ...cycle, status: "ativo" });
        } else if (req.params.action === "close") {
          assert(cycle.status === "ativo", "Ciclo não está ativo");
          // Replica notas para avaliadores que não avaliaram dentro do prazo
          await replicateMissingEvaluations(db, cycle.id);
          await db.put("cycles", { ...cycle, status: "encerrado" });
        } else if (req.params.action === "reopen") {
          assert(cycle.status === "encerrado", "Somente ciclos encerrados podem ser reabertos");
          assert(!season.result, "Resultados publicados não podem ser reabertos");
          assert(cycle.deadline >= today(), "O prazo deste ciclo já terminou");
          await db.put("cycles", { ...cycle, status: "ativo", reopenedAt: now(), reopenedBy: user.id });
          for (const employee of await db.all("employees"))
            await syncEmployeeParticipants(db, employee.id);
        } else throw new HttpError(404, "Ação desconhecida");
        await audit(db, user.id, String(req.params.action), cycle.id);
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/evaluations",
    route(async (req, res) => {
      const { db, user, role } = await context(req, "evaluate");
      const input = z
        .object({
          participantId: z.uuid(),
          answers: z
            .array(
              z.object({
                criterionId: z.string(),
                value: z.number(),
                comment: z.string().max(500).default(""),
              }),
            )
            .max(20)
            .default([]),
          compliment: z.string().trim().max(500).default(""),
          status: z
            .enum(["rascunho", "enviada", "impossivel"])
            .default("enviada"),
          reason: z.string().trim().max(500).default(""),
        })
        .parse(req.body);
      const saved = await store.transaction(async () => {
        const participant = await must(db, "participants", input.participantId);
        assert(
          canSee(user, role, participant.snapshot),
          "Colaborador fora do seu vínculo",
          403,
        );
        assert(participant.eligible !== false, "Participante inelegível");
        // Supervisores/Fiscais: verificar se têm acesso ao participante
        if (!role.globalScope && role.permissions.includes("evaluate")) {
          const profile = normalizedName(role.name);
          if (profile !== "cliente") {
            const assignedEvaluator = participant.snapshot?.supervisorId;
            assert(
              !assignedEvaluator || assignedEvaluator === user.id,
              "Este colaborador está atribuído a outro avaliador",
              403,
            );
          }
        }
        const participantEvaluations = (await db.all("evaluations")).filter(
          (evaluation) => evaluation.participantId === participant.id,
        );
        // Permite avaliação dupla: cada avaliador submete a sua própria nota.
        // O bloqueio de duplicata por mesmo avaliador fica abaixo (existing check).
        const cycle = await must(db, "cycles", participant.cycleId);
        const season = await must(db, "seasons", cycle.seasonId);
        assert(
          cycle.status === "ativo" && season.status === "ativa",
          "Ciclo encerrado ou ainda não iniciado",
        );
        assert(
          today() >= cycle.start,
          "O período de avaliação ainda não começou",
        );
        assert(
          season.rules.allowLate || today() <= cycle.deadline,
          "Prazo de avaliação encerrado",
        );
        const existing = participantEvaluations.find(
          (e) =>
            e.participantId === participant.id && e.evaluatorId === user.id,
        );
        assert(
          !existing || existing.status === "rascunho",
          "Avaliação já registrada para este colaborador e avaliador",
          409,
        );
        const approved = !season.rules.complimentApproval;
        let scored: any = {
          answers: input.answers,
          criteriaPoints: 0,
          complimentPoints: 0,
          score: 0,
        };
        if (input.status === "enviada")
          scored = scoreEvaluation(
            season.rules,
            input.answers,
            input.compliment,
            approved,
          );
        if (input.status === "impossivel")
          assert(
            season.rules.allowUnable && input.reason.length >= 3,
            "Informe por que não consegue avaliar",
          );
        const result = await db.put("evaluations", {
          ...existing,
          id: existing?.id || id(),
          participantId: participant.id,
          evaluatorId: user.id,
          evaluator: user.name,
          roleId: role.id,
          evaluatorRole: role.name,
          cycleId: cycle.id,
          seasonId: season.id,
          snapshot: participant.snapshot,
          ...scored,
          compliment: input.compliment,
          complimentApproved: approved,
          status: input.status,
          reason: input.reason,
          sentAt: now(),
          createdAt: existing?.createdAt || now(),
          ruleVersion: season.ruleVersion,
        });
        await audit(db, user.id, input.status, result.id);
        return result;
      });
      res.json(saved);
    }),
  );
  app.post(
    "/api/evaluations/:id/:action",
    route(async (req, res) => {
      const { db, user, role } = await context(req);
      assert(
        role.permissions.includes("evaluations") ||
          (role.permissions.includes("evaluate") && req.params.action === "reopen"),
        "Sem permissão para esta ação",
        403,
      );
      await store.transaction(async () => {
        const e = await must(db, "evaluations", String(req.params.id));
        assert(
          e.evaluatorId === user.id || canSee(user, role, e.snapshot),
          "Avaliação fora do seu vínculo",
          403,
        );
        const season = await must(db, "seasons", e.seasonId);
        assert(
          season.status === "ativa",
          "Resultado encerrado não pode ser alterado",
        );
        if (req.params.action === "reopen") {
          const cycle = await must(db, "cycles", e.cycleId);
          assert(
            cycle.status === "ativo",
            "Reabertura permitida apenas em ciclo ativo",
          );
          assert(e.status !== "rascunho", "Avaliação já está em preenchimento");
          if (!role.permissions.includes("evaluations")) {
            const settings = (await db.all("settings"))[0];
            const allowReevaluate =
              season.rules?.allowReevaluate !== false &&
              settings?.rules?.allowReevaluate !== false;
            assert(
              allowReevaluate,
              "A reavaliação de colaboradores já avaliados está desativada nas configurações",
              403,
            );
            assert(
              e.evaluatorId === user.id,
              "Você só pode reabrir sua própria avaliação",
              403,
            );
          }
          const rawReason = req.body?.reason?.trim();
          const reason = rawReason && rawReason.length >= 3
            ? z.string().trim().min(3).max(500).parse(rawReason)
            : "Reavaliação solicitada pelo avaliador";
          await db.put("evaluations", {
            ...e,
            status: "rascunho",
            complimentApproved: false,
            revisions: [
              ...(e.revisions || []),
              {
                date: now(),
                actor: user.id,
                reason,
                answers: e.answers,
                score: e.score,
                status: e.status,
                compliment: e.compliment,
              },
            ],
          });
        } else if (req.params.action === "approve") {
          assert(e.status === "enviada", "Avaliação não enviada");
          assert(
            e.compliment && !e.complimentApproved,
            "Elogio já aprovado ou inexistente",
          );
          await db.put("evaluations", {
            ...e,
            complimentApproved: true,
            complimentPoints: season.rules.complimentPoints,
            score: e.criteriaPoints + season.rules.complimentPoints,
            approvedBy: user.id,
          });
        } else if (req.params.action === "cancel") {
          assert(e.status === "enviada", "Avaliação não enviada");
          const reason = z
            .string()
            .trim()
            .min(3)
            .max(500)
            .parse(req.body.reason);
          await db.put("evaluations", {
            ...e,
            status: "cancelada",
            cancelReason: reason,
          });
        } else throw new HttpError(404, "Ação desconhecida");
        await audit(db, user.id, String(req.params.action), e.id);
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/imports/preview",
    route(async (req, res) => {
      const { db, user } = await context(req, "imports");
      const input = z
        .object({
          name: z.string().max(150),
          content: z.string().max(11000000),
          mapping: z.record(z.string(), z.string()).optional(),
        })
        .parse(req.body);
      assert(/\.(xlsx|csv)$/i.test(input.name), "Use um arquivo CSV ou XLSX");
      const buffer = Buffer.from(input.content, "base64");
      assert(buffer.length <= 8 * 1024 * 1024, "Limite de 8 MB");
      const workbook = new ExcelJS.Workbook();
      let rows: string[][] = [];
      if (/\.xlsx$/i.test(input.name)) {
        validateWorkbookArchive(buffer);
        try{await workbook.xlsx.load(buffer as any);}catch{throw new HttpError(400,'Não foi possível ler a planilha XLSX. Confira o arquivo.');}
        const sheet = workbook.worksheets[0];
        assert(sheet, "Planilha vazia");
        assert(sheet.rowCount <= 5001, "Limite de 5.000 linhas");
        sheet.eachRow((row) => {
          rows.push(
            Array.from({ length: Math.min(sheet.columnCount, 50) }, (_, i) =>
              row.getCell(i + 1).text.trim(),
            ),
          );
        });
      } else {
        const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
        const delimiter = source.split("\n")[0].includes(";") ? ";" : ",";
        let row: string[] = [],
          value = "",
          quoted = false;
        for (let i = 0; i < source.length; i++) {
          const c = source[i];
          if (c === '"') {
            if (quoted && source[i + 1] === '"') {
              value += '"';
              i++;
            } else quoted = !quoted;
          } else if (c === delimiter && !quoted) {
            row.push(value.trim());
            value = "";
          } else if (c === "\n" && !quoted) {
            row.push(value.trim());
            rows.push(row);
            row = [];
            value = "";
          } else if (c !== "\r") value += c;
        }
        if (value || row.length) {
          row.push(value.trim());
          rows.push(row);
        }
        assert(!quoted, "CSV contém aspas não fechadas");
        assert(rows.length <= 5001, "Limite de 5.000 linhas");
      }
      const headers = rows.shift() || [];
      assert(headers.length, "Arquivo vazio");
      const normalize = (v: string) =>
        v
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
      const required = ["matricula", "cpf", "nome", "funcao", "cliente", "posto"];
      const mapping =
        input.mapping ||
        Object.fromEntries(
          required.map((k) => [
            k,
            headers.find((h) => normalize(h) === k) || "",
          ]),
        );
      if (required.some((k) => !headers.includes(mapping[k])))
        return res.json({ headers, mapping, needsMapping: true });
      const seen = new Set<string>();
      const seenCpf = new Set<string>();
      const parsed = rows
        .filter((r) => r.some(Boolean))
        .map((r, index) => {
          const data = Object.fromEntries(
            required.map((k) => [k, r[headers.indexOf(mapping[k])] || ""]),
          );
          const errors = required
            .filter((k) => !data[k])
            .map((k) => `${k} obrigatório`);
          if (seen.has(data.matricula))
            errors.push("Matrícula duplicada no arquivo");
          seen.add(data.matricula);
          data.cpf = normalizeCpf(data.cpf);
          if (!validCpf(data.cpf)) errors.push("CPF inválido");
          if (seenCpf.has(data.cpf)) errors.push("CPF duplicado no arquivo");
          seenCpf.add(data.cpf);
          if (Object.values(data).some((v) => v.length > 200))
            errors.push("Campo excede 200 caracteres");
          return { line: index + 2, ...data, errors };
        });
      assert(parsed.length, "Nenhum registro no arquivo");
      const record = await db.put("imports", {
        id: id(),
        name: input.name,
        status: "previa",
        rows: parsed,
        records: parsed.length,
        errors: parsed.filter((r) => r.errors.length).length,
        createdBy: user.id,
        date: now(),
      });
      res.json({
        id: record.id,
        headers,
        mapping,
        rows: parsed,
        records: record.records,
        errors: record.errors,
      });
    }),
  );
  app.post(
    "/api/imports/:id/confirm",
    route(async (req, res) => {
      const { db, user } = await context(req, "imports");
      await store.transaction(async () => {
        const imp = await must(db, "imports", String(req.params.id));
        assert(imp.status === "previa", "Importação já processada", 409);
        assert(imp.errors === 0, "Corrija os erros e importe novamente");
        const clients = await db.all("clients"), posts = await db.all("posts"),
          employees = await db.all("employees"), allocations = await db.all("allocations"),
          users = await db.all("users"), roles = await db.all("roles"),
          clientPosts = await db.all("clientPosts");
        const settings = (await db.all("settings"))[0];
        const domain = String(settings?.employeeEmailDomain || "");
        assert(domain, "Cadastre o domínio de acesso dos colaboradores em Configurações antes de importar");
        let employeeRole = roles.find((item) => normalizedName(item.name) === "colaborador");
        if (!employeeRole) {
          employeeRole = await db.put("roles", { id: id(), name: "Colaborador", permissions: ["dashboard", "ranking"], globalScope: false });
          roles.push(employeeRole);
        }
        for (const r of imp.rows) {
          let client = clients.find(
            (c) => c.name.toLowerCase() === r.cliente.toLowerCase(),
          );
          if (!client) {
            client = await db.put("clients", {
              id: id(),
              name: r.cliente,
              status: "ativo",
              cnpj: "",
              segment: "",
              responsible: "",
              email: "",
              phone: "",
            });
            clients.push(client);
          }
          let post = posts.find(
            (p) => p.name.toLowerCase() === r.posto.toLowerCase(),
          );
          if (!post) {
            post = await db.put("posts", {
              id: id(),
              name: r.posto,
              status: "ativo",
              code: "",
              address: "",
            });
            posts.push(post);
          }
          if (!clientPosts.some((link) => link.clientId === client!.id && link.postId === post!.id)) {
            const link = await db.put("clientPosts", { id: id(), clientId: client.id, postId: post.id, createdAt: now(), importId: imp.id });
            clientPosts.push(link);
          }
          let employee = employees.find((e) => e.registration === r.matricula);
          assert(!employees.some((item) => item.id !== employee?.id && item.cpf === r.cpf), `CPF já cadastrado: ${r.cpf}`, 409);
          employee = await db.put("employees", {
            ...employee,
            id: employee?.id || id(),
            name: r.nome,
            cpf: r.cpf,
            registration: r.matricula,
            role: r.funcao,
            status: employee?.status || "ativo",
            admissionDate: employee?.admissionDate || today(),
          });
          if (!employees.some((item) => item.id === employee!.id)) employees.push(employee);
          const current = allocations.find(
            (a) => a.employeeId === employee!.id && !a.end,
          );
          if (current?.postId !== post.id) {
            if (current)
              await db.put("allocations", { ...current, end: today() });
            const allocation = await db.put("allocations", {
              id: id(),
              employeeId: employee.id,
              postId: post.id,
              clientId: client.id,
              start: today(),
              end: null,
              supervisorId: "",
              importId: imp.id,
            });
            allocations.push(allocation);
          }
          const linkedUser = users.find((item) => item.id === employee!.userId || item.employeeId === employee!.id);
          let loginEmail = linkedUser?.email;
          if (!loginEmail) {
            const base = employeeLoginLocal(r.nome);
            loginEmail = `${base}${domain}`;
            if (users.some((item) => item.email === loginEmail)) loginEmail = `${base}.${r.cpf.slice(-4)}${domain}`;
            let suffix = 2;
            while (users.some((item) => item.email === loginEmail)) loginEmail = `${base}.${r.cpf.slice(-4)}.${suffix++}${domain}`;
          }
          const account = await db.put("users", {
            ...linkedUser, id: linkedUser?.id || id(), name: r.nome, email: loginEmail,
            passwordHash: linkedUser?.passwordHash || passwordHash(r.cpf),
            mustChangePassword: linkedUser ? linkedUser.mustChangePassword : true,
            roleId: employeeRole.id, employeeId: employee.id, status: "ativo",
            clientIds: [client.id], postIds: [post.id], createdAt: linkedUser?.createdAt || now(), updatedAt: now(),
          });
          if (!linkedUser) users.push(account);
          employee = await db.put("employees", { ...employee, userId: account.id, loginEmail });
          await syncEmployeeParticipants(db, employee.id);
        }
        await db.put("imports", {
          ...imp,
          status: "concluida",
          confirmedAt: now(),
          confirmedBy: user.id,
        });
        await audit(db, user.id, "confirmar_importacao", imp.id, {
          records: imp.records,
        });
      });
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/export/:kind",
    route(async (req, res) => {
      const { db, user, role } = await context(req, "reports");
      const kind = String(req.params.kind);
      assert(
        ["clients", "employees", "evaluations", "pending", "ranking"].includes(kind),
        "Relatório inválido",
      );
      const seasonId = String(req.query.season || ""),
        clientId = String(req.query.client || "");
      const ps = (await db.all("participants")).filter((p) =>
        canSee(user, role, p.snapshot),
      );
      const es = (await db.all("evaluations")).filter((e) =>
        ps.some((p) => p.id === e.participantId),
      );
      let rows: RecordData[] = [];
      if (kind === "clients") {
        const posts = await db.all("posts");
        const links = await db.all("clientPosts");
        const allocations = await db.all("allocations");
        rows = (await db.all("clients"))
          .filter(
            (client) =>
              role.globalScope ||
              user.clientIds?.includes(client.id) ||
              links.some((link) =>
                link.clientId === client.id && user.postIds?.includes(link.postId),
              ),
          )
          .map((client) => {
            const postIds = new Set(links.filter((link) => link.clientId === client.id).map((link) => link.postId));
            return {
              ...client,
              posts: posts.filter((post) => postIds.has(post.id)).length,
              employees: new Set(
                allocations
                  .filter((allocation) => !allocation.end && allocation.clientId === client.id && postIds.has(allocation.postId))
                  .map((allocation) => allocation.employeeId),
              ).size,
            };
          });
      }
      if (kind === "employees") {
        const allocations = await db.all("allocations"),
          posts = await db.all("posts"),
          clients = await db.all("clients");
        rows = (await db.all("employees")).flatMap((e) => {
          const a = allocations.find((a) => a.employeeId === e.id && !a.end);
          if (!role.globalScope && (!a || !canSee(user, role, a))) return [];
          return [
            {
              ...e,
              clientId: a?.clientId,
              client: clients.find((c) => c.id === a?.clientId)?.name,
              post: posts.find((p) => p.id === a?.postId)?.name,
            },
          ];
        });
      }
      if (kind === "evaluations")
        rows = es.map((e) => ({ ...e, ...e.snapshot }));
      if (kind === "pending")
        rows = ps
          .filter(
            (p) =>
              !es.some(
                (e) => e.participantId === p.id && e.status === "enviada",
              ),
          )
          .map((p) => ({ ...p, ...p.snapshot }));
      if (kind === "ranking")
        for (const s of await db.all("seasons")) {
          if (
            !s.rules ||
            (seasonId && s.id !== seasonId) ||
            (!role.globalScope &&
              s.rules.hideBeforePublication &&
              s.status !== "publicada")
          )
            continue;
          rows.push(
            ...(await seasonRanking(db, s))
              .filter((r: RecordData) => canSee(user, role, r))
              .map((r: RecordData) => ({
                ...r,
                seasonId: s.id,
                season: s.name,
              })),
          );
        }
      rows = rows.filter(
        (r) =>
          (!seasonId || kind === "employees" || r.seasonId === seasonId) &&
          (!clientId || r.clientId === clientId),
      );
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Clube de Talentos");
      sheet.columns = [
        { header: "Nome", key: "name", width: 32 },
        { header: "CNPJ", key: "cnpj", width: 22 },
        { header: "Segmento", key: "segment", width: 20 },
        { header: "Responsável", key: "responsible", width: 25 },
        { header: "Matrícula", key: "registration", width: 18 },
        { header: "Cliente", key: "client", width: 30 },
        { header: "Posto", key: "post", width: 25 },
        { header: "Função", key: "role", width: 22 },
        { header: "Pontos", key: "score", width: 14 },
        { header: "Classificação", key: "badge", width: 18 },
        { header: "Situação", key: "status", width: 18 },
        { header: "Temporada", key: "season", width: 22 },
        { header: "Avaliador", key: "evaluator", width: 25 },
      ];
      for (const row of rows) {
        const values: Record<string, unknown> = {};
        for (const c of sheet.columns) {
          const v = row[String(c.key)];
          values[String(c.key)] =
            typeof v === "string" && /^[=+@\-\t\r]/.test(v)
              ? `'${v}`
              : (v ?? "");
        }
        sheet.addRow(values);
      }
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1B6EF3" },
      };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.autoFilter = { from: "A1", to: "N1" };
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${kind}.xlsx"`,
      );
      res.send(Buffer.from(await workbook.xlsx.writeBuffer()));
    }),
  );
  app.use("/api", (_req, _res, next) =>
    next(new HttpError(404, "Rota não encontrada")),
  );
  const frontend = resolve(process.env.FRONTEND_DIST || "../frontend/dist");
  app.use(express.static(frontend));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(resolve(frontend, "index.html")),
  );
  app.use(
    (
      error: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const conflict = /UNIQUE constraint|duplicate key/.test(
        error.message || "",
      );
      const status =
        error instanceof HttpError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : conflict
              ? 409
              : [400, 413].includes(error.status)
                ? error.status
                : 500;
      if (status === 500) console.error(error);
      res.status(status).json({
        error:
          error instanceof z.ZodError
            ? error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : conflict
              ? "Já existe um registro com esses dados"
              : status === 500
                ? "Não foi possível concluir a operação"
                : error.message,
      });
    },
  );
  app.locals.runScheduled = () =>
    store.exclusive(async () => {
      for (const org of await store.all("organizations"))
        await store.transaction(() => tick(new TenantStore(store, org.id)));
    });
  return app;
}
