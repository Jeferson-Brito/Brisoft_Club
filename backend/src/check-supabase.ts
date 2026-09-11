import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Store, tables } from "./db.ts";

if (existsSync(".env")) loadEnvFile(".env");
if (!process.env.DATABASE_URL)
  throw new Error("Defina DATABASE_URL em backend/.env antes da validação.");

const store = await new Store().init(process.env.DATABASE_URL);
try {
  const counts: Record<string, number> = {};
  for (const table of tables) counts[table] = (await store.all(table)).length;
  console.log("Conexão Supabase validada com TLS e schema clube acessível.");
  console.table(counts);
} finally {
  await store.close();
}
