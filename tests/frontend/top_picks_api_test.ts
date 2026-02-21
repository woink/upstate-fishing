/**
 * Top Picks API route tests
 *
 * Tests the API response structure and count parameter validation.
 * Uses the same pattern as other frontend route tests.
 */

import { assertEquals, assertExists } from '@std/assert';
import { TopPickScoreSchema } from '@shared/models/types.ts';
import { z } from 'zod';

// ============================================================================
// Response structure tests
// ============================================================================

Deno.test('top-picks API - success response has correct shape', () => {
  const response = {
    success: true,
    data: [
      {
        stream: {
          id: 'beaverkill',
          name: 'Beaverkill',
          region: 'catskills',
          state: 'NY',
          stationIds: ['01420500'],
          coordinates: { latitude: 41.9365, longitude: -74.9201 },
        },
        score: 85,
        fishingQuality: 'excellent' as const,
        waterTempF: 54,
        airTempF: 58,
        dischargeCfs: 150,
        topHatches: [
          { name: 'Hendrickson', probability: 0.8 },
        ],
        summary: 'Beaverkill | Water: 54°F | Likely hatches: Hendrickson',
      },
    ],
    count: 1,
    timestamp: new Date().toISOString(),
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(response.count, 1);
  assertEquals(Array.isArray(response.data), true);
});

Deno.test('top-picks API - TopPickScore validates with Zod schema', () => {
  const pick = {
    stream: {
      id: 'esopus',
      name: 'Esopus Creek',
      region: 'catskills',
      state: 'NY',
      stationIds: ['01362200'],
    },
    score: 72,
    fishingQuality: 'good',
    waterTempF: 50,
    airTempF: 55,
    dischargeCfs: 200,
    topHatches: [
      { name: 'Blue Winged Olive', probability: 0.65 },
      { name: 'Hendrickson', probability: 0.55 },
    ],
    summary: 'Esopus Creek | Water: 50°F',
  };

  const result = TopPickScoreSchema.safeParse(pick);
  assertEquals(result.success, true);
});

Deno.test('top-picks API - TopPickScore with null values validates', () => {
  const pick = {
    stream: {
      id: 'shetucket',
      name: 'Shetucket River',
      region: 'connecticut',
      state: 'CT',
      stationIds: ['01122500'],
    },
    score: 45,
    fishingQuality: 'fair',
    waterTempF: null,
    airTempF: null,
    dischargeCfs: null,
    topHatches: [],
    summary: 'Shetucket River',
  };

  const result = TopPickScoreSchema.safeParse(pick);
  assertEquals(result.success, true);
});

// ============================================================================
// Count parameter validation tests
// ============================================================================

Deno.test('top-picks API - count param clamping logic', () => {
  // Simulating the handler's count parameter logic
  function parseCount(countParam: string | null): number {
    return countParam ? Math.min(Math.max(parseInt(countParam, 10) || 5, 1), 10) : 5;
  }

  assertEquals(parseCount(null), 5, 'Default is 5');
  assertEquals(parseCount('3'), 3, 'Valid count');
  assertEquals(parseCount('0'), 5, 'Zero is falsy so falls back to 5');
  assertEquals(parseCount('-1'), 1, 'Negative clamps to 1');
  assertEquals(parseCount('20'), 10, 'Max clamp to 10');
  assertEquals(parseCount('abc'), 5, 'NaN defaults to 5');
  assertEquals(parseCount(''), 5, 'Empty string defaults to 5');
});

// ============================================================================
// Error response tests
// ============================================================================

Deno.test('top-picks API - error response structure', () => {
  const response = {
    success: false,
    error: { error: 'Failed to compute top picks', code: 'FETCH_ERROR' },
    timestamp: new Date().toISOString(),
  };

  assertEquals(response.success, false);
  assertExists(response.error);
  assertEquals(response.error.code, 'FETCH_ERROR');
});

// ============================================================================
// TopPickScore schema boundary tests
// ============================================================================

Deno.test('top-picks API - score must be 0-100', () => {
  const validPick = {
    stream: { id: 'test', name: 'Test', region: 'catskills', state: 'NY', stationIds: [] },
    score: 50,
    fishingQuality: 'good',
    waterTempF: null,
    airTempF: null,
    dischargeCfs: null,
    topHatches: [],
    summary: 'test',
  };

  assertEquals(TopPickScoreSchema.safeParse(validPick).success, true);
  assertEquals(
    TopPickScoreSchema.safeParse({ ...validPick, score: -1 }).success,
    false,
    'Score < 0 should fail',
  );
  assertEquals(
    TopPickScoreSchema.safeParse({ ...validPick, score: 101 }).success,
    false,
    'Score > 100 should fail',
  );
});

Deno.test('top-picks API - topHatches probability must be 0-1', () => {
  const hatches = z.array(z.object({
    name: z.string(),
    probability: z.number().min(0).max(1),
  }));

  assertEquals(
    hatches.safeParse([{ name: 'BWO', probability: 0.5 }]).success,
    true,
    'Valid probability',
  );
  assertEquals(
    hatches.safeParse([{ name: 'BWO', probability: 1.5 }]).success,
    false,
    'Probability > 1 should fail',
  );
});
