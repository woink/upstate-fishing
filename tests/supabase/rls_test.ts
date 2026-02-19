/**
 * Row Level Security (RLS) policy tests.
 * Verifies that users can only access their own data, and public tables
 * are read-only for anonymous users.
 */

import { assertEquals, assertExists } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import {
  createTestUser,
  deleteTestUser,
  getAnonClient,
  getAuthenticatedClient,
  getServiceClient,
} from '../helpers/supabase.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

const RUN = Deno.env.get('RUN_SUPABASE_TESTS') === 'true';

// ============================================================================
// profiles RLS
// ============================================================================

describe('profiles RLS', { ignore: !RUN, sanitizeResources: false, sanitizeOps: false }, () => {
  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };

  beforeAll(async () => {
    userA = await createTestUser(`rls-profiles-a-${crypto.randomUUID()}@test.local`);
    userB = await createTestUser(`rls-profiles-b-${crypto.randomUUID()}@test.local`);
  });

  afterAll(async () => {
    await deleteTestUser(userA.userId);
    await deleteTestUser(userB.userId);
  });

  it('user A can SELECT own profile', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userA.userId)
      .single();
    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.id, userA.userId);
  });

  it('user A cannot SELECT user B profile', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { data } = await client
      .from('profiles')
      .select('*')
      .eq('id', userB.userId);
    assertEquals(data?.length ?? 0, 0);
  });

  it('user A can UPDATE own profile', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { error } = await client
      .from('profiles')
      .update({ display_name: 'User A Updated' })
      .eq('id', userA.userId);
    assertEquals(error, null);
  });

  it('user A cannot UPDATE user B profile', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { data } = await client
      .from('profiles')
      .update({ display_name: 'Hacked' })
      .eq('id', userB.userId)
      .select();
    // RLS silently filters — no rows matched
    assertEquals(data?.length ?? 0, 0);
  });
});

// ============================================================================
// saved_streams RLS
// ============================================================================

describe(
  'saved_streams RLS',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let userA: { userId: string; accessToken: string };
    let userB: { userId: string; accessToken: string };

    beforeAll(async () => {
      userA = await createTestUser(`rls-streams-a-${crypto.randomUUID()}@test.local`);
      userB = await createTestUser(`rls-streams-b-${crypto.randomUUID()}@test.local`);
    });

    afterAll(async () => {
      await deleteTestUser(userA.userId);
      await deleteTestUser(userB.userId);
    });

    it('user A can INSERT own saved_stream', async () => {
      const client = getAuthenticatedClient(userA.accessToken);
      const { error } = await client
        .from('saved_streams')
        .insert({ user_id: userA.userId, stream_id: 'beaverkill' });
      assertEquals(error, null);
    });

    it('user A can SELECT own saved_streams', async () => {
      const client = getAuthenticatedClient(userA.accessToken);
      const { data, error } = await client
        .from('saved_streams')
        .select('*')
        .eq('user_id', userA.userId);
      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.length > 0, true);
    });

    it('user A cannot see user B saved_streams', async () => {
      // First, user B inserts a saved stream
      const clientB = getAuthenticatedClient(userB.accessToken);
      await clientB
        .from('saved_streams')
        .insert({ user_id: userB.userId, stream_id: 'esopus-creek' });

      // User A tries to read user B's saved streams
      const clientA = getAuthenticatedClient(userA.accessToken);
      const { data } = await clientA
        .from('saved_streams')
        .select('*')
        .eq('user_id', userB.userId);
      assertEquals(data?.length ?? 0, 0);
    });

    it('user A cannot INSERT with user B user_id', async () => {
      const client = getAuthenticatedClient(userA.accessToken);
      const { error } = await client
        .from('saved_streams')
        .insert({ user_id: userB.userId, stream_id: 'willowemoc' });
      assertExists(error);
    });

    it('user A can DELETE own saved_stream', async () => {
      const client = getAuthenticatedClient(userA.accessToken);
      const { error } = await client
        .from('saved_streams')
        .delete()
        .eq('user_id', userA.userId)
        .eq('stream_id', 'beaverkill');
      assertEquals(error, null);
    });
  },
);

// ============================================================================
// notification_preferences RLS
// ============================================================================

describe('notification_preferences RLS', {
  ignore: !RUN,
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let userA: { userId: string; accessToken: string };
  let userB: { userId: string; accessToken: string };

  beforeAll(async () => {
    userA = await createTestUser(`rls-notif-a-${crypto.randomUUID()}@test.local`);
    userB = await createTestUser(`rls-notif-b-${crypto.randomUUID()}@test.local`);
  });

  afterAll(async () => {
    await deleteTestUser(userA.userId);
    await deleteTestUser(userB.userId);
  });

  it('user A can INSERT own notification_preferences', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { error } = await client
      .from('notification_preferences')
      .insert({
        user_id: userA.userId,
        email_daily_report: true,
        email_hatch_alerts: false,
        quality_threshold: 'good',
      });
    assertEquals(error, null);
  });

  it('user A can SELECT own notification_preferences', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { data, error } = await client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userA.userId)
      .single();
    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.email_daily_report, true);
  });

  it('user A can UPDATE own notification_preferences', async () => {
    const client = getAuthenticatedClient(userA.accessToken);
    const { error } = await client
      .from('notification_preferences')
      .update({ email_hatch_alerts: true })
      .eq('user_id', userA.userId);
    assertEquals(error, null);
  });

  it('user A cannot access user B notification_preferences', async () => {
    // User B creates preferences
    const clientB = getAuthenticatedClient(userB.accessToken);
    await clientB
      .from('notification_preferences')
      .insert({
        user_id: userB.userId,
        email_daily_report: false,
        email_hatch_alerts: true,
      });

    // User A tries to read
    const clientA = getAuthenticatedClient(userA.accessToken);
    const { data } = await clientA
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userB.userId);
    assertEquals(data?.length ?? 0, 0);
  });
});

