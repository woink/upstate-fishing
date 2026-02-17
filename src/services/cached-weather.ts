/**
 * Cached Weather Service
 *
 * Wraps WeatherService with Deno KV caching.
 * TTL: 1 hour (Weather forecasts update hourly)
 */

import type { Coordinates, HourlyForecast, WeatherConditions } from '../models/types.ts';
import { type CacheLike, cacheService, makeWeatherKey, TTL } from './cache.ts';
import { WeatherService } from './weather.ts';
import { logger } from '../utils/logger.ts';

export interface CachedWeatherResult<T> {
  data: T;
  cached: boolean;
  cachedAt: number | null;
}

export class CachedWeatherService {
  private readonly weather: WeatherService;
  private readonly cache: CacheLike;

  constructor(weather?: WeatherService, cache?: CacheLike) {
    this.weather = weather ?? new WeatherService();
    this.cache = cache ?? cacheService;
  }

  /**
   * Get hourly forecast with caching
   */
  async getHourlyForecast(coords: Coordinates): Promise<CachedWeatherResult<HourlyForecast>> {
    const key = makeWeatherKey(coords.latitude, coords.longitude);

    // Try cache first — treat failure as cache miss
    let cached: { data: HourlyForecast; hit: boolean; cachedAt: number | null } | null = null;
    try {
      cached = await this.cache.get<HourlyForecast>(key);
    } catch (err) {
      logger.warn('Cache read failed, falling back to API', {
        key: key.join('/'),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (cached) {
      return {
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const data = await this.weather.getHourlyForecast(coords);

    // Cache the result — swallow failure, data already fetched
    try {
      await this.cache.set(key, data, TTL.WEATHER_MS);
    } catch (err) {
      logger.warn('Cache write failed', {
        key: key.join('/'),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return {
      data,
      cached: false,
      cachedAt: null,
    };
  }

  /**
   * Get current conditions (first hour of forecast)
   */
  async getCurrentConditions(
    coords: Coordinates,
  ): Promise<CachedWeatherResult<WeatherConditions | null>> {
    const result = await this.getHourlyForecast(coords);

    return {
      data: result.data.periods[0] ?? null,
      cached: result.cached,
      cachedAt: result.cachedAt,
    };
  }

  /**
   * Invalidate cache for specific coordinates
   */
  async invalidate(coords: Coordinates): Promise<void> {
    const key = makeWeatherKey(coords.latitude, coords.longitude);
    await this.cache.delete(key);
  }
}

// Default singleton instance
export const cachedWeatherService = new CachedWeatherService();
