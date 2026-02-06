/**
 * Prediction service tests
 */

import { assertEquals, assertGreater } from '@std/assert';
import { PredictionService } from '../src/services/predictions.ts';
import type { StationData, WeatherConditions } from '../src/models/types.ts';

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
