import { it, expect } from "vitest";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
it("the separate execution service authenticates and evaluates requests", async () => {
  const key = randomBytes(32).toString("hex");
  const child = spawn(process.execPath, ["runner/server.mjs"], {
    env: { ...process.env, RUNNER_API_KEY: key, PORT: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const port = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Runner startup timeout")),
        10000,
      );
      child.stdout.on("data", (chunk) => {
        try {
          const msg = JSON.parse(chunk.toString());
          if (msg.port) {
            clearTimeout(timer);
            resolve(msg.port);
          }
        } catch {
          /* Wait for ready message. */
        }
      });
      child.once("error", reject);
    });
    const url = `http://127.0.0.1:${port}/evaluate`;
    expect((await fetch(url, { method: "POST" })).status).toBe(401);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "function solve(n){return n+1}",
        cases: [{ label: "increment", args: [2], expected: 3 }],
      }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).results[0].passed).toBe(true);
    const invalid = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: "{}",
    });
    expect(invalid.status).toBe(400);
  } finally {
    child.kill();
  }
});
