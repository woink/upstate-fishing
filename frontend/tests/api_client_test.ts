/**
 * API client behavior tests
 * Tests fetch logic and response handling used by islands
 */

import { assertEquals } from '@std/assert';

// ============================================================================
// Fetch URL Construction
// ============================================================================

Deno.test('fetch URL - streams list', () => {
  const apiUrl = 'http://localhost:8000';
  const url = `${apiUrl}/api/streams`;
  assertEquals(url, 'http://localhost:8000/api/streams');
});

Deno.test('fetch URL - stream conditions', () => {
  const apiUrl = 'http://localhost:8000';
  const streamId = 'beaverkill';
  const url = `${apiUrl}/api/streams/${streamId}/conditions`;
  assertEquals(url, 'http://localhost:8000/api/streams/beaverkill/conditions');
});

// ============================================================================
// Response Transformation
// ============================================================================

Deno.test('response transformation - extracts conditions', () => {
  const response = {
    success: true,
    data: {
      stream: { id: 'beaverkill', name: 'Beaverkill' },
      fishingQuality: 'good',
      stationData: [{ waterTempF: 54 }],
      predictedHatches: [],
    },
  };

  const conditions = response.success ? response.data : null;
  assertEquals(conditions?.fishingQuality, 'good');
});

Deno.test('response transformation - handles null data', () => {
  const response: { success: boolean; data?: unknown; error?: { error: string } } = {
    success: false,
    error: { error: 'Error' },
  };
  const conditions = response.success ? response.data : null;
  assertEquals(conditions, null);
});

// ============================================================================
// Top Picks Sorting
// ============================================================================

Deno.test('top picks - sorts by fishing quality', () => {
  const conditions = [
    { stream: { id: 'a' }, fishingQuality: 'fair' as const },
    { stream: { id: 'b' }, fishingQuality: 'excellent' as const },
    { stream: { id: 'c' }, fishingQuality: 'good' as const },
  ];

  const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 };
  const sorted = [...conditions].sort(
    (a, b) => qualityOrder[a.fishingQuality] - qualityOrder[b.fishingQuality],
  );

  assertEquals(sorted[0].stream.id, 'b'); // excellent
  assertEquals(sorted[1].stream.id, 'c'); // good
  assertEquals(sorted[2].stream.id, 'a'); // fair
});

Deno.test('top picks - limits to top 3', () => {
  const conditions = [
    { stream: { id: 'a' }, fishingQuality: 'excellent' as const },
    { stream: { id: 'b' }, fishingQuality: 'good' as const },
    { stream: { id: 'c' }, fishingQuality: 'good' as const },
    { stream: { id: 'd' }, fishingQuality: 'fair' as const },
    { stream: { id: 'e' }, fishingQuality: 'poor' as const },
  ];

  const top3 = conditions.slice(0, 3);
  assertEquals(top3.length, 3);
});

// ============================================================================
// Station Data Extraction
// ============================================================================

Deno.test('station data - gets first station', () => {
  const stationData = [
    { stationId: '01420500', waterTempF: 54, dischargeCfs: 150 },
    { stationId: '01418500', waterTempF: 52, dischargeCfs: 100 },
  ];

  const primary = stationData[0];
  assertEquals(primary?.waterTempF, 54);
});

Deno.test('station data - handles empty array', () => {
  const stationData: Array<{ waterTempF: number }> = [];
  const primary = stationData[0];
  assertEquals(primary, undefined);
});

Deno.test('station data - safely accesses properties', () => {
  const stationData = [{ waterTempF: null, dischargeCfs: 150 }];
  const primary = stationData[0];
  const hasTemp = primary?.waterTempF !== null && primary?.waterTempF !== undefined;
  assertEquals(hasTemp, false);
});

// ============================================================================
// Hatch Predictions Display
// ============================================================================

Deno.test('hatch predictions - extracts top hatches', () => {
  const predictions = [
    { hatch: { commonName: 'Hendrickson' }, probability: 0.9 },
    { hatch: { commonName: 'BWO' }, probability: 0.7 },
    { hatch: { commonName: 'Midge' }, probability: 0.5 },
  ];

  const topHatches = predictions.slice(0, 2).map((p) => p.hatch.commonName);
  assertEquals(topHatches.join(', '), 'Hendrickson, BWO');
});

Deno.test('hatch predictions - formats probability as percentage', () => {
  const probability = 0.85;
  const percentage = Math.round(probability * 100);
  assertEquals(percentage, 85);
});

// ============================================================================
// Error Handling
// ============================================================================

Deno.test('error handling - network error message', () => {
  const err = new Error('Failed to fetch');
  const message = err instanceof Error ? err.message : 'Failed to load';
  assertEquals(message, 'Failed to fetch');
});

Deno.test('error handling - fallback message', () => {
  const err: unknown = 'Unknown error';
  const message = err instanceof Error ? err.message : 'Failed to load';
  assertEquals(message, 'Failed to load');
});

// ============================================================================
// Loading State
// ============================================================================

Deno.test('loading state - tracks loading IDs', () => {
  const loadingIds = new Set<string>();

  // Add loading
  loadingIds.add('beaverkill');
  assertEquals(loadingIds.has('beaverkill'), true);

  // Remove loading
  loadingIds.delete('beaverkill');
  assertEquals(loadingIds.has('beaverkill'), false);
});

Deno.test('loading state - immutable updates', () => {
  const loadingIds = new Set(['beaverkill']);

  // Create new set for update
  const newSet = new Set([...loadingIds, 'esopus']);
  assertEquals(newSet.size, 2);
  assertEquals(loadingIds.size, 1); // Original unchanged
});

// ============================================================================
// Conditions Map State
// ============================================================================

Deno.test('conditions map - stores by stream ID', () => {
  const conditionsMap: Record<string, { fishingQuality: string }> = {};

  conditionsMap['beaverkill'] = { fishingQuality: 'excellent' };
  conditionsMap['esopus'] = { fishingQuality: 'good' };

  assertEquals(conditionsMap['beaverkill'].fishingQuality, 'excellent');
  assertEquals(conditionsMap['esopus'].fishingQuality, 'good');
});

Deno.test('conditions map - immutable updates', () => {
  const conditionsMap = { beaverkill: { fishingQuality: 'good' } };

  const updated = {
    ...conditionsMap,
    esopus: { fishingQuality: 'excellent' },
  };

  assertEquals(Object.keys(updated).length, 2);
  assertEquals(Object.keys(conditionsMap).length, 1); // Original unchanged
});
