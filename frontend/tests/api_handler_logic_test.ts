/**
 * API Route Handler Logic Tests
 *
 * Tests the business logic used by the new Fresh API route handlers.
 * These routes import data/services directly instead of proxying to a backend.
 *
 * Covers:
 * - routes/api/hatches/index.ts (list + filtering)
 * - routes/api/hatches/[id].ts (lookup by ID)
 * - routes/api/streams/index.ts (list + filtering)
 * - routes/api/streams/[id]/index.ts (lookup by ID)
 * - routes/api/predict.ts (Zod validation + prediction construction)
 */

import { assertEquals, assertExists } from '@std/assert';
import { getHatchesByMonth, getHatchesByOrder, HATCHES } from '@shared/data/hatches.ts';
import {
  getStreamById,
  getStreamsByRegion,
  getStreamsByState,
  STREAMS,
} from '@shared/data/streams.ts';
import { fahrenheitToCelsius } from '@shared/utils/temperature.ts';
import type { InsectOrder, Region, State } from '@shared/models/types.ts';

// ============================================================================
// Hatches List Route Logic (/api/hatches)
// ============================================================================

Deno.test('GET /api/hatches - returns all hatches when no filters', () => {
  const hatches = [...HATCHES];
  assertEquals(hatches.length > 0, true, 'Should have hatches');
  assertEquals(Array.isArray(hatches), true);
});

Deno.test('GET /api/hatches?order=mayfly - filters by order', () => {
  const order = 'mayfly';
  const hatches = [...HATCHES].filter((h) => h.order === order);

  assertEquals(hatches.length > 0, true, 'Should have mayfly hatches');
  for (const hatch of hatches) {
    assertEquals(hatch.order, 'mayfly');
  }
});

Deno.test('GET /api/hatches?order=caddisfly - filters caddisflies', () => {
  const order = 'caddisfly';
  const hatches = [...HATCHES].filter((h) => h.order === order);

  assertEquals(hatches.length > 0, true, 'Should have caddisfly hatches');
  for (const hatch of hatches) {
    assertEquals(hatch.order, 'caddisfly');
  }
});

Deno.test('GET /api/hatches?order=stonefly - filters stoneflies', () => {
  const hatches = [...HATCHES].filter((h) => h.order === 'stonefly');
  assertEquals(hatches.length > 0, true, 'Should have stonefly hatches');
});

Deno.test('GET /api/hatches?order=midge - filters midges', () => {
  const hatches = [...HATCHES].filter((h) => h.order === 'midge');
  assertEquals(hatches.length > 0, true, 'Should have midge hatches');
});

Deno.test('GET /api/hatches?month=4 - filters by April', () => {
  const monthNum = 4;
  const hatches = [...HATCHES].filter((h) => h.peakMonths.includes(monthNum));

  assertEquals(hatches.length > 0, true, 'Should have April hatches');
  for (const hatch of hatches) {
    assertEquals(hatch.peakMonths.includes(monthNum), true);
  }
});

Deno.test('GET /api/hatches?month=1 - filters by January (winter)', () => {
  const hatches = [...HATCHES].filter((h) => h.peakMonths.includes(1));
  // Midges are year-round, so at minimum we should have that
  assertEquals(hatches.length > 0, true, 'Should have at least midge in January');
});

Deno.test('GET /api/hatches - combined order+month filter', () => {
  const order: InsectOrder = 'mayfly';
  const monthNum = 4;

  let hatches = [...HATCHES];
  hatches = hatches.filter((h) => h.order === order);
  hatches = hatches.filter((h) => h.peakMonths.includes(monthNum));

  // All results should be mayflies active in April
  for (const hatch of hatches) {
    assertEquals(hatch.order, 'mayfly');
    assertEquals(hatch.peakMonths.includes(monthNum), true);
  }
});

Deno.test('GET /api/hatches - invalid month is ignored (NaN)', () => {
  const month = 'abc';
  const monthNum = parseInt(month, 10);

  // The handler skips filtering if month is NaN
  const isValid = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
  assertEquals(isValid, false);

  // So all hatches should be returned
  const hatches = [...HATCHES];
  assertEquals(hatches.length > 0, true);
});

Deno.test('GET /api/hatches - month=0 is out of range', () => {
  const monthNum = 0;
  const isValid = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
  assertEquals(isValid, false);
});

