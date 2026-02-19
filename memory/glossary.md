# Glossary

## Acronyms & Abbreviations

| Term    | Meaning                                                                        |
| ------- | ------------------------------------------------------------------------------ |
| USGS    | US Geological Survey — federal source of real-time water monitoring data       |
| KV      | Deno KV — built-in key-value store used for caching (requires `--unstable-kv`) |
| SSR     | Server-side rendering (Fresh/Preact)                                           |
| E2E     | End-to-end (testing with Playwright)                                           |
| CI      | Continuous integration — GitHub Actions pipeline                               |
| TTL     | Time-to-live for cache entries (USGS: 15min, weather: 60min, static: 24hr)     |
| PWA     | Progressive Web App — making the app installable on mobile (Issue #7)          |
| PostGIS | PostgreSQL spatial extension — for "find streams near me" queries (Issue #73)  |

## USGS Parameter Codes

| Code  | Measures                     |
| ----- | ---------------------------- |
| 00010 | Water temperature            |
| 00060 | Discharge (flow rate in cfs) |
| 00065 | Gage height                  |

## Domain Terms

| Term              | Meaning                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| sentinel values   | Bad/missing data markers from USGS (e.g., -999999 cfs) — must be filtered                   |
| hatch             | Insect emergence event; triggers trout feeding activity                                     |
| hatch prediction  | Probability scoring: 50% water temp match + 30% month match + 20% weather                   |
| islands           | Fresh architecture pattern — pages server-rendered, interactive bits hydrate on client      |
| @shared/          | Import alias → `src/` directory, shared Zod schemas and TS types                            |
| fishing quality   | Enum: excellent / good / fair / poor — color coded green/blue/yellow/red                    |
| data availability | Metadata indicating which USGS params a station actually reports                            |
| top picks         | "Where should I fish today?" algorithm ranking streams by conditions (Issue #6)             |
| On the Water      | Feature set for active fishing sessions: fly recs, access points, wading safety (Issue #52) |
| Hono              | Previous backend framework, removed in PR #85. Fresh now serves API routes directly.        |
| Forgejo           | Previous git hosting platform, migrated to GitHub                                           |

## Regions

The app covers trout streams organized by region across NY, NJ, CT, and NC. 27+ streams total, each
with USGS station IDs and coordinates. NC and CT streams added in the MVP v1 epic.

## Project Epics

| Epic                             | Issue   | Status                        |
| -------------------------------- | ------- | ----------------------------- |
| Data Quality & Resilience        | #79/#89 | Completed                     |
| Testing Infrastructure           | #80     | In progress (E2E via PR #103) |
| Stream Discovery & User Features | #81     | Not started                   |
| Production & Distribution        | #82     | Not started                   |
| Supabase Integration             | #73     | Research phase (#77)          |
| On the Water                     | #52     | Not started                   |
