import { expect, it } from "vitest";
import { createSaveQueue, createDraftWriter } from "../src/lib/save-queue";
it("saves a reversion while an intermediate draft is still in flight", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const writes: string[] = [];
  const writer = createDraftWriter("A", async (code) => {
    if (code === "B") await gate;
    writes.push(code);
  });
  expect(writer.needsSave("A")).toBe(false);
  const intermediate = writer.save("B");
  expect(writer.needsSave("A")).toBe(true);
  const reverted = writer.save("A");
  release();
  await Promise.all([intermediate, reverted]);
  expect(writes).toEqual(["B", "A"]);
});
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
