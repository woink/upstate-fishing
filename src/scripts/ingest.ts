#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read
/**
 * CLI entry point for the data ingestion pipeline.
 *
 * Fetches current USGS readings and weather data for all configured streams,
 * then upserts into Supabase. Safe to run repeatedly — uses ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   deno task ingest
 *   deno run --allow-net --allow-env --allow-read --env-file src/scripts/ingest.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getAllStationIds, STREAMS } from '../data/streams.ts';
import { ingestStationReadings, ingestWeatherSnapshots } from '../services/ingestion.ts';
import type { Coordinates, IngestionResult } from '../models/types.ts';

function getEnvOrExit(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    console.error(JSON.stringify({
      level: 'error',
      message: `Missing required environment variable: ${key}`,
      timestamp: new Date().toISOString(),
    }));
    Deno.exit(1);
  }
  return value;
}

function logResult(result: IngestionResult): void {
  console.log(JSON.stringify({
    level: 'info',
    message: `Ingestion complete: ${result.table}`,
    timestamp: new Date().toISOString(),
    ...result,
  }));
}

async function main(): Promise<void> {
  const url = getEnvOrExit('SUPABASE_URL');
  const serviceKey = getEnvOrExit('SUPABASE_SERVICE_ROLE_KEY');

  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stationIds = getAllStationIds();
  const coordinates: Coordinates[] = STREAMS
    .filter((s) => s.coordinates !== undefined)
    .map((s) => s.coordinates!);

  // Deduplicate coordinates (some streams share similar locations)
  const uniqueCoords = deduplicateCoordinates(coordinates);

  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting ingestion',
    timestamp: new Date().toISOString(),
    stations: stationIds.length,
    weatherLocations: uniqueCoords.length,
  }));

  let hasErrors = false;

  // Ingest station readings
  const stationResult = await ingestStationReadings(client, stationIds);
  logResult(stationResult);
  if (stationResult.errors > 0) hasErrors = true;

  // Ingest weather snapshots
  const weatherResult = await ingestWeatherSnapshots(client, uniqueCoords);
  logResult(weatherResult);
  if (weatherResult.errors > 0) hasErrors = true;

  if (hasErrors) {
    Deno.exit(1);
  }
}

/** Deduplicate coordinates by rounding to 4 decimal places (~11m precision). */
function deduplicateCoordinates(coords: Coordinates[]): Coordinates[] {
  const seen = new Set<string>();
  return coords.filter((c) => {
    const key = `${c.latitude.toFixed(4)},${c.longitude.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

await main();
