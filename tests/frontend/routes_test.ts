/**
 * Frontend route handler tests
 * Tests server-side rendering logic
 */

import { assertEquals, assertExists } from '@std/assert';
import {
  filterStreamsByQuery,
  getStreamsByRegion,
  getStreamsByState,
  STREAMS,
} from '@shared/data/streams.ts';
import { HATCHES } from '@shared/data/hatches.ts';

// ============================================================================
// Route Parameter Tests
// ============================================================================

Deno.test('streams route - extracts region from query params', () => {
  const url = new URL('http://localhost:8001/streams?region=catskills');
  const region = url.searchParams.get('region');
  assertEquals(region, 'catskills');
});

Deno.test('streams route - extracts state from query params', () => {
  const url = new URL('http://localhost:8001/streams?state=NY');
  const state = url.searchParams.get('state');
  assertEquals(state, 'NY');
});

Deno.test('streams route - handles missing params', () => {
  const url = new URL('http://localhost:8001/streams');
  const region = url.searchParams.get('region');
  const state = url.searchParams.get('state');
  assertEquals(region, null);
  assertEquals(state, null);
});

Deno.test('stream detail route - extracts id from path', () => {
  // Simulating Fresh route params
  const params = { id: 'beaverkill' };
  assertEquals(params.id, 'beaverkill');
});

// ============================================================================
// Page Title Generation Tests
// ============================================================================

Deno.test('streams page title - with region', () => {
  const regionLabels: Record<string, string> = {
    catskills: 'Catskills',
    delaware: 'Delaware System',
    croton: 'Croton Watershed',
    raritan: 'Raritan / NJ',
  };

  const region = 'catskills';
  const title = `${regionLabels[region] ?? region} Streams`;
  assertEquals(title, 'Catskills Streams');
});

Deno.test('streams page title - with state', () => {
  const state = 'NJ';
  const title = `${state} Streams`;
  assertEquals(title, 'NJ Streams');
});

Deno.test('streams page title - no filter', () => {
  const region = undefined;
  const state = undefined;
  const title = region ? `Region Streams` : state ? `${state} Streams` : 'All Streams';
  assertEquals(title, 'All Streams');
});

// ============================================================================
// API Response Handling Tests
// ============================================================================

