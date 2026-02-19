-- ============================================================================
-- UUIDv7 defaults for high-volume tables + created_at audit columns
--
-- station_readings and weather_snapshots grow with every USGS/weather
-- snapshot (every 15 min × 27+ stations). UUIDv4 (random) scatters across
-- the B-tree index, causing page splits and fragmentation at scale.
-- UUIDv7 encodes a millisecond timestamp prefix, so new IDs are always
-- appended to the end of the index — much better insert performance.
--
-- created_at captures when a row was ingested, distinct from recorded_at
-- (the USGS/weather timestamp). This enables auditing data ingestion lag.
-- ============================================================================

-- Enable UUIDv7 extension
create extension if not exists pg_uuidv7 with schema extensions;

-- Switch high-volume table PK defaults to UUIDv7
alter table public.station_readings
  alter column id set default uuid_generate_v7();

alter table public.weather_snapshots
  alter column id set default uuid_generate_v7();

-- Add ingestion audit timestamp
alter table public.station_readings
  add column created_at timestamptz not null default now();

alter table public.weather_snapshots
  add column created_at timestamptz not null default now();