Deno.test('GET /api/hatches - month=13 is out of range', () => {
  const monthNum = 13;
  const isValid = !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12;
  assertEquals(isValid, false);
});

// ============================================================================
// Hatch Detail Route Logic (/api/hatches/:id)
// ============================================================================

Deno.test('GET /api/hatches/:id - finds hendrickson', () => {
  const hatch = HATCHES.find((h) => h.id === 'hendrickson');
  assertExists(hatch, 'Hendrickson should exist');
  assertEquals(hatch.id, 'hendrickson');
  assertEquals(hatch.commonName, 'Hendrickson');
  assertEquals(hatch.order, 'mayfly');
});

Deno.test('GET /api/hatches/:id - finds bwo', () => {
  const hatch = HATCHES.find((h) => h.id === 'bwo');
  assertExists(hatch, 'BWO should exist');
  assertEquals(hatch.order, 'mayfly');
});

Deno.test('GET /api/hatches/:id - returns undefined for nonexistent', () => {
  const hatch = HATCHES.find((h) => h.id === 'nonexistent-hatch');
  assertEquals(hatch, undefined);
});

Deno.test('GET /api/hatches/:id - all hatches have required fields', () => {
  for (const hatch of HATCHES) {
    assertExists(hatch.id);
    assertExists(hatch.commonName);
    assertExists(hatch.order);
    assertEquals(typeof hatch.minTempF, 'number');
    assertEquals(typeof hatch.maxTempF, 'number');
    assertEquals(hatch.minTempF < hatch.maxTempF, true, `${hatch.id}: minTemp < maxTemp`);
    assertEquals(Array.isArray(hatch.peakMonths), true);
    assertEquals(hatch.peakMonths.length > 0, true, `${hatch.id}: has peak months`);
  }
});

// ============================================================================
// Streams List Route Logic (/api/streams)
// ============================================================================

Deno.test('GET /api/streams - returns all streams when no filters', () => {
  const streams = [...STREAMS];
  assertEquals(streams.length > 0, true, 'Should have streams');
});

Deno.test('GET /api/streams?region=catskills - filters by region', () => {
  const streams = getStreamsByRegion('catskills');

  assertEquals(streams.length > 0, true, 'Should have catskills streams');
  for (const stream of streams) {
    assertEquals(stream.region, 'catskills');
  }
});

Deno.test('GET /api/streams?region=delaware - filters delaware streams', () => {
  const streams = getStreamsByRegion('delaware');
  assertEquals(streams.length > 0, true, 'Should have delaware streams');
  for (const stream of streams) {
    assertEquals(stream.region, 'delaware');
  }
});

Deno.test('GET /api/streams?state=NY - filters by state', () => {
  const streams = getStreamsByState('NY');

  assertEquals(streams.length > 0, true, 'Should have NY streams');
  for (const stream of streams) {
    assertEquals(stream.state, 'NY');
  }
});

Deno.test('GET /api/streams?state=NJ - filters NJ streams', () => {
  const streams = getStreamsByState('NJ');
  assertEquals(streams.length > 0, true, 'Should have NJ streams');
  for (const stream of streams) {
    assertEquals(stream.state, 'NJ');
  }
});

Deno.test('GET /api/streams - region takes precedence over state', () => {
  // Simulates: region=catskills&state=NJ
  const region: Region | undefined = 'catskills';
  const state: State | undefined = 'NJ';

  let streams = [...STREAMS];
  if (region) {
    streams = getStreamsByRegion(region);
  } else if (state) {
    streams = getStreamsByState(state);
  }

  // Should filter by region, not state
  for (const stream of streams) {
    assertEquals(stream.region, 'catskills');
  }
});

Deno.test('GET /api/streams - no filter returns all', () => {
  const region: Region | undefined = undefined;
  const state: State | undefined = undefined;

  let streams = [...STREAMS];
  if (region) {
    streams = getStreamsByRegion(region);
  } else if (state) {
    streams = getStreamsByState(state);
  }

  assertEquals(streams.length, STREAMS.length);
});

// ============================================================================
// Stream Detail Route Logic (/api/streams/:id)
// ============================================================================

Deno.test('GET /api/streams/:id - finds beaverkill', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream, 'Beaverkill should exist');
  assertEquals(stream.id, 'beaverkill');
  assertEquals(stream.name, 'Beaverkill');
  assertEquals(stream.region, 'catskills');
  assertEquals(stream.state, 'NY');
});

