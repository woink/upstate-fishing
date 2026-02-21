/**
 * Unit tests for the Haversine distance utility
 */

import { assertEquals } from '@std/assert';
import { haversineDistance } from '@shared/utils/distance.ts';

// ============================================================================
// Known Distance Tests
// ============================================================================

Deno.test('haversineDistance - same point returns zero', () => {
  const coord = { latitude: 41.9365, longitude: -74.9201 };
  const distance = haversineDistance(coord, coord);
  assertEquals(distance, 0);
});

Deno.test('haversineDistance - NYC to Los Angeles is approximately 2451 miles', () => {
  const nyc = { latitude: 40.7128, longitude: -74.0060 };
  const la = { latitude: 34.0522, longitude: -118.2437 };
  const distance = haversineDistance(nyc, la);
  // Allow 1% tolerance for well-known distance
  assertEquals(distance > 2420, true, `Expected ~2451 miles, got ${distance}`);
  assertEquals(distance < 2480, true, `Expected ~2451 miles, got ${distance}`);
});

Deno.test('haversineDistance - Beaverkill to Willowemoc is short (nearby streams)', () => {
  const beaverkill = { latitude: 41.9365, longitude: -74.9201 };
  const willowemoc = { latitude: 41.9001, longitude: -74.8254 };
  const distance = haversineDistance(beaverkill, willowemoc);
  // These are neighboring streams, should be < 10 miles
  assertEquals(distance < 10, true, `Expected < 10 miles, got ${distance}`);
  assertEquals(distance > 0, true, `Expected > 0 miles, got ${distance}`);
});

Deno.test('haversineDistance - order does not matter (symmetry)', () => {
  const a = { latitude: 41.9365, longitude: -74.9201 };
  const b = { latitude: 42.0459, longitude: -74.2768 };
  const ab = haversineDistance(a, b);
  const ba = haversineDistance(b, a);
  assertEquals(ab, ba);
});

Deno.test('haversineDistance - equator to north pole is approximately 6215 miles', () => {
  const equator = { latitude: 0, longitude: 0 };
  const northPole = { latitude: 90, longitude: 0 };
  const distance = haversineDistance(equator, northPole);
  // Quarter of earth circumference ~6215 miles
  assertEquals(distance > 6180, true, `Expected ~6215 miles, got ${distance}`);
  assertEquals(distance < 6250, true, `Expected ~6215 miles, got ${distance}`);
});

Deno.test('haversineDistance - catskills to NC foothills is several hundred miles', () => {
  const beaverkill = { latitude: 41.9365, longitude: -74.9201 };
  const linville = { latitude: 35.7956, longitude: -81.8911 };
  const distance = haversineDistance(beaverkill, linville);
  // Should be roughly 500-600 miles
  assertEquals(distance > 450, true, `Expected 500-600 miles, got ${distance}`);
  assertEquals(distance < 650, true, `Expected 500-600 miles, got ${distance}`);
});

Deno.test('haversineDistance - returns miles not kilometers', () => {
  // NYC to Chicago is ~790 miles, ~1270 km
  const nyc = { latitude: 40.7128, longitude: -74.0060 };
  const chicago = { latitude: 41.8781, longitude: -87.6298 };
  const distance = haversineDistance(nyc, chicago);
  // If returning miles, should be < 800. If km, would be > 1200
  assertEquals(distance < 800, true, `Expected miles (~790), got ${distance}`);
  assertEquals(distance > 700, true, `Expected miles (~790), got ${distance}`);
});
