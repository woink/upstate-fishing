/**
 * Supabase migration integration tests.
 * Verifies triggers, cascade deletes, and unique constraints from the schema.
 */

import { assertEquals, assertExists, assertNotEquals } from '@std/assert';
import { afterAll, beforeAll, describe, it } from '@std/testing/bdd';
import {
  createTestUser,
  deleteTestUser,
  getAuthenticatedClient,
  getServiceClient,
} from '../helpers/supabase.ts';
import type { SupabaseClient } from '@supabase/supabase-js';

const RUN = Deno.env.get('RUN_SUPABASE_TESTS') === 'true';

describe('handle_new_user() trigger', {
  ignore: !RUN,
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let serviceClient: SupabaseClient;
  let userId: string;

  beforeAll(() => {
    serviceClient = getServiceClient();
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  it('creates a profile with null display_name and avatar_url for email signup', async () => {
    const email = `test-email-${crypto.randomUUID()}@test.local`;
    const result = await createTestUser(email);
    userId = result.userId;

    const { data, error } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.id, userId);
    assertEquals(data.display_name, null);
    assertEquals(data.avatar_url, null);
  });
});

describe('handle_new_user() trigger with OAuth metadata', {
  ignore: !RUN,
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let serviceClient: SupabaseClient;
  let userId: string;

  beforeAll(() => {
    serviceClient = getServiceClient();
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  it('populates display_name and avatar_url from user metadata', async () => {
    const email = `test-oauth-${crypto.randomUUID()}@test.local`;
    const result = await createTestUser(email, {
      full_name: 'Test Angler',
      picture: 'https://example.com/avatar.jpg',
    });
    userId = result.userId;

    const { data, error } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    assertEquals(error, null);
    assertExists(data);
    assertEquals(data.display_name, 'Test Angler');
    assertEquals(data.avatar_url, 'https://example.com/avatar.jpg');
  });
});

describe('update_updated_at() trigger', {
  ignore: !RUN,
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const email = `test-updated-at-${crypto.randomUUID()}@test.local`;
    const result = await createTestUser(email);
    userId = result.userId;
    accessToken = result.accessToken;
  });

  afterAll(async () => {
    if (userId) await deleteTestUser(userId);
  });

  it('updates updated_at when profile is modified', async () => {
    const client = getAuthenticatedClient(accessToken);

    const { data: before } = await client
      .from('profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();
    assertExists(before);

    // Small delay to ensure timestamp changes
    await new Promise((resolve) => setTimeout(resolve, 50));

    await client
      .from('profiles')
      .update({ display_name: 'Updated Name' })
      .eq('id', userId);

    const { data: after } = await client
      .from('profiles')
      .select('updated_at')
      .eq('id', userId)
      .single();
    assertExists(after);

    assertNotEquals(before.updated_at, after.updated_at);
  });
});

describe('cascade deletes', { ignore: !RUN, sanitizeResources: false, sanitizeOps: false }, () => {
  it('deleting a user removes saved_streams and notification_preferences', async () => {
    const email = `test-cascade-${crypto.randomUUID()}@test.local`;
    const { userId, accessToken } = await createTestUser(email);
    const client = getAuthenticatedClient(accessToken);

    // Insert saved_stream
    const { error: streamErr } = await client
      .from('saved_streams')
      .insert({ user_id: userId, stream_id: 'beaverkill' });
    assertEquals(streamErr, null);

    // Insert notification_preferences
    const { error: prefErr } = await client
      .from('notification_preferences')
      .insert({ user_id: userId, email_daily_report: true, email_hatch_alerts: false });
    assertEquals(prefErr, null);

    // Delete user (cascades)
    await deleteTestUser(userId);

    // Verify cascade with service client (bypasses RLS)
    const serviceClient = getServiceClient();

    const { data: streams } = await serviceClient
      .from('saved_streams')
      .select('id')
      .eq('user_id', userId);
    assertEquals(streams?.length ?? 0, 0);

    const { data: prefs } = await serviceClient
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId);
    assertEquals(prefs?.length ?? 0, 0);
  });
});

describe(
  'unique constraints',
  { ignore: !RUN, sanitizeResources: false, sanitizeOps: false },
  () => {
    let userId: string;
    let accessToken: string;

    beforeAll(async () => {
      const email = `test-unique-${crypto.randomUUID()}@test.local`;
      const result = await createTestUser(email);
      userId = result.userId;
      accessToken = result.accessToken;
    });

    afterAll(async () => {
      if (userId) await deleteTestUser(userId);
    });

    it('rejects duplicate (user_id, stream_id) in saved_streams', async () => {
      const client = getAuthenticatedClient(accessToken);

      const { error: first } = await client
        .from('saved_streams')
        .insert({ user_id: userId, stream_id: 'esopus-creek' });
      assertEquals(first, null);

      const { error: duplicate } = await client
        .from('saved_streams')
        .insert({ user_id: userId, stream_id: 'esopus-creek' });
      assertExists(duplicate);
      assertEquals(duplicate.code, '23505'); // unique_violation
    });

    it('rejects duplicate user_id in notification_preferences', async () => {
      const client = getAuthenticatedClient(accessToken);

      const { error: first } = await client
        .from('notification_preferences')
        .insert({ user_id: userId, email_daily_report: false, email_hatch_alerts: false });
      assertEquals(first, null);

      const { error: duplicate } = await client
        .from('notification_preferences')
        .insert({ user_id: userId, email_daily_report: true, email_hatch_alerts: true });
      assertExists(duplicate);
      assertEquals(duplicate.code, '23505'); // unique_violation
    });
  },
);
