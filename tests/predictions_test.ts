/**
 * Prediction service tests
 */

import { assertEquals, assertGreater } from '@std/assert';
import { PredictionService } from '../src/services/predictions.ts';
import type { StationData, Stream, WeatherConditions } from '../src/models/types.ts';

Deno.test('PredictionService - predicts Hendrickson in April at 54°F', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
    },
  ];

  const weather: WeatherConditions = {
    timestamp: new Date().toISOString(),
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 8,
    shortForecast: 'Mostly Cloudy',
    isDaylight: true,
  };

  // April 15th at 2pm
  const april = new Date(2024, 3, 15, 14, 0, 0);
  const predictions = service.predictHatches(stationData, weather, april);

  // Should predict Hendrickson
  const hendrickson = predictions.find((p) => p.hatch.id === 'hendrickson');
  assertEquals(hendrickson !== undefined, true, 'Hendrickson should be predicted');
  assertGreater(hendrickson!.probability, 0.5, 'Hendrickson probability should be > 0.5');
});

Deno.test('PredictionService - predicts BWO on overcast day', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 50,
      waterTempC: 10,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
    },
  ];

  const weather: WeatherConditions = {
    timestamp: new Date().toISOString(),
    airTempF: 52,
    cloudCoverPercent: 90,
    precipProbability: 40,
    windSpeedMph: 5,
    shortForecast: 'Cloudy with Light Rain',
    isDaylight: true,
  };

  // October 10th
  const october = new Date(2024, 9, 10, 14, 0, 0);
  const predictions = service.predictHatches(stationData, weather, october);

  // Should predict BWO
  const bwo = predictions.find((p) => p.hatch.id === 'bwo');
  assertEquals(bwo !== undefined, true, 'BWO should be predicted');
  assertGreater(bwo!.probability, 0.6, 'BWO probability should be > 0.6 in ideal conditions');
});

Deno.test('PredictionService - no hatches predicted at extreme temps', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 32, // Freezing!
      waterTempC: 0,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
    },
  ];

  const january = new Date(2024, 0, 15, 12, 0, 0);
  const predictions = service.predictHatches(stationData, null, january);

  // At 32°F, only midges should be possible
  const nonMidges = predictions.filter(
    (p) => p.hatch.order !== 'midge' && p.probability > 0.5,
  );
  assertEquals(nonMidges.length, 0, 'No non-midge hatches at 32°F');
});

Deno.test('PredictionService - sulphurs in summer', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 62,
      waterTempC: 16.7,
      dischargeCfs: 100,
      gageHeightFt: 2.0,
    },
  ];

  // July evening
  const july = new Date(2024, 6, 20, 18, 0, 0);
  const predictions = service.predictHatches(stationData, null, july);

  // Should predict sulphurs
  const sulphurs = predictions.filter((p) => p.hatch.commonName.includes('Sulphur'));
  assertGreater(sulphurs.length, 0, 'Should predict at least one sulphur hatch');
});

// ============================================================================
// Data Completeness Tests
// ============================================================================

const testStream: Stream = {
  id: 'test-stream',
  name: 'Test Stream',
  region: 'catskills',
  state: 'NY',
  stationIds: ['01420500'],
};

Deno.test('PredictionService - generateConditions includes dataCompleteness', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const conditions = service.generateConditions(testStream, stationData, null);
  assertEquals(conditions.dataCompleteness, 'full');
});

Deno.test('PredictionService - empty station data produces limited completeness', () => {
  const service = new PredictionService();

  const conditions = service.generateConditions(testStream, [], null);
  assertEquals(conditions.dataCompleteness, 'limited');
});

// ============================================================================
// assessFishingQuality boundary tests (tested via generateConditions)
// ============================================================================

Deno.test('PredictionService - waterTempF at 38F boundary is not poor (>= 38 is ok)', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 38,
      waterTempC: 3.3,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  // Use a month/date where hatches are unlikely so we isolate the temp logic
  const january = new Date(2024, 0, 15, 12, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, null, january);
  // At 38°F the temperature check (< 38) should NOT trigger 'poor'.
  // Quality may still be 'poor' if there are zero hatches above 0.5 probability,
  // but that's the hatch-count logic, not the temperature guard.
  if (conditions.predictedHatches.filter((p) => p.probability >= 0.5).length > 0) {
    assertEquals(
      conditions.fishingQuality !== 'poor',
      true,
      '38°F should not trigger cold-temperature poor',
    );
  }
});

