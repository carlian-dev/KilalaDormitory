-- ============================================================
-- Kilala Dormitory — account profile permissions.
-- Run in Supabase Dashboard > SQL Editor, AFTER mvp4_application_updates.sql.
-- Safe to re-run.
-- ============================================================

-- Account registration from the client is student-only. Admin roles must be
-- assigned by a trusted administrator through the Supabase dashboard.
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert to authenticated
  with check (id = auth.uid() and role = 'student');

-- Students and admins may edit their own name, but cannot change their role.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;
