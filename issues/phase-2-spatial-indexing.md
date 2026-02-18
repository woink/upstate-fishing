---
title: "perf: add PostGIS GiST index for weather_snapshots spatial queries"
labels: [enhancement, phase-2, performance]
origin: "PR #119 review (Non-Blocking Phase 2 Item)"
---

## Context

From PR #119 review ([Non-Blocking Phase 2 Item](https://github.com/woink/upstate-fishing/pull/119)).

The `weather_snapshots` table currently uses a btree index on `(latitude, longitude, recorded_at desc)`:

```sql
create index weather_snapshots_location_recorded_idx
  on public.weather_snapshots (latitude, longitude, recorded_at desc);
```

## Problem

Btree indexes are suboptimal for spatial range/proximity queries (e.g., "find all snapshots within
50 miles of a point"). When Phase 2 adds nearby streams or location-based weather queries, this
index will not support efficient spatial lookups.

## Proposed Solution

Add a new migration that:
1. Adds a `geography(Point, 4326)` column (or a generated column from latitude/longitude)
2. Creates a GiST index on the geography column
3. Optionally drops the btree index if it becomes redundant

The `profiles` table already uses this pattern with `geography(Point, 4326)` and a GiST index.

## Reference

- `supabase/migrations/00001_create_initial_schema.sql` lines 126-136
- `profiles` table spatial column pattern (lines 17, 22)
