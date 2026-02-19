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
deno task build            # Production build
deno task test             # Run all tests (backend + frontend, requires --unstable-kv)
deno task check            # Type-check all TS/TSX
deno task lint             # Lint
deno task fmt              # Format
deno task fmt --check      # Check formatting without writing
deno task e2e              # Run E2E browser tests (Astral + Chromium)
```

### Running a Single Test

```bash
deno test --allow-net --allow-env --allow-read --allow-write --unstable-kv tests/predictions_test.ts
```

Frontend tests:

```bash
deno test --allow-net --allow-env --allow-read --allow-write --unstable-kv tests/frontend/routes_test.ts
```

### E2E Tests (Astral)

```bash
deno task e2e              # Run all E2E tests
deno test --allow-all --unstable-kv e2e/homepage_test.ts  # Run a single E2E test
```

E2E tests use **Astral** (`jsr:@astral/astral`), a Deno-native browser automation library. No
Node.js, npm, or Playwright needed. Astral auto-downloads Chromium on first run. Tests live in
`e2e/` and use `@std/testing/bdd` + `@std/assert`. A shared helper module at `e2e/helpers/mod.ts`
provides server lifecycle management, browser launch, and assertion utilities (replacing
Playwright's `expect()` API).

### Environment

Copy `.env.example` to `.env`. Key variable: `RUN_INTEGRATION_TESTS`.

## Architecture

### Project Structure

```
routes/            -> Fresh routes (pages + API)
islands/           -> Interactive Preact components
components/        -> Server-only components
static/            -> Static assets (styles.css)
utils/             -> Frontend utilities (api-response, validation)
lib/               -> Frontend libraries (colors, promise-pool)
types/             -> Type declarations (global.d.ts)
src/               -> Shared library (types, services, data)
tests/             -> Backend unit tests
  frontend/        -> Frontend unit tests
e2e/               -> End-to-end browser tests (Astral/Deno)
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

Fresh API routes in `routes/api/` serve all endpoints directly (streams, hatches, stations,
predictions) using the shared services from `src/`.

### Data Layer

No database -- uses Deno KV for caching and static TypeScript arrays for stream/hatch data:

- `data/streams.ts` -- 27 streams with USGS station IDs and coordinates, organized by region
- `data/hatches.ts` -- 17 insect species with temperature ranges, peak months, time-of-day
  preferences

Some USGS stations lack water temperature sensors (e.g., Croton watershed, Shetucket River) -- the
prediction service falls back to month-based predictions when water temp is unavailable.

## Testing Philosophy

This project follows **Test-Driven Development (TDD)** and **Domain-Driven Design (DDD)**
principles. The goal is as close to 100% unit test and E2E test coverage as realistically possible.

### When writing new code

1. **Write tests first** -- define expected behavior before implementing. For backend services,
   write unit tests in `tests/`. For frontend routes/components, write tests in `tests/frontend/`.
   For user-facing features, write E2E tests in `e2e/`.
2. **Domain types drive design** -- all domain concepts are modeled as Zod schemas in
   `src/models/types.ts`. New features should start by defining or extending domain types, then flow
   outward to services and UI.
3. **Every PR should include tests** -- bug fixes need a regression test, new features need unit +
   E2E coverage, refactors must not reduce coverage.

### Test layers

| Layer         | Location          | Scope                            | Runner           |
| ------------- | ----------------- | -------------------------------- | ---------------- |
| Backend unit  | `tests/`          | Services, data, utils, types     | `deno task test` |
| Frontend unit | `tests/frontend/` | Routes, API handlers, components | `deno task test` |
| E2E (browser) | `e2e/`            | Full user flows via Chromium     | `deno task e2e`  |

### E2E coverage map

E2E tests verify complete user-facing flows through a real browser (Astral + Chromium):

- `homepage_test.ts` -- hero content, navigation links, TopPicks island hydration
- `streams_test.ts` -- stream list rendering, region filtering, search
- `stream_detail_test.ts` -- individual stream page with conditions card
- `hatches_test.ts` -- hatch chart page, interactive table rendering
- `map_test.ts` -- Leaflet map island, station markers
- `navigation_test.ts` -- cross-page navigation, API route responses, error handling

When adding a new page or island, **add a corresponding E2E test file** in `e2e/`. Use the shared
helpers in `e2e/helpers/mod.ts` for server lifecycle, browser launch, and assertions.

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

The CI workflow (`.github/workflows/ci.yml`) runs on pull requests. Steps run sequentially and fail
fast:

1. **Format check** -- `deno fmt --check`
2. **Lint** -- `deno lint`
3. **Type check** -- `deno check --unstable-kv **/*.ts **/*.tsx`
4. **Test** -- `deno test ... tests/` (covers both backend and frontend unit tests)
5. **E2E tests (Astral)** -- `deno task e2e` (auto-downloads Chromium, starts Fresh dev server)

E2E tests use Astral (not Playwright/Node.js) -- no `package.json` or `node_modules` needed.