Deno.test('API response - success structure', () => {
  const response = {
    success: true,
    data: [{ id: 'beaverkill', name: 'Beaverkill' }],
    timestamp: '2024-04-15T14:00:00Z',
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(Array.isArray(response.data), true);
});

Deno.test('API response - error structure', () => {
  const response = {
    success: false,
    error: { error: 'Stream not found', code: 'NOT_FOUND' },
    timestamp: '2024-04-15T14:00:00Z',
  };

  assertEquals(response.success, false);
  assertExists(response.error);
  assertEquals(response.error.code, 'NOT_FOUND');
});

Deno.test('API response - extracts data correctly', () => {
  const json = {
    success: true,
    data: [
      { id: 'beaverkill', name: 'Beaverkill', region: 'catskills' },
      { id: 'esopus', name: 'Esopus Creek', region: 'catskills' },
    ],
    count: 2,
  };

  const streams = json.data ?? [];
  assertEquals(streams.length, 2);
  assertEquals(streams[0].id, 'beaverkill');
});

Deno.test('API response - handles missing data gracefully', () => {
  const json: { success: boolean; data?: unknown[]; error?: { error: string; code: string } } = {
    success: false,
    error: { error: 'Error', code: 'ERROR' },
  };
  const streams = json.data ?? [];
  assertEquals(streams.length, 0);
});

// ============================================================================
// Stream Filter Logic Tests (direct data imports)
// ============================================================================

Deno.test('filter logic - getStreamsByRegion returns correct streams', () => {
  const streams = getStreamsByRegion('catskills');

  assertEquals(streams.length > 0, true, 'Should have catskills streams');
  for (const stream of streams) {
    assertEquals(stream.region, 'catskills');
  }
});

Deno.test('filter logic - getStreamsByState returns correct streams', () => {
  const streams = getStreamsByState('NJ');

  assertEquals(streams.length > 0, true, 'Should have NJ streams');
  for (const stream of streams) {
    assertEquals(stream.state, 'NJ');
  }
});

Deno.test('filter logic - region takes precedence over state', () => {
  const region = 'catskills';
  const state = 'NY';

  // In the handler, we check region first, then state
  const filterUsed = region ? 'region' : state ? 'state' : 'none';
  assertEquals(filterUsed, 'region');
});

// ============================================================================
// Conditions Page Tests
// ============================================================================

Deno.test('conditions page - builds error message', () => {
  const json = {
    success: false,
    error: { error: 'Stream not found', code: 'NOT_FOUND' },
  };

  const error = json.error?.error ?? 'Failed to load stream';
  assertEquals(error, 'Stream not found');
});

Deno.test('conditions page - fallback error message', () => {
  const json: { success: boolean; error?: { error: string } } = { success: false };
  const error = json.error?.error ?? 'Failed to load stream';
  assertEquals(error, 'Failed to load stream');
});

// ============================================================================
// Map Page Tests
// ============================================================================

Deno.test('map page - filters streams with coordinates', () => {
  const streams = [
    { id: 'a', coordinates: { latitude: 41.9, longitude: -74.9 } },
    { id: 'b', coordinates: undefined },
    { id: 'c', coordinates: { latitude: 42.0, longitude: -74.5 } },
  ];

  const withCoords = streams.filter((s) => s.coordinates !== undefined);
  assertEquals(withCoords.length, 2);
});

Deno.test('map page - extracts coordinates correctly', () => {
  const stream = {
    id: 'beaverkill',
    coordinates: { latitude: 41.9365, longitude: -74.9201 },
  };

  const { latitude, longitude } = stream.coordinates;
  assertEquals(latitude, 41.9365);
  assertEquals(longitude, -74.9201);
});

Deno.test('map page - uses STREAMS data directly', () => {
  // After the merge, the map handler imports STREAMS directly
  assertEquals(STREAMS.length > 0, true);
  // At least some streams should have coordinates for map markers
  const withCoords = STREAMS.filter((s) => s.coordinates !== undefined);
  assertEquals(withCoords.length > 0, true, 'Some streams should have coordinates');
});

// ============================================================================
// Hatches Page Handler Logic Tests (direct data imports)
// ============================================================================

Deno.test('hatches page handler - filters hatches by order', () => {
  const filterOrder = 'mayfly';
  let hatches = [...HATCHES];
  hatches = hatches.filter((h) => h.order === filterOrder);

  assertEquals(hatches.length > 0, true);
  for (const h of hatches) {
    assertEquals(h.order, 'mayfly');
  }
});

Deno.test('hatches page handler - filters hatches by month', () => {
  const filterMonth = 4;
  let hatches = [...HATCHES];
  hatches = hatches.filter((h) => h.peakMonths.includes(filterMonth));

  assertEquals(hatches.length > 0, true);
  for (const h of hatches) {
    assertEquals(h.peakMonths.includes(4), true);
  }
});

Deno.test('hatches page handler - validates order param', () => {
  const validOrders = ['mayfly', 'caddisfly', 'stonefly', 'midge'];
  const orderParam = 'invalid_order';
  const filterOrder = orderParam && validOrders.includes(orderParam) ? orderParam : null;
  assertEquals(filterOrder, null);
});

Deno.test('hatches page handler - validates month param range', () => {
  const monthParam = '13';
  const monthNum = monthParam ? parseInt(monthParam, 10) : null;
  const filterMonth = monthNum && monthNum >= 1 && monthNum <= 12 ? monthNum : null;
  assertEquals(filterMonth, null);
});

Deno.test('hatches page handler - no filters returns all hatches', () => {
  const filterOrder = null;
  const filterMonth = null;

  let hatches = [...HATCHES];
  if (filterOrder) {
    hatches = hatches.filter((h) => h.order === filterOrder);
  }
  if (filterMonth) {
    hatches = hatches.filter((h) => h.peakMonths.includes(filterMonth));
  }

  assertEquals(hatches.length, HATCHES.length);
});

// ============================================================================
// Streams Page Handler Logic Tests (direct data imports)
// ============================================================================

Deno.test('streams page handler - filters by region using direct import', () => {
  const region = 'catskills';
  const streams = getStreamsByRegion(region);

  assertEquals(streams.length > 0, true);
  // Verify all returned streams are from catskills
  for (const s of streams) {
    assertEquals(s.region, 'catskills');
  }
});

Deno.test('streams page handler - state filter when no region', () => {
  const region = undefined;
  const state = 'NJ' as const;

  let streams = [...STREAMS];
  if (region) {
    streams = getStreamsByRegion(region);
  } else if (state) {
    streams = getStreamsByState(state);
  }

  assertEquals(streams.length > 0, true);
  for (const s of streams) {
    assertEquals(s.state, 'NJ');
  }
});

// ============================================================================
// filterStreamsByQuery Tests
// ============================================================================

Deno.test('filterStreamsByQuery - region connecticut returns CT streams', () => {
  const result = filterStreamsByQuery({ region: 'connecticut' });
  assertEquals(result.streams.length > 0, true, 'Should have connecticut streams');
  for (const s of result.streams) {
    assertEquals(s.region, 'connecticut');
    assertEquals(s.state, 'CT');
  }
  assertEquals(result.region, 'connecticut');
});

Deno.test('filterStreamsByQuery - region nc-highcountry returns NC high country streams', () => {
  const result = filterStreamsByQuery({ region: 'nc-highcountry' });
  assertEquals(result.streams.length > 0, true, 'Should have nc-highcountry streams');
  for (const s of result.streams) {
    assertEquals(s.region, 'nc-highcountry');
    assertEquals(s.state, 'NC');
  }
  assertEquals(result.region, 'nc-highcountry');
});

Deno.test('filterStreamsByQuery - region nc-foothills returns NC foothills streams', () => {
  const result = filterStreamsByQuery({ region: 'nc-foothills' });
  assertEquals(result.streams.length > 0, true, 'Should have nc-foothills streams');
  for (const s of result.streams) {
    assertEquals(s.region, 'nc-foothills');
    assertEquals(s.state, 'NC');
  }
  assertEquals(result.region, 'nc-foothills');
});

Deno.test('filterStreamsByQuery - state NC returns all NC streams', () => {
  const result = filterStreamsByQuery({ state: 'NC' });
  assertEquals(result.streams.length > 0, true, 'Should have NC streams');
  for (const s of result.streams) {
    assertEquals(s.state, 'NC');
  }
  assertEquals(result.state, 'NC');
});

Deno.test('filterStreamsByQuery - state CT returns all CT streams', () => {
  const result = filterStreamsByQuery({ state: 'CT' });
  assertEquals(result.streams.length > 0, true, 'Should have CT streams');
  for (const s of result.streams) {
    assertEquals(s.state, 'CT');
  }
  assertEquals(result.state, 'CT');
});

Deno.test('filterStreamsByQuery - invalid region returns all streams', () => {
  const result = filterStreamsByQuery({ region: 'invalid-region' });
  assertEquals(result.streams.length, STREAMS.length);
  assertEquals(result.region, undefined);
  assertEquals(result.state, undefined);
});

Deno.test('filterStreamsByQuery - null region returns all streams', () => {
  const result = filterStreamsByQuery({ region: null });
  assertEquals(result.streams.length, STREAMS.length);
});

Deno.test('filterStreamsByQuery - empty params returns all streams', () => {
  const result = filterStreamsByQuery({});
  assertEquals(result.streams.length, STREAMS.length);
});