// ============================================================================
// station_readings RLS (public read, service role write)
// ============================================================================

describe(
  'station_readings RLS',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    let insertedId: string;

    beforeAll(async () => {
      serviceClient = getServiceClient();
      // Service role inserts a test reading
      const { data, error } = await serviceClient
        .from('station_readings')
        .insert({
          station_id: 'test-rls-001',
          station_name: 'RLS Test Station',
          recorded_at: new Date().toISOString(),
          water_temp_f: 55.0,
          water_temp_c: 12.8,
          discharge_cfs: 200,
          gage_height_ft: 3.0,
        })
        .select('id')
        .single();
      assertEquals(error, null);
      assertExists(data);
      insertedId = data.id;
    });

    afterAll(async () => {
      await serviceClient
        .from('station_readings')
        .delete()
        .eq('id', insertedId);
    });

    it('anon can SELECT station_readings', async () => {
      const anon = getAnonClient();
      const { data, error } = await anon
        .from('station_readings')
        .select('*')
        .eq('id', insertedId);
      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.length, 1);
    });

    it('anon cannot INSERT into station_readings', async () => {
      const anon = getAnonClient();
      const { error } = await anon
        .from('station_readings')
        .insert({
          station_id: 'anon-attempt',
          station_name: 'Should Fail',
          recorded_at: new Date().toISOString(),
          water_temp_f: 50.0,
          water_temp_c: 10.0,
          discharge_cfs: 100,
          gage_height_ft: 2.0,
        });
      assertExists(error);
    });

    it('service role can INSERT into station_readings', async () => {
      const { data, error } = await serviceClient
        .from('station_readings')
        .insert({
          station_id: 'service-role-test',
          station_name: 'Service Role Station',
          recorded_at: new Date().toISOString(),
          water_temp_f: 60.0,
          water_temp_c: 15.6,
          discharge_cfs: 300,
          gage_height_ft: 4.0,
        })
        .select('id')
        .single();
      assertEquals(error, null);
      assertExists(data);

      // Cleanup
      await serviceClient
        .from('station_readings')
        .delete()
        .eq('id', data.id);
    });
  },
);

// ============================================================================
// weather_snapshots RLS (public read, service role write)
// ============================================================================

describe(
  'weather_snapshots RLS',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let serviceClient: SupabaseClient;
    let insertedId: string;

    beforeAll(async () => {
      serviceClient = getServiceClient();
      const { data, error } = await serviceClient
        .from('weather_snapshots')
        .insert({
          latitude: 41.9365,
          longitude: -74.9201,
          recorded_at: new Date().toISOString(),
          air_temp_f: 58.0,
          cloud_cover_percent: 80,
          precip_probability: 20,
          wind_speed_mph: 8,
          short_forecast: 'Mostly Cloudy',
        })
        .select('id')
        .single();
      assertEquals(error, null);
      assertExists(data);
      insertedId = data.id;
    });

    afterAll(async () => {
      await serviceClient
        .from('weather_snapshots')
        .delete()
        .eq('id', insertedId);
    });

    it('anon can SELECT weather_snapshots', async () => {
      const anon = getAnonClient();
      const { data, error } = await anon
        .from('weather_snapshots')
        .select('*')
        .eq('id', insertedId);
      assertEquals(error, null);
      assertExists(data);
      assertEquals(data.length, 1);
    });

    it('anon cannot INSERT into weather_snapshots', async () => {
      const anon = getAnonClient();
      const { error } = await anon
        .from('weather_snapshots')
        .insert({
          latitude: 41.0,
          longitude: -74.0,
          recorded_at: new Date().toISOString(),
          air_temp_f: 50.0,
          cloud_cover_percent: 50,
          precip_probability: 10,
          wind_speed_mph: 5,
          short_forecast: 'Clear',
        });
      assertExists(error);
    });

    it('service role can INSERT into weather_snapshots', async () => {
      const { data, error } = await serviceClient
        .from('weather_snapshots')
        .insert({
          latitude: 42.0,
          longitude: -73.5,
          recorded_at: new Date().toISOString(),
          air_temp_f: 65.0,
          cloud_cover_percent: 30,
          precip_probability: 5,
          wind_speed_mph: 3,
          short_forecast: 'Sunny',
        })
        .select('id')
        .single();
      assertEquals(error, null);
      assertExists(data);

      // Cleanup
      await serviceClient
        .from('weather_snapshots')
        .delete()
        .eq('id', data.id);
    });
  },
);
