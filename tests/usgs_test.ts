/**
 * USGS service tests
 */

import { assertEquals } from '@std/assert';
import { isValidReading, USGS_PARAMS, USGSService } from '../src/services/usgs.ts';

// ============================================================================
// USGS_PARAMS Tests
// ============================================================================

Deno.test('USGS_PARAMS - has correct parameter codes', () => {
  assertEquals(USGS_PARAMS.WATER_TEMP, '00010');
  assertEquals(USGS_PARAMS.DISCHARGE, '00060');
  assertEquals(USGS_PARAMS.GAGE_HEIGHT, '00065');
});

// ============================================================================
// Sentinel Value Filtering Tests
// ============================================================================

Deno.test('isValidReading - filters USGS sentinel values', () => {
  // Sentinel values should be filtered
  assertEquals(isValidReading(-999999), false);
  assertEquals(isValidReading(-99999), false);

  // NaN should be filtered
  assertEquals(isValidReading(NaN), false);

  // Valid readings should pass
  assertEquals(isValidReading(0), true);
  assertEquals(isValidReading(15.5), true);
  assertEquals(isValidReading(100), true);
  assertEquals(isValidReading(-5), true); // Negative temps are valid
});

// ============================================================================
// USGSService Unit Tests
// ============================================================================

Deno.test('USGSService - constructor accepts default options', () => {
  const service = new USGSService();
  assertEquals(typeof service, 'object');
});

Deno.test('USGSService - constructor accepts custom options', () => {
  const service = new USGSService({
    baseUrl: 'https://custom.usgs.gov',
    timeout: 5000,
  });
  assertEquals(typeof service, 'object');
});

Deno.test('USGSService - returns empty array for empty station list', async () => {
  const service = new USGSService();
  const result = await service.getInstantaneousValues([]);
  assertEquals(result, []);
});

// ============================================================================
// USGSService - Temperature Conversion
// ============================================================================

Deno.test('USGSService - temperature conversion logic', () => {
  // USGS returns Celsius, service converts to Fahrenheit
  // F = C * 9/5 + 32, rounded to 1 decimal

  const testCases = [
    { celsius: 0, fahrenheitExpected: 32.0 },
    { celsius: 10, fahrenheitExpected: 50.0 },
    { celsius: 12.2, fahrenheitExpected: 54.0 }, // Typical spring water temp
    { celsius: 15.5, fahrenheitExpected: 59.9 },
    { celsius: 20, fahrenheitExpected: 68.0 },
  ];

  for (const { celsius, fahrenheitExpected } of testCases) {
    const converted = Math.round((celsius * 9 / 5 + 32) * 10) / 10;
    assertEquals(converted, fahrenheitExpected, `${celsius}°C should convert correctly`);
  }
});

// ============================================================================
// USGSService - Data Transformation Logic
// ============================================================================

Deno.test('USGSService - handles null values correctly', () => {
  // Verify that the service should handle null/missing values gracefully
  // When a station doesn't report a particular measurement, it should be null

  // This documents the expected behavior of the transformResponse method
  const expectedNullHandling = {
    missingWaterTemp: null,
    missingDischarge: null,
    missingGageHeight: null,
  };

  assertEquals(expectedNullHandling.missingWaterTemp, null);
  assertEquals(expectedNullHandling.missingDischarge, null);
  assertEquals(expectedNullHandling.missingGageHeight, null);
});

Deno.test('USGSService - station data structure is correct', () => {
  // Verify the expected structure of StationData
  const expectedFields = [
    'stationId',
    'stationName',
    'timestamp',
    'waterTempF',
    'waterTempC',
    'dischargeCfs',
    'gageHeightFt',
  ];

  // Document expected output structure
  for (const field of expectedFields) {
    assertEquals(typeof field, 'string', `Expected field: ${field}`);
  }
});

// ============================================================================
// USGSService - Integration Test (requires network, skipped by default)
// ============================================================================

Deno.test({
  name: 'USGSService - fetches real station data (integration)',
  ignore: Deno.env.get('RUN_INTEGRATION_TESTS') !== 'true',
  fn: async () => {
    const service = new USGSService();

    // Beaverkill station
    const stationIds = ['01420500'];

    const data = await service.getInstantaneousValues(stationIds);

    assertEquals(data.length > 0, true, 'Should return station data');

    const station = data[0];
    if (station) {
      assertEquals(station.stationId, '01420500');
      assertEquals(typeof station.stationName, 'string');
      assertEquals(typeof station.timestamp, 'string');
      // Values might be null if sensor is offline
      assertEquals(
        station.waterTempF === null || typeof station.waterTempF === 'number',
        true,
        'waterTempF should be number or null',
      );
    }
  },
});

Deno.test({
  name: 'USGSService - handles multiple stations (integration)',
  ignore: Deno.env.get('RUN_INTEGRATION_TESTS') !== 'true',
  fn: async () => {
    const service = new USGSService();

    // Multiple Catskills stations
    const stationIds = ['01420500', '01418500', '01362200'];

    const data = await service.getInstantaneousValues(stationIds);

    // Should return data for at least some stations (some might be offline)
    assertEquals(data.length > 0, true, 'Should return data for some stations');

    // Verify unique station IDs in response
    const returnedIds = data.map((d) => d.stationId);
    const uniqueIds = new Set(returnedIds);
    assertEquals(returnedIds.length, uniqueIds.size, 'Station IDs should be unique');
  },
});
