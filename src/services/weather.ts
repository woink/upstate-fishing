/**
 * National Weather Service API client
 * https://api.weather.gov/
 */

import { z } from 'zod';
import type { Coordinates, HourlyForecast, WeatherConditions } from '../models/types.ts';
import { celsiusToFahrenheit } from '../utils/temperature.ts';

// ============================================================================
// NWS API Response Types
// ============================================================================

const NWSPointsResponseSchema = z.object({
  properties: z.object({
    gridId: z.string(),
    gridX: z.number(),
    gridY: z.number(),
    forecast: z.string(),
    forecastHourly: z.string(),
  }),
});

const NWSForecastPeriodSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  temperature: z.number(),
  temperatureUnit: z.string(),
  probabilityOfPrecipitation: z.object({ value: z.number().nullable() }).optional(),
  windSpeed: z.string(),
  shortForecast: z.string(),
  isDaytime: z.boolean(),
});

const NWSForecastResponseSchema = z.object({
  properties: z.object({
    generatedAt: z.string(),
    periods: z.array(NWSForecastPeriodSchema),
  }),
});

const NWSGridpointsResponseSchema = z.object({
  properties: z.object({
    skyCover: z.object({
      values: z.array(z.object({
        validTime: z.string(),
        value: z.number(),
      })),
    }).optional(),
  }),
});

// ============================================================================
// Weather Service
// ============================================================================

export interface WeatherServiceOptions {
  baseUrl?: string;
  userAgent?: string;
  timeout?: number;
}

export class WeatherService {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly timeout: number;
  private readonly gridCache: Map<string, { gridId: string; gridX: number; gridY: number }>;

  constructor(options: WeatherServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.weather.gov';
    this.userAgent = options.userAgent ?? 'FishingConditionsApp/1.0 (contact@example.com)';
    this.timeout = options.timeout ?? 10000;
    this.gridCache = new Map();
  }

  /**
   * Get hourly forecast for a location
   */
  async getHourlyForecast(coords: Coordinates): Promise<HourlyForecast> {
    const grid = await this.getGridpoint(coords);
    const forecastUrl =
      `${this.baseUrl}/gridpoints/${grid.gridId}/${grid.gridX},${grid.gridY}/forecast/hourly`;

    const response = await this.fetch(forecastUrl);
    const parsed = NWSForecastResponseSchema.parse(response);

    // Also fetch gridpoints for sky cover data
    const skyCoverMap: Map<string, number> = new Map();
    try {
      const gridpointsUrl = `${this.baseUrl}/gridpoints/${grid.gridId}/${grid.gridX},${grid.gridY}`;
      const gridpointsResponse = await this.fetch(gridpointsUrl);
      const gridpointsParsed = NWSGridpointsResponseSchema.parse(gridpointsResponse);

      if (gridpointsParsed.properties.skyCover?.values) {
        for (const entry of gridpointsParsed.properties.skyCover.values) {
          // validTime format: "2024-01-15T14:00:00+00:00/PT1H"
          const timestamp = entry.validTime.split('/')[0];
          if (timestamp) {
            skyCoverMap.set(timestamp, entry.value);
          }
        }
      }
    } catch {
      // Sky cover data is optional, continue without it
    }

    const periods: WeatherConditions[] = parsed.properties.periods.map((period) => {
      const startTime = period.startTime;
      const cloudCover = skyCoverMap.get(startTime) ??
        this.estimateCloudCover(period.shortForecast);

      return {
        timestamp: startTime,
        airTempF: period.temperatureUnit === 'F'
          ? period.temperature
          : celsiusToFahrenheit(period.temperature, 0),
        cloudCoverPercent: cloudCover,
        precipProbability: period.probabilityOfPrecipitation?.value ?? 0,
        windSpeedMph: this.parseWindSpeed(period.windSpeed),
        shortForecast: period.shortForecast,
        isDaylight: period.isDaytime,
      };
    });

    return {
      location: coords,
      generatedAt: parsed.properties.generatedAt,
      periods,
    };
  }

  /**
   * Get current conditions (first hour of forecast)
   */
  async getCurrentConditions(coords: Coordinates): Promise<WeatherConditions | null> {
    const forecast = await this.getHourlyForecast(coords);
    return forecast.periods[0] ?? null;
  }

  /**
   * Get grid coordinates for a location (with caching)
   */
  private async getGridpoint(
    coords: Coordinates,
  ): Promise<{ gridId: string; gridX: number; gridY: number }> {
    const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;

    const cached = this.gridCache.get(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/points/${coords.latitude.toFixed(4)},${
      coords.longitude.toFixed(4)
    }`;
    const response = await this.fetch(url);
    const parsed = NWSPointsResponseSchema.parse(response);

    const grid = {
      gridId: parsed.properties.gridId,
      gridX: parsed.properties.gridX,
      gridY: parsed.properties.gridY,
    };

    this.gridCache.set(cacheKey, grid);
    return grid;
  }

  /**
   * Make a fetch request with timeout and proper headers
   */
  private async fetch(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/geo+json',
        },
      });

      if (!response.ok) {
        throw new Error(`NWS API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse wind speed from NWS format (e.g., "10 mph" or "5 to 10 mph")
   */
  private parseWindSpeed(windSpeed: string): number {
    const match = windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/i);
    if (!match) return 0;

    const low = parseInt(match[1] ?? '0', 10);
    const high = match[2] ? parseInt(match[2], 10) : low;
    return Math.round((low + high) / 2);
  }

  /**
   * Estimate cloud cover from forecast text when not available
   */
  private estimateCloudCover(forecast: string): number {
    const lower = forecast.toLowerCase();

    if (lower.includes('sunny') || lower.includes('clear')) return 10;
    if (lower.includes('mostly sunny') || lower.includes('mostly clear')) return 25;
    if (lower.includes('partly')) return 50;
    if (lower.includes('mostly cloudy')) return 75;
    if (lower.includes('cloudy') || lower.includes('overcast')) return 90;
    if (lower.includes('rain') || lower.includes('storm') || lower.includes('shower')) return 85;

    return 50; // Default to partly cloudy
  }
}

// Default singleton instance
export const weatherService = new WeatherService();
