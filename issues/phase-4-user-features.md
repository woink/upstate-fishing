---
title: "Phase 4: User Features — saved streams, preferences, profile"
labels: [area:backend, area:frontend, enhancement, phase-4]
parent: "#73"
depends_on: "Phase 3 (Authentication)"
---

## Context

Phase 4 of the Supabase integration (#73). With auth in place (Phase 3), this phase adds
user-facing features: saved/favorite streams, notification preferences, and profile management.

## Goal

Authenticated users can save favorite streams, configure notification preferences, set a home
location, and manage their profile. These features use the Supabase tables and RLS policies
created in Phase 1.

## Scope

### 1. Saved Streams

#### API Routes

```
GET    /api/user/streams         — List user's saved streams
POST   /api/user/streams         — Save a stream { streamId }
DELETE /api/user/streams/[id]    — Remove a saved stream
```

- All routes require authentication (use `requireAuth` from Phase 3)
- RLS enforces user isolation at the database level
- Return full stream metadata (join with static `STREAMS` data)

#### UI Integration

- Add a bookmark/heart icon to `StreamConditionsCard` and `StreamList` items
- Toggle state: filled (saved) vs outline (not saved)
- Optimistic UI update with rollback on error
- "My Streams" section on user profile page or dedicated `/saved` route

### 2. Notification Preferences

#### API Routes

```
GET  /api/user/preferences       — Get current preferences
PUT  /api/user/preferences       — Update preferences
```

- Create default preferences on first GET if none exist (upsert pattern)
- Validate `qualityThreshold` against `FishingQualitySchema` enum

#### UI

- Settings page at `/settings` or `/profile/settings`
- Toggle switches for `emailDailyReport` and `emailHatchAlerts`
- Dropdown for `qualityThreshold` (poor/fair/good/excellent)
- Auto-save on change with debounce

### 3. User Profile

#### API Routes

```
GET  /api/user/profile           — Get current user profile
PUT  /api/user/profile           — Update profile (displayName, homeLocation)
```

- Home location: accept lat/lon, convert to PostGIS `geography(Point, 4326)`
- Avatar: use Supabase Storage for uploads, or accept OAuth-provided URL

#### UI

- Profile page at `/profile`
- Edit display name
- Set home location via map picker or coordinates input
- Show avatar (from OAuth or uploaded)
- Link to notification preferences

### 4. Home Location Map Picker

Extend `StationMap` island or create a new `LocationPicker` island:

- Click-to-set pin on Leaflet map
- Reverse geocode to show location name
- Save to profile `home_location` (PostGIS point)
- Used for "nearby streams" feature in Phase 5

## Zod Schemas (already defined in Phase 1)

- `UserProfileSchema` — profile CRUD
- `SavedStreamSchema` — saved stream records
- `NotificationPreferencesSchema` — preference settings

## Test Plan

- Unit tests for all API routes (CRUD operations, auth enforcement)
- Unit tests for RLS isolation (user A cannot read user B's data)
- E2E: save a stream → verify it appears in saved list
- E2E: update notification preferences → verify persistence
- E2E: update profile name and home location → verify display
- E2E: unauthenticated access returns 401/redirect

## Acceptance Criteria

- [ ] Users can save/unsave streams with optimistic UI
- [ ] Saved streams persist across sessions
- [ ] Notification preferences can be viewed and updated
- [ ] Profile page shows and edits display name, avatar, home location
- [ ] Map picker allows setting home location
- [ ] All routes enforce authentication
- [ ] RLS prevents cross-user data access
- [ ] Feature-flagged: bookmark icons hidden when Supabase unavailable
- [ ] All new code has unit + E2E tests
