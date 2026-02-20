-- ============================================================================
-- Add created_at audit columns to high-volume tables
--
-- created_at captures when a row was ingested, distinct from recorded_at
-- (the USGS/weather timestamp). This enables auditing data ingestion lag.
-- ============================================================================

-- Add ingestion audit timestamp
alter table public.station_readings
  add column if not exists created_at timestamptz not null default now();

alter table public.weather_snapshots
  add column if not exists created_at timestamptz not null default now();
