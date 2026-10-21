-- ============================================================
-- Kilala Dormitory — application history and in-app notifications.
-- Run in Supabase Dashboard > SQL Editor, AFTER mvp3_billing_docs.sql.
-- Safe to re-run.
-- ============================================================

create table if not exists public.application_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  event_type text not null,
  status text not null,
  remarks text not null default '',
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists application_history_app_idx
  on public.application_history (application_id, created_at);
alter table public.application_history enable row level security;

drop policy if exists "application history owner and admin read" on public.application_history;
create policy "application history owner and admin read"
  on public.application_history for select to authenticated
  using (
    exists (
      select 1 from public.applications a
      where a.id = application_id
        and (a.owner_id = auth.uid() or public.is_admin())
    )
  );

insert into public.application_history
  (application_id, event_type, status, remarks, created_at)
select a.id, 'submitted', 'pending', '', a.submitted_at
from public.applications a
where not exists (
  select 1
  from public.application_history h
  where h.application_id = a.id
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications
  drop column if exists application_id;
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notifications owner mark read" on public.notifications;
create policy "notifications owner mark read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.record_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_name text;
  notification_title text;
  notification_message text;
begin
  if tg_op = 'INSERT' then
    insert into public.application_history
      (application_id, event_type, status, remarks, changed_by)
    values
      (new.id, 'submitted', new.status, new.remarks, auth.uid());

    insert into public.notifications (user_id, title, message)
    values (
      new.owner_id,
      'Application submitted',
      'Your application has been received and is pending review.'
    );
    return new;
  end if;

  if new.status is not distinct from old.status
     and new.remarks is not distinct from old.remarks then
    return new;
  end if;

  if old.status = 'rejected' and new.status = 'pending' then
    event_name := 'resubmitted';
    notification_title := 'Application resubmitted';
    notification_message := 'Your corrected documents have been resubmitted for review.';
  elsif new.status is distinct from old.status then
    event_name := 'status_changed';
    notification_title := 'Application status updated';
    notification_message := 'Your application status is now '
      || replace(new.status, '_', ' ') || '.';
  else
    event_name := 'remarks_updated';
    notification_title := 'Application update';
    notification_message := 'Dorm staff added a note to your application.';
  end if;

  if new.remarks is not null and btrim(new.remarks) <> '' then
    notification_message := notification_message || ' Admin note: ' || btrim(new.remarks);
  end if;

  insert into public.application_history
    (application_id, event_type, status, remarks, changed_by)
  values
    (new.id, event_name, new.status, coalesce(new.remarks, ''), auth.uid());

  insert into public.notifications (user_id, title, message)
  values (new.owner_id, notification_title, notification_message);

  return new;
end;
$$;

drop trigger if exists applications_record_insert on public.applications;
create trigger applications_record_insert
  after insert on public.applications
  for each row execute function public.record_application_update();

drop trigger if exists applications_record_update on public.applications;
create trigger applications_record_update
  after update of status, remarks on public.applications
  for each row execute function public.record_application_update();
