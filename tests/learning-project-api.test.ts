import { expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import curriculum from "../curriculum/original.fr.json";

const project = curriculum.lessons.find((lesson) => lesson.id === "mvp-008")!.activity;
const versionId = "00000000-0000-4000-8000-000000000202";
const projectId = "00000000-0000-4000-8000-000000000303";
const userId = "00000000-0000-4000-8000-000000000101";
const steps = project.public.project!.steps.map((id, index) => ({ id, position: index + 1 }));
const submissions = [
  { version: project.public.version, answers: { bonus: { kind: "blanks", values: { expression: "two" } } } },
  { version: project.public.version, answers: { message: { kind: "matching", pairs: [{ leftId: "lina", rightId: "prenom" }, { leftId: "huit", rightId: "total" }] } } },
  { version: project.public.version, answers: { affichage: { kind: "ordering", order: ["prenom", "score"] } } },
  { version: project.public.version, answers: { sortie: { kind: "choice", selected: ["eight"] } } },
];

const mocks = vi.hoisted(() => ({
  user: { id: "00000000-0000-4000-8000-000000000101" } as { id: string } | null,
  rpc: vi.fn(),
  load: vi.fn(),
  saved: [] as { position: number; passed?: boolean; submission?: unknown }[],
  savedError: null as { message: string } | null,
}));

vi.mock("@/lib/supabase/server", () => {
  const query = (response: { data: unknown; error: unknown }) => {
    const result = {
      select: () => result, eq: () => result, not: () => result, order: () => result,
      maybeSingle: async () => response,
      then: (resolve: (value: typeof response) => unknown) => Promise.resolve(response).then(resolve),
    };
    return result;
  };
  return {
    configured: () => true,
    admin: () => ({
      rpc: mocks.rpc,
      from: (table: string) => {
        if (table !== "learning_project_step_results") throw new Error(`Unexpected admin table: ${table}`);
        return query({ data: mocks.saved, error: mocks.savedError });
      },
    }),
    supabase: async () => ({
      auth: { getUser: async () => ({ data: { user: mocks.user } }) },
      from: (table: string) => {
        if (!["lessons", "user_progress", "prerequisites"].includes(table)) throw new Error(`Unexpected user table: ${table}`);
        const data = table === "lessons" ? { id: "mvp-008", type: "exercise", xp: 20 } : [];
        return query({ data, error: null });
      },
    }),
  };
});
vi.mock("@/lib/learning-runtime", () => ({ loadAuthoredActivity: mocks.load }));

import { POST as submitStep } from "../src/app/api/learning/[id]/steps/[stepId]/route";
import { POST as finishProject } from "../src/app/api/learning/[id]/project/finish/route";

beforeEach(() => {
  mocks.user = { id: userId };
  mocks.rpc.mockReset();
  mocks.saved = [];
  mocks.savedError = null;
  mocks.load.mockReset().mockResolvedValue({ activity: project, versionId, projectId, steps });
});

function request(path: string, body: unknown) {
  return new NextRequest(`http://localhost:3107/api/learning/mvp-008/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3107", Host: "localhost:3107" },
    body: JSON.stringify(body),
  });
}

it("rejects a project step out of order before grading or writing", async () => {
  const response = await submitStep(request("steps/affichage", submissions[2]), { params: Promise.resolve({ id: "mvp-008", stepId: "affichage" }) });
  expect(response.status).toBe(409);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("saves a correctly graded step through its step RPC without granting activity rewards", async () => {
  mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
  const response = await submitStep(request("steps/bonus", submissions[0]), { params: Promise.resolve({ id: "mvp-008", stepId: "bonus" }) });
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ passed: true, nextStepId: "message", completedSteps: 1, totalSteps: 4 });
  expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("save_learning_project_step", expect.objectContaining({ p_user: userId, p_project_id: projectId, p_position: 1, p_passed: true }));
  expect(mocks.rpc.mock.calls.some(([name]) => name === "finish_attempt")).toBe(false);
});

it("does not finish an incomplete project", async () => {
  mocks.saved = [{ position: 1, submission: submissions[0] }];
  const response = await finishProject(request("project/finish", { version: project.public.version }), { params: Promise.resolve({ id: "mvp-008" }) });
  expect(response.status).toBe(409);
  expect(mocks.rpc).not.toHaveBeenCalled();
});

it("regrades every saved step before the final RPC sequence and returns no answer keys", async () => {
  mocks.saved = submissions.map((submission, index) => ({ position: index + 1, submission }));
  mocks.rpc.mockResolvedValueOnce({ data: "attempt-test", error: null })
    .mockResolvedValueOnce({ data: null, error: null })
    .mockResolvedValueOnce({ data: { xp: 20 }, error: null });
  const response = await finishProject(request("project/finish", { version: project.public.version }), { params: Promise.resolve({ id: "mvp-008" }) });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ attemptId: "attempt-test", passed: true, xp: 20 });
  expect(JSON.stringify(body)).not.toContain('"accepted"');
  expect(mocks.rpc.mock.calls.map(([name]) => name)).toEqual(["begin_learning_attempt", "authorize_project_completion", "finish_attempt"]);
  expect(mocks.rpc.mock.calls[0][1].p_submission.answers).toMatchObject({ bonus: { kind: "blanks", values: { expression: "two" } }, sortie: { kind: "choice", selected: ["eight"] } });
});
