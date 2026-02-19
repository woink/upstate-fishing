# Upstate Fishing

Full-stack fishing conditions app for NY/NJ/CT trout streams.

## Stack

- **Runtime:** Deno
- **Frontend:** Deno Fresh + Preact + Tailwind CSS
- **Testing:** @std/testing/bdd (unit/integration), Playwright (E2E — in progress)
- **CI:** GitHub Actions (fmt → lint → type check → test)
- **Data:** Static TS arrays (27 streams, 17 insect species) + Deno KV cache
- **APIs:** USGS Instantaneous Values API, Weather.gov Point API

## Repo

https://github.com/woink/upstate-fishing

## Architecture

Monorepo: `src/` (shared library), `frontend/` (Fresh app), `tests/` (backend), `frontend/tests/`
(frontend). No traditional database — Deno KV for caching only. Supabase under consideration
(#73/#77).

## Architecture Decisions

- Previously had a separate Hono backend — removed in PR #85, Fresh serves API routes directly
- Previously hosted on Forgejo — migrated to GitHub
- Backend/frontend tests must run separately (different deno.json configs)
- NC and CT stream data added during MVP v1 epic

## Roadmap (from open epics)

1. **Testing** (#80) — E2E tests in progress (PR #103)
2. **Production** (#82) — Deno Deploy (#2) then PWA (#7)
3. **Stream Discovery** (#81) — Region nav (#49), wizard (#72), top picks (#6)
4. **Supabase** (#73) — Research phase (#77), then auth + PostGIS + storage
5. **On the Water** (#52) — Active fishing session features
6. **Someday** — Historical data (#9), fly shop directory (#5)

## Recent Completed Work

- Data quality epic: sentinel value filtering, missing parameter handling, data availability
  metadata
- Backend test coverage: weather, predictions, caching services
- Frontend test coverage: validation, filters, API responses
- CI pipeline setup

## Current Work

- PR #103: Playwright E2E test suite (WIP)
- Issue #95: Frontend indicators for missing USGS parameters (open)
