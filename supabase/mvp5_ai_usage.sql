-- ============================================================
-- Kilala Dormitory — MVP 5: Dormi AI usage quotas.
-- Run once in Supabase Dashboard > SQL Editor, AFTER mvp4.
-- Idempotent.
--
-- Only the dormi-chat Edge Function (service role) touches these
-- tables/functions. RLS is enabled with NO policies on purpose —
-- anon/authenticated clients can never read or write quota state.
-- ============================================================

-- ---------- tables ----------
create table if not exists public.dormi_quota (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Manila')::date,
  used int not null default 0,
  primary key (user_id, day)
);
alter table public.dormi_quota enable row level security;

create table if not exists public.dormi_quota_global (
  day date primary key,
  used int not null default 0
);
alter table public.dormi_quota_global enable row level security;

-- ---------- helpers ----------
-- Atomically take one message from both quota buckets.
-- Returns (allowed, remaining, scope): scope is 'user' or 'global'
-- when denied, null when allowed. remaining = user messages left today.
create or replace function public.dormi_take_quota(
  p_user uuid,
  p_user_limit int,
  p_global_limit int
)
returns table (allowed boolean, remaining int, scope text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Manila')::date;
  v_user_used int;
  v_global_used int;
begin
  insert into public.dormi_quota (user_id, day, used)
  values (p_user, v_day, 0)
  on conflict (user_id, day) do nothing;

  select q.used into v_user_used
  from public.dormi_quota q
  where q.user_id = p_user and q.day = v_day
  for update;

  insert into public.dormi_quota_global (day, used)
  values (v_day, 0)
  on conflict (day) do nothing;

  select g.used into v_global_used
  from public.dormi_quota_global g
  where g.day = v_day
  for update;

  if v_user_used >= p_user_limit then
    return query select false, greatest(p_user_limit - v_user_used, 0), 'user'::text;
    return;
  end if;

  if v_global_used >= p_global_limit then
    return query select false, p_user_limit - v_user_used, 'global'::text;
    return;
  end if;

  update public.dormi_quota set used = used + 1
  where user_id = p_user and day = v_day;
  update public.dormi_quota_global set used = used + 1
  where day = v_day;

  return query select true, p_user_limit - (v_user_used + 1), null::text;
end;
$$;

-- Give one message back when the AI provider failed and no reply was
-- delivered (5xx, timeout, empty response) — the student shouldn't pay
-- for our outage.
create or replace function public.dormi_refund_quota(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'Asia/Manila')::date;
begin
  update public.dormi_quota set used = greatest(used - 1, 0)
  where user_id = p_user and day = v_day;
  update public.dormi_quota_global set used = greatest(used - 1, 0)
  where day = v_day;
end;
$$;

-- ---------- privileges: service role only ----------
revoke all on function public.dormi_take_quota(uuid, int, int) from public, anon, authenticated;
revoke all on function public.dormi_refund_quota(uuid) from public, anon, authenticated;
grant execute on function public.dormi_take_quota(uuid, int, int) to service_role;
grant execute on function public.dormi_refund_quota(uuid) to service_role;
