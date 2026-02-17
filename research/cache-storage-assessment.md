# Cache & Storage Assessment: Supabase vs Firebase vs Deno KV

**Issue:** #73 — Supabase Integration for Auth, Historical Data, PostGIS, and User Location
**Date:** 2026-02-17

---

## 1. Current Architecture: How Deno KV Is Used Today

Deno KV serves as a **short-lived TTL cache** for external API responses. It is not used as a
database or for persistent storage of any kind.

### What Deno KV stores

| Data           | TTL        | Key Pattern                                  | Source API  |
| -------------- | ---------- | -------------------------------------------- | ----------- |
| USGS readings  | 15 minutes | `['cache', 'usgs', 'stationIds:params']`     | USGS IV API |
| Weather data   | 60 minutes | `['cache', 'weather', 'lat.xxxx,lon.xxxx']`  | Weather.gov |
| Static lookups | 24 hours   | `['cache', ...]`                             | (internal)  |

### What Deno KV does NOT store

- User accounts, preferences, or sessions
- Historical data or time-series records
- Stream/hatch reference data (hardcoded in `src/data/streams.ts` and `src/data/hatches.ts`)
- Geospatial indexes or spatial queries

### Key architectural traits

- **Singleton `CacheService`** with `CacheLike` interface for dependency injection
  (`src/services/cache.ts`)
- **Graceful degradation** — cache read/write failures are caught; the app falls through to live API
  calls
- **Sub-millisecond local latency** (~0.8ms in benchmarks) — ideal for the caching use case
- **Zero infrastructure** — `Deno.openKv()` requires no setup, no connection strings, no external
  service
- **Built-in TTL** via `expireIn` option + manual expiration checks

---

## 2. What Issue #73 Actually Requires

The issue asks for capabilities that **do not exist in the app today**:

1. **Authentication** — user accounts, sessions, social login
2. **Persistent storage** — historical stream/weather data over weeks/months
3. **PostGIS spatial queries** — "find streams near me," distance-based sorting
4. **User preferences** — saved streams, location, notification settings

None of these are caching concerns. They are **new persistence and identity layers**.

---

## 3. Platform Assessment

### 3.1 Supabase

| Capability                 | Fit for This Project                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Auth**                   | Strong. SSR cookie-based auth works with Fresh via `@supabase/ssr`. RLS policies enforce access at the DB level. |
| **PostgreSQL**             | Strong. Relational model fits structured stream/station/user data. Full SQL, joins, foreign keys.             |
| **PostGIS**                | Strong. Native extension. Spatial indexes, nearest-neighbor queries (`<->` operator), bounding box filters.   |
| **Deno integration**       | Strong. First-class — SDK on JSR (`jsr:@supabase/supabase-js`), Edge Functions run Deno 2.1, official docs.   |
| **Real-time**              | Moderate. WebSocket-based. Useful for live condition updates but not a core requirement.                      |
| **Caching**                | Weak. No built-in cache layer. Would require manual Redis setup for request-level caching.                    |
| **Offline support**        | Weak. No client-side offline caching SDK.                                                                     |
| **Pricing (free tier)**    | Unlimited API requests. 500 MB database. 1 GB file storage. Projects pause after 1 week of inactivity.       |
| **Vendor lock-in**         | Low. Open-source, self-hostable, standard PostgreSQL. Data is portable.                                       |
| **Historical data**        | Strong. PostgreSQL is designed for time-series-like queries on structured data.                                |

#### Supabase-specific advantages for this project

- **PostGIS** is a direct match for issue #73's "proximity-based stream discovery" requirement.
  Streams already have coordinates in `src/data/streams.ts` — these could become PostGIS `geography(POINT)` columns with GIST indexes.
- **Auth + RLS** means user preferences (saved streams, home location) are secured at the database
  level without extra middleware.
- **SQL** allows complex historical queries: "What was the water temperature trend on the Beaverkill
  last April?" — something Deno KV cannot do.
- The `@supabase/ssr` package has documented patterns for Fresh middleware integration.

#### Supabase risks

