/**
 * Data ingestion service — USGS & Weather → Supabase
 *
 * Fetches current readings from the existing USGS and weather services,
 * maps them to the Supabase table schemas, and bulk-upserts via the
 * service role client (bypasses RLS).
 *
 * Both functions are idempotent: ON CONFLICT DO NOTHING prevents duplicates.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Coordinates,
  IngestionResult,
  StationData,
  StationReadingInsert,
  WeatherConditions,
  WeatherSnapshotInsert,
} from '../models/types.ts';
import { USGSService } from './usgs.ts';
import { WeatherService } from './weather.ts';
import { logger } from '../utils/logger.ts';
import { promisePool } from '../../lib/promise-pool.ts';

// ============================================================================
// Mapping functions (exported for unit testing)
// ============================================================================

/** Map a StationData domain object to a station_readings insert row. */
export function mapStationDataToReading(station: StationData): StationReadingInsert {
  return {
    station_id: station.stationId,
    station_name: station.stationName,
    recorded_at: station.timestamp,
    water_temp_f: station.waterTempF,
    water_temp_c: station.waterTempC,
    discharge_cfs: station.dischargeCfs,
    gage_height_ft: station.gageHeightFt,
  };
}

/** Map WeatherConditions + coordinates to a weather_snapshots insert row. */
export function mapWeatherToSnapshot(
  weather: WeatherConditions,
  coords: Coordinates,
): WeatherSnapshotInsert {
  return {
    latitude: Math.round(coords.latitude * 1e4) / 1e4,
    longitude: Math.round(coords.longitude * 1e4) / 1e4,
    recorded_at: weather.timestamp,
    air_temp_f: weather.airTempF,
    cloud_cover_percent: weather.cloudCoverPercent,
    precip_probability: weather.precipProbability,
    wind_speed_mph: weather.windSpeedMph,
    short_forecast: weather.shortForecast,
  };
}

// ============================================================================
// Ingestion functions
// ============================================================================

/**
 * Fetch current USGS readings for the given station IDs and upsert into
 * station_readings. Uses ON CONFLICT DO NOTHING for idempotency.
 */
export async function ingestStationReadings(
  client: SupabaseClient,
  stationIds: string[],
  usgs: USGSService = new USGSService(),
): Promise<IngestionResult> {
  const start = performance.now();
  const result: IngestionResult = {
    table: 'station_readings',
    inserted: 0,
    skipped: 0,
    errors: 0,
    durationMs: 0,
  };

  let rows: StationReadingInsert[] = [];

  try {
    const stationData = await usgs.getInstantaneousValues(stationIds);
    if (stationData.length === 0) {
      result.durationMs = performance.now() - start;
      return result;
    }

    rows = stationData.map(mapStationDataToReading);

    const { data, error } = await client
      .from('station_readings')
      .upsert(rows, {
        onConflict: 'station_id,recorded_at',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      logger.error('station_readings upsert failed', { error: error.message });
      result.errors = rows.length;
    } else {
      result.inserted = data?.length ?? 0;
      result.skipped = rows.length - result.inserted;
    }
  } catch (err) {
    logger.error('station readings ingestion failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    result.errors += rows.length || 1;
  }

  result.durationMs = Math.round(performance.now() - start);
  return result;
}

/**
 * Fetch current weather for the given coordinates and upsert into
 * weather_snapshots. Fetches the first hourly period (current conditions)
 * for each location.
 */
export async function ingestWeatherSnapshots(
  client: SupabaseClient,
  coordinates: Coordinates[],
  weather: WeatherService = new WeatherService(),
): Promise<IngestionResult> {
  const start = performance.now();
  const result: IngestionResult = {
    table: 'weather_snapshots',
    inserted: 0,
    skipped: 0,
    errors: 0,
    durationMs: 0,
  };

  const rows: WeatherSnapshotInsert[] = [];

  const tasks = coordinates.map((coords) => async () => {
    const conditions = await weather.getCurrentConditions(coords);
    return conditions ? mapWeatherToSnapshot(conditions, coords) : null;
  });

  const settled = await promisePool(tasks, 5);

  for (const entry of settled) {
    if (entry.status === 'fulfilled' && entry.value) {
      rows.push(entry.value);
    } else if (entry.status === 'rejected') {
      logger.warn('Failed to fetch weather for coordinates', {
        error: entry.reason instanceof Error ? entry.reason.message : String(entry.reason),
      });
      result.errors++;
    }
  }

  if (rows.length === 0) {
    result.durationMs = Math.round(performance.now() - start);
    return result;
  }

  try {
    const { data, error } = await client
      .from('weather_snapshots')
      .upsert(rows, {
        onConflict: 'latitude,longitude,recorded_at',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      logger.error('weather_snapshots upsert failed', { error: error.message });
      result.errors += rows.length;
    } else {
      result.inserted = data?.length ?? 0;
      result.skipped = rows.length - result.inserted;
    }
  } catch (err) {
    logger.error('weather snapshots ingestion failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    result.errors += rows.length;
  }

  result.durationMs = Math.round(performance.now() - start);
  return result;
}
