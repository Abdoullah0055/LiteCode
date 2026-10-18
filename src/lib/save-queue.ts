/** Writes from one editor are acknowledged in their original order. */
export function createSaveQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    enqueue<T>(write: () => Promise<T>): Promise<T> {
      const current = tail.then(write, write);
      tail = current.then(
        () => undefined,
        () => undefined,
      );
      return current;
    },
  };
}

export function createDraftWriter(
  initialCode: string,
  write: (code: string) => Promise<void>,
) {
  const queue = createSaveQueue();
  let lastQueued = initialCode;
  return {
    needsSave: (code: string) => code !== lastQueued,
    save(code: string) {
      lastQueued = code;
      return queue.enqueue(() => write(code));
    },
  };
}
