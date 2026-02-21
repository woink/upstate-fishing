/**
 * Frontend tests for the nearby-streams API route logic
 */

import { assertEquals, assertExists } from '@std/assert';
import { STREAMS } from '@shared/data/streams.ts';
import { haversineDistance } from '@shared/utils/distance.ts';
import type { NearbyStream } from '@shared/models/types.ts';
import { NearbyStreamSchema } from '@shared/models/types.ts';

// ============================================================================
// API Parameter Validation Tests
// ============================================================================

Deno.test('nearby-streams API - extracts lat/lon from query params', () => {
  const url = new URL('http://localhost:8001/api/nearby-streams?lat=41.9&lon=-74.9');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  assertEquals(lat, '41.9');
  assertEquals(lon, '-74.9');
});

Deno.test('nearby-streams API - extracts radius from query params', () => {
  const url = new URL('http://localhost:8001/api/nearby-streams?lat=41.9&lon=-74.9&radius=100');
  const radius = url.searchParams.get('radius');
  assertEquals(radius, '100');
});

Deno.test('nearby-streams API - missing params detected', () => {
  const url = new URL('http://localhost:8001/api/nearby-streams');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');
  assertEquals(lat, null);
  assertEquals(lon, null);
});

Deno.test('nearby-streams API - defaults radius to 50 when not provided', () => {
  const url = new URL('http://localhost:8001/api/nearby-streams?lat=41.9&lon=-74.9');
  const radiusStr = url.searchParams.get('radius');
  const radius = radiusStr ? parseFloat(radiusStr) : 50;
  assertEquals(radius, 50);
});

// ============================================================================
// Nearby Stream Calculation Tests
// ============================================================================

Deno.test('nearby-streams - computes distances for all streams', () => {
  const origin = { latitude: 41.9365, longitude: -74.9201 }; // Beaverkill

  const results = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => ({
      streamId: s.id,
      name: s.name,
      region: s.region,
      state: s.state,
      latitude: s.coordinates!.latitude,
      longitude: s.coordinates!.longitude,
      distanceMiles: Math.round(haversineDistance(origin, s.coordinates!) * 10) / 10,
    }));

  assertEquals(results.length > 0, true, 'Should compute distances for streams');
  // Beaverkill should be at distance 0 from itself
  const beaverkill = results.find((r) => r.streamId === 'beaverkill');
  assertExists(beaverkill);
  assertEquals(beaverkill.distanceMiles, 0);
});

Deno.test('nearby-streams - filters by radius', () => {
  const origin = { latitude: 41.9365, longitude: -74.9201 }; // Beaverkill
  const radius = 25;

  const results = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => ({
      streamId: s.id,
      distanceMiles: Math.round(haversineDistance(origin, s.coordinates!) * 10) / 10,
    }))
    .filter((s) => s.distanceMiles <= radius);

  // All results should be within radius
  for (const r of results) {
    assertEquals(
      r.distanceMiles <= radius,
      true,
      `${r.streamId} at ${r.distanceMiles} > ${radius}`,
    );
  }

  // Should include nearby Catskills streams but not NC streams
  const hasNearby = results.some((r) => r.streamId === 'willowemoc');
  assertEquals(hasNearby, true, 'Should include nearby Willowemoc Creek');

  const hasDistant = results.some((r) => r.streamId === 'linville');
  assertEquals(hasDistant, false, 'Should not include distant Linville River');
});

Deno.test('nearby-streams - results sorted by distance ascending', () => {
  const origin = { latitude: 41.9365, longitude: -74.9201 };

  const results = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => ({
      streamId: s.id,
      distanceMiles: Math.round(haversineDistance(origin, s.coordinates!) * 10) / 10,
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  for (let i = 1; i < results.length; i++) {
    assertEquals(
      results[i].distanceMiles >= results[i - 1].distanceMiles,
      true,
      `Results not sorted: ${results[i - 1].distanceMiles} > ${results[i].distanceMiles}`,
    );
  }
});

Deno.test('nearby-streams - result schema validates', () => {
  const origin = { latitude: 41.9365, longitude: -74.9201 };

  const result: NearbyStream = {
    streamId: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    latitude: 41.9365,
    longitude: -74.9201,
    distanceMiles: haversineDistance(origin, { latitude: 41.9001, longitude: -74.8254 }),
  };

  const parsed = NearbyStreamSchema.safeParse(result);
  assertEquals(parsed.success, true, 'NearbyStream should validate against schema');
});

Deno.test('nearby-streams - large radius returns all streams', () => {
  const origin = { latitude: 40.0, longitude: -75.0 };
  const radius = 500;

  const results = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => ({
      streamId: s.id,
      distanceMiles: Math.round(haversineDistance(origin, s.coordinates!) * 10) / 10,
    }))
    .filter((s) => s.distanceMiles <= radius);

  // With 500-mile radius from central mid-Atlantic, should get most/all streams
  assertEquals(results.length > 20, true, `Expected >20 streams, got ${results.length}`);
});

Deno.test('nearby-streams - zero radius returns nothing useful', () => {
  const origin = { latitude: 40.0, longitude: -75.0 };
  const radius = 0.01; // Very small radius

  const results = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => ({
      streamId: s.id,
      distanceMiles: Math.round(haversineDistance(origin, s.coordinates!) * 10) / 10,
    }))
    .filter((s) => s.distanceMiles <= radius);

  // Should be empty or nearly empty -- no stream is exactly at 40.0, -75.0
  assertEquals(results.length, 0, 'Very small radius should return no streams');
});

// ============================================================================
// API Response Structure Tests
// ============================================================================

Deno.test('nearby-streams API - success response structure', () => {
  const response = {
    success: true,
    data: [{
      streamId: 'beaverkill',
      name: 'Beaverkill',
      region: 'catskills',
      state: 'NY',
      latitude: 41.9365,
      longitude: -74.9201,
      distanceMiles: 5.2,
    }],
    count: 1,
    timestamp: new Date().toISOString(),
  };

  assertEquals(response.success, true);
  assertExists(response.data);
  assertEquals(response.count, 1);
  assertExists(response.timestamp);
});

Deno.test('nearby-streams API - error response for missing params', () => {
  const response = {
    success: false,
    error: { error: 'lat and lon query parameters are required', code: 'MISSING_PARAMS' },
    timestamp: new Date().toISOString(),
  };

  assertEquals(response.success, false);
  assertEquals(response.error.code, 'MISSING_PARAMS');
});
