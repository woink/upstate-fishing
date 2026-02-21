/**
 * Historical data service tests
 *
 * Tests the pure computeStats and detectTrend functions.
 * Network-dependent tests (getStationHistory) are covered by Supabase
 * integration tests.
 */

import { assertEquals } from '@std/assert';
import { computeStats, detectTrend } from '../src/services/historical.ts';
import type { TimeSeriesPoint } from '../src/services/historical.ts';

// ============================================================================
// detectTrend tests
// ============================================================================

Deno.test('detectTrend - rising values return rising', () => {
  const values = [10, 11, 12, 13, 14, 15, 16, 17, 18];
  assertEquals(detectTrend(values), 'rising');
});

Deno.test('detectTrend - falling values return falling', () => {
  const values = [18, 17, 16, 15, 14, 13, 12, 11, 10];
  assertEquals(detectTrend(values), 'falling');
});

Deno.test('detectTrend - stable values return stable', () => {
  const values = [50, 50.1, 49.9, 50, 50.2, 49.8, 50, 50.1, 50];
  assertEquals(detectTrend(values), 'stable');
});

Deno.test('detectTrend - fewer than 3 values return unknown', () => {
  assertEquals(detectTrend([10, 20]), 'unknown');
  assertEquals(detectTrend([10]), 'unknown');
  assertEquals(detectTrend([]), 'unknown');
});

Deno.test('detectTrend - exactly 3 values detects trend', () => {
  assertEquals(detectTrend([10, 15, 20]), 'rising');
  assertEquals(detectTrend([20, 15, 10]), 'falling');
});

Deno.test('detectTrend - slight change within 5% threshold is stable', () => {
  // 100 → 104 = 4% change, should be stable
  const values = [100, 101, 102, 103, 104];
  assertEquals(detectTrend(values), 'stable');
});

// ============================================================================
// computeStats tests
// ============================================================================

function makePoint(
  timestamp: string,
  waterTempF: number | null = null,
  dischargeCfs: number | null = null,
  gageHeightFt: number | null = null,
): TimeSeriesPoint {
  return { timestamp, waterTempF, dischargeCfs, gageHeightFt };
}

Deno.test('computeStats - computes min/max/avg for water temp', () => {
  const points: TimeSeriesPoint[] = [
    makePoint('2024-04-01T00:00:00Z', 48),
    makePoint('2024-04-02T00:00:00Z', 52),
    makePoint('2024-04-03T00:00:00Z', 56),
  ];

  const stats = computeStats('01420500', points, 3);
  assertEquals(stats.waterTemp.min, 48);
  assertEquals(stats.waterTemp.max, 56);
  assertEquals(stats.waterTemp.avg, 52);
  assertEquals(stats.waterTemp.trend, 'rising');
});

Deno.test('computeStats - handles null values gracefully', () => {
  const points: TimeSeriesPoint[] = [
    makePoint('2024-04-01T00:00:00Z', null, 150),
    makePoint('2024-04-02T00:00:00Z', null, 200),
    makePoint('2024-04-03T00:00:00Z', null, 180),
  ];

  const stats = computeStats('01420500', points, 3);
  assertEquals(stats.waterTemp.min, null);
  assertEquals(stats.waterTemp.max, null);
  assertEquals(stats.waterTemp.avg, null);
  assertEquals(stats.waterTemp.trend, 'unknown');
  assertEquals(stats.discharge.min, 150);
  assertEquals(stats.discharge.max, 200);
});

Deno.test('computeStats - empty points produce null stats', () => {
  const stats = computeStats('01420500', [], 7);
  assertEquals(stats.stationId, '01420500');
  assertEquals(stats.days, 7);
  assertEquals(stats.waterTemp.min, null);
  assertEquals(stats.discharge.min, null);
  assertEquals(stats.gageHeight.min, null);
});

Deno.test('computeStats - rounds values to 1 decimal place', () => {
  const points: TimeSeriesPoint[] = [
    makePoint('2024-04-01T00:00:00Z', 48.333),
    makePoint('2024-04-02T00:00:00Z', 52.666),
    makePoint('2024-04-03T00:00:00Z', 50.555),
  ];

  const stats = computeStats('01420500', points, 3);
  assertEquals(stats.waterTemp.min, 48.3);
  assertEquals(stats.waterTemp.max, 52.7);
  assertEquals(stats.waterTemp.avg, 50.5);
});

Deno.test('computeStats - single value produces stable trend', () => {
  const points: TimeSeriesPoint[] = [
    makePoint('2024-04-01T00:00:00Z', 50),
  ];

  const stats = computeStats('01420500', points, 1);
  assertEquals(stats.waterTemp.min, 50);
  assertEquals(stats.waterTemp.max, 50);
  assertEquals(stats.waterTemp.avg, 50);
  assertEquals(stats.waterTemp.trend, 'unknown');
});

Deno.test('computeStats - computes all three metrics independently', () => {
  const points: TimeSeriesPoint[] = [
    makePoint('2024-04-01T00:00:00Z', 48, 200, 3.0),
    makePoint('2024-04-02T00:00:00Z', 52, 180, 2.8),
    makePoint('2024-04-03T00:00:00Z', 56, 160, 2.6),
  ];

  const stats = computeStats('01420500', points, 3);
  assertEquals(stats.waterTemp.trend, 'rising');
  assertEquals(stats.discharge.trend, 'falling');
  assertEquals(stats.gageHeight.trend, 'falling');
});

Deno.test('computeStats - preserves stationId and days', () => {
  const stats = computeStats('01362500', [], 30);
  assertEquals(stats.stationId, '01362500');
  assertEquals(stats.days, 30);
});
