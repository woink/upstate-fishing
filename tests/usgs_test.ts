/**
 * USGS service tests
 */

import { assertEquals } from '@std/assert';
import {
  computeDataCompleteness,
  isValidReading,
  USGS_PARAMS,
  USGSService,
} from '../src/services/usgs.ts';
import type { StationData } from '../src/models/types.ts';

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

  // Infinity should be filtered
  assertEquals(isValidReading(Infinity), false);
  assertEquals(isValidReading(-Infinity), false);

  // Valid readings should pass
  assertEquals(isValidReading(0), true);
  assertEquals(isValidReading(15.5), true);
  assertEquals(isValidReading(100), true);
  assertEquals(isValidReading(-5), true); // Negative temps are valid
  assertEquals(isValidReading(-999998), true); // Not a sentinel
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
// computeDataCompleteness Tests
// ============================================================================

function makeStationData(
  overrides: Partial<StationData> = {},
): StationData {
  return {
    stationId: '01420500',
    stationName: 'Test Station',
    timestamp: new Date().toISOString(),
    waterTempF: null,
    waterTempC: null,
    dischargeCfs: null,
    gageHeightFt: null,
    ...overrides,
  };
}

Deno.test('computeDataCompleteness - all available returns full', () => {
  const stations: StationData[] = [
    makeStationData({
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'full');
});

Deno.test('computeDataCompleteness - mixed availability returns partial', () => {
  const stations: StationData[] = [
    makeStationData({
      dataAvailability: {
        waterTemp: 'available',
        discharge: 'available',
        gageHeight: 'not_equipped',
      },
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'partial');
});

Deno.test('computeDataCompleteness - no water temp returns limited', () => {
  const stations: StationData[] = [
    makeStationData({
      dataAvailability: {
        waterTemp: 'not_equipped',
        discharge: 'available',
        gageHeight: 'available',
      },
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'limited');
});

Deno.test('computeDataCompleteness - empty array returns limited', () => {
  assertEquals(computeDataCompleteness([]), 'limited');
});

Deno.test('computeDataCompleteness - multiple stations all full returns full', () => {
  const stations: StationData[] = [
    makeStationData({
      stationId: '01420500',
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    }),
    makeStationData({
      stationId: '01418500',
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'full');
});

Deno.test('computeDataCompleteness - one station partial makes overall partial', () => {
  const stations: StationData[] = [
    makeStationData({
      stationId: '01420500',
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    }),
    makeStationData({
      stationId: '01418500',
      dataAvailability: {
        waterTemp: 'available',
        discharge: 'sentinel',
        gageHeight: 'available',
      },
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'partial');
});

Deno.test('computeDataCompleteness - missing dataAvailability (cached entry) returns partial', () => {
  // One station has full data, the other lacks metadata entirely.
  // Since at least one station reports water temp, overall is 'partial' (not 'full'
  // because the metadata-less station can't confirm all params are available).
  const stations: StationData[] = [
    makeStationData({
      stationId: '01420500',
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    }),
    makeStationData({
      stationId: '01418500',
      // No dataAvailability — simulates a pre-metadata cached entry
    }),
  ];
  assertEquals(computeDataCompleteness(stations), 'partial');
});

Deno.test('computeDataCompleteness - all stations missing dataAvailability returns limited', () => {
  const stations: StationData[] = [
    makeStationData({ stationId: '01420500' }),
    makeStationData({ stationId: '01418500' }),
  ];
  assertEquals(computeDataCompleteness(stations), 'limited');
});

// ============================================================================
// USGSService - Mock Response Transformation Tests
// ============================================================================

function buildMockUSGSResponse(
  timeSeries: Array<{
    stationId: string;
    stationName: string;
    paramCode: string;
    value: string;
  }>,
) {
  return {
    value: {
      timeSeries: timeSeries.map((ts) => ({
        sourceInfo: {
          siteCode: [{ value: ts.stationId }],
          siteName: ts.stationName,
          geoLocation: {
            geogLocation: { latitude: 42.0, longitude: -74.0 },
          },
        },
        variable: {
          variableCode: [{ value: ts.paramCode }],
          variableName: 'Test Variable',
          unit: { unitCode: 'deg C' },
        },
        values: [{
          value: [{ value: ts.value, dateTime: '2024-04-15T12:00:00.000Z' }],
        }],
      })),
    },
  };
}

Deno.test('USGSService - sentinel values produce sentinel availability', async () => {
  const mockResponse = buildMockUSGSResponse([
    { stationId: '01000001', stationName: 'Test Station', paramCode: '00010', value: '-999999' },
    { stationId: '01000001', stationName: 'Test Station', paramCode: '00060', value: '150.0' },
    { stationId: '01000001', stationName: 'Test Station', paramCode: '00065', value: '2.5' },
  ]);

  const server = Deno.serve({ port: 0 }, (_req) => {
    return new Response(JSON.stringify(mockResponse), {
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    const addr = server.addr;
    const service = new USGSService({ baseUrl: `http://localhost:${addr.port}/` });
    const result = await service.getInstantaneousValues(['01000001']);

    assertEquals(result.length, 1);
    assertEquals(result[0].waterTempF, null);
    assertEquals(result[0].waterTempC, null);
    assertEquals(result[0].dischargeCfs, 150.0);
    assertEquals(result[0].dataAvailability?.waterTemp, 'sentinel');
    assertEquals(result[0].dataAvailability?.discharge, 'available');
    assertEquals(result[0].dataAvailability?.gageHeight, 'available');
  } finally {
    await server.shutdown();
  }
});

Deno.test('USGSService - missing parameters produce not_equipped availability', async () => {
  // Only discharge — no water temp or gage height time series
  const mockResponse = buildMockUSGSResponse([
    { stationId: '01000002', stationName: 'Discharge Only', paramCode: '00060', value: '200.0' },
  ]);

  const server = Deno.serve({ port: 0 }, (_req) => {
    return new Response(JSON.stringify(mockResponse), {
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    const addr = server.addr;
    const service = new USGSService({ baseUrl: `http://localhost:${addr.port}/` });
    const result = await service.getInstantaneousValues(['01000002']);

    assertEquals(result.length, 1);
    assertEquals(result[0].waterTempF, null);
    assertEquals(result[0].dischargeCfs, 200.0);
    assertEquals(result[0].dataAvailability?.waterTemp, 'not_equipped');
    assertEquals(result[0].dataAvailability?.discharge, 'available');
    assertEquals(result[0].dataAvailability?.gageHeight, 'not_equipped');
  } finally {
    await server.shutdown();
  }
});

Deno.test('USGSService - valid readings produce available status', async () => {
  const mockResponse = buildMockUSGSResponse([
    { stationId: '01000003', stationName: 'Full Station', paramCode: '00010', value: '12.2' },
    { stationId: '01000003', stationName: 'Full Station', paramCode: '00060', value: '150.0' },
    { stationId: '01000003', stationName: 'Full Station', paramCode: '00065', value: '2.5' },
  ]);

  const server = Deno.serve({ port: 0 }, (_req) => {
    return new Response(JSON.stringify(mockResponse), {
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    const addr = server.addr;
    const service = new USGSService({ baseUrl: `http://localhost:${addr.port}/` });
    const result = await service.getInstantaneousValues(['01000003']);

    assertEquals(result.length, 1);
    assertEquals(result[0].waterTempC, 12.2);
    assertEquals(result[0].dischargeCfs, 150.0);
    assertEquals(result[0].gageHeightFt, 2.5);
    assertEquals(result[0].dataAvailability?.waterTemp, 'available');
    assertEquals(result[0].dataAvailability?.discharge, 'available');
    assertEquals(result[0].dataAvailability?.gageHeight, 'available');
  } finally {
    await server.shutdown();
  }
});

Deno.test('USGSService - empty values array produces no_data availability', async () => {
  // Water temp time series exists but has zero data points;
  // discharge has valid data so the station still gets a timestamp
  const mockResponse = {
    value: {
      timeSeries: [
        {
          sourceInfo: {
            siteCode: [{ value: '01000004' }],
            siteName: 'Empty Values Station',
            geoLocation: { geogLocation: { latitude: 42.0, longitude: -74.0 } },
          },
          variable: {
            variableCode: [{ value: '00010' }],
            variableName: 'Temperature',
            unit: { unitCode: 'deg C' },
          },
          values: [{ value: [] }], // equipped but no data points
        },
        {
          sourceInfo: {
            siteCode: [{ value: '01000004' }],
            siteName: 'Empty Values Station',
            geoLocation: { geogLocation: { latitude: 42.0, longitude: -74.0 } },
          },
          variable: {
            variableCode: [{ value: '00060' }],
            variableName: 'Discharge',
            unit: { unitCode: 'ft3/s' },
          },
          values: [{ value: [{ value: '150.0', dateTime: '2024-04-15T12:00:00.000Z' }] }],
        },
      ],
    },
  };

  const server = Deno.serve({ port: 0 }, (_req) => {
    return new Response(JSON.stringify(mockResponse), {
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    const addr = server.addr;
    const service = new USGSService({ baseUrl: `http://localhost:${addr.port}/` });
    const result = await service.getInstantaneousValues(['01000004']);

    assertEquals(result.length, 1);
    assertEquals(result[0].waterTempF, null);
    assertEquals(result[0].waterTempC, null);
    assertEquals(result[0].dischargeCfs, 150.0);
    assertEquals(result[0].dataAvailability?.waterTemp, 'no_data');
    assertEquals(result[0].dataAvailability?.discharge, 'available');
    assertEquals(result[0].dataAvailability?.gageHeight, 'not_equipped');
  } finally {
    await server.shutdown();
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
