/**
 * Top Picks scoring tests
 *
 * Tests the pure `scoreStream` function in isolation (no network calls).
 * The function scores a stream 0-100 based on water temp, hatch activity,
 * and weather/flow conditions.
 */

import { assertEquals, assertGreater, assertLessOrEqual } from '@std/assert';
import { scoreStream } from '../src/services/top-picks.ts';
import { PredictionService } from '../src/services/predictions.ts';
import type { HatchPrediction, StationData, WeatherConditions } from '../src/models/types.ts';
import { HATCHES } from '../src/data/hatches.ts';

// ============================================================================
// Test helpers
// ============================================================================

function makeStation(overrides: Partial<StationData> = {}): StationData {
  return {
    stationId: '01420500',
    stationName: 'Test Station',
    timestamp: new Date().toISOString(),
    waterTempF: 54,
    waterTempC: 12.2,
    dischargeCfs: 150,
    gageHeightFt: 2.5,
    ...overrides,
  };
}

function makeWeather(overrides: Partial<WeatherConditions> = {}): WeatherConditions {
  return {
    timestamp: new Date().toISOString(),
    airTempF: 58,
    cloudCoverPercent: 60,
    precipProbability: 10,
    windSpeedMph: 5,
    shortForecast: 'Partly Cloudy',
    isDaylight: true,
    ...overrides,
  };
}

function makePrediction(probability: number): HatchPrediction {
  return {
    hatch: HATCHES[0],
    probability,
    confidence: probability >= 0.7 ? 'high' : probability >= 0.4 ? 'medium' : 'low',
    reasoning: 'Test prediction',
  };
}

// ============================================================================
// Water temperature scoring (40 points max)
// ============================================================================

Deno.test('scoreStream - optimal temp (48-62°F) gives max temp score', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather();
  const score = scoreStream([station], weather, []);
  // 40 (temp) + 0 (no hatches) + weather points
  assertGreater(score, 39, 'Optimal temp should contribute ~40 points');
});

Deno.test('scoreStream - stress temp (>68°F) gives 0 temp points', () => {
  const station = makeStation({ waterTempF: 72 });
  const weather = makeWeather();
  const score = scoreStream([station], weather, []);
  // 0 (temp) + 0 (no hatches) + weather points = only weather
  assertLessOrEqual(score, 30, 'Stress temp should contribute 0 temp points');
});

Deno.test('scoreStream - lethargy temp (<38°F) gives 0 temp points', () => {
  const station = makeStation({ waterTempF: 35 });
  const weather = makeWeather();
  const score = scoreStream([station], weather, []);
  assertLessOrEqual(score, 30, 'Cold lethargy temp should contribute 0 temp points');
});

Deno.test('scoreStream - cool but fishable (42-48°F) gives partial temp score', () => {
  const station = makeStation({ waterTempF: 45 });
  const weather = makeWeather();
  const scoreWith45 = scoreStream([station], weather, []);
  // Should be between stress (0 temp) and optimal (40 temp)
  assertGreater(scoreWith45, 25, '45°F should give meaningful temp score');
  assertLessOrEqual(scoreWith45, 70, '45°F should not max out');
});

Deno.test('scoreStream - warm but fishable (62-68°F) gives declining temp score', () => {
  const station62 = makeStation({ waterTempF: 63 });
  const station67 = makeStation({ waterTempF: 67 });
  const weather = makeWeather();
  const score63 = scoreStream([station62], weather, []);
  const score67 = scoreStream([station67], weather, []);
  assertGreater(score63, score67, '63°F should score higher than 67°F (declining warmth)');
});

Deno.test('scoreStream - no temp data gives neutral 15 points', () => {
  const station = makeStation({ waterTempF: null });
  const weather = makeWeather();
  const scoreNoTemp = scoreStream([station], weather, []);
  // 15 (neutral temp) + 0 (hatches) + weather
  assertGreater(scoreNoTemp, 14, 'No-temp neutral should give at least 15 from temp');
});

// ============================================================================
// Hatch activity scoring (30 points max)
// ============================================================================

Deno.test('scoreStream - 3 high-probability hatches gives max hatch score', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather();
  const preds = [makePrediction(0.8), makePrediction(0.7), makePrediction(0.6)];
  const score = scoreStream([station], weather, preds);
  // 40 (temp) + 30 (hatches) + weather ~= 95+
  assertGreater(score, 85, '3 high-prob hatches should push score very high');
});

Deno.test('scoreStream - 0 predictions gives 0 hatch points', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather();
  const withHatches = scoreStream([station], weather, [makePrediction(0.8)]);
  const without = scoreStream([station], weather, []);
  assertGreater(withHatches, without, 'Hatches should increase score');
});

