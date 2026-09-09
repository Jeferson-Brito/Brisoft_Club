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
} from "./domain.ts";

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordValid(password: string, encoded: string) {
  const [salt, key] = encoded.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(key, "hex"),
  );
}
const safeUser = (u: RecordData) => {
  const { passwordHash: _, ...rest } = u;
  return rest;
};
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
  app.set("trust proxy", false);
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
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
      if (
        req.headers.origin !== expected &&
        !(
          process.env.NODE_ENV !== "production" &&
          /^http:\/\/(localhost|127\.0\.0\.1):(5173|5174|4173)$/.test(
            req.headers.origin,
          )
        )
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
    const role = await must(db, "roles", user.roleId);
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
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600000,
      path: "/",
    });
  }
  app.get(
    "/api/health",
    route(async (_req, res) =>
      res.json({ ok: true, database: store.postgres ? "postgres" : "sqlite" }),
    ),
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
          demo: z.boolean().default(false),
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
          permissions: [...permissions],
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
            permissions: ["dashboard", "evaluate", "ranking", "employees"],
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
          version: 1,
          updatedAt: now(),
        });
        if (input.demo) {
          const client = await db.put("clients", {
            id: id(),
            name: "Cliente de demonstração",
            cnpj: "",
            segment: "Demonstração",
            status: "ativo",
            responsible: "",
            email: "",
            phone: "",
          });
          const post = await db.put("posts", {
            id: id(),
            name: "Portaria principal",
            clientId: client.id,
            code: "DEMO",
            status: "ativo",
            address: "",
          });
          for (const [index, name] of [
            "Ana Paula Santos",
            "Carlos Eduardo Silva",
            "Mariana Alves",
            "Rafael Almeida",
            "Juliana Costa",
            "Lucas Oliveira",
          ].entries()) {
            const employee = await db.put("employees", {
              id: id(),
              name,
              registration: `DEMO-${index + 1}`,
              role: index % 2 ? "Vigilante" : "Recepcionista",
              admissionDate: today(),
              status: "ativo",
            });
            await db.put("allocations", {
              id: id(),
              employeeId: employee.id,
              postId: post.id,
              clientId: client.id,
              start: today(),
              end: null,
              supervisorId: "",
            });
          }
        }
        await audit(db, u.id, "configuracao_inicial", tenantId, {
          demo: input.demo,
        });
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
    );
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
  async function tick(db: TenantStore) {
    for (const season of await db.all("seasons")) {
      if (season.status === "ativa" && season.rules?.autoClose) {
        const cycles = (await db.all("cycles")).filter(
          (c) => c.seasonId === season.id,
        );
        for (const c of cycles)
          if (c.status === "ativo" && c.deadline < today())
            await db.put("cycles", { ...c, status: "encerrado" });
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
      const allClients = await db.all("clients"),
        allPosts = await db.all("posts"),
        allAllocations = await db.all("allocations");
      const posts = allPosts.filter((p) =>
        canSee(user, role, { ...p, postId: p.id }),
      );
      const postIds = new Set(posts.map((p) => p.id));
      const clients = allClients.filter(
        (c) =>
          role.globalScope ||
          user.clientIds.includes(c.id) ||
          posts.some((p) => p.clientId === c.id),
      );
      const allocations = allAllocations.filter(
        (a) => role.globalScope || postIds.has(a.postId),
      );
      const employeeIds = new Set(allocations.map((a) => a.employeeId));
      const employees = (await db.all("employees")).filter(
        (e) => role.globalScope || employeeIds.has(e.id),
      );
      const participants = (await db.all("participants")).filter((p) =>
        canSee(user, role, p.snapshot),
      );
      const participantIds = new Set(participants.map((p) => p.id));
      const evaluations = (await db.all("evaluations")).filter(
        (e) =>
          participantIds.has(e.participantId) &&
          (role.permissions.includes("evaluations") ||
            e.evaluatorId === user.id),
      );
      const seasons = await db.all("seasons");
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
          rankings[s.id] = (await seasonRanking(db, s)).filter(
            (r: RecordData) => canSee(user, role, r),
          );
        }
      res.json({
        organization: org?.name,
        user: safeUser(user),
        role,
        clients,
        posts,
        employees,
        allocations,
        participants,
        evaluations,
        seasons: seasons.map((s) => ({ ...s, result: undefined })),
        cycles: await db.all("cycles"),
        rankings,
        users: role.permissions.includes("users")
          ? (await db.all("users")).map(safeUser)
          : [safeUser(user)],
        roles: role.permissions.includes("users")
          ? await db.all("roles")
          : [role],
        imports: role.permissions.includes("imports")
          ? await db.all("imports")
          : [],
        settings: role.permissions.includes("settings")
          ? (await db.all("settings"))[0]
          : null,
        audit: role.permissions.includes("settings")
          ? (await db.all("audit"))
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 300)
          : [],
      });
    }),
  );
  const tablePermission: Partial<Record<Table, string>> = {
    clients: "clients",
    posts: "clients",
    employees: "employees",
    allocations: "employees",
    seasons: "seasons",
    cycles: "seasons",
    users: "users",
    roles: "users",
  };
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
        if (table === "posts") await must(db, "clients", input.clientId);
        if (table === "allocations") {
          const employee = await must(db, "employees", input.employeeId);
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
          if (input.supervisorId) await must(db, "users", input.supervisorId);
          for (const a of await db.all("allocations"))
            if (a.employeeId === employee.id && !a.end) {
              assert(
                input.start >= a.start,
                "Início anterior à alocação atual",
              );
              await db.put("allocations", { ...a, end: input.start });
            }
          input.clientId = post.clientId;
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
          for (const p of input.postIds) await must(db, "posts", p);
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
        await audit(db, user.id, "alterar_regulamento", settings.id, {
          version: settings.version + 1,
          rules,
        });
      });
      res.json({ ok: true });
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
          assert(
            !settings.rules.provisional,
            "Revise e confirme o regulamento nas Configurações",
          );
          assert(
            cycles.length >= settings.rules.minimumCycles,
            "Cadastre a quantidade mínima de ciclos do regulamento",
          );
          await db.put("seasons", {
            ...season,
            status: "ativa",
            rules: settings.rules,
            ruleVersion: settings.version,
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
          let count = 0;
          for (const e of employees.filter((e) => e.status === "ativo")) {
            const a = allocations
              .filter(
                (a) =>
                  a.employeeId === e.id &&
                  a.start <= cycle.start &&
                  (!a.end || a.end > cycle.start),
              )
              .sort((a, b) => b.start.localeCompare(a.start))[0];
            if (!a) continue;
            const post = await must(db, "posts", a.postId);
            const client = await must(db, "clients", post.clientId);
            if (client.status !== "ativo" || post.status !== "ativo") continue;
            await db.put("participants", {
              id: id(),
              cycleId: cycle.id,
              seasonId: season.id,
              employeeId: e.id,
              allocationId: a.id,
              eligible: true,
              snapshot: {
                name: e.name,
                registration: e.registration,
                role: e.role,
                client: client.name,
                clientId: client.id,
                post: post.name,
                postId: post.id,
                supervisorId: a.supervisorId,
              },
            });
            count++;
          }
          assert(count, "Nenhuma alocação elegível no início do ciclo");
          await db.put("cycles", { ...cycle, status: "ativo" });
        } else if (req.params.action === "close") {
          assert(cycle.status === "ativo", "Ciclo não está ativo");
          await db.put("cycles", { ...cycle, status: "encerrado" });
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
        const existing = (await db.all("evaluations")).find(
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
      const { db, user, role } = await context(req, "evaluations");
      await store.transaction(async () => {
        const e = await must(db, "evaluations", String(req.params.id));
        assert(
          canSee(user, role, e.snapshot),
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
          const reason = z
            .string()
            .trim()
            .min(3)
            .max(500)
            .parse(req.body.reason);
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
      const required = ["matricula", "nome", "funcao", "cliente", "posto"];
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
        const clients = await db.all("clients"),
          posts = await db.all("posts"),
          employees = await db.all("employees");
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
            (p) =>
              p.clientId === client.id &&
              p.name.toLowerCase() === r.posto.toLowerCase(),
          );
          if (!post) {
            post = await db.put("posts", {
              id: id(),
              clientId: client.id,
              name: r.posto,
              status: "ativo",
              code: "",
              address: "",
            });
            posts.push(post);
          }
          let employee = employees.find((e) => e.registration === r.matricula);
          employee = await db.put("employees", {
            ...employee,
            id: employee?.id || id(),
            name: r.nome,
            registration: r.matricula,
            role: r.funcao,
            status: employee?.status || "ativo",
            admissionDate: employee?.admissionDate || today(),
          });
          const current = (await db.all("allocations")).find(
            (a) => a.employeeId === employee!.id && !a.end,
          );
          if (current?.postId !== post.id) {
            if (current)
              await db.put("allocations", { ...current, end: today() });
            await db.put("allocations", {
              id: id(),
              employeeId: employee.id,
              postId: post.id,
              clientId: client.id,
              start: today(),
              end: null,
              supervisorId: "",
              importId: imp.id,
            });
          }
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
        ["employees", "evaluations", "pending", "ranking"].includes(kind),
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
      sheet.autoFilter = { from: "A1", to: "J1" };
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
