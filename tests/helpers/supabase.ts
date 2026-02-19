/**
 * Shared utilities for Supabase integration tests.
 * Provides service/anon/authenticated clients and test user lifecycle helpers.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnvOrThrow(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    getEnvOrThrow('SUPABASE_URL'),
    getEnvOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function getAnonClient(): SupabaseClient {
  return createClient(
    getEnvOrThrow('SUPABASE_URL'),
    getEnvOrThrow('SUPABASE_ANON_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function createTestUser(
  email: string,
  metadata?: Record<string, unknown>,
): Promise<{ userId: string; accessToken: string }> {
  const admin = getServiceClient();
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password: 'test-password-123!',
    email_confirm: true,
    user_metadata: metadata,
  });
  if (createError) throw createError;

  const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({
    email,
    password: 'test-password-123!',
  });
  if (signInError) throw signInError;

  return {
    userId: createData.user.id,
    accessToken: signInData.session!.access_token,
  };
}

export function getAuthenticatedClient(accessToken: string): SupabaseClient {
  return createClient(
    getEnvOrThrow('SUPABASE_URL'),
    getEnvOrThrow('SUPABASE_ANON_KEY'),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
}

export async function deleteTestUser(userId: string): Promise<void> {
  const admin = getServiceClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function isSupabaseRunning(): Promise<boolean> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    if (!url) return false;
    const resp = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
    });
    return resp.ok;
  } catch {
    return false;
  }
}