- Adds an external dependency and network hop for every DB query (vs Deno KV's local-only access).
- Free tier pauses inactive projects — problematic for a fishing app with seasonal usage spikes.
- PostGIS queries can be resource-intensive; need careful indexing.

---

### 3.2 Firebase

| Capability                 | Fit for This Project                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Auth**                   | Strong. Mature, well-documented. Email, social, anonymous auth. But Admin SDK on Deno is experimental.      |
| **Firestore (NoSQL)**      | Moderate. Document model works for user profiles but poor for relational stream/station data with joins.     |
| **Geospatial queries**     | Weak. No built-in PostGIS equivalent. Requires geohash workarounds or third-party libraries.                |
| **Deno integration**       | Weak. No official Deno SDK. Experimental JS SDK support. Requires `npm:firebase` or ESM CDN shims.          |
| **Real-time**              | Strong. Best-in-class real-time sync and offline-first client caching.                                      |
| **Caching**                | Strong (client-side). Firestore SDK auto-caches on device. No server-side KV cache equivalent.              |
| **Offline support**        | Strong. Mature client SDKs allow read/write while offline.                                                  |
| **Pricing (free tier)**    | 50K reads/day, 20K writes/day, 10 GB egress. Pay-per-operation billing can spike unpredictably.             |
| **Vendor lock-in**         | High. Proprietary. Data export from Firestore's document model is non-trivial. Password hashes not portable.|
| **Historical data**        | Moderate. Can store documents, but querying time-series across collections requires denormalization.         |

#### Firebase-specific concerns for this project

- **No PostGIS**: The geospatial requirement in issue #73 is a hard gap. Firebase has no native
  spatial extension. You'd need to implement geohash-based proximity manually or use a separate
  service.
- **NoSQL mismatch**: The domain model is inherently relational — streams have stations, stations
  have readings, readings have parameters. This maps naturally to SQL tables with foreign keys, not
  Firestore document collections.
- **Deno support is experimental**: No first-class SDK. The Firebase JS SDK's Deno support has not
  graduated from experimental status. Firebase's 2025 announcements focused on AI tooling, not Deno
  integration.
- **Cost unpredictability**: Every Firestore read is billed. A page that loads 27 streams with
  conditions data could trigger hundreds of reads per request. At scale, this adds up.

#### Firebase advantages

- If the app ever needed **offline-first mobile** support (e.g., a native app for anglers with
  no cell service on the stream), Firebase's offline sync is unmatched.
- Firebase Auth is more battle-tested than Supabase Auth for edge cases.

---

## 4. Core Question: Replace or Complement Deno KV?

### Verdict: **Complement, not replace.**

Neither Supabase nor Firebase should replace Deno KV. They solve different problems.

```
┌─────────────────────────────────────────────────────────────┐
│                    Current: Deno KV Only                    │
│                                                             │
│  USGS API ──→ [Deno KV cache, 15min TTL] ──→ API response  │
│  Weather API ──→ [Deno KV cache, 60min TTL] ──→ API resp   │
│  Static data ──→ TypeScript arrays (in memory)              │
│                                                             │
│  No auth. No persistence. No spatial queries.               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Proposed: Deno KV + Supabase                   │
│                                                             │
│  Deno KV (KEEP) ── short-lived API response cache           │
│    • USGS readings (15-min TTL)                             │
│    • Weather forecasts (60-min TTL)                         │
│    • Zero-config, sub-ms latency, no network hop            │
│                                                             │
│  Supabase (ADD) ── persistent data + identity               │
│    • Auth: user accounts, sessions, RLS                     │
│    • PostgreSQL: historical readings, user preferences      │
│    • PostGIS: "streams near me," distance sorting           │
│    • Time-series: historical trends for streams             │
└─────────────────────────────────────────────────────────────┘
```

### Why keep Deno KV for caching

1. **Latency**: ~0.8ms local reads vs network round-trip to Supabase/Firebase. For a cache that's
   hit on every page load, this matters.
2. **Zero infrastructure**: No connection strings, no environment variables, no service to manage.
   `Deno.openKv()` just works.
3. **Graceful degradation**: The existing `CacheLike` interface and try/catch patterns mean cache
   failures are non-fatal. Adding a database dependency for caching would make failures more
   impactful.
4. **TTL built-in**: Deno KV's `expireIn` handles automatic cleanup. Supabase PostgreSQL has no
   native row-level TTL — you'd need cron jobs or triggers to expire rows.
5. **Cost**: Deno KV caching is free and local. Supabase would charge for the reads/writes that
   caching is specifically designed to reduce.

### Why NOT use Firebase

1. **No PostGIS** — the spatial query requirement has no Firebase-native solution.
2. **NoSQL mismatch** — the domain model is relational (streams → stations → readings → parameters).
3. **Poor Deno support** — experimental SDK, no JSR package, requires shims.
4. **Vendor lock-in** — proprietary, non-portable data model.
5. **Cost model** — per-read billing is hostile to cache-miss patterns where you load many records.

### Why Supabase is the right complement

1. **PostGIS** directly addresses issue #73's spatial requirements.
2. **PostgreSQL** fits the existing relational domain types (already defined as Zod schemas).
3. **First-class Deno integration** via JSR, with documented Fresh auth patterns.
4. **Open-source** — self-hostable, no vendor lock-in, standard SQL.
5. **Auth + RLS** provides user identity with database-level access control.
6. **Historical storage** enables the time-series queries that Deno KV cannot support.

---

## 5. Proposed Data Boundaries

| Concern                        | Technology       | Rationale                                                   |
| ------------------------------ | ---------------- | ----------------------------------------------------------- |
| API response caching           | **Deno KV**      | Sub-ms latency, TTL, zero-config, already built             |
| User authentication            | **Supabase Auth** | SSR cookie auth with Fresh, RLS integration                |
| User preferences               | **Supabase PG**  | Persistent, queryable, secured by RLS                       |
| Historical stream readings     | **Supabase PG**  | Time-series queries, aggregations, trends                   |
| Spatial queries (nearby)       | **Supabase PostGIS** | GIST indexes, `<->` operator, bounding box queries     |
| Stream/hatch reference data    | **TypeScript arrays** | Small, static, fast — no need to move to a DB          |
| HTTP cache headers             | **Deno KV metadata** | Already generates `Cache-Control`, `X-Cache` headers   |

---

## 6. Migration Considerations

### What stays the same

- `src/services/cache.ts` — `CacheService` and `CacheLike` interface remain unchanged
- `src/services/cached-usgs.ts` / `cached-weather.ts` — wrappers keep using Deno KV
- `src/data/streams.ts` / `hatches.ts` — static data stays in TypeScript arrays
- All existing tests continue to pass

### What gets added

- `src/services/supabase.ts` — Supabase client initialization
- `src/services/auth.ts` — authentication service wrapping Supabase Auth
- `src/services/history.ts` — service for writing/querying historical readings
- `src/services/spatial.ts` — PostGIS-backed "streams near me" queries
- Database migrations for: `users`, `user_preferences`, `historical_readings`, spatial indexes
- Frontend middleware for auth state management
- New Zod schemas for user-related types in `src/models/types.ts`
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### What does NOT change

- The `CacheLike` interface and Deno KV caching layer
- The prediction engine (`services/predictions.ts`)
- The USGS and Weather service implementations
- Static stream/hatch data arrays
- Existing API response format (`{ success, data, error, timestamp }`)

---

## 7. Recommendation

**Use Supabase to complement Deno KV.** Do not use Firebase. Do not replace Deno KV.

- Deno KV handles what it's good at: fast, ephemeral, TTL-based API response caching with zero
  configuration overhead.
- Supabase handles what Deno KV cannot: persistent user data, relational queries, spatial indexes,
  authentication, and historical time-series storage.
- Firebase offers no advantage over Supabase for this project's requirements and introduces
  significant drawbacks (no PostGIS, poor Deno support, vendor lock-in, cost unpredictability).

This layered approach avoids over-engineering the existing cache while adding the persistent
infrastructure needed for issue #73's requirements.
