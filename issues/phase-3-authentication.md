---
title: "Phase 3: Authentication — sign up, login, session management"
labels: [area:backend, area:frontend, enhancement, phase-3]
parent: "#73"
depends_on: "Phase 1 (PR #119)"
---

## Context

Phase 3 of the Supabase integration (#73). With the foundation schema in place, this phase adds
user authentication using Supabase Auth, enabling sign-up, login, logout, and session management
across the Fresh app.

## Goal

Users can create accounts and sign in. Auth state is available server-side (via cookies) and
client-side (via Supabase JS client). Protected routes redirect unauthenticated users.

## Scope

### 1. Auth API Routes

Create Fresh API routes for authentication flows:

```
POST /api/auth/signup     — Email/password registration
POST /api/auth/login      — Email/password login
POST /api/auth/logout     — Clear session
POST /api/auth/callback   — OAuth callback handler
GET  /api/auth/session    — Current session info
```

- Use `createServerSupabaseClient()` (already built in Phase 1) for cookie-based sessions
- Return standardized `ApiResponse` wrapper
- Set secure, httpOnly cookies for session tokens

### 2. Auth Middleware (`frontend/routes/_middleware.ts`)

Add Fresh middleware that:

- Creates a server Supabase client per request
- Attaches the current user (if any) to request state
- Does NOT block unauthenticated requests (most routes are public)
- Sets `ctx.state.user` and `ctx.state.supabase` for downstream handlers

### 3. Auth UI Components

#### Auth Island (`frontend/islands/AuthButton.tsx`)

Header component showing:
- **Logged out**: "Sign In" button → opens modal/page
- **Logged in**: Avatar + display name + dropdown (Profile, Saved Streams, Sign Out)

#### Auth Pages

- `/auth/login` — Email/password form + OAuth buttons (Google, GitHub)
- `/auth/signup` — Registration form
- `/auth/callback` — OAuth redirect handler (server-side)

### 4. OAuth Provider Setup

Configure at least one OAuth provider (GitHub recommended for dev community):

- Register OAuth app with provider
- Store client ID/secret in environment variables
- Update `handle_new_user` trigger to populate profile from OAuth metadata (see
  `issues/phase-2-oauth-metadata.md`)

### 5. Protected Route Helper

Utility for routes that require authentication:

```typescript
export function requireAuth(ctx: FreshContext): User | Response {
  if (!ctx.state.user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/auth/login?redirect=' + encodeURIComponent(ctx.url.pathname) },
    });
  }
  return ctx.state.user;
}
```

### 6. Cookie Parser Fix

Address issue #121 (RFC 6265 quoted cookie values) as part of this phase, since auth relies
heavily on cookie parsing.

## Zod Schemas (already defined in Phase 1)

- `UserProfileSchema` — validates profile data

## Test Plan

- Unit tests for each auth API route (signup, login, logout, callback, session)
- Unit tests for auth middleware (user extraction, anonymous passthrough)
- E2E tests for login/signup flows (Astral)
- E2E test for protected route redirect
- Test OAuth callback with mocked provider response

## Acceptance Criteria

- [ ] Users can sign up with email/password
- [ ] Users can log in and maintain sessions across page loads
- [ ] Users can log out (session cleared)
- [ ] OAuth login works with at least one provider
- [ ] Auth state available server-side via middleware
- [ ] Auth UI shows login/signup or user info based on session
- [ ] Protected routes redirect to login with return URL
- [ ] Feature-flagged: app works without `SUPABASE_URL` (auth UI hidden)
- [ ] All new code has unit + E2E tests
- [ ] Cookie parser handles RFC 6265 quoted values (#121)
