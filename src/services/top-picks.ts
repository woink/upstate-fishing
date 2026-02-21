/**
 * Top Picks Scoring Service
 *
 * Scores all streams server-side to determine the best fishing spots today.
 * Weights: water temp (40%), hatch activity (30%), weather/flow (30%).
 *
 * Replaces the naive client-side approach (fetch 6 streams, sort by quality)
 * with a single server-side endpoint that evaluates all 27 streams.
 */

import type { StationData, TopPickScore, WeatherConditions } from '../models/types.ts';
import type { Stream } from '../models/types.ts';
import { STREAMS } from '../data/streams.ts';
import { PredictionService } from './predictions.ts';
import { cachedUSGSService } from './cached-usgs.ts';
import { cachedWeatherService } from './cached-weather.ts';
import { promisePool } from '../lib/promise-pool.ts';
import { logger } from '../utils/logger.ts';

/** Number of top picks to return */
const TOP_N = 5;

/** Concurrency limit for parallel API fetches */
const FETCH_CONCURRENCY = 6;

/**
 * Score a single stream based on current conditions.
 * Returns a 0-100 score where higher is better.
 *
 * Scoring breakdown:
 *   - Water temp (40%): 0-40 points. Optimal trout range (48-62°F) scores highest.
 *   - Hatch activity (30%): 0-30 points. More high-probability hatches = higher score.
 *   - Weather/flow (30%): 0-30 points. Low wind, moderate flow, pleasant air temp.
 */
export function scoreStream(
  stationData: StationData[],
  weather: WeatherConditions | null,
  predictions: ReturnType<PredictionService['predictHatches']>,
): number {
  let score = 0;

  // --- Water Temperature (40 points max) ---
  const temps = stationData
    .map((s) => s.waterTempF)
    .filter((t): t is number => t !== null);
  const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : null;

  if (avgTemp !== null) {
    if (avgTemp > 68 || avgTemp < 38) {
      score += 0; // Stress/lethargy zone
    } else if (avgTemp >= 48 && avgTemp <= 62) {
      score += 40; // Optimal trout range
    } else if (avgTemp >= 42 && avgTemp < 48) {
      // Cool but fishable — scale 20-40
      score += 20 + ((avgTemp - 42) / 6) * 20;
    } else if (avgTemp > 62 && avgTemp <= 68) {
      // Warm but fishable — scale 40 down to 10
      score += 40 - ((avgTemp - 62) / 6) * 30;
    } else {
      // 38-42 range — cold but not lethargy
      score += 10 + ((avgTemp - 38) / 4) * 10;
    }
  } else {
    // No temp data — neutral score
    score += 15;
  }

  // --- Hatch Activity (30 points max) ---
  const highProb = predictions.filter((p) => p.probability >= 0.5);
  const medProb = predictions.filter((p) => p.probability >= 0.3 && p.probability < 0.5);

  // Each high-probability hatch contributes up to 10 points (capped at 3)
  score += Math.min(highProb.length, 3) * 10;
  // Each medium-probability hatch contributes 2 points (capped at remaining)
  const remainingHatchPoints = 30 - Math.min(highProb.length, 3) * 10;
  score += Math.min(medProb.length * 2, remainingHatchPoints);

  // --- Weather/Flow (30 points max) ---
  let weatherScore = 15; // Default neutral if no weather data
  if (weather) {
    weatherScore = 0;
    // Wind: calm is best, >20 mph is terrible
    if (weather.windSpeedMph <= 5) weatherScore += 10;
    else if (weather.windSpeedMph <= 10) weatherScore += 8;
    else if (weather.windSpeedMph <= 15) weatherScore += 5;
    else if (weather.windSpeedMph <= 20) weatherScore += 2;

    // Precipitation: light chance is fine, heavy is bad for most fishing
    if (weather.precipProbability <= 20) weatherScore += 10;
    else if (weather.precipProbability <= 40) weatherScore += 7;
    else if (weather.precipProbability <= 60) weatherScore += 4;
    else weatherScore += 1;

    // Air temp comfort: 45-75°F is pleasant for the angler
    if (weather.airTempF >= 45 && weather.airTempF <= 75) weatherScore += 10;
    else if (weather.airTempF >= 35 && weather.airTempF < 45) weatherScore += 5;
    else if (weather.airTempF > 75 && weather.airTempF <= 85) weatherScore += 5;
    else weatherScore += 1;
  }
  score += weatherScore;

  return Math.round(Math.min(score, 100));
}

/**
 * Fetch conditions for a single stream and produce a TopPickScore.
 * Returns null if fetching fails entirely.
 */
async function scoreOneStream(
  stream: Stream,
  predictionService: PredictionService,
): Promise<TopPickScore | null> {
  try {
    const usgsResult = await cachedUSGSService.getInstantaneousValues(stream.stationIds);

    let weather: WeatherConditions | null = null;
    if (stream.coordinates) {
      try {
        const weatherResult = await cachedWeatherService.getCurrentConditions(stream.coordinates);
        weather = weatherResult.data;
      } catch (err) {
        logger.warn('Top picks: weather fetch failed', {
          stream: stream.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const predictions = predictionService.predictHatches(usgsResult.data, weather);
    const score = scoreStream(usgsResult.data, weather, predictions);
    const quality = predictionService.generateConditions(
      stream,
      usgsResult.data,
      weather,
    );

    const firstStation = usgsResult.data[0];

    return {
      stream,
      score,
      fishingQuality: quality.fishingQuality,
      waterTempF: firstStation?.waterTempF ?? null,
      airTempF: weather?.airTempF ?? null,
      dischargeCfs: firstStation?.dischargeCfs ?? null,
      topHatches: predictions.slice(0, 3).map((p) => ({
        name: p.hatch.commonName,
        probability: p.probability,
      })),
      summary: quality.summary,
    };
  } catch (err) {
    logger.warn('Top picks: stream scoring failed', {
      stream: stream.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Score all streams and return the top N picks, sorted best-first.
 */
export async function getTopPicks(
  count: number = TOP_N,
  predictionService: PredictionService = new PredictionService(),
): Promise<TopPickScore[]> {
  const tasks = STREAMS.map((stream) => () => scoreOneStream(stream, predictionService));

  const settled = await promisePool(tasks, FETCH_CONCURRENCY);

  const picks: TopPickScore[] = [];
  for (const entry of settled) {
    if (entry.status === 'fulfilled' && entry.value !== null) {
      picks.push(entry.value);
    }
  }

  // Sort by score descending, then by fishing quality as tiebreaker
  const qualityOrder = { excellent: 0, good: 1, fair: 2, poor: 3 } as const;
  picks.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return qualityOrder[a.fishingQuality] - qualityOrder[b.fishingQuality];
  });

  return picks.slice(0, count);
}
