/**
 * Cached Weather Service
 *
 * Wraps WeatherService with Deno KV caching.
 * TTL: 1 hour (Weather forecasts update hourly)
 */

import type { Coordinates, HourlyForecast, WeatherConditions } from '../models/types.ts';
import { cacheService, makeWeatherKey, TTL } from './cache.ts';
import { WeatherService } from './weather.ts';

export interface CachedWeatherResult<T> {
  data: T;
  cached: boolean;
  cachedAt: number | null;
}

export class CachedWeatherService {
  private readonly weather: WeatherService;

  constructor(weather?: WeatherService) {
    this.weather = weather ?? new WeatherService();
  }

  /**
   * Get hourly forecast with caching
   */
  async getHourlyForecast(coords: Coordinates): Promise<CachedWeatherResult<HourlyForecast>> {
    const key = makeWeatherKey(coords.latitude, coords.longitude);

    // Try cache first
    const cached = await cacheService.get<HourlyForecast>(key);
    if (cached) {
      return {
        data: cached.data,
        cached: true,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const data = await this.weather.getHourlyForecast(coords);

    // Cache the result
    await cacheService.set(key, data, TTL.WEATHER_MS);

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
    await cacheService.delete(key);
  }
}

// Default singleton instance
export const cachedWeatherService = new CachedWeatherService();
