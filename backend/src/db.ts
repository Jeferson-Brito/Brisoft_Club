import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

export const tables = [
  "organizations",
  "roles",
  "users",
  "sessions",
  "clients",
  "posts",
  "clientPosts",
  "employees",
  "allocations",
  "penaltyTypes",
  "employeeActions",
  "seasons",
  "cycles",
  "participants",
  "evaluations",
  "imports",
  "audit",
  "settings",
] as const;
export type Table = (typeof tables)[number];
export type RecordData = { id: string; [key: string]: any };

function postgresConfig(url: string): pg.ClientConfig {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DATABASE_URL inválida. Copie a URI de conexão do Supabase sem alterar o formato.");
  }
  if (parsed.hostname.endsWith("pooler.supabase.com") && parsed.port === "6543")
    throw new Error(
      "Use o Supabase Session pooler (porta 5432), não o Transaction pooler (porta 6543). O Clube de Talentos usa transações e estado de sessão SQL.",
    );
  if (process.env.NODE_ENV === "production" && process.env.PGSSL === "disable")
    throw new Error("PGSSL=disable não é permitido em produção.");
  const caPath = process.env.PGSSL_CA?.trim();
  const verifyCertificate = process.env.PGSSL_VERIFY !== "false";
  if (process.env.NODE_ENV === "production" && !verifyCertificate)
    throw new Error("PGSSL_VERIFY=false não é permitido em produção. Configure PGSSL_CA.");
  return {
    connectionString: url,
    application_name: "clube-de-talentos",
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000),
    query_timeout: Number(process.env.PG_QUERY_TIMEOUT_MS || 30000),
    statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 30000),
    ssl:
      process.env.PGSSL === "disable"
        ? false
        : {
            rejectUnauthorized: verifyCertificate,
            ...(caPath ? { ca: readFileSync(resolve(caPath), "utf8") } : {}),
          },
  };
}
// TEXT UUIDs, ISO dates and serialized JSON keep the SQL portable to PostgreSQL.
export const schema = `
CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES organizations(id), email TEXT NOT NULL, role_id TEXT NOT NULL REFERENCES roles(id), data TEXT NOT NULL, UNIQUE(tenant_id,email));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, client_id TEXT REFERENCES clients(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clientPosts (id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), post_id TEXT NOT NULL REFERENCES posts(id), data TEXT NOT NULL, UNIQUE(client_id,post_id));
CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES organizations(id), registration TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(tenant_id,registration));
CREATE TABLE IF NOT EXISTS allocations (id TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id), post_id TEXT NOT NULL REFERENCES posts(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS penaltyTypes (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seasons (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cycles (id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES seasons(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS employeeActions (id TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id), season_id TEXT NOT NULL REFERENCES seasons(id), cycle_id TEXT REFERENCES cycles(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, cycle_id TEXT NOT NULL REFERENCES cycles(id), employee_id TEXT NOT NULL REFERENCES employees(id), allocation_id TEXT NOT NULL REFERENCES allocations(id), data TEXT NOT NULL, UNIQUE(cycle_id,employee_id));
CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id), evaluator_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL, UNIQUE(participant_id,evaluator_id));
CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS participants_cycle ON participants(cycle_id);
CREATE INDEX IF NOT EXISTS allocations_employee ON allocations(employee_id);
CREATE INDEX IF NOT EXISTS client_posts_client ON clientPosts(client_id);
CREATE INDEX IF NOT EXISTS client_posts_post ON clientPosts(post_id);
CREATE INDEX IF NOT EXISTS employee_actions_employee ON employeeActions(employee_id);
CREATE INDEX IF NOT EXISTS employee_actions_season ON employeeActions(season_id);
CREATE INDEX IF NOT EXISTS evaluations_participant ON evaluations(participant_id);
`;
const columns: Partial<Record<Table, Record<string, string>>> = {
  organizations: { slug: "slug" },
  users: { tenant_id: "tenantId", email: "email", role_id: "roleId" },
  sessions: { user_id: "userId" },
  posts: { client_id: "clientId" },
  clientPosts: { client_id: "clientId", post_id: "postId" },
  employees: { tenant_id: "tenantId", registration: "registration" },
  allocations: { employee_id: "employeeId", post_id: "postId" },
  employeeActions: { employee_id: "employeeId", season_id: "seasonId", cycle_id: "cycleId" },
  cycles: { season_id: "seasonId" },
  participants: {
    cycle_id: "cycleId",
    employee_id: "employeeId",
    allocation_id: "allocationId",
  },
  evaluations: { participant_id: "participantId", evaluator_id: "evaluatorId" },
};
export class Store {
  sqlite?: DatabaseSync;
  postgres?: pg.Client;
  private pgConfig?: pg.ClientConfig;
  private isConnecting = false;
  private pending: Promise<unknown> = Promise.resolve();

