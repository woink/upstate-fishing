/**
 * Promise pool concurrency limiter tests
 */

import { assertEquals } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { promisePool } from '../lib/promise-pool.ts';

describe('promisePool', () => {
  it('limits concurrency to specified number', async () => {
    let activeTasks = 0;
    let peakConcurrency = 0;

    const tasks = Array.from({ length: 10 }, () => async () => {
      activeTasks++;
      peakConcurrency = Math.max(peakConcurrency, activeTasks);
      await new Promise((resolve) => setTimeout(resolve, 10));
      activeTasks--;
      return 'done';
    });

    await promisePool(tasks, 3);

    assertEquals(
      peakConcurrency <= 3,
      true,
      `Peak concurrency was ${peakConcurrency}, expected <= 3`,
    );
  });

  it('processes all tasks and preserves result order', async () => {
    const tasks = [0, 1, 2, 3, 4].map((i) => async () => {
      await new Promise((resolve) => setTimeout(resolve, (5 - i) * 5));
      return i * 10;
    });

    const results = await promisePool(tasks, 2);

    assertEquals(results.length, 5);
    for (let i = 0; i < 5; i++) {
      const r = results[i];
      assertEquals(r.status, 'fulfilled');
      if (r.status === 'fulfilled') {
        assertEquals(r.value, i * 10);
      }
    }
  });

  it('handles rejections without stopping pool', async () => {
    const tasks: (() => Promise<string>)[] = [
      () => Promise.resolve('ok'),
      () => Promise.reject(new Error('fail')),
      () => Promise.resolve('also ok'),
    ];

    const results = await promisePool(tasks, 2);

    assertEquals(results.length, 3);
    assertEquals(results[0].status, 'fulfilled');
    assertEquals(results[1].status, 'rejected');
    assertEquals(results[2].status, 'fulfilled');

    if (results[0].status === 'fulfilled') assertEquals(results[0].value, 'ok');
    if (results[1].status === 'rejected') {
      assertEquals((results[1].reason as Error).message, 'fail');
    }
    if (results[2].status === 'fulfilled') assertEquals(results[2].value, 'also ok');
  });

  it('works with concurrency=1 (serial execution)', async () => {
    const order: number[] = [];
    const tasks = [0, 1, 2].map((i) => () => {
      order.push(i);
      return Promise.resolve(i);
    });

    const results = await promisePool(tasks, 1);

    assertEquals(order, [0, 1, 2]);
    assertEquals(results.length, 3);
  });

  it('handles empty task array', async () => {
    const results = await promisePool([], 4);
    assertEquals(results, []);
  });

  it('works when concurrency exceeds task count', async () => {
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2)];
    const results = await promisePool(tasks, 10);

    assertEquals(results.length, 2);
    assertEquals(results[0].status, 'fulfilled');
    assertEquals(results[1].status, 'fulfilled');
  });
});