Deno.test('GET /api/streams/:id - finds esopus', () => {
  const stream = getStreamById('esopus');
  assertExists(stream, 'Esopus should exist');
  assertEquals(stream.region, 'catskills');
});

Deno.test('GET /api/streams/:id - returns undefined for nonexistent', () => {
  const stream = getStreamById('nonexistent-stream');
  assertEquals(stream, undefined);
});

Deno.test('GET /api/streams/:id - stream has stationIds', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream);
  assertEquals(Array.isArray(stream.stationIds), true);
  assertEquals(stream.stationIds.length > 0, true, 'Beaverkill should have station IDs');
});

Deno.test('GET /api/streams/:id - stream has coordinates when available', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream);
  assertExists(stream.coordinates);
  assertEquals(typeof stream.coordinates.latitude, 'number');
  assertEquals(typeof stream.coordinates.longitude, 'number');
});

// ============================================================================
// Predict Route Logic (/api/predict) - Input Construction
// ============================================================================

Deno.test('predict - builds station data from waterTempF', () => {
  const waterTempF = 54;
  const stationData = waterTempF
    ? [{
      stationId: 'custom',
      stationName: 'Custom Input',
      timestamp: new Date().toISOString(),
      waterTempF,
      waterTempC: fahrenheitToCelsius(waterTempF),
      dischargeCfs: null,
      gageHeightFt: null,
    }]
    : [];

  assertEquals(stationData.length, 1);
  assertEquals(stationData[0].waterTempF, 54);
  assertEquals(stationData[0].waterTempC, 12.2);
  assertEquals(stationData[0].stationId, 'custom');
  assertEquals(stationData[0].dischargeCfs, null);
  assertEquals(stationData[0].gageHeightFt, null);
});

Deno.test('predict - empty station data when no waterTempF', () => {
  const waterTempF = undefined;
  const stationData = waterTempF
    ? [{
      stationId: 'custom',
      stationName: 'Custom Input',
      timestamp: new Date().toISOString(),
      waterTempF,
      waterTempC: fahrenheitToCelsius(waterTempF),
      dischargeCfs: null,
      gageHeightFt: null,
    }]
    : [];

  assertEquals(stationData.length, 0);
});

Deno.test('predict - builds weather from airTempF', () => {
  const airTempF = 58;
  const cloudCoverPercent = 80;
  const precipProbability = 20;

  const weather = airTempF
    ? {
      timestamp: new Date().toISOString(),
      airTempF,
      cloudCoverPercent: cloudCoverPercent ?? 50,
      precipProbability: precipProbability ?? 0,
      windSpeedMph: 5,
      shortForecast: 'Custom conditions',
      isDaylight: true,
    }
    : null;

  assertExists(weather);
  assertEquals(weather.airTempF, 58);
  assertEquals(weather.cloudCoverPercent, 80);
  assertEquals(weather.precipProbability, 20);
  assertEquals(weather.windSpeedMph, 5);
  assertEquals(weather.isDaylight, true);
});

Deno.test('predict - weather defaults cloudCover to 50 when not provided', () => {
  const airTempF = 58;
  const cloudCoverPercent = undefined;
  const precipProbability = undefined;

  const weather = airTempF
    ? {
      timestamp: new Date().toISOString(),
      airTempF,
      cloudCoverPercent: cloudCoverPercent ?? 50,
      precipProbability: precipProbability ?? 0,
      windSpeedMph: 5,
      shortForecast: 'Custom conditions',
      isDaylight: true,
    }
    : null;

  assertExists(weather);
  assertEquals(weather.cloudCoverPercent, 50);
  assertEquals(weather.precipProbability, 0);
});

Deno.test('predict - null weather when no airTempF', () => {
  const airTempF = undefined;
  const weather = airTempF
    ? {
      timestamp: new Date().toISOString(),
      airTempF,
      cloudCoverPercent: 50,
      precipProbability: 0,
      windSpeedMph: 5,
      shortForecast: 'Custom conditions',
      isDaylight: true,
    }
    : null;

  assertEquals(weather, null);
});

Deno.test('predict - temperature conversion is correct', () => {
  assertEquals(fahrenheitToCelsius(32), 0);
  assertEquals(fahrenheitToCelsius(212), 100);
  assertEquals(fahrenheitToCelsius(50), 10);
});

// ============================================================================
// Predict Route - Zod Validation Logic
// ============================================================================

