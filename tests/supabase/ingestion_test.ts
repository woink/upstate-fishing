/**
 * Integration tests for the ingestion service against a local Supabase instance.
 * Requires: supabase start + RUN_SUPABASE_TESTS=true
 *
 * Tests verify:
 * - Data flows from USGS/weather APIs into Supabase tables
 * - Upsert idempotency (ON CONFLICT DO NOTHING)
 * - IngestionResult accuracy
 */

import { assertEquals, assertExists, assertGreater } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import { getServiceClient, isSupabaseRunning } from '../helpers/supabase.ts';
import { ingestStationReadings, ingestWeatherSnapshots } from '../../src/services/ingestion.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

const RUN = Deno.env.get('RUN_SUPABASE_TESTS') === 'true';

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
      // First ingestion
      const first = await ingestStationReadings(serviceClient, [testStationId]);

      // Count rows
      const { count: countBefore } = await serviceClient
        .from('station_readings')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', testStationId);

      // Second ingestion — same data
      const second = await ingestStationReadings(serviceClient, [testStationId]);

      // Count should not change
      const { count: countAfter } = await serviceClient
        .from('station_readings')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', testStationId);

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
    // Beaverkill coordinates
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
      const { count: countBefore } = await serviceClient
        .from('weather_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', testCoords.latitude)
        .eq('longitude', testCoords.longitude);

      await ingestWeatherSnapshots(serviceClient, [testCoords]);

      const { count: countAfter } = await serviceClient
        .from('weather_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', testCoords.latitude)
        .eq('longitude', testCoords.longitude);

      assertEquals(countAfter, countBefore);
    });
  },
);
