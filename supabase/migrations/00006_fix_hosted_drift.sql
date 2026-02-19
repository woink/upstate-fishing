-- ============================================================================
-- Fix hosted DB drift: drop pg_uuidv7 dependency + re-apply FORCE RLS
--
-- Migration 00005 depended on pg_uuidv7, which is unavailable on Supabase
-- hosted. The extension creation silently succeeded (IF NOT EXISTS), but the
-- uuid_generate_v7() default never took effect. On hosted, id columns already
-- use gen_random_uuid() from the original schema — this migration makes local
-- environments match.
--
-- Migration 00004 applied FORCE RLS, but the hosted instance shows
-- relforcerowsecurity = false. Re-applying is idempotent and harmless on
-- local where it already took effect.
-- ============================================================================

-- 1. Revert id defaults to gen_random_uuid() (no-op on hosted, fixes local)
alter table public.station_readings
  alter column id set default gen_random_uuid();

alter table public.weather_snapshots
  alter column id set default gen_random_uuid();

-- 2. Drop pg_uuidv7 extension if it was installed locally
drop extension if exists pg_uuidv7;

-- 3. Re-apply FORCE RLS on user-data tables (idempotent)
alter table public.profiles force row level security;
alter table public.saved_streams force row level security;
alter table public.notification_preferences force row level security;
