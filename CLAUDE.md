# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A full-stack fishing conditions app for NY/NJ/CT trout streams. Combines real-time USGS water data, Weather.gov forecasts, and insect hatch predictions to recommend where to fish.

## Development Commands

### Backend (Hono API on port 8000)

```bash
deno task dev              # Start with hot reload (requires --unstable-kv)
deno task test             # Run all backend tests
deno task check            # Type-check src/**/*.ts
deno task lint             # Lint
deno task fmt              # Format
deno task fmt --check      # Check formatting without writing
```

### Frontend (Fresh on port 8001)

```bash
deno task dev:frontend     # Start frontend dev server (or cd frontend && deno task dev)
cd frontend && deno task build    # Production build
cd frontend && deno task check    # Type-check frontend
```

### Running a Single Test

```bash
deno test --allow-net --allow-env --allow-read --allow-write --unstable-kv tests/predictions_test.ts
```

Frontend tests:
```bash
cd frontend && deno test --allow-net --allow-env --allow-read tests/routes_test.ts
```

### Environment

Copy `.env.example` to `.env`. Key variables: `PORT`, `CORS_ORIGINS`, `API_URL` (frontend's backend URL), `RUN_INTEGRATION_TESTS`.

## Architecture

### Monorepo with Shared Types

```
src/           -> Backend (Deno + Hono REST API)
frontend/      -> Frontend (Deno Fresh + Preact + Tailwind)
tests/         -> Backend tests
frontend/tests/ -> Frontend tests
```

The `@shared/` import alias maps to `src/` and is used by both backend and frontend to share Zod schemas and TypeScript types from `src/models/types.ts`. This is the single source of truth for all domain types.

### Backend Service Layer

- `services/usgs.ts` -- Fetches real-time water temp, discharge, gage height from USGS Instantaneous Values API (params: `00010`, `00060`, `00065`)
- `services/weather.ts` -- Fetches hourly forecasts from Weather.gov Point API
- `services/cache.ts` -- Deno KV caching with TTL (USGS: 15min, weather: 60min, static: 24hr)
- `services/cached-usgs.ts` / `cached-weather.ts` -- Cached wrappers around the raw services
- `services/predictions.ts` -- Hatch probability scoring: 50% water temp match, 30% month match, 20% weather conditions

### Frontend Islands Architecture

Fresh uses an "islands" pattern -- pages in `routes/` are server-rendered, interactive components in `islands/` hydrate on the client. State management uses Preact Signals (`useSignal`).

Key islands: `StationMap.tsx` (Leaflet map), `StreamList.tsx`, `TopPicks.tsx`, `HatchChart.tsx`, `StreamConditionsCard.tsx`.

The frontend proxies API calls through `routes/api/[...path].ts` which forwards to the backend and adds cache-control headers.

### Data Layer

No database -- uses Deno KV for caching and static TypeScript arrays for stream/hatch data:
- `data/streams.ts` -- 27 streams with USGS station IDs and coordinates, organized by region
- `data/hatches.ts` -- 17 insect species with temperature ranges, peak months, time-of-day preferences

Some USGS stations lack water temperature sensors (e.g., Croton watershed, Shetucket River) -- the prediction service falls back to month-based predictions when water temp is unavailable.

## Conventions

- **Deno runtime** with `--unstable-kv` flag required for caching
- **Strict TypeScript**: `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`
- **Zod schemas** for all domain types with runtime validation
- **Formatting**: 2-space indent, single quotes, 100-char line width (Deno fmt)
- **Testing**: `@std/testing/bdd` (describe/it), `@std/assert` -- tests run against live USGS/Weather APIs unless `RUN_INTEGRATION_TESTS=false`
- **API responses**: Standardized `{ success, data, error, timestamp }` wrapper
- **Fishing quality enum**: `excellent | good | fair | poor` with consistent color coding (green/blue/yellow/red)
- **CI runs**: fmt check -> lint -> type check -> tests (see `.forgejo/workflows/ci.yaml`, needs migration to GitHub Actions)
