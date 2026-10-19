import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = (relative) => path.join(root, "node_modules", ...relative.split("/"));
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  NEXT_PUBLIC_SITE_URL: "",
  LITECODE_E2E_LIVE: "",
  LITECODE_E2E_TEST_PROJECT_REF: "",
};

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Exited ${code}: ${args.join(" ")}`)));
  });
}

await run([cli("next/dist/bin/next"), "build"]);
await run([cli("@playwright/test/cli.js"), "test"]);
