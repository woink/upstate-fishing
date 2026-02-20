-- ============================================================================
-- Force RLS on user-data tables
--
-- ENABLE ROW LEVEL SECURITY only enforces policies for non-owner roles.
-- FORCE ROW LEVEL SECURITY ensures that even the table owner (postgres)
-- must satisfy RLS policies. This prevents accidental data exposure if
-- a code path uses a superuser connection.
--
-- Note: FORCE RLS does NOT restrict roles with the BYPASSRLS privilege.
-- Supabase's service_role holds BYPASSRLS by default, so it can still
-- read/write these tables without RLS applying — this is intentional
-- for admin operations. The protection here is narrowly against
-- accidental raw postgres/owner connections.
--
-- We intentionally skip station_readings and weather_snapshots — those
-- tables are written by the service role, and forced RLS would require
-- additional policies to allow service-role inserts.
-- ============================================================================

alter table public.profiles force row level security;
alter table public.saved_streams force row level security;
alter table public.notification_preferences force row level security;
