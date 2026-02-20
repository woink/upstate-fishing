-- ============================================================================
-- Add unique constraint on weather_snapshots to prevent duplicate ingestion
--
-- station_readings already has a unique index on (station_id, recorded_at)
-- from 00001. Weather snapshots need the same protection, keyed on location
-- and timestamp.
-- ============================================================================

create unique index if not exists weather_snapshots_location_recorded_unique_idx
  on public.weather_snapshots (latitude, longitude, recorded_at);
