import { expect, it } from "vitest";
import { createSaveQueue } from "../src/lib/save-queue";
it("serializes autosave and submission writes even if the first is slow", async () => {
  const queue = createSaveQueue();
  const writes: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const old = queue.enqueue(async () => {
    await gate;
    writes.push("old");
  });
  const latest = queue.enqueue(async () => {
    writes.push("latest");
  });
  await Promise.resolve();
  expect(writes).toEqual([]);
  release();
  await Promise.all([old, latest]);
  expect(writes).toEqual(["old", "latest"]);
});
it("allows a later save after a failed network request", async () => {
  const queue = createSaveQueue();
  await expect(
    queue.enqueue(async () => {
      throw new Error("offline");
    }),
  ).rejects.toThrow("offline");
  await expect(queue.enqueue(async () => 42)).resolves.toBe(42);
});