Deno.test('scoreStream - medium-probability hatches contribute less', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather();
  const highPred = scoreStream([station], weather, [makePrediction(0.6)]);
  const medPred = scoreStream([station], weather, [makePrediction(0.35)]);
  assertGreater(highPred, medPred, 'High-prob hatch should score higher than medium');
});

// ============================================================================
// Weather/flow scoring (30 points max)
// ============================================================================

Deno.test('scoreStream - calm wind scores higher than gusty', () => {
  const station = makeStation({ waterTempF: 55 });
  const calm = makeWeather({ windSpeedMph: 3 });
  const gusty = makeWeather({ windSpeedMph: 18 });
  const scoreCalm = scoreStream([station], calm, []);
  const scoreGusty = scoreStream([station], gusty, []);
  assertGreater(scoreCalm, scoreGusty, 'Calm wind should score higher');
});

Deno.test('scoreStream - low precip scores higher than high precip', () => {
  const station = makeStation({ waterTempF: 55 });
  const dry = makeWeather({ precipProbability: 5 });
  const rainy = makeWeather({ precipProbability: 80 });
  const scoreDry = scoreStream([station], dry, []);
  const scoreRainy = scoreStream([station], rainy, []);
  assertGreater(scoreDry, scoreRainy, 'Low precip should score higher');
});

Deno.test('scoreStream - comfortable air temp scores higher than extreme', () => {
  const station = makeStation({ waterTempF: 55 });
  const comfy = makeWeather({ airTempF: 60 });
  const cold = makeWeather({ airTempF: 25 });
  const scoreComfy = scoreStream([station], comfy, []);
  const scoreCold = scoreStream([station], cold, []);
  assertGreater(scoreComfy, scoreCold, 'Comfortable air temp should score higher');
});

Deno.test('scoreStream - no weather gives neutral 15 weather points', () => {
  const station = makeStation({ waterTempF: 55 });
  const score = scoreStream([station], null, []);
  // 40 (optimal temp) + 0 (no hatches) + 15 (neutral weather) = 55
  assertEquals(score, 55, 'No weather should give neutral 15 weather points');
});

// ============================================================================
// Combined scoring
// ============================================================================

Deno.test('scoreStream - perfect conditions score near 100', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather({ windSpeedMph: 3, precipProbability: 5, airTempF: 60 });
  const preds = [makePrediction(0.9), makePrediction(0.8), makePrediction(0.7)];
  const score = scoreStream([station], weather, preds);
  assertEquals(score, 100, 'Perfect conditions should score 100');
});

Deno.test('scoreStream - terrible conditions score near 0', () => {
  const station = makeStation({ waterTempF: 75 }); // Stress temp
  const weather = makeWeather({ windSpeedMph: 25, precipProbability: 90, airTempF: 95 });
  const score = scoreStream([station], weather, []);
  assertLessOrEqual(score, 10, 'Terrible conditions should score near 0');
});

Deno.test('scoreStream - score is capped at 100', () => {
  const station = makeStation({ waterTempF: 55 });
  const weather = makeWeather({ windSpeedMph: 0, precipProbability: 0, airTempF: 60 });
  const preds = [
    makePrediction(0.9),
    makePrediction(0.9),
    makePrediction(0.9),
    makePrediction(0.9),
  ];
  const score = scoreStream([station], weather, preds);
  assertLessOrEqual(score, 100, 'Score should never exceed 100');
});

Deno.test('scoreStream - averages temps from multiple stations', () => {
  const station1 = makeStation({ waterTempF: 50 });
  const station2 = makeStation({ waterTempF: 60 });
  const weather = makeWeather();
  // Average = 55, which is optimal
  const score = scoreStream([station1, station2], weather, []);
  assertGreater(score, 39, 'Average of 50+60=55 should be in optimal range');
});

// ============================================================================
// Integration: verify PredictionService produces predictions scoreStream accepts
// ============================================================================

Deno.test('scoreStream - works with real PredictionService output', () => {
  const service = new PredictionService();
  const station = makeStation({ waterTempF: 54 });
  const weather = makeWeather({ cloudCoverPercent: 80 });
  const april = new Date(2024, 3, 15, 14, 0, 0);

  const predictions = service.predictHatches([station], weather, april);
  const score = scoreStream([station], weather, predictions);

  assertGreater(score, 0, 'Score should be positive with real predictions');
  assertLessOrEqual(score, 100, 'Score should not exceed 100');
});
