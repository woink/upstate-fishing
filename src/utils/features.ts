/**
 * Feature flags derived from environment variables.
 * Enables graceful degradation — the app works without Supabase configured.
 */

export const FEATURES = Object.freeze({
  /** True if SUPABASE_URL is set (client can connect to Supabase). */
  SUPABASE: !!Deno.env.get('SUPABASE_URL'),
  /** True if SUPABASE_SERVICE_ROLE_KEY is set (can write historical data). */
  HISTORICAL_DATA: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
});
