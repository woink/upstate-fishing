/**
 * Promise pool — bounded concurrency for async tasks.
 *
 * Runs up to `concurrency` tasks at a time. When one finishes the next
 * is started. Results are returned in the original task order using
 * PromiseSettledResult semantics (rejections don't abort the pool).
 */
export async function promisePool<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      try {
        const value = await tasks[i]();
        results[i] = { status: 'fulfilled', value };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext(),
  );

  await Promise.all(workers);
  return results;
}
