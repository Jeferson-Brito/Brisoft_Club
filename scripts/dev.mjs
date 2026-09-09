import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [
  spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: path.join(root, "backend"),
    stdio: "inherit",
    windowsHide: true,
  }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    cwd: path.join(root, "frontend"),
    stdio: "inherit",
    windowsHide: true,
  }),
];
function stop() {
  for (const child of children) child.kill();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const child of children)
  child.on("exit", (code) => {
    if (code) {
      stop();
      process.exitCode = code;
    }
  });
