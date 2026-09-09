import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";

export const tables = [
  "organizations",
  "roles",
  "users",
  "sessions",
  "clients",
  "posts",
  "employees",
  "allocations",
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
// TEXT UUIDs, ISO dates and serialized JSON keep the SQL portable to PostgreSQL.
export const schema = `
CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS roles (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES organizations(id), email TEXT NOT NULL, role_id TEXT NOT NULL REFERENCES roles(id), data TEXT NOT NULL, UNIQUE(tenant_id,email));
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES organizations(id), registration TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(tenant_id,registration));
CREATE TABLE IF NOT EXISTS allocations (id TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id), post_id TEXT NOT NULL REFERENCES posts(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS seasons (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cycles (id TEXT PRIMARY KEY, season_id TEXT NOT NULL REFERENCES seasons(id), data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, cycle_id TEXT NOT NULL REFERENCES cycles(id), employee_id TEXT NOT NULL REFERENCES employees(id), allocation_id TEXT NOT NULL REFERENCES allocations(id), data TEXT NOT NULL, UNIQUE(cycle_id,employee_id));
CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id), evaluator_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL, UNIQUE(participant_id,evaluator_id));
CREATE TABLE IF NOT EXISTS imports (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS participants_cycle ON participants(cycle_id);
CREATE INDEX IF NOT EXISTS allocations_employee ON allocations(employee_id);
CREATE INDEX IF NOT EXISTS evaluations_participant ON evaluations(participant_id);
`;
const columns: Partial<Record<Table, Record<string, string>>> = {
  organizations: { slug: "slug" },
  users: { tenant_id: "tenantId", email: "email", role_id: "roleId" },
  sessions: { user_id: "userId" },
  posts: { client_id: "clientId" },
  employees: { tenant_id: "tenantId", registration: "registration" },
  allocations: { employee_id: "employeeId", post_id: "postId" },
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
  private pending: Promise<unknown> = Promise.resolve();
  async init(
    url?: string,
    file = process.env.SQLITE_PATH || resolve("data/clube.sqlite"),
  ) {
    if (url) {
      this.postgres = new pg.Client({
        connectionString: url,
        ssl:
          process.env.PGSSL === "disable"
            ? false
            : { rejectUnauthorized: true },
      });
      await this.postgres.connect();
      await this.postgres.query(
        "CREATE SCHEMA IF NOT EXISTS clube; SET search_path TO clube;",
      );
      await this.postgres.query(schema);
    } else {
      if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
      this.sqlite = new DatabaseSync(file);
      this.sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
      this.sqlite.exec(schema);
    }
    return this;
  }
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (this.postgres) {
      let i = 0;
      return (
        await this.postgres.query(
          sql.replace(/\?/g, () => `$${++i}`),
          params,
        )
      ).rows;
    }
    return this.sqlite!.prepare(sql).all(...params);
  }
  async execute(sql: string, params: any[] = []) {
    if (this.postgres) {
      let i = 0;
      await this.postgres.query(
        sql.replace(/\?/g, () => `$${++i}`),
        params,
      );
    } else this.sqlite!.prepare(sql).run(...params);
  }
  async all(table: Table): Promise<RecordData[]> {
    return (await this.query(`SELECT data FROM ${table}`)).map((r) =>
      JSON.parse(r.data),
    );
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
      ...Object.values(mapping).map((key) => data[key]),
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
  async get(table: Table, id: string) {
    const row = await this.root.get(table, id);
    return row?.tenantId === this.tenantId ? row : undefined;
  }
  async put(table: Table, data: RecordData) {
    const previous = await this.root.get(table, data.id);
    if (previous && previous.tenantId !== this.tenantId)
      throw new Error("Tenant mismatch");
    return this.root.put(table, { ...data, tenantId: this.tenantId });
  }
  async remove(table: Table, id: string) {
    if (await this.get(table, id)) await this.root.remove(table, id);
  }
}
