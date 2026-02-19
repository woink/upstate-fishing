# Tech Stack & Tooling

## Runtime & Framework

- Deno (with `--unstable-kv` flag)
- Deno Fresh (islands architecture)
- Preact (UI components, signals for state)
- Tailwind CSS (styling)

## Code Standards

- Strict TypeScript (noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters)
- Zod schemas for all domain types
- 2-space indent, single quotes, 100-char line width (Deno fmt)
- Standardized API response wrapper: `{ success, data, error, timestamp }`

## Testing

- Unit/integration: `@std/testing/bdd` (describe/it) + `@std/assert`
- E2E: Playwright (in progress, PR #103) — runs via Node.js
- Backend and frontend tests MUST run separately (different deno.json configs)
- Integration tests toggle: `RUN_INTEGRATION_TESTS` env var

## CI/CD

GitHub Actions on push to main and PRs:

1. Format check → 2. Lint → 3. Type check (shared) → 4. Type check (frontend) → 5. Test (backend)
   → 6. Test (frontend)

## External APIs

- USGS Instantaneous Values API (water temp, discharge, gage height)
- Weather.gov Point API (hourly forecasts)
- Both cached via Deno KV with different TTLs
