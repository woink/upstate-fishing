-- ============================================================================
-- Re-apply FORCE RLS on user-data tables
--
-- Migration 00004 applied FORCE RLS, but the hosted instance shows
-- relforcerowsecurity = false (likely due to a schema reset or migration
-- replay issue). Re-applying is idempotent and harmless on environments
-- where it already took effect.
-- ============================================================================

alter table public.profiles force row level security;
alter table public.saved_streams force row level security;
alter table public.notification_preferences force row level security;
