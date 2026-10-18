import { expect, it } from "vitest";
import { assertTestProject } from "./helpers/test-project";

it("requires an explicitly confirmed hosted test project before any live writes", () => {
  expect(() =>
    assertTestProject("https://test-project.supabase.co", undefined),
  ).toThrow();
  expect(() =>
    assertTestProject("https://production.supabase.co", "test-project"),
  ).toThrow();
  expect(() =>
    assertTestProject("http://test-project.supabase.co", "test-project"),
  ).toThrow();
  expect(() =>
    assertTestProject(
      "https://test-project.supabase.co.attacker.invalid",
      "test-project",
    ),
  ).toThrow();
  expect(() =>
    assertTestProject("https://test-project.supabase.co", "test-project"),
  ).not.toThrow();
});
