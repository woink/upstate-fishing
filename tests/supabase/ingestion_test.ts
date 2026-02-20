/**
 * Integration tests for the ingestion service against a local Supabase instance.
 * Requires: supabase start + RUN_SUPABASE_TESTS=true
 *
 * Tests verify:
 * - Data flows from USGS/weather APIs into Supabase tables
 * - Upsert idempotency (ON CONFLICT DO NOTHING)
 * - IngestionResult accuracy
 *
 * Idempotency tests inject mock services with fixed timestamps so two calls
 * always return identical data, eliminating flakiness from live API boundaries.
 */

import { assertEquals, assertExists, assertGreater } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { getServiceClient, isSupabaseRunning } from '../helpers/supabase.ts';
import { ingestStationReadings, ingestWeatherSnapshots } from '../../src/services/ingestion.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Coordinates, StationData, WeatherConditions } from '../../src/models/types.ts';
import { USGSService } from '../../src/services/usgs.ts';
import { WeatherService } from '../../src/services/weather.ts';

const RUN = Deno.env.get('RUN_SUPABASE_TESTS') === 'true';

// ============================================================================
// Mock services with fixed data for deterministic idempotency tests
// ============================================================================

const FIXED_TIMESTAMP = '2024-01-15T12:00:00.000Z';

const MOCK_STATION_DATA: StationData = {
  stationId: '01420500',
  stationName: 'BEAVERKILL AT COOKS FALLS NY',
  timestamp: FIXED_TIMESTAMP,
  waterTempF: 42.5,
  waterTempC: 5.8,
  dischargeCfs: 180.0,
  gageHeightFt: 2.9,
};

const MOCK_WEATHER: WeatherConditions = {
  timestamp: FIXED_TIMESTAMP,
  airTempF: 35,
  cloudCoverPercent: 70,
  precipProbability: 20,
  windSpeedMph: 10,
  shortForecast: 'Mostly Cloudy',
  isDaylight: true,
};

/** A USGSService that always returns fixed station data. */
class MockUSGSService extends USGSService {
  override getInstantaneousValues(
    _stationIds: string[],
    _params?: string[],
  ): Promise<StationData[]> {
    return Promise.resolve([MOCK_STATION_DATA]);
  }
}

/** A WeatherService that always returns fixed weather conditions. */
class MockWeatherService extends WeatherService {
  override getCurrentConditions(
    _coords: Coordinates,
  ): Promise<WeatherConditions | null> {
    return Promise.resolve(MOCK_WEATHER);
  }
}

// ============================================================================
// Station readings ingestion
// ============================================================================

describe(
  'ingestStationReadings',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    const testStationId = '01420500'; // Beaverkill — known to have data

    beforeAll(async () => {
      const running = await isSupabaseRunning();
      if (!running) throw new Error('Supabase not running');
      serviceClient = getServiceClient();
    });

    afterAll(async () => {
      // Clean up test data
      if (serviceClient) {
        await serviceClient
          .from('station_readings')
          .delete()
          .eq('station_id', testStationId);
      }
    });

    it('ingests station readings and returns a valid result', async () => {
      const result = await ingestStationReadings(serviceClient, [testStationId]);

      assertEquals(result.table, 'station_readings');
      assertGreater(result.durationMs, 0);
      // The station should have data — at least 1 inserted
      assertGreater(result.inserted + result.skipped, 0);
      assertEquals(result.errors, 0);
    });

    it('is idempotent — re-ingestion does not duplicate rows', async () => {
      const mockUsgs = new MockUSGSService();

      // First ingestion with fixed data
      const first = await ingestStationReadings(
        serviceClient,
        [testStationId],
        mockUsgs,
      );

      // Count rows
      const { count: countBefore } = await serviceClient
        .from('station_readings')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', testStationId)
        .eq('recorded_at', FIXED_TIMESTAMP);

      // Second ingestion — identical data from mock
      const second = await ingestStationReadings(
        serviceClient,
        [testStationId],
        mockUsgs,
      );

      // Count should not change
      const { count: countAfter } = await serviceClient
        .from('station_readings')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', testStationId)
        .eq('recorded_at', FIXED_TIMESTAMP);

      assertEquals(countAfter, countBefore);
      // All rows should be skipped in the second run
      assertEquals(second.inserted, 0);
      assertEquals(second.skipped, first.inserted + first.skipped);
    });

    it('verifies the inserted row matches the source data', async () => {
      const { data } = await serviceClient
        .from('station_readings')
        .select('*')
        .eq('station_id', testStationId)
        .limit(1)
        .single();

      assertExists(data);
      assertEquals(data.station_id, testStationId);
      assertExists(data.recorded_at);
      assertExists(data.created_at);
      // station_name should be populated
      assertExists(data.station_name);
    });
  },
);

// ============================================================================
// Weather snapshots ingestion
// ============================================================================

describe(
  'ingestWeatherSnapshots',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    // Beaverkill coordinates — rounded to 4 dp to match mapWeatherToSnapshot
    const testCoords = { latitude: 41.9365, longitude: -74.9201 };

    beforeAll(async () => {
      const running = await isSupabaseRunning();
      if (!running) throw new Error('Supabase not running');
      serviceClient = getServiceClient();
    });

    afterAll(async () => {
      if (serviceClient) {
        await serviceClient
          .from('weather_snapshots')
          .delete()
          .eq('latitude', testCoords.latitude)
          .eq('longitude', testCoords.longitude);
      }
    });

    it('ingests weather snapshots and returns a valid result', async () => {
      const result = await ingestWeatherSnapshots(serviceClient, [testCoords]);

      assertEquals(result.table, 'weather_snapshots');
      assertGreater(result.durationMs, 0);
      assertGreater(result.inserted + result.skipped, 0);
      assertEquals(result.errors, 0);
    });

    it('is idempotent — re-ingestion does not duplicate rows', async () => {
      const mockWeather = new MockWeatherService();

      // First ingestion with fixed data
      await ingestWeatherSnapshots(serviceClient, [testCoords], mockWeather);

      const { count: countBefore } = await serviceClient
        .from('weather_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', testCoords.latitude)
        .eq('longitude', testCoords.longitude)
        .eq('recorded_at', FIXED_TIMESTAMP);

      // Second ingestion — identical data from mock
      await ingestWeatherSnapshots(serviceClient, [testCoords], mockWeather);

      const { count: countAfter } = await serviceClient
        .from('weather_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', testCoords.latitude)
        .eq('longitude', testCoords.longitude)
        .eq('recorded_at', FIXED_TIMESTAMP);

      assertEquals(countAfter, countBefore);
    });
  },
);