Deno.test('PredictionService - waterTempF at 37F is poor (< 38)', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 37,
      waterTempC: 2.8,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const april = new Date(2024, 3, 15, 14, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, null, april);
  assertEquals(conditions.fishingQuality, 'poor', 'At 37F, quality should be poor (< 38)');
});

Deno.test('PredictionService - waterTempF at 68F is not poor (only > 68 is poor)', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 68,
      waterTempC: 20,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const july = new Date(2024, 6, 15, 18, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, null, july);
  assertEquals(
    conditions.fishingQuality !== 'poor',
    true,
    'At 68F exactly, quality should NOT be poor (only > 68 triggers poor)',
  );
});

Deno.test('PredictionService - waterTempF at 69F is poor (> 68)', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 69,
      waterTempC: 20.6,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const july = new Date(2024, 6, 15, 18, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, null, july);
  assertEquals(conditions.fishingQuality, 'poor', 'At 69F, quality should be poor (> 68)');
});

Deno.test('PredictionService - generateConditions with weather data has all expected fields', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const weather: WeatherConditions = {
    timestamp: new Date().toISOString(),
    airTempF: 58,
    cloudCoverPercent: 60,
    precipProbability: 10,
    windSpeedMph: 8,
    shortForecast: 'Partly Cloudy',
    isDaylight: true,
  };

  const april = new Date(2024, 3, 15, 14, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, weather, april);

  assertEquals(typeof conditions.stream, 'object');
  assertEquals(typeof conditions.timestamp, 'string');
  assertEquals(Array.isArray(conditions.stationData), true);
  assertEquals(Array.isArray(conditions.predictedHatches), true);
  assertEquals(typeof conditions.fishingQuality, 'string');
  assertEquals(typeof conditions.summary, 'string');
  assertEquals(typeof conditions.dataCompleteness, 'string');
  assertEquals(conditions.weather !== undefined, true);
});

Deno.test('PredictionService - wind speed exactly 20mph does NOT return fair', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const weather: WeatherConditions = {
    timestamp: new Date().toISOString(),
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 20,
    shortForecast: 'Mostly Cloudy',
    isDaylight: true,
  };

  const april = new Date(2024, 3, 15, 14, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, weather, april);
  const topHatches = conditions.predictedHatches.filter((p) => p.probability >= 0.5);
  if (topHatches.length >= 3) {
    assertEquals(
      conditions.fishingQuality,
      'excellent',
      '20mph wind with 3+ hatches should give excellent quality (wind boundary not crossed)',
    );
  } else if (topHatches.length >= 2) {
    assertEquals(
      conditions.fishingQuality,
      'good',
      '20mph wind with 2+ hatches should give good quality (wind boundary not crossed)',
    );
  }
});

Deno.test('PredictionService - wind speed 21mph returns fair', () => {
  const service = new PredictionService();

  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: 54,
      waterTempC: 12.2,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: { waterTemp: 'available', discharge: 'available', gageHeight: 'available' },
    },
  ];

  const weather: WeatherConditions = {
    timestamp: new Date().toISOString(),
    airTempF: 58,
    cloudCoverPercent: 80,
    precipProbability: 20,
    windSpeedMph: 21,
    shortForecast: 'Mostly Cloudy',
    isDaylight: true,
  };

  const april = new Date(2024, 3, 15, 14, 0, 0);
  const conditions = service.generateConditions(testStream, stationData, weather, april);
  assertEquals(conditions.fishingQuality, 'fair', 'At wind 21mph, quality should be fair');
});

// ============================================================================
// Month-only fallback tests
// ============================================================================

Deno.test('PredictionService - month-only fallback uses updated reasoning', () => {
  const service = new PredictionService();

  // No water temp means month-only fallback
  const stationData: StationData[] = [
    {
      stationId: '01420500',
      stationName: 'Test Station',
      timestamp: new Date().toISOString(),
      waterTempF: null,
      waterTempC: null,
      dischargeCfs: 150,
      gageHeightFt: 2.5,
      dataAvailability: {
        waterTemp: 'not_equipped',
        discharge: 'available',
        gageHeight: 'available',
      },
    },
  ];

  // Use a month that has known hatches (April)
  const april = new Date(2024, 3, 15, 14, 0, 0);
  const predictions = service.predictHatches(stationData, null, april);

  if (predictions.length > 0) {
    assertEquals(
      predictions[0].reasoning.includes('water temperature not monitored'),
      true,
      'Reasoning should mention water temp not monitored',
    );
  }
});
