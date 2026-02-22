-- ============================================================================
-- Access Points & Stream Metadata Schema
-- Stream entry/exit points with PostGIS, regulations, and metadata.
-- ============================================================================

-- Enable PostGIS if not already (idempotent)
create extension if not exists postgis;

-- Access points for stream entry/exit
create table public.access_points (
  id uuid primary key default gen_random_uuid(),
  stream_id text not null, -- references id field in data/streams.ts (no FK; streams live in code)
  name text not null,
  type text not null check (type in ('parking', 'bridge', 'trail', 'put-in', 'take-out')),
  location geography(Point, 4326) not null,
  description text,
  parking_available boolean not null default false,
  handicap_accessible boolean not null default false,
  public_land boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stream regulations
create table public.stream_regulations (
  id uuid primary key default gen_random_uuid(),
  stream_id text not null, -- references id field in data/streams.ts (no FK; streams live in code)
  regulation_type text not null check (regulation_type in (
    'catch_and_release', 'trophy', 'general', 'delayed_harvest', 'special'
  )),
  season_start date,
  season_end date,
  special_rules text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Stream metadata (one row per stream)
create table public.stream_metadata (
  id uuid primary key default gen_random_uuid(),
  stream_id text not null unique, -- references id field in data/streams.ts (no FK; streams live in code)
  difficulty_rating text check (difficulty_rating in ('easy', 'moderate', 'difficult', 'expert')),
  wading_safety text check (wading_safety in ('safe', 'moderate', 'caution', 'dangerous')),
  best_seasons text[] default '{}',
  fish_species jsonb default '[]',
  stocking_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Spatial index
create index idx_access_points_location on public.access_points using gist (location);
create index idx_access_points_stream_id on public.access_points(stream_id);
create index idx_stream_regulations_stream_id on public.stream_regulations(stream_id);
create index idx_stream_metadata_stream_id on public.stream_metadata(stream_id);

-- RLS
alter table public.access_points enable row level security;
alter table public.stream_regulations enable row level security;
alter table public.stream_metadata enable row level security;

create policy "Public read" on public.access_points for select using (true);
create policy "Service write" on public.access_points for all
  using (auth.role() = 'service_role');

create policy "Public read" on public.stream_regulations for select using (true);
create policy "Service write" on public.stream_regulations for all
  using (auth.role() = 'service_role');

create policy "Public read" on public.stream_metadata for select using (true);
create policy "Service write" on public.stream_metadata for all
  using (auth.role() = 'service_role');

-- Triggers (reuses update_updated_at() from 00001_create_initial_schema.sql)
create trigger access_points_updated_at before update on public.access_points
  for each row execute function public.update_updated_at();
create trigger stream_regulations_updated_at before update on public.stream_regulations
  for each row execute function public.update_updated_at();
create trigger stream_metadata_updated_at before update on public.stream_metadata
  for each row execute function public.update_updated_at();