  private async connectPostgres() {
    this.postgres = new pg.Client(this.pgConfig!);
    this.postgres.on("error", (err) => {
      console.warn("Postgres connection error (reconnecting on next query):", err.message);
      if (this.postgres) (this.postgres as any)._ended = true;
    });
    await this.postgres.connect();
    await this.postgres.query(
      "CREATE SCHEMA IF NOT EXISTS clube; SET search_path TO clube;",
    );
  }

  async ensureConnected() {
    if (!this.pgConfig) return;
    if (!this.postgres || (this.postgres as any)._ending || (this.postgres as any)._ended) {
      if (this.isConnecting) return;
      this.isConnecting = true;
      try {
        if (this.postgres) {
          try { await this.postgres.end(); } catch {}
        }
        await this.connectPostgres();
      } finally {
        this.isConnecting = false;
      }
    }
  }

  async init(
    url?: string,
    file = process.env.SQLITE_PATH || resolve("data/clube.sqlite"),
  ) {
    if (url) {
      this.pgConfig = postgresConfig(url);
      await this.connectPostgres();
      await this.postgres!.query(schema);
      await this.postgres!.query("ALTER TABLE posts ALTER COLUMN client_id DROP NOT NULL");
    } else {
      if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
      this.sqlite = new DatabaseSync(file);
      this.sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
      this.sqlite.exec(schema);
    }
    const legacyPosts = await this.all("posts");
    const existingLinks = await this.all("clientPosts");
    for (const post of legacyPosts)
      if (
        post.clientId &&
        !existingLinks.some(
          (link) => link.clientId === post.clientId && link.postId === post.id,
        )
      )
        await this.put("clientPosts", {
          id: `legacy-${post.clientId}-${post.id}`,
          tenantId: post.tenantId,
          clientId: post.clientId,
          postId: post.id,
          createdAt: post.createdAt || new Date().toISOString(),
        });
    const links = await this.all("clientPosts");
    for (const allocation of await this.all("allocations")) {
      if (allocation.clientId) continue;
      const post = legacyPosts.find((item) => item.id === allocation.postId);
      const linkedClients = links.filter((item) => item.postId === allocation.postId);
      const clientId = post?.clientId || (linkedClients.length === 1 ? linkedClients[0].clientId : "");
      if (clientId) await this.put("allocations", { ...allocation, clientId });
    }
    return this;
  }
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.pgConfig) {
      await this.ensureConnected();
      let i = 0;
      try {
        return (
          await this.postgres!.query(
            sql.replace(/\?/g, () => `$${++i}`),
            params,
          )
        ).rows;
      } catch (err: any) {
        if (err?.message?.includes("Connection terminated") || err?.message?.includes("closed")) {
          if (this.postgres) (this.postgres as any)._ended = true;
          await this.ensureConnected();
          i = 0;
          return (
            await this.postgres!.query(
              sql.replace(/\?/g, () => `$${++i}`),
              params,
            )
          ).rows;
        }
        throw err;
      }
    }
    return this.sqlite!.prepare(sql).all(...params);
  }
  async execute(sql: string, params: any[] = []) {
    if (this.pgConfig) {
      await this.ensureConnected();
      let i = 0;
      try {
        await this.postgres!.query(
          sql.replace(/\?/g, () => `$${++i}`),
          params,
        );
      } catch (err: any) {
        if (err?.message?.includes("Connection terminated") || err?.message?.includes("closed")) {
          if (this.postgres) (this.postgres as any)._ended = true;
          await this.ensureConnected();
          i = 0;
          await this.postgres!.query(
            sql.replace(/\?/g, () => `$${++i}`),
            params,
          );
        } else {
          throw err;
        }
      }
    } else this.sqlite!.prepare(sql).run(...params);
  }
  async all(table: Table): Promise<RecordData[]> {
    return (await this.query(`SELECT data FROM ${table}`)).map((r) =>
      JSON.parse(r.data),
    );
  }
  async allMany(selected: readonly Table[]) {
    const result: Partial<Record<Table, RecordData[]>> = {};
    for (const table of selected) result[table] = [];
    if (!selected.length) return result;
    const rows = await this.query(
      selected.map((table) => `SELECT '${table}' AS table_name, data FROM ${table}`).join(" UNION ALL "),
    );
    for (const row of rows) result[row.table_name as Table]!.push(JSON.parse(row.data));
    return result;
  }
  async get(table: Table, id: string): Promise<RecordData | undefined> {
    const rows = await this.query(`SELECT data FROM ${table} WHERE id=?`, [id]);
    return rows[0] ? JSON.parse(rows[0].data) : undefined;
  }
  async put(table: Table, data: RecordData) {
    const mapping = columns[table] || {};
    const keys = ["id", ...Object.keys(mapping), "data"];
    const values = [
      data.id,
      ...Object.values(mapping).map((key) => data[key] ?? null),
      JSON.stringify(data),
    ];
    await this.execute(
      `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")}) ON CONFLICT(id) DO UPDATE SET ${keys
        .slice(1)
        .map((k) => `${k}=excluded.${k}`)
        .join(",")}`,
      values,
    );
    return data;
  }
  async remove(table: Table, id: string) {
    await this.execute(`DELETE FROM ${table} WHERE id=?`, [id]);
  }
  // A single connection and queue prevent interleaved transactions, including SQLite writes.
  exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.pending.then(fn, fn);
    this.pending = next.catch(() => {});
    return next;
  }
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    await this.execute("BEGIN");
    try {
      const result = await fn();
      await this.execute("COMMIT");
      return result;
    } catch (error) {
      await this.execute("ROLLBACK");
      throw error;
    }
  }
  async close() {
    this.sqlite?.close();
    await this.postgres?.end();
  }
}
export class TenantStore {
  constructor(
    readonly root: Store,
    readonly tenantId: string,
  ) {}
  async all(table: Table) {
    return (await this.root.all(table)).filter(
      (r) => r.tenantId === this.tenantId,
    );
  }
  async allMany(selected: readonly Table[]) {
    const rows = await this.root.allMany(selected);
    const result: Partial<Record<Table, RecordData[]>> = {};
    for (const table of selected)
      result[table] = (rows[table] || []).filter((row) => row.tenantId === this.tenantId);
    return result;
  }
  async get(table: Table, id: string) {
    const row = await this.root.get(table, id);
    return row?.tenantId === this.tenantId ? row : undefined;
  }
  async query(sql: string, params: any[] = []) {
    return this.root.query(sql, params);
  }
  async put(table: Table, data: RecordData) {
    if (table !== "audit") {
      const previous = await this.root.get(table, data.id);
      if (previous && previous.tenantId !== this.tenantId)
        throw new Error("Tenant mismatch");
    }
    return this.root.put(table, { ...data, tenantId: this.tenantId });
  }
  async remove(table: Table, id: string) {
    if (await this.get(table, id)) await this.root.remove(table, id);
  }
}
