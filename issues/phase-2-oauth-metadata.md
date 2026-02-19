---
title: 'feat: populate display_name and avatar_url from OAuth metadata in handle_new_user trigger'
labels: [enhancement, phase-2]
origin: 'PR #119 review (Non-Blocking Phase 2 Item)'
---

## Context

From PR #119 review
([Non-Blocking Phase 2 Item](https://github.com/woink/upstate-fishing/pull/119)).

The `handle_new_user()` trigger currently creates a skeleton profile with only the user ID:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
```

## Problem

When users sign up via OAuth (Google, GitHub, etc.), Supabase stores provider metadata in
`auth.users.raw_user_meta_data`. The trigger could extract `full_name`/`name` and
`avatar_url`/`picture` to pre-populate the profile, giving users a better first-time experience.

## Proposed Solution

Once the OAuth provider(s) are chosen, update the trigger in a new migration:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  return new;
end;
$$;
```

The exact JSON keys depend on the OAuth provider (Google uses `picture` and `name`, GitHub uses
`avatar_url` and `name`). This should be implemented when auth providers are configured.

## Reference

- `supabase/migrations/00001_create_initial_schema.sql` lines 149-164
- [Supabase docs: Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)
