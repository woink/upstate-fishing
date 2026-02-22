-- ============================================================================
-- Fly Shops Schema
-- Persistent fly shop directory with PostGIS location and report source link.
-- ============================================================================

create table public.fly_shops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  region text not null,
  state text not null,
  address text not null,
  location geography(Point, 4326) not null,
  phone text not null,
  website text,
  description text not null,
  hours jsonb,
  services text[] default '{}',
  brands_carried text[] default '{}',
  guide_service boolean not null default false,
  online_store_url text,
  report_source_id uuid references public.report_sources(id) on delete set null,
  rating numeric check (rating >= 0 and rating <= 5),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_fly_shops_location on public.fly_shops using gist (location);
create index idx_fly_shops_region on public.fly_shops(region);
create index idx_fly_shops_state on public.fly_shops(state);
create index idx_fly_shops_report_source on public.fly_shops(report_source_id);

-- RLS
alter table public.fly_shops enable row level security;

create policy "Public read" on public.fly_shops for select using (true);
create policy "Service write" on public.fly_shops for all
  using (auth.role() = 'service_role');

-- Trigger (reuses update_updated_at() from 00001_create_initial_schema.sql)
create trigger fly_shops_updated_at before update on public.fly_shops
  for each row execute function public.update_updated_at();
