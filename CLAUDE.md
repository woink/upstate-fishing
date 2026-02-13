# CLAUDE.md

## Project Overview

Upstate Fishing Conditions App — helps anglers find where to fish in NY, NJ, CT, and NC by combining real-time stream conditions, hatch predictions, and local intelligence.

**Tech stack:** Deno, TypeScript (strict), Hono (backend), Fresh + Preact (frontend), Tailwind CSS, Leaflet (maps), Zod (validation), Deno KV (caching).

## Common Commands

```bash
# Backend dev server (port 8000)
deno task dev

# Frontend dev server (port 8001)
deno task dev:frontend

# Run all tests
deno task test

# Type check backend
deno task check

# Type check frontend
cd frontend && deno task check

# Lint
deno task lint

# Format
deno task fmt

# Format check (no write)
deno task fmt --check

# Frontend production build
cd frontend && deno task build
```

## Code Style

- **Formatter:** `deno fmt` — single quotes, 2-space indent, 100-char line width
- **Linter:** `deno lint` with recommended rules
- **TypeScript:** Strict mode (`strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`)
- Always run `deno task fmt` and `deno task lint` before committing

## Project Structure

- `src/` — Backend (Hono API server)
  - `src/data/` — Curated stream and hatch definitions
  - `src/models/` — Zod schemas and TypeScript types
  - `src/routes/` — API route handlers
  - `src/services/` — USGS, weather, prediction, and caching services
- `frontend/` — Frontend (Deno Fresh + Preact)
  - `frontend/islands/` — Interactive Preact components (Fresh Islands)
  - `frontend/routes/` — Page routes and API proxy
  - `frontend/components/` — Reusable UI components
  - `frontend/static/` — Static assets and styles
- `tests/` — Backend tests
- `frontend/tests/` — Frontend tests
- `research/` — Background research documents

## Testing

- Framework: Deno's native test runner with `@std/assert` and `@std/testing/bdd`
- Run: `deno task test` (backend) or `cd frontend && deno task check` (frontend types)
- Tests live in `tests/` (backend) and `frontend/tests/` (frontend)
- External API calls (USGS, Weather.gov) are stubbed in tests

## CI Pipeline

CI runs on PRs to `main` and `epic/*` branches (`.forgejo/workflows/ci.yaml`):
1. `deno task fmt --check`
2. `deno task lint`
3. `deno task check`
4. `deno task test`

## Architecture Notes

- Backend serves API on port 8000; frontend proxies `/api/*` to backend
- Caching via Deno KV: USGS data (15 min TTL), weather (1 hr), static data (24 hr)
- Fresh Islands pattern: interactive components are isolated in `frontend/islands/`
- Shared code between frontend and backend via `@shared/` import alias (maps to `src/`)

## Branching Strategy

- `main` — production
- `epic/*` — collect related features
- `feature/*` — individual features, merge into epics
- `issue/*` — bug fixes, merge into main
