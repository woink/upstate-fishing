-- ============================================================================
-- Extract OAuth metadata (display_name, avatar_url) when creating a profile.
--
-- Supabase stores OAuth provider data in auth.users.raw_user_meta_data.
-- Provider key conventions:
--   Google : full_name, picture
--   GitHub : name, avatar_url
--
-- Email-only signups have no metadata — COALESCE falls through to NULL,
-- which is fine since both columns are nullable.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;
