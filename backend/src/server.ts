import { Store } from "./db.ts";
import { createApp } from "./app.ts";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
if (existsSync(".env")) loadEnvFile(".env");
const store = await new Store().init(process.env.DATABASE_URL);
const app = createApp(store);
const scheduler = setInterval(() => {
  void app.locals.runScheduled().catch(console.error);
}, 60000);
scheduler.unref();
const server = app.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `Clube de Talentos em http://localhost:${process.env.PORT || 3001}`,
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      clearInterval(scheduler);
      await store.close();
      process.exit(0);
    }),
  );
