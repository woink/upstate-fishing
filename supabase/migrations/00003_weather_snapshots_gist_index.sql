-- ============================================================================
-- Add PostGIS geography column and GiST index to weather_snapshots
--
-- The existing btree index on (latitude, longitude, recorded_at desc) serves
-- exact-coordinate time-ordered queries. This migration adds a generated
-- geography(Point, 4326) column with a GiST index for spatial proximity
-- queries (e.g., ST_DWithin for "find snapshots within N meters").
--
-- The geography column is GENERATED ALWAYS from the existing latitude and
-- longitude columns, so no data backfill or application changes are needed.
-- ============================================================================

alter table public.weather_snapshots
  add column location geography(Point, 4326)
  generated always as (
    extensions.ST_SetSRID(
      extensions.ST_MakePoint(longitude, latitude),
      4326
    )::geography
  ) stored;

create index weather_snapshots_location_idx
  on public.weather_snapshots using gist (location);
