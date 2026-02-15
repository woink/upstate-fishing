# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## What This Is

A full-stack fishing conditions app for NY/NJ/CT trout streams. Combines real-time USGS water data,
Weather.gov forecasts, and insect hatch predictions to recommend where to fish.

## Development Commands

### Development

```bash
deno task dev              # Start Fresh dev server with hot reload
deno task test             # Run all tests (backend + frontend, requires --unstable-kv)
deno task check            # Type-check src/**/*.ts
deno task lint             # Lint
deno task fmt              # Format
deno task fmt --check      # Check formatting without writing
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

### E2E Tests (Playwright)

```bash
deno task e2e              # Run Playwright E2E tests (requires Fresh dev server)
cd frontend && npm run e2e # Same, from frontend directory
cd frontend && npm run e2e:headed  # Run with visible browser
```

Tests live in `frontend/e2e/` and use Node-based Playwright (`@playwright/test`). The Playwright
config (`frontend/playwright.config.ts`) auto-starts the Fresh dev server via `webServer`. Chromium
must be installed first: `cd frontend && npx playwright install --with-deps chromium`.

### Environment

Copy `.env.example` to `.env`. Key variable: `RUN_INTEGRATION_TESTS`.

## Architecture

### Monorepo with Shared Types

```
src/           -> Shared library (types, services, data)
frontend/      -> Fresh app (Deno Fresh + Preact + Tailwind)
tests/         -> Shared library tests
frontend/tests/ -> Frontend unit/integration tests (Deno)
frontend/e2e/  -> End-to-end browser tests (Playwright/Node)
```

The `@shared/` import alias maps to `src/` and is used by both backend and frontend to share Zod
schemas and TypeScript types from `src/models/types.ts`. This is the single source of truth for all
domain types.

### Backend Service Layer

- `services/usgs.ts` -- Fetches real-time water temp, discharge, gage height from USGS Instantaneous
  Values API (params: `00010`, `00060`, `00065`)
- `services/weather.ts` -- Fetches hourly forecasts from Weather.gov Point API
- `services/cache.ts` -- Deno KV caching with TTL (USGS: 15min, weather: 60min, static: 24hr)
- `services/cached-usgs.ts` / `cached-weather.ts` -- Cached wrappers around the raw services
- `services/predictions.ts` -- Hatch probability scoring: 50% water temp match, 30% month match, 20%
  weather conditions

### Frontend Islands Architecture

Fresh uses an "islands" pattern -- pages in `routes/` are server-rendered, interactive components in
`islands/` hydrate on the client. State management uses Preact Signals (`useSignal`).

Key islands: `StationMap.tsx` (Leaflet map), `StreamList.tsx`, `TopPicks.tsx`, `HatchChart.tsx`,
`StreamConditionsCard.tsx`.

Fresh API routes in `frontend/routes/api/` serve all endpoints directly (streams, hatches, stations,
predictions) using the shared services from `src/`.

### Data Layer

No database -- uses Deno KV for caching and static TypeScript arrays for stream/hatch data:

- `data/streams.ts` -- 27 streams with USGS station IDs and coordinates, organized by region
- `data/hatches.ts` -- 17 insect species with temperature ranges, peak months, time-of-day
  preferences

Some USGS stations lack water temperature sensors (e.g., Croton watershed, Shetucket River) -- the
prediction service falls back to month-based predictions when water temp is unavailable.

## Conventions

- **Deno runtime** with `--unstable-kv` flag required for caching
- **Strict TypeScript**: `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`,
  `noUnusedParameters`
- **Zod schemas** for all domain types with runtime validation
- **Formatting**: 2-space indent, single quotes, 100-char line width (Deno fmt)
- **Testing**: `@std/testing/bdd` (describe/it), `@std/assert` -- tests run against live
  USGS/Weather APIs unless `RUN_INTEGRATION_TESTS=false`
- **API responses**: Standardized `{ success, data, error, timestamp }` wrapper
- **Fishing quality enum**: `excellent | good | fair | poor` with consistent color coding
  (green/blue/yellow/red)
- **CI**: GitHub Actions on push to `main` and PRs (see below)

## CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on every push to `main` and on pull requests.
Steps run sequentially and fail fast:

1. **Format check** -- `deno fmt --check`
2. **Lint** -- `deno lint`
3. **Type check (shared)** -- `deno check src/**/*.ts` (root `deno.json`)
4. **Type check (frontend)** -- `cd frontend && deno check --unstable-kv **/*.ts **/*.tsx` (frontend
   `deno.json`)
5. **Test (backend)** -- `deno test ... tests/` (root `deno.json`)
6. **Test (frontend)** -- `cd frontend && deno test ... tests/` (frontend `deno.json`)
7. **E2E tests (Playwright)** -- Installs Chromium, starts Fresh dev server, runs browser tests

Backend and frontend tests **must** run separately because they use different `deno.json` configs.
The frontend config has `$fresh/`, Preact, and Leaflet import mappings that don't exist in the root
config. Running `deno test` from the root without specifying `tests/` would discover frontend tests
and fail on unresolved `$fresh/` imports

E2E tests use Node/Playwright (not Deno) and are excluded from `deno check`, `deno fmt`, and
`deno lint` via the `exclude` fields in both `deno.json` configs.
