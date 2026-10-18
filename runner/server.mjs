import http from "node:http";
import { Worker } from "node:worker_threads";
import { timingSafeEqual } from "node:crypto";
const key = process.env.RUNNER_API_KEY;
if (!key || key.length < 32)
  throw new Error("RUNNER_API_KEY must contain at least 32 characters");
let active = 0;
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const reply = (status, data) => {
    res.writeHead(status);
    res.end(JSON.stringify(data));
  };
  const token = Buffer.from(
    req.headers.authorization?.replace(/^Bearer /, "") || "",
  );
  const expected = Buffer.from(key);
  if (token.length !== expected.length || !timingSafeEqual(token, expected))
    return reply(401, { error: "Unauthorized" });
  if (req.method !== "POST" || req.url !== "/evaluate")
    return reply(404, { error: "Not found" });
  if (active >= 4) return reply(429, { error: "Runner busy" });
  active++;
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 128000)
        return reply(413, { error: "Payload too large" });
    }
    const data = JSON.parse(body);
    if (
      typeof data.code !== "string" ||
      data.code.length > 20000 ||
      !Array.isArray(data.cases) ||
      !data.cases.length ||
      data.cases.length > 12 ||
      data.cases.some(
        (c) => !Array.isArray(c.args) || typeof c.label !== "string",
      )
    )
      return reply(400, { error: "Invalid payload" });
    const worker = new Worker(new URL("./worker.mjs", import.meta.url), {
      workerData: data,
      resourceLimits: {
        maxOldGenerationSizeMb: 96,
        maxYoungGenerationSizeMb: 16,
        stackSizeMb: 2,
      },
    });
    const result = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        void worker.terminate();
        reject(new Error("Timeout"));
      }, 5000);
      worker.once("message", (message) => {
        clearTimeout(timer);
        resolve(message);
        void worker.terminate();
      });
      worker.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      worker.once("exit", (code) => {
        if (code !== 0) {
          clearTimeout(timer);
          reject(new Error("Worker exited"));
        }
      });
    });
    reply(200, result);
  } catch {
    reply(422, { error: "Temps, mémoire ou syntaxe invalide." });
  } finally {
    active--;
  }
});
server.requestTimeout = 10000;
server.headersTimeout = 5000;
server.listen(
  Number(process.env.PORT || 4001),
  process.env.RUNNER_HOST || "127.0.0.1",
  () =>
    console.log(JSON.stringify({ ready: true, port: server.address().port })),
);
