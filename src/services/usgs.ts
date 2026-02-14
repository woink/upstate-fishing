/**
 * USGS Water Services API client
 * https://waterservices.usgs.gov/
 */

import { z } from 'zod';
import type { StationData } from '../models/types.ts';
import { celsiusToFahrenheit } from '../utils/temperature.ts';

// ============================================================================
// USGS API Response Types (Zod schemas for runtime validation)
// ============================================================================

const USGSValueSchema = z.object({
  value: z.string(),
  dateTime: z.string(),
}).passthrough();

const USGSTimeSeriesSchema = z.object({
  sourceInfo: z.object({
    siteCode: z.array(z.object({ value: z.string() }).passthrough()),
    siteName: z.string(),
    geoLocation: z.object({
      geogLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).passthrough(),
    }).passthrough(),
  }).passthrough(),
  variable: z.object({
    variableCode: z.array(z.object({ value: z.string() }).passthrough()),
    variableName: z.string(),
    unit: z.object({ unitCode: z.string() }).passthrough(),
  }).passthrough(),
  values: z.array(
    z.object({
      value: z.array(USGSValueSchema),
    }).passthrough(),
  ),
}).passthrough();

const USGSResponseSchema = z.object({
  value: z.object({
    timeSeries: z.array(USGSTimeSeriesSchema),
  }).passthrough(),
}).passthrough();

type USGSResponse = z.infer<typeof USGSResponseSchema>;
type USGSTimeSeries = z.infer<typeof USGSTimeSeriesSchema>;

// ============================================================================
// USGS Sentinel Values
// ============================================================================

/**
 * USGS uses these values to indicate missing/invalid readings
 * Common sentinel values per USGS IV API documentation:
 * - -999999: Ice-affected/Equipment malfunction
 * - -99999: Other invalid reading conditions
 *
 * Source: https://help.waterdata.usgs.gov/codes-and-parameters
 */
export const USGS_SENTINEL_VALUES = new Set([-999999, -99999]);

export function isValidReading(value: number): boolean {
  return !isNaN(value) && !USGS_SENTINEL_VALUES.has(value);
}

// ============================================================================
// USGS Parameter Codes
// ============================================================================

export const USGS_PARAMS = {
  WATER_TEMP: '00010', // Water temperature, degrees Celsius
  DISCHARGE: '00060', // Discharge, cubic feet per second
  GAGE_HEIGHT: '00065', // Gage height, feet
} as const;

// ============================================================================
// USGS Service
// ============================================================================

export interface USGSServiceOptions {
  baseUrl?: string;
  timeout?: number;
}

export class USGSService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: USGSServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://waterservices.usgs.gov/nwis/iv/';
    this.timeout = options.timeout ?? 10000;
  }

  /**
   * Fetch instantaneous values for given station IDs
   */
  async getInstantaneousValues(
    stationIds: string[],
    params: string[] = [USGS_PARAMS.WATER_TEMP, USGS_PARAMS.DISCHARGE, USGS_PARAMS.GAGE_HEIGHT],
  ): Promise<StationData[]> {
    if (stationIds.length === 0) {
      return [];
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('sites', stationIds.join(','));
    url.searchParams.set('parameterCd', params.join(','));
    url.searchParams.set('siteStatus', 'active');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status} ${response.statusText}`);
      }

      const raw = await response.json();
      const parsed = USGSResponseSchema.parse(raw);

      return this.transformResponse(parsed);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Transform USGS response to our StationData format
   */
  private transformResponse(response: USGSResponse): StationData[] {
    const stationMap = new Map<string, Partial<StationData>>();

    for (const series of response.value.timeSeries) {
      const stationId = series.sourceInfo.siteCode[0]?.value;
      if (!stationId) continue;

      // Initialize station data if not exists
      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          stationName: series.sourceInfo.siteName,
          waterTempF: null,
          waterTempC: null,
          dischargeCfs: null,
          gageHeightFt: null,
        });
      }

      const stationData = stationMap.get(stationId)!;
      const latestValue = this.getLatestValue(series);

      if (!latestValue) continue;

      const paramCode = series.variable.variableCode[0]?.value;
      const value = parseFloat(latestValue.value);

      // Update timestamp to the most recent
      if (!stationData.timestamp || latestValue.dateTime > stationData.timestamp) {
        stationData.timestamp = latestValue.dateTime;
      }

      // Set value based on parameter code (filter NaN and USGS sentinel values)
      switch (paramCode) {
        case USGS_PARAMS.WATER_TEMP: {
          const isValid = isValidReading(value);
          stationData.waterTempC = isValid ? value : null;
          stationData.waterTempF = isValid ? celsiusToFahrenheit(value) : null;
          break;
        }
        case USGS_PARAMS.DISCHARGE:
          stationData.dischargeCfs = isValidReading(value) ? value : null;
          break;
        case USGS_PARAMS.GAGE_HEIGHT:
          stationData.gageHeightFt = isValidReading(value) ? value : null;
          break;
      }
    }

    // Convert map to array and validate
    return Array.from(stationMap.values())
      .filter((s): s is StationData => !!s.timestamp && !!s.stationId && !!s.stationName)
      .map((s) => ({
        stationId: s.stationId!,
        stationName: s.stationName!,
        timestamp: s.timestamp!,
        waterTempF: s.waterTempF ?? null,
        waterTempC: s.waterTempC ?? null,
        dischargeCfs: s.dischargeCfs ?? null,
        gageHeightFt: s.gageHeightFt ?? null,
      }));
  }

  /**
   * Get the most recent value from a time series
   */
  private getLatestValue(series: USGSTimeSeries): { value: string; dateTime: string } | null {
    const values = series.values[0]?.value;
    if (!values || values.length === 0) return null;

    // Values are typically in chronological order, get last one
    return values[values.length - 1] ?? null;
  }
}

// Default singleton instance
export const usgsService = new USGSService();
