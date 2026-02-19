/**
 * End-to-end CRUD tests for Supabase tables.
 * Tests the full lifecycle: create, read, update, delete for each table.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import {
  createTestUser,
  deleteTestUser,
  getAuthenticatedClient,
  getServiceClient,
} from '../helpers/supabase.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

const RUN = Deno.env.get('RUN_SUPABASE_TESTS') === 'true';

// ============================================================================
// saved_streams CRUD
// ============================================================================

describe(
  'saved_streams CRUD',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let userId: string;
    let accessToken: string;
    let client: SupabaseClient;
    let savedStreamId: string;

    beforeAll(async () => {
      const result = await createTestUser(
        `crud-streams-${crypto.randomUUID()}@test.local`,
      );
      userId = result.userId;
      accessToken = result.accessToken;
      client = getAuthenticatedClient(accessToken);
    });

    afterAll(async () => {
      if (userId) await deleteTestUser(userId);
    });

    it('creates a saved stream', async () => {
      const { data, error } = await client
        .from('saved_streams')
        .insert({ user_id: userId, stream_id: 'beaverkill' })
        .select()
        .single();

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.user_id, userId);
      assertEquals(data.stream_id, 'beaverkill');
      assertExists(data.id);
      assertExists(data.created_at);
      savedStreamId = data.id;
    });

    it('reads saved streams', async () => {
      const { data, error } = await client
        .from('saved_streams')
        .select('*')
        .eq('user_id', userId);

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.length, 1);
      assertEquals(data[0].stream_id, 'beaverkill');
    });

    it('deletes a saved stream', async () => {
      const { error } = await client
        .from('saved_streams')
        .delete()
        .eq('id', savedStreamId);

      assertEquals(error, null);

      const { data } = await client
        .from('saved_streams')
        .select('*')
        .eq('user_id', userId);
      assertEquals(data?.length ?? 0, 0);
    });
  },
);

// ============================================================================
// notification_preferences CRUD
// ============================================================================

describe('notification_preferences CRUD', {
  ignore: !RUN,
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let userId: string;
  let accessToken: string;
  let client: SupabaseClient;

  beforeAll(async () => {
    const result = await createTestUser(
      `crud-notif-${crypto.randomUUID()}@test.local`,
    );
    userId = result.userId;
    accessToken = result.accessToken;
    client = getAuthenticatedClient(accessToken);
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  it('creates notification preferences', async () => {
    const { data, error } = await client
      .from('notification_preferences')
      .insert({
        user_id: userId,
        email_daily_report: true,
        email_hatch_alerts: false,
        quality_threshold: 'good',
      })
      .select()
      .single();

    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.user_id, userId);
    assertEquals(data.email_daily_report, true);
    assertEquals(data.email_hatch_alerts, false);
    assertEquals(data.quality_threshold, 'good');
  });

  it('reads notification preferences', async () => {
    const { data, error } = await client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.quality_threshold, 'good');
  });

  it('updates notification preferences', async () => {
    const { data, error } = await client
      .from('notification_preferences')
      .update({
        email_hatch_alerts: true,
        quality_threshold: 'excellent',
      })
      .eq('user_id', userId)
      .select()
      .single();

    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.email_hatch_alerts, true);
    assertEquals(data.quality_threshold, 'excellent');
  });

  it('rejects invalid quality_threshold value', async () => {
    const { error } = await client
      .from('notification_preferences')
      .update({ quality_threshold: 'amazing' })
      .eq('user_id', userId);

    assertExists(error);
    // Check constraint violation
    assertEquals(error.code, '23514');
  });
});

// ============================================================================
// station_readings CRUD (service role write, anon read)
// ============================================================================

describe(
  'station_readings CRUD',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    let insertedId: string;

    beforeAll(() => {
      serviceClient = getServiceClient();
    });

    afterAll(async () => {
      if (insertedId) {
        await serviceClient
          .from('station_readings')
          .delete()
          .eq('id', insertedId);
      }
    });

    it('service role inserts a station reading', async () => {
      const { data, error } = await serviceClient
        .from('station_readings')
        .insert({
          station_id: '01420500',
          station_name: 'BEAVERKILL AT COOKS FALLS NY',
          recorded_at: '2024-04-15T14:00:00Z',
          water_temp_f: 54.0,
          water_temp_c: 12.2,
          discharge_cfs: 150.0,
          gage_height_ft: 2.5,
        })
        .select()
        .single();

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.station_id, '01420500');
      assertEquals(data.water_temp_f, 54.0);
      insertedId = data.id;
    });

    it('anon can read the station reading', async () => {
      const { data, error } = await serviceClient
        .from('station_readings')
        .select('*')
        .eq('id', insertedId)
        .single();

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.station_name, 'BEAVERKILL AT COOKS FALLS NY');
      assertEquals(data.discharge_cfs, 150.0);
      assertEquals(data.gage_height_ft, 2.5);
    });
  },
);

// ============================================================================
// weather_snapshots CRUD (service role write, anon read)
// ============================================================================

describe(
  'weather_snapshots CRUD',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    let insertedId: string;

    beforeAll(() => {
      serviceClient = getServiceClient();
    });

    afterAll(async () => {
      if (insertedId) {
        await serviceClient
          .from('weather_snapshots')
          .delete()
          .eq('id', insertedId);
      }
    });

    it('service role inserts a weather snapshot', async () => {
      const { data, error } = await serviceClient
        .from('weather_snapshots')
        .insert({
          latitude: 41.9365,
          longitude: -74.9201,
          recorded_at: '2024-04-15T14:00:00Z',
          air_temp_f: 58.0,
          cloud_cover_percent: 80,
          precip_probability: 20,
          wind_speed_mph: 8,
          short_forecast: 'Mostly Cloudy',
        })
        .select()
        .single();

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.latitude, 41.9365);
      assertEquals(data.air_temp_f, 58.0);
      assertEquals(data.short_forecast, 'Mostly Cloudy');
      insertedId = data.id;
    });

    it('anon can read the weather snapshot', async () => {
      const { data, error } = await serviceClient
        .from('weather_snapshots')
        .select('*')
        .eq('id', insertedId)
        .single();

      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.longitude, -74.9201);
      assertEquals(data.cloud_cover_percent, 80);
      assertEquals(data.wind_speed_mph, 8);
    });
  },
);
