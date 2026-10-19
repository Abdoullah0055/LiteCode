import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import curriculum from "../curriculum/original.fr.json";
const pilot = curriculum.lessons.find((lesson) => lesson.id === "mvp-004")!.activity;

const mocks = vi.hoisted(() => ({
  user: { id: "00000000-0000-4000-8000-000000000101" } as { id: string } | null,
  rpc: vi.fn(),
  load: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  configured: () => true,
  admin: () => ({ rpc: mocks.rpc }),
  supabase: async () => ({
    auth: { getUser: async () => ({ data: { user: mocks.user } }) },
    from: (table: string) => {
      const response = { data: table === "lessons" ? { id: "mvp-004", type: "exercise", xp: 20 } : [], error: null };
      const query = {
        select: () => query, eq: () => query, not: () => query,
        maybeSingle: async () => response,
        then: (resolve: (value: typeof response) => unknown) => Promise.resolve(response).then(resolve),
      };
      return query;
    },
  }),
}));
vi.mock("@/lib/learning-runtime", () => ({ loadAuthoredActivity: mocks.load }));

import { POST as attempt } from "../src/app/api/learning/[id]/attempt/route";
import { PUT as draft } from "../src/app/api/learning/[id]/draft/route";

beforeEach(() => {
  mocks.user = { id: "00000000-0000-4000-8000-000000000101" };
  mocks.rpc.mockReset();
  mocks.load.mockReset().mockResolvedValue({ activity: pilot, versionId: "00000000-0000-4000-8000-000000000202", projectId: null, steps: [] });
});

const params = () => ({ params: Promise.resolve({ id: "mvp-004" }) });
function request(path: string, body: unknown, method = "POST") {
  return new NextRequest(`http://localhost:3107/api/learning/mvp-004/${path}`, {
    method, headers: { "Content-Type": "application/json", Origin: "http://localhost:3107", Host: "localhost:3107" },
    body: JSON.stringify(body),
  });
}

it("requires a real authenticated user before loading correction data", async () => {
  mocks.user = null;
  expect((await attempt(request("attempt", { version: 2, answers: {} }), params())).status).toBe(401);
  expect(mocks.load).not.toHaveBeenCalled();
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("rejects client XP and pass claims without creating an attempt", async () => {
  expect((await attempt(request("attempt", { version: 2, answers: {}, xp: 999, passed: true }), params())).status).toBe(400);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("returns 409 for stale submissions before creating an attempt", async () => {
  expect((await attempt(request("attempt", { version: 1, answers: {} }), params())).status).toBe(409);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("returns 409 for a stale draft without overwriting stored answers", async () => {
  expect((await draft(request("draft", { version: 1, answers: {} }, "PUT"), params())).status).toBe(409);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("refuses another origin before exposing corrections", async () => {
  const req = request("attempt", { version: 2, answers: {} });
  req.headers.set("Origin", "https://attacker.invalid");
  expect((await attempt(req, params())).status).toBe(403);
  expect(mocks.load).not.toHaveBeenCalled();
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("grades answers on the server and returns the stored reward without keys", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: "attempt-test", error: null })
    .mockResolvedValueOnce({ data: { xp: 20 }, error: null });
  const response = await attempt(request("attempt", { version: 2, answers: {
    "variable-roles": { kind: "classify", assignments: { prenom: "fixed", score: "changes" } },
    "score-trace": { kind: "trace", values: { start: "2", bonus: "5" } },
    "const-intention": { kind: "choice", selected: ["const"] },
  } }), params());
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ passed: true, xp: 20, attemptId: "attempt-test" });
  expect(JSON.stringify(body)).not.toContain('"accepted"');
  expect(mocks.rpc).toHaveBeenLastCalledWith("finish_attempt", expect.objectContaining({ p_status: "passed", p_user: mocks.user!.id }));
});
