-- ============================================================
-- Kilala Dormitory — MVP 6: institutional Google sign-in.
-- Run once in Supabase Dashboard > SQL Editor, AFTER mvp5.
-- Idempotent.
--
-- Students sign in with Google only, and only with a real
-- @student.buksu.edu.ph Google Workspace account. Account
-- creation is enforced by a trigger on auth.users — not by the
-- React client — because the anon key is public. Admins are the
-- only exception: allowlist their address in public.admin_emails
-- before creating the account (see §2 of supabase/BACKEND.md).
-- ============================================================

-- ---------- admin allowlist (service-role only) ----------
create table if not exists public.admin_emails (
  email text primary key,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint admin_emails_lowercase check (email = lower(email))
);
alter table public.admin_emails enable row level security;

-- Deliberately no policies: anon/authenticated clients can never
-- read or write this table. Rows are added from the SQL editor or
-- with the service_role key only.

-- ---------- block every non-institutional account ----------
create or replace function public.enforce_institutional_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
begin
  -- Admin addresses bypass the student-domain rule so the dorm
  -- office can still create its email/password accounts.
  if exists (
    select 1 from public.admin_emails a where a.email = v_email
  ) then
    return new;
  end if;

  if v_email !~ '^[a-z0-9._%+-]+@student\.buksu\.edu\.ph$' then
    raise exception using
      errcode = '23514',
      message = 'Kilala only accepts @student.buksu.edu.ph Google accounts.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_institutional_email on auth.users;
create trigger enforce_institutional_email
  before insert or update of email on auth.users
  for each row execute function public.enforce_institutional_email();

-- ---------- auto-create the profile row ----------
-- Google passes full_name in raw_user_meta_data; allowlisted
-- addresses become admins, every other account is a student.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'preferred_username'), ''),
      coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Student')
    ),
    case
      when exists (
        select 1 from public.admin_emails a
        where a.email = lower(coalesce(new.email, ''))
      ) then 'admin'
      else 'student'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts already have profiles from the old client-side
-- insert; fill genuine gaps (e.g. a Google user created before this
-- trigger existed) without touching anyone's role.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    coalesce(nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Student')
  ),
  case
    when exists (
      select 1 from public.admin_emails a
      where a.email = lower(coalesce(u.email, ''))
    ) then 'admin'
    else 'student'
  end
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ---------- close client-side profile writes ----------
-- Profiles are created by the trigger above, so clients never need INSERT.
-- The old name-update policy also let any student PATCH their own row to
-- role = 'admin'; keep self-service name edits student-only.
drop policy if exists "profiles self insert" on public.profiles;
drop policy if exists "profiles self update name" on public.profiles;
create policy "profiles self update name" on public.profiles
  for update to authenticated
  using (id = auth.uid() and role = 'student')
  with check (id = auth.uid() and role = 'student');

-- ---------- students can only file applications from school accounts ----------
-- Second layer for the data itself: even an account that predates the
-- trigger above cannot create an application from a personal address.
drop policy if exists "applications owner insert" on public.applications;
create policy "applications owner insert" on public.applications
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and lower(coalesce(auth.jwt() ->> 'email', ''))
      ~ '^[a-z0-9._%+-]+@student\.buksu\.edu\.ph$'
  );
