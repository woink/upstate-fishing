/**
 * Supabase client service tests
 */

import { assert, assertEquals, assertThrows } from '@std/assert';
import { SupabaseClientService, supabaseService } from '../src/services/supabase.ts';

// ============================================================================
// SupabaseClientService Tests
// ============================================================================

Deno.test('SupabaseClientService - isAvailable() returns false when env vars absent', () => {
  const service = new SupabaseClientService({ url: undefined, anonKey: undefined });
  assertEquals(service.isAvailable(), false);
});

Deno.test('SupabaseClientService - isAvailable() returns false when only url set', () => {
  const service = new SupabaseClientService({ url: 'http://localhost:54321', anonKey: undefined });
  assertEquals(service.isAvailable(), false);
});

Deno.test('SupabaseClientService - isAvailable() returns false when only key set', () => {
  const service = new SupabaseClientService({ url: undefined, anonKey: 'test-key' });
  assertEquals(service.isAvailable(), false);
});

Deno.test('SupabaseClientService - isAvailable() returns true when both set', () => {
  const service = new SupabaseClientService({
    url: 'http://localhost:54321',
    anonKey: 'test-key',
  });
  assertEquals(service.isAvailable(), true);
});

Deno.test('SupabaseClientService - getClient() throws when not configured', () => {
  const service = new SupabaseClientService({ url: undefined, anonKey: undefined });
  assertThrows(
    () => service.getClient(),
    Error,
    'Supabase is not configured',
  );
});

// Supabase client starts an internal realtime heartbeat interval,
// so we disable resource/op sanitizers for tests that instantiate a client.
Deno.test({
  name: 'SupabaseClientService - getClient() returns client when configured',
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    const service = new SupabaseClientService({
      url: 'http://localhost:54321',
      anonKey: 'test-anon-key',
    });
    const client = service.getClient();
    assert(client !== null);
    assert(typeof client.from === 'function');
  },
});

Deno.test({
  name: 'SupabaseClientService - getClient() returns same instance on repeated calls',
  sanitizeResources: false,
  sanitizeOps: false,
  fn() {
    const service = new SupabaseClientService({
      url: 'http://localhost:54321',
      anonKey: 'test-anon-key',
    });
    const client1 = service.getClient();
    const client2 = service.getClient();
    assert(client1 === client2);
  },
});

Deno.test('SupabaseClientService - singleton export exists', () => {
  assert(supabaseService instanceof SupabaseClientService);
});
