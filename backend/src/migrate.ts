import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Store, tables } from "./db.ts";
if (existsSync(".env")) loadEnvFile(".env");
if (!process.env.DATABASE_URL)
  throw new Error("Defina DATABASE_URL com a conexão PostgreSQL do Supabase.");
if (process.env.CONFIRM_MIGRATION !== "yes")
  throw new Error(
    "Faça backup e defina CONFIRM_MIGRATION=yes para migrar para um banco vazio.",
  );
const source = await new Store().init(
  undefined,
  process.env.SQLITE_PATH || resolve("data/clube.sqlite"),
);
const target = await new Store().init(process.env.DATABASE_URL);
try {
  await target.transaction(async () => {
    for (const table of tables)
      if ((await target.all(table)).length)
        throw new Error(`Destino não está vazio: ${table}`);
    for (const table of tables) {
      if (table === "sessions") continue;
      const rows = await source.all(table);
      for (const row of rows) await target.put(table, row);
      const copied = await target.all(table);
      if (copied.length !== rows.length)
        throw new Error(`Contagem divergente: ${table}`);
      console.log(`${table}: ${copied.length} registros conferidos`);
    }
  });
  console.log(
    "Migração concluída. IDs e snapshots preservados. Faça login novamente.",
  );
} finally {
  await source.close();
  await target.close();
}
