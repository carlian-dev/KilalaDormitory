-- ============================================================
-- Kilala Dormitory — MVP 1 follow-up: flat billing + two-sided docs.
-- Run once in Supabase Dashboard > SQL Editor, AFTER mvp2.
--
-- Billing:  applications.devices jsonb [{name, kind}] where kind is
--   'appliance' (+P150 each) or 'gadget' (free). Base rate P775.
--   Monthly total is computed client-side, never stored.
--
-- Documents (9 keys): 5 admin templates (download, print, sign,
--   upload back) + 4 student-provided uploads.
-- ============================================================

-- ---------- devices ----------
alter table public.applications
  add column if not exists devices jsonb not null default '[]';

-- ---------- doc_type: expand from old 3 keys to 9 ----------
alter table public.application_documents
  drop constraint if exists application_documents_doc_type_check;
alter table public.application_documents
  add constraint application_documents_doc_type_check
  check (doc_type in (
    'residency_application',
    'personal_data',
    'residency_agreement',
    'appliance_registration',
    'residency_admission',
    'cor',
    'student_id_copy',
    'med_lab',
    'med_cert'
  ));

-- ---------- doc_templates (admin-managed softcopies) ----------
create table if not exists public.doc_templates (
  key text primary key check (key in (
    'residency_application',
    'personal_data',
    'residency_agreement',
    'appliance_registration',
    'residency_admission'
  )),
  label text not null,
  file_path text,
  file_name text,
  updated_at timestamptz not null default now()
);
alter table public.doc_templates enable row level security;

-- Seed the 5 rows (no file yet = "Missing" in console).
insert into public.doc_templates (key, label) values
  ('residency_application', 'Residency Application for Students'),
  ('personal_data', 'Personal Data for Students'),
  ('residency_agreement', 'Residency Agreement'),
  ('appliance_registration', 'Registration of Appliance / Electronic Device'),
  ('residency_admission', 'Residency Admission')
on conflict (key) do nothing;

drop policy if exists "templates read" on public.doc_templates;
create policy "templates read" on public.doc_templates
  for select to authenticated using (true);

drop policy if exists "templates admin write" on public.doc_templates;
create policy "templates admin write" on public.doc_templates
  for all to authenticated using (public.is_admin())
  with check (public.is_admin());

-- ---------- Storage: private bucket dorm-templates ----------
insert into storage.buckets (id, name, public)
values ('dorm-templates', 'dorm-templates', false)
on conflict (id) do nothing;

-- path convention: {template_key}{ext} (e.g. "residency_agreement.pdf")
drop policy if exists "templates obj read" on storage.objects;
create policy "templates obj read" on storage.objects
  for select to authenticated using (bucket_id = 'dorm-templates');

drop policy if exists "templates obj write" on storage.objects;
create policy "templates obj write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'dorm-templates' and public.is_admin()
  );

drop policy if exists "templates obj update" on storage.objects;
create policy "templates obj update" on storage.objects
  for update to authenticated using (
    bucket_id = 'dorm-templates' and public.is_admin()
  );
