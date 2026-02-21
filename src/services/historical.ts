/**
 * Historical Data Service
 *
 * Queries station_readings from Supabase to provide time-series data and
 * computed statistics (min, max, avg, trend) for stream detail pages.
 *
 * Falls back gracefully when Supabase is not configured (returns empty results).
 */

import type { StationStats, TrendDirection } from '../models/types.ts';
import { supabaseService } from './supabase.ts';
import { logger } from '../utils/logger.ts';

/** A single reading row from station_readings. */
export interface ReadingRow {
  recorded_at: string;
  water_temp_f: number | null;
  discharge_cfs: number | null;
  gage_height_ft: number | null;
}

/** Time-series data point for charts. */
export interface TimeSeriesPoint {
  timestamp: string;
  waterTempF: number | null;
  dischargeCfs: number | null;
  gageHeightFt: number | null;
}

/**
 * Fetch historical readings for a station over the last N days.
 * Returns chronologically ordered time-series data.
 */
export async function getStationHistory(
  stationId: string,
  days: number = 7,
): Promise<TimeSeriesPoint[]> {
  if (!supabaseService.isAvailable()) {
    return [];
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const client = supabaseService.getClient();
    const { data, error } = await client
      .from('station_readings')
      .select('recorded_at, water_temp_f, discharge_cfs, gage_height_ft')
      .eq('station_id', stationId)
      .gte('recorded_at', since.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      logger.error('Failed to query station history', {
        stationId,
        error: error.message,
      });
      return [];
    }

    return (data as ReadingRow[]).map((row) => ({
      timestamp: row.recorded_at,
      waterTempF: row.water_temp_f,
      dischargeCfs: row.discharge_cfs,
      gageHeightFt: row.gage_height_ft,
    }));
  } catch (err) {
    logger.error('Station history query failed', {
      stationId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Compute statistics (min, max, avg, trend) from time-series data.
 */
export function computeStats(
  stationId: string,
  points: TimeSeriesPoint[],
  days: number,
): StationStats {
  const temps = points.map((p) => p.waterTempF).filter((v): v is number => v !== null);
  const flows = points.map((p) => p.dischargeCfs).filter((v): v is number => v !== null);
  const gages = points.map((p) => p.gageHeightFt).filter((v): v is number => v !== null);

  return {
    stationId,
    days,
    waterTemp: summarize(temps),
    discharge: summarize(flows),
    gageHeight: summarize(gages),
  };
}

function summarize(
  values: number[],
): { min: number | null; max: number | null; avg: number | null; trend: TrendDirection } {
  if (values.length === 0) {
    return { min: null, max: null, avg: null, trend: 'unknown' };
  }

  const min = Math.round(Math.min(...values) * 10) / 10;
  const max = Math.round(Math.max(...values) * 10) / 10;
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const trend = detectTrend(values);

  return { min, max, avg, trend };
}

/**
 * Detect trend direction by comparing the average of the last third
 * to the average of the first third of values.
 */
export function detectTrend(values: number[]): TrendDirection {
  if (values.length < 3) return 'unknown';

  const third = Math.ceil(values.length / 3);
  const firstThird = values.slice(0, third);
  const lastThird = values.slice(-third);

  const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
  const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;

  const change = ((lastAvg - firstAvg) / Math.abs(firstAvg || 1)) * 100;

  if (change > 5) return 'rising';
  if (change < -5) return 'falling';
  return 'stable';
}

/**
 * Get full station stats: fetch history then compute.
 */
export async function getStationStats(
  stationId: string,
  days: number = 7,
): Promise<StationStats> {
  const history = await getStationHistory(stationId, days);
  return computeStats(stationId, history, days);
}
