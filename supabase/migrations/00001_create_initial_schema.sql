-- ============================================================================
-- Phase 1: Foundation Schema
-- Enables PostGIS, creates all tables, indexes, RLS policies, and triggers.
-- ============================================================================

-- Extensions
create extension if not exists postgis with schema extensions;

-- ============================================================================
-- profiles — extends auth.users with app-specific fields
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  home_location geography(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_home_location_idx on public.profiles using gist (home_location);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- ============================================================================
-- saved_streams — user's favorite streams
-- ============================================================================

create table public.saved_streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stream_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, stream_id)
);

create index saved_streams_user_id_idx on public.saved_streams (user_id);

alter table public.saved_streams enable row level security;

create policy "Users can view their own saved streams"
  on public.saved_streams for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own saved streams"
  on public.saved_streams for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved streams"
  on public.saved_streams for delete
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- notification_preferences — per-user alert settings
-- ============================================================================

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  email_daily_report boolean not null default false,
  email_hatch_alerts boolean not null default false,
  quality_threshold text not null default 'good'
    check (quality_threshold in ('poor', 'fair', 'good', 'excellent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_preferences_user_id_idx
  on public.notification_preferences (user_id);

alter table public.notification_preferences enable row level security;

create policy "Users can view their own notification preferences"
  on public.notification_preferences for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own notification preferences"
  on public.notification_preferences for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notification preferences"
  on public.notification_preferences for update
  using ((select auth.uid()) = user_id);

-- ============================================================================
-- station_readings — historical USGS snapshots (public read, service role write)
-- ============================================================================

create table public.station_readings (
  id uuid primary key default gen_random_uuid(),
  station_id text not null,
  station_name text not null,
  recorded_at timestamptz not null,
  water_temp_f double precision,
  water_temp_c double precision,
  discharge_cfs double precision,
  gage_height_ft double precision
);

create unique index station_readings_station_recorded_idx
  on public.station_readings (station_id, recorded_at desc);

alter table public.station_readings enable row level security;

create policy "Anyone can read station readings"
  on public.station_readings for select
  using (true);

-- Service role bypasses RLS, so no insert/update policy needed for it.

-- ============================================================================
-- weather_snapshots — historical weather data (public read, service role write)
-- ============================================================================

create table public.weather_snapshots (
  id uuid primary key default gen_random_uuid(),
  latitude double precision not null,
  longitude double precision not null,
  recorded_at timestamptz not null,
  air_temp_f double precision not null,
  cloud_cover_percent double precision not null,
  precip_probability double precision not null,
  wind_speed_mph double precision not null,
  short_forecast text not null
);

create index weather_snapshots_location_recorded_idx
  on public.weather_snapshots (latitude, longitude, recorded_at desc);

alter table public.weather_snapshots enable row level security;

create policy "Anyone can read weather snapshots"
  on public.weather_snapshots for select
  using (true);

-- ============================================================================
-- Auto-create profile on auth.users insert
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Auto-update updated_at on mutable tables
-- ============================================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.update_updated_at();
