---
title: "Phase 6: Notifications — email daily reports & hatch alerts"
labels: [area:backend, enhancement, phase-6]
parent: "#73"
depends_on: "Phase 2 (Historical Data), Phase 4 (User Features)"
---

## Context

Phase 6 of the Supabase integration (#73). With historical data flowing (Phase 2) and user
preferences saved (Phase 4), this phase adds the notification system: daily email reports
summarizing conditions for saved streams, and hatch alerts when conditions are excellent.

## Goal

Users who opt in receive email notifications about their saved streams — a daily morning report
with current conditions, and real-time alerts when fishing quality reaches their configured
threshold.

## Scope

### 1. Email Service (`src/services/email.ts`)

Abstraction layer for sending transactional emails:

- Support multiple providers: Supabase Auth emails (built-in), Resend, or SendGrid
- Template rendering with stream conditions data
- Rate limiting per user

### 2. Daily Report Job

Scheduled job (via Deno Deploy cron or GitHub Actions):

- Query users where `email_daily_report = true`
- For each user, fetch conditions for their saved streams
- Generate and send summary email:
  - Top pick stream for today
  - Conditions snapshot per saved stream (quality, water temp, top hatch)
  - Link to full stream detail page
- Run at 6:00 AM ET daily

### 3. Hatch Alert Job

Triggered after each ingestion cycle (Phase 2):

- Query users where `email_hatch_alerts = true`
- Check if any of their saved streams have fishing quality >= their `quality_threshold`
- Deduplicate: don't re-alert for the same stream within 24 hours
- Send targeted alert email:
  - Stream name and current quality
  - Active hatches with confidence levels
  - Direct link to stream page

### 4. Notification History Table (new migration)

Track sent notifications to prevent duplicates:

```sql
create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  notification_type text not null check (notification_type in ('daily_report', 'hatch_alert')),
  stream_id text,
  sent_at timestamptz not null default now(),
  metadata jsonb
);

create index notification_log_user_sent_idx
  on public.notification_log (user_id, sent_at desc);

create index notification_log_dedup_idx
  on public.notification_log (user_id, notification_type, stream_id, sent_at desc);
```

### 5. API Routes

```
GET  /api/user/notifications          — Recent notification history
POST /api/user/notifications/test     — Send a test email to current user
```

## Test Plan

- Unit tests for email template rendering
- Unit tests for daily report generation logic
- Unit tests for hatch alert deduplication
- Unit tests for notification API routes
- Integration test for email delivery (mocked provider)

## Acceptance Criteria

- [ ] Daily report emails sent at configured time for opted-in users
- [ ] Hatch alerts sent when saved stream quality meets threshold
- [ ] Alerts deduplicated (no repeat alerts within 24 hours for same stream)
- [ ] Users can send test notifications from settings page
- [ ] Notification history viewable via API
- [ ] Email service abstracted for provider flexibility
- [ ] Feature-flagged: notification jobs no-op without email provider configured
- [ ] All new code has unit tests
