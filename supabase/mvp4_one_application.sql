-- ============================================================
-- Kilala Dormitory — 1 student = 1 application.
-- Run once in Supabase Dashboard > SQL Editor, AFTER mvp3.
-- Idempotent. If this fails with "duplicate key", an owner has
-- multiple rows — keep the newest per owner, delete the rest,
-- then re-run:
--   delete from public.applications a using public.applications b
--   where a.owner_id = b.owner_id and a.submitted_at < b.submitted_at;
-- ============================================================

create unique index if not exists applications_owner_unique
  on public.applications (owner_id);
