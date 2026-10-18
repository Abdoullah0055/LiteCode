import { expect, it } from "vitest";
import { evaluate } from "../runner/evaluate.mjs";
it("enforces non-mutating array contracts", async () => {
  const cases = [
    {
      label: "copy",
      args: [[1, 2], 3],
      expected: [1, 2, 3],
      preserve_inputs: true,
      require_new_array: true,
    },
  ];
  expect(
    (await evaluate("function solve(a,n){a.push(n);return a}", cases))[0]
      .passed,
  ).toBe(false);
  expect(
    (await evaluate("function solve(a,n){return [...a,n]}", cases))[0].passed,
  ).toBe(true);
});
it("executes JavaScript and compares typed results outside the VM", async () => {
  const cases = [
    { label: "double", args: [4], expected: 8 },
    { label: "zero", args: [0], expected: 0 },
  ];
  expect(
    (await evaluate("function solve(n){return n*2}", cases)).every(
      (x) => x.passed,
    ),
  ).toBe(true);
  expect(
    (await evaluate('function solve(){return "8"}', cases))[0].passed,
  ).toBe(false);
});
it("interrupts loops and denies host APIs", async () => {
  const cases = [{ label: "bounded", args: [], expected: 1 }];
  expect(
    (await evaluate("function solve(){while(true){}}", cases))[0].passed,
  ).toBe(false);
  expect(
    (await evaluate("function solve(){return process.env}", cases))[0].passed,
  ).toBe(false);
  expect(
    (
      await evaluate(
        'function solve(){return fetch("https://example.com")}',
        cases,
      )
    )[0].passed,
  ).toBe(false);
});
it("rejects syntax errors, oversized output and heap exhaustion", async () => {
  const cases = [{ label: "safe", args: [], expected: 1 }];
  expect((await evaluate("function solve( {", cases))[0].passed).toBe(false);
  expect(
    (await evaluate('function solve(){return "a".repeat(100000)}', cases))[0]
      .passed,
  ).toBe(false);
  expect(
    (
      await evaluate(
        "function solve(){return new Array(20000000).fill(1)}",
        cases,
      )
    )[0].passed,
  ).toBe(false);
});
