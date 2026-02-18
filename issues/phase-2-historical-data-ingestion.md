---
title: "Phase 2: Historical Data Ingestion — USGS readings & weather snapshots"
labels: [area:backend, area:data, enhancement, phase-2]
parent: "#73"
depends_on: "PR #119 (Phase 1)"
related: "#9"
---

## Context

Phase 2 of the Supabase integration (#73). With the foundation schema and client services in place
(PR #119), this phase populates the `station_readings` and `weather_snapshots` tables with
historical and ongoing data from USGS and Weather.gov APIs.

## Goal

Build a service-role ingestion pipeline that periodically snapshots current USGS station readings and
weather conditions into Supabase, creating the historical dataset needed for trends (issue #9) and
stats.

## Scope

### 1. Ingestion Service (`src/services/ingestion.ts`)

Create a new service that uses the existing `USGSService` and `WeatherService` to fetch current
data, then writes it to Supabase via the service-role client:

```typescript
export class IngestionService {
  /** Snapshot current readings for all 27 streams' stations into station_readings. */
  async ingestStationReadings(): Promise<IngestionResult>

  /** Snapshot current weather for all stream coordinates into weather_snapshots. */
  async ingestWeatherSnapshots(): Promise<IngestionResult>
}
```

- Use `FEATURES.HISTORICAL_DATA` gate (requires `SUPABASE_SERVICE_ROLE_KEY`)
- Handle the unique constraint on `(station_id, recorded_at)` — use `ON CONFLICT DO NOTHING` or
  upsert semantics
- Rate-limit USGS/Weather.gov API calls (reuse existing `promisePool` pattern)
- Return structured result: `{ inserted, skipped, errors, duration }`

### 2. Ingestion API Route (`frontend/routes/api/ingest.ts`)

Protected POST endpoint that triggers ingestion:

```
POST /api/ingest?type=readings|weather|all
Authorization: Bearer <service-role-key>
```

- Validate bearer token matches `SUPABASE_SERVICE_ROLE_KEY`
- Return `IngestionResult` with counts
- This enables cron-based ingestion via external scheduler (GitHub Actions, Deno Deploy cron)

### 3. Scheduled Ingestion (GitHub Actions or Deno Deploy Cron)

Add a scheduled job that calls the ingestion endpoint:

- Station readings: every 15 minutes (matches USGS update frequency)
- Weather snapshots: every 60 minutes (matches Weather.gov update frequency)
- Configurable via environment variables

### 4. Backfill Script (`scripts/backfill.ts`)

One-time script to backfill historical USGS data:

- Use USGS Daily Values API (`/dv/`) for historical daily stats
- Populate `station_readings` with daily averages going back 1 year
- Progress logging, resumable (tracks last backfilled date per station)

## Zod Schemas (already defined in Phase 1)

- `StationReadingSchema` — validates ingested readings
- `WeatherSnapshotSchema` — validates ingested weather data

## Test Plan

- Unit tests for `IngestionService` with mocked Supabase client
- Unit tests for ingestion API route auth validation
- Integration test for backfill script (optional, gated by `RUN_INTEGRATION_TESTS`)
- Verify unique constraint handles duplicates gracefully (no errors on re-ingestion)

## Acceptance Criteria

- [ ] `IngestionService` writes station readings and weather snapshots to Supabase
- [ ] Ingestion API route protected by service-role key
- [ ] Duplicate readings handled via upsert/conflict resolution
- [ ] Scheduled job runs on configured interval
- [ ] Backfill script populates 1 year of daily USGS data
- [ ] Feature-flagged: app works normally without `SUPABASE_SERVICE_ROLE_KEY`
- [ ] All new code has unit tests