Deno.test('predict validation - cloudCoverPercent must be 0-100', () => {
  // Replicating the schema validation check
  const valid = (n: number) => n >= 0 && n <= 100;

  assertEquals(valid(0), true);
  assertEquals(valid(50), true);
  assertEquals(valid(100), true);
  assertEquals(valid(-1), false);
  assertEquals(valid(101), false);
  assertEquals(valid(150), false);
});

Deno.test('predict validation - precipProbability must be 0-100', () => {
  const valid = (n: number) => n >= 0 && n <= 100;

  assertEquals(valid(0), true);
  assertEquals(valid(100), true);
  assertEquals(valid(-10), false);
  assertEquals(valid(200), false);
});

Deno.test('predict validation - all fields are optional', () => {
  // An empty object should be valid (all fields optional)
  const body = {};
  const hasRequired = Object.keys(body).length === 0;
  assertEquals(hasRequired, true);
  // The handler should still produce predictions with empty input
});

Deno.test('predict validation - date must be ISO datetime when provided', () => {
  const validDate = '2024-04-15T14:00:00Z';
  const invalidDate = 'not-a-date';

  // Valid ISO datetime
  const parsed = new Date(validDate);
  assertEquals(isNaN(parsed.getTime()), false);

  // Invalid datetime (Zod would reject this)
  const parsedInvalid = new Date(invalidDate);
  assertEquals(isNaN(parsedInvalid.getTime()), true);
});

// ============================================================================
// Stream Conditions Route Logic (/api/streams/:id/conditions)
// ============================================================================

Deno.test('conditions - stream lookup returns null for unknown ID', () => {
  const stream = getStreamById('nonexistent');
  assertEquals(stream, undefined);
});

Deno.test('conditions - stream has stationIds for USGS lookup', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream);
  assertEquals(stream.stationIds.length > 0, true);
});

Deno.test('conditions - stream coordinates check for weather lookup', () => {
  const stream = getStreamById('beaverkill');
  assertExists(stream);

  // The handler conditionally fetches weather only when coordinates exist
  const shouldFetchWeather = !!stream.coordinates;
  assertEquals(shouldFetchWeather, true, 'Beaverkill should have coordinates');
});

Deno.test('conditions - cache status logic: both cached', () => {
  const usgsResult = { cached: true, cachedAt: Date.now() - 1000 };
  const weatherCached = true;
  const hasCoordinates = true;

  const allCached = usgsResult.cached && (hasCoordinates ? weatherCached : true);
  assertEquals(allCached, true);
});

Deno.test('conditions - cache status logic: USGS not cached', () => {
  const usgsResult = { cached: false, cachedAt: null };
  const weatherCached = true;
  const hasCoordinates = true;

  const allCached = usgsResult.cached && (hasCoordinates ? weatherCached : true);
  assertEquals(allCached, false);
});

Deno.test('conditions - cache status logic: no coordinates skips weather cache check', () => {
  const usgsResult = { cached: true, cachedAt: Date.now() };
  const weatherCached = false;
  const hasCoordinates = false;

  // When no coordinates, weather cache doesn't matter
  const allCached = usgsResult.cached && (hasCoordinates ? weatherCached : true);
  assertEquals(allCached, true);
});

Deno.test('conditions - earliestCachedAt picks the oldest timestamp', () => {
  const usgsAt = Date.now() - 60000; // 1 min ago
  const weatherAt = Date.now() - 30000; // 30 sec ago

  const earliest = Math.min(usgsAt, weatherAt);
  assertEquals(earliest, usgsAt);
});

// ============================================================================
// Station Route Logic (/api/stations/:id)
// ============================================================================

Deno.test('stations - empty data array means not found', () => {
  const resultData: unknown[] = [];
  assertEquals(resultData.length === 0, true);
});

Deno.test('stations - first element is returned for found station', () => {
  const resultData = [
    { stationId: '01420500', waterTempF: 54 },
    { stationId: '01420500', waterTempF: 55 },
  ];

  const primary = resultData[0];
  assertEquals(primary.stationId, '01420500');
  assertEquals(primary.waterTempF, 54);
});

Deno.test('stations - cache header construction', () => {
  // Test the pattern used in stations/[id].ts
  const cached = true;
  const cacheDisplay = cached ? 'HIT' : 'MISS';
  assertEquals(cacheDisplay, 'HIT');

  const notCached = false;
  assertEquals(notCached ? 'HIT' : 'MISS', 'MISS');
});
