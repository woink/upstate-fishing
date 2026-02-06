/**
 * Type validation tests
 * Tests Zod schemas for runtime validation
 */

import { assertEquals, assertThrows } from '@std/assert';
import {
  CoordinatesSchema,
  HatchSchema,
  RegionSchema,
  StationDataSchema,
  StreamSchema,
  WeatherConditionsSchema,
} from '../src/models/types.ts';

// ============================================================================
// Coordinates Schema Tests
// ============================================================================

Deno.test('CoordinatesSchema - accepts valid coordinates', () => {
  const valid = { latitude: 41.9365, longitude: -74.9201 };
  const result = CoordinatesSchema.parse(valid);
  assertEquals(result.latitude, 41.9365);
  assertEquals(result.longitude, -74.9201);
});

Deno.test('CoordinatesSchema - accepts edge case coordinates', () => {
  // North Pole
  const northPole = CoordinatesSchema.parse({ latitude: 90, longitude: 0 });
  assertEquals(northPole.latitude, 90);

  // South Pole
  const southPole = CoordinatesSchema.parse({ latitude: -90, longitude: 0 });
  assertEquals(southPole.latitude, -90);

  // International Date Line
  const dateLine = CoordinatesSchema.parse({ latitude: 0, longitude: 180 });
  assertEquals(dateLine.longitude, 180);

  const dateLineNeg = CoordinatesSchema.parse({ latitude: 0, longitude: -180 });
  assertEquals(dateLineNeg.longitude, -180);
});

Deno.test('CoordinatesSchema - rejects invalid latitude', () => {
  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 91, longitude: 0 });
  });

  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: -91, longitude: 0 });
  });
});

Deno.test('CoordinatesSchema - rejects invalid longitude', () => {
  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 0, longitude: 181 });
  });

  assertThrows(() => {
    CoordinatesSchema.parse({ latitude: 0, longitude: -181 });
  });
});

// ============================================================================
// Region Schema Tests
// ============================================================================

Deno.test('RegionSchema - accepts valid regions', () => {
  assertEquals(RegionSchema.parse('catskills'), 'catskills');
  assertEquals(RegionSchema.parse('croton'), 'croton');
  assertEquals(RegionSchema.parse('raritan'), 'raritan');
  assertEquals(RegionSchema.parse('delaware'), 'delaware');
});

Deno.test('RegionSchema - rejects invalid region', () => {
  assertThrows(() => {
    RegionSchema.parse('adirondacks');
  });
});

// ============================================================================
// Stream Schema Tests
// ============================================================================

Deno.test('StreamSchema - accepts valid stream', () => {
  const valid = {
    id: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01420500', '01418500'],
  };
  const result = StreamSchema.parse(valid);
  assertEquals(result.id, 'beaverkill');
  assertEquals(result.stationIds.length, 2);
});

Deno.test('StreamSchema - accepts stream with coordinates', () => {
  const valid = {
    id: 'beaverkill',
    name: 'Beaverkill',
    region: 'catskills',
    state: 'NY',
    stationIds: ['01420500'],
    coordinates: { latitude: 41.9365, longitude: -74.9201 },
  };
  const result = StreamSchema.parse(valid);
  assertEquals(result.coordinates?.latitude, 41.9365);
});

Deno.test('StreamSchema - rejects invalid state', () => {
  assertThrows(() => {
    StreamSchema.parse({
      id: 'test',
      name: 'Test Stream',
      region: 'catskills',
      state: 'PA', // Not NY or NJ
      stationIds: [],
    });
  });
});

// ============================================================================
// Station Data Schema Tests
// ============================================================================

Deno.test('StationDataSchema - accepts valid station data', () => {
  const valid = {
    stationId: '01420500',
    stationName: 'BEAVERKILL AT COOKS FALLS NY',
    timestamp: '2024-04-15T14:00:00Z',
    waterTempF: 54,
    waterTempC: 12.2,
    dischargeCfs: 150,
    gageHeightFt: 2.5,
  };
  const result = StationDataSchema.parse(valid);
  assertEquals(result.stationId, '01420500');
  assertEquals(result.waterTempF, 54);
});

Deno.test('StationDataSchema - accepts null values for optional readings', () => {
  const valid = {
    stationId: '01420500',
    stationName: 'Test Station',
    timestamp: '2024-04-15T14:00:00Z',
    waterTempF: null,
    waterTempC: null,
    dischargeCfs: null,
    gageHeightFt: null,
  };
  const result = StationDataSchema.parse(valid);
  assertEquals(result.waterTempF, null);
});

Deno.test('StationDataSchema - rejects invalid timestamp', () => {
  assertThrows(() => {
    StationDataSchema.parse({
      stationId: '01420500',
      stationName: 'Test',
      timestamp: 'not-a-date',
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
    });
  });
});

// ============================================================================
// Weather Conditions Schema Tests
// ============================================================================

Deno.test('WeatherConditionsSchema - accepts valid weather', () => {
  const valid = {
    timestamp: '2024-04-15T14:00:00Z',
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 8,
    shortForecast: 'Mostly Cloudy',
    isDaylight: true,
  };
  const result = WeatherConditionsSchema.parse(valid);
  assertEquals(result.airTempF, 58);
  assertEquals(result.cloudCoverPercent, 80);
});

Deno.test('WeatherConditionsSchema - rejects cloud cover over 100', () => {
  assertThrows(() => {
    WeatherConditionsSchema.parse({
      timestamp: '2024-04-15T14:00:00Z',
      airTempF: 58,
      cloudCoverPercent: 101,
      precipProbability: 20,
      windSpeedMph: 8,
      shortForecast: 'Cloudy',
      isDaylight: true,
    });
  });
});

Deno.test('WeatherConditionsSchema - rejects negative precipitation probability', () => {
  assertThrows(() => {
    WeatherConditionsSchema.parse({
      timestamp: '2024-04-15T14:00:00Z',
      airTempF: 58,
      cloudCoverPercent: 50,
      precipProbability: -5,
      windSpeedMph: 8,
      shortForecast: 'Cloudy',
      isDaylight: true,
    });
  });
});

// ============================================================================
// Hatch Schema Tests
// ============================================================================

Deno.test('HatchSchema - accepts valid hatch', () => {
  const valid = {
    id: 'hendrickson',
    commonName: 'Hendrickson',
    scientificName: 'Ephemerella subvaria',
    order: 'mayfly',
    minTempF: 50,
    maxTempF: 58,
    peakMonths: [4, 5],
    timeOfDay: 'afternoon',
    prefersOvercast: true,
    hookSizes: [12, 14],
    notes: 'Start of dry fly season.',
  };
  const result = HatchSchema.parse(valid);
  assertEquals(result.id, 'hendrickson');
  assertEquals(result.order, 'mayfly');
});

Deno.test('HatchSchema - rejects invalid insect order', () => {
  assertThrows(() => {
    HatchSchema.parse({
      id: 'test',
      commonName: 'Test',
      order: 'butterfly', // Invalid order
      minTempF: 50,
      maxTempF: 60,
      peakMonths: [5],
      timeOfDay: 'any',
      prefersOvercast: false,
      hookSizes: [14],
    });
  });
});

Deno.test('HatchSchema - rejects invalid month', () => {
  assertThrows(() => {
    HatchSchema.parse({
      id: 'test',
      commonName: 'Test',
      order: 'mayfly',
      minTempF: 50,
      maxTempF: 60,
      peakMonths: [13], // Invalid month
      timeOfDay: 'any',
      prefersOvercast: false,
      hookSizes: [14],
    });
  });
});
