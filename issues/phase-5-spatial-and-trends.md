---
title: "Phase 5: Spatial Queries & Historical Trends"
labels: [area:backend, area:frontend, enhancement, phase-5]
parent: "#73"
depends_on: "Phase 2 (Historical Data), Phase 4 (User Features)"
related: "#9"
---

## Context

Phase 5 of the Supabase integration (#73). This phase brings together historical data (Phase 2)
and user features (Phase 4) to deliver the high-value features: nearby stream discovery via PostGIS
spatial queries and historical trend analysis.

## Goal

Users can discover streams near their home location and view historical trends for any stream —
water temperature over time, discharge patterns, seasonal comparisons, and "this day in history."

## Scope

### 1. Nearby Streams (PostGIS Spatial Queries)

#### Prerequisites

- Add PostGIS GiST index for `weather_snapshots` (see `issues/phase-2-spatial-indexing.md`)
- User has set `home_location` in their profile (Phase 4)

#### API Route

```
GET /api/user/nearby?radius=25&unit=miles
```

- Use PostGIS `ST_DWithin()` to find streams within radius of user's home location
- Sort by distance ascending
- Return `NearbyStream[]` with `distanceMiles`
- Default radius: 25 miles

#### Database Function (new migration)

```sql
create or replace function public.nearby_streams(
  user_lat double precision,
  user_lon double precision,
  radius_miles double precision default 25
)
returns table (
  stream_id text,
  name text,
  region text,
  state text,
  latitude double precision,
  longitude double precision,
  distance_miles double precision
)
language sql stable
as $$
  select
    s.stream_id, s.name, s.region, s.state, s.latitude, s.longitude,
    ST_Distance(
      ST_MakePoint(s.longitude, s.latitude)::geography,
      ST_MakePoint(user_lon, user_lat)::geography
    ) / 1609.34 as distance_miles
  from public.stream_locations s
  where ST_DWithin(
    ST_MakePoint(s.longitude, s.latitude)::geography,
    ST_MakePoint(user_lon, user_lat)::geography,
    radius_miles * 1609.34
  )
  order by distance_miles;
$$;
```

**Note:** This requires a `stream_locations` view or table derived from the static `STREAMS` data.
Options: (a) create a new migration that seeds a `stream_locations` table from the TypeScript data,
or (b) compute distances client-side from the static `STREAMS` array using Haversine formula
(simpler, no new table needed). Decide during implementation.

#### UI

- "Nearby Streams" section on homepage (when user has home location set)
- Cards showing stream name, distance, current quality badge
- Link to full stream detail page

### 2. Historical Trends (Issue #9)

#### API Routes

```
GET /api/streams/[id]/history?days=30           — Raw readings over time
GET /api/streams/[id]/stats?days=30             — Aggregated stats (min/max/avg/trend)
GET /api/streams/[id]/compare?date=2025-04-15   — "This day in history" comparison
```

#### History Endpoint

- Query `station_readings` for the stream's station(s) over the requested period
- Return time-series data: `{ timestamp, waterTempF, dischargeCfs, gageHeightFt }[]`
- Support `days` parameter: 7, 30, 90, 365
- Paginate if needed for large datasets

#### Stats Endpoint

- Aggregate readings: min, max, average, trend direction
- Return `StationStats` (Zod schema already defined in Phase 1)
- Trend: compare recent 24h avg against 7d avg → rising/falling/stable

#### Compare Endpoint ("This Day in History")

- Fetch readings for the same calendar date in previous years
- Return current vs historical comparison:
  ```json
  {
    "current": { "waterTempF": 52, "dischargeCfs": 180 },
    "historical": [
      { "year": 2025, "waterTempF": 48, "dischargeCfs": 210 },
      { "year": 2024, "waterTempF": 55, "dischargeCfs": 165 }
    ]
  }
  ```

#### Trend Visualization Island (`frontend/islands/TrendChart.tsx`)

- Line chart showing water temp and/or discharge over time
- Time range selector: 7d / 30d / 90d / 1yr
- Overlay historical comparison when available
- Use a lightweight chart library (Chart.js via CDN, or canvas-based)

#### Integration into Stream Detail Page

- Add "Trends" tab/section to `/streams/[id]` page
- Show `TrendChart` island below `StreamConditionsCard`
- "This day in history" card with year-over-year comparison

## Zod Schemas (already defined in Phase 1)

- `NearbyStreamSchema` — nearby stream results with distance
- `TrendDirectionSchema` — rising/falling/stable/unknown
- `StationStatsSchema` — aggregated station statistics

## Test Plan

- Unit tests for nearby streams function (mock PostGIS responses)
- Unit tests for history/stats/compare API routes
- Unit tests for trend direction calculation
- E2E: set home location → verify nearby streams appear
- E2E: navigate to stream detail → verify trend chart renders
- E2E: verify "this day in history" comparison display
- Integration tests against Supabase with seeded historical data (gated)

## Acceptance Criteria

- [ ] Nearby streams API returns streams sorted by distance from user's home location
- [ ] Nearby streams section appears on homepage for users with home location
- [ ] History endpoint returns time-series readings for configurable periods
- [ ] Stats endpoint returns aggregated min/max/avg with trend direction
- [ ] Compare endpoint returns year-over-year data for a given date
- [ ] Trend chart renders interactive line chart with time range selector
- [ ] "This day in history" card shows on stream detail pages (when data available)
- [ ] All queries use appropriate indexes (GiST for spatial, btree for time-series)
- [ ] Feature-flagged: trends gracefully degrade when no historical data available
- [ ] All new code has unit + E2E tests
