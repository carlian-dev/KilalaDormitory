-- ============================================================
-- Kilala Dormitory — MVP 1 schema + RLS + Storage
-- Run once in Supabase Dashboard > SQL Editor > New query.
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- helper: true when the caller is an admin (security definer avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- profiles policies
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles self update name" on public.profiles;
create policy "profiles self update name" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------- applications ----------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  student_id_no text not null,
  course text not null,
  year text not null,
  phone text not null,
  guardian text not null,
  address text not null default '',
  room_pref text not null,
  term text not null,
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected')),
  remarks text not null default '',
  assigned_room text not null default '',
  submitted_at timestamptz not null default now()
);
create index if not exists applications_owner_idx on public.applications (owner_id);
alter table public.applications enable row level security;

drop policy if exists "applications owner read" on public.applications;
create policy "applications owner read" on public.applications
  for select to authenticated using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "applications owner insert" on public.applications;
create policy "applications owner insert" on public.applications
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "applications admin update" on public.applications;
create policy "applications admin update" on public.applications
  for update to authenticated using (public.is_admin());

-- ---------- application_documents ----------
create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  doc_type text not null check (doc_type in ('school_id', 'coe', 'birth_cert')),
  file_path text not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  unique (application_id, doc_type)
);
create index if not exists application_documents_app_idx
  on public.application_documents (application_id);
alter table public.application_documents enable row level security;

drop policy if exists "documents owner read" on public.application_documents;
create policy "documents owner read" on public.application_documents
  for select to authenticated using (
    exists (
      select 1 from public.applications a
      where a.id = application_id and (a.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "documents owner insert" on public.application_documents;
create policy "documents owner insert" on public.application_documents
  for insert to authenticated with check (
    exists (
      select 1 from public.applications a
      where a.id = application_id and a.owner_id = auth.uid()
    )
  );

-- ---------- Storage: private bucket dorm-requirements ----------
insert into storage.buckets (id, name, public)
values ('dorm-requirements', 'dorm-requirements', false)
on conflict (id) do nothing;

-- path convention: {application_id}/{doc_type} (e.g. "<uuid>/school_id")
drop policy if exists "dormreq owner read" on storage.objects;
create policy "dormreq owner read" on storage.objects
  for select to authenticated using (
    bucket_id = 'dorm-requirements'
    and (
      public.is_admin()
      or exists (
        select 1 from public.applications a
        where a.owner_id = auth.uid()
          and split_part(name, '/', 1) = a.id::text
      )
    )
  );

drop policy if exists "dormreq owner write" on storage.objects;
create policy "dormreq owner write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'dorm-requirements'
    and exists (
      select 1 from public.applications a
      where a.owner_id = auth.uid()
        and split_part(name, '/', 1) = a.id::text
    )
  );

drop policy if exists "dormreq owner update" on storage.objects;
create policy "dormreq owner update" on storage.objects
  for update to authenticated using (
    bucket_id = 'dorm-requirements'
    and (
      public.is_admin()
      or exists (
        select 1 from public.applications a
        where a.owner_id = auth.uid()
          and split_part(name, '/', 1) = a.id::text
      )
    )
  );
