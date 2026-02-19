/**
 * Feature flag tests
 */

import { assertEquals } from '@std/assert';
import { FEATURES } from '../src/utils/features.ts';

// ============================================================================
// Feature Flags Tests
// ============================================================================

Deno.test('FEATURES.SUPABASE reflects SUPABASE_URL env var', () => {
  // In test environment, SUPABASE_URL is typically not set
  const expected = !!Deno.env.get('SUPABASE_URL');
  assertEquals(FEATURES.SUPABASE, expected);
});

Deno.test('FEATURES.HISTORICAL_DATA reflects SUPABASE_SERVICE_ROLE_KEY env var', () => {
  const expected = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  assertEquals(FEATURES.HISTORICAL_DATA, expected);
});

Deno.test('FEATURES is frozen (readonly)', () => {
  assertEquals(Object.isFrozen(FEATURES), true);
});
