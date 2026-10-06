-- ============================================================
-- Kilala Dormitory — MVP 1 follow-up: drop room_pref requirement
-- + allow owners to replace their documents (resubmit flow).
-- Run once in Supabase Dashboard > SQL Editor, AFTER mvp1_schema.sql.
-- ============================================================

-- Apply no longer collects a room preference (rooms cut from MVP 1).
alter table public.applications
  alter column room_pref drop not null,
  alter column room_pref set default '';

-- Owners may send their OWN application back to pending with a cleared
-- remark (the resubmit flow). They cannot approve themselves: the check
-- only allows status = 'pending' and remarks = ''.
drop policy if exists "applications owner resubmit" on public.applications;
create policy "applications owner resubmit" on public.applications
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status = 'pending' and remarks = '');

drop policy if exists "documents owner update" on public.application_documents;
create policy "documents owner update" on public.application_documents
  for update to authenticated using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.owner_id = auth.uid()
    )
  );
