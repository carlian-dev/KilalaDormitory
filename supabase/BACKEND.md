# Kilala Dormitory — Backend Inventory

Every backend behavior in this project, and exactly where it is saved.
Rule: **if it isn't in this repo or in the checklist below, it doesn't exist.**
There are no Edge Functions, webhooks, or cron jobs in MVP 1 (see §5).

## 1. Versioned backend (in this repo)

| Behavior | Source |
|---|---|
| Tables `profiles`, `applications`, `application_documents`, `doc_templates` | `mvp1_schema.sql`, `mvp3_billing_docs.sql` |
| `room_pref` nullable + resubmit UPDATE policies | `mvp2_cleanup_resubmit.sql` |
| One student = one application (`applications_owner_unique`) | `mvp4_one_application.sql` |
| `doc_type` 9-key CHECK | `mvp3_billing_docs.sql` |
| `is_admin()` security-definer function | `mvp1_schema.sql` |
| All RLS policies (owner-only + admin override) | `mvp1_schema.sql`, `mvp2_cleanup_resubmit.sql` |
| Buckets `dorm-requirements`, `dorm-templates` (private) + Storage policies | `mvp1_schema.sql`, `mvp3_billing_docs.sql` |
| `devices` jsonb column (appliance/gadget declarations) | `mvp3_billing_docs.sql` |
| Billing math (₱775 + ₱150/appliance, computed never stored) | `src/lib/mockData.js` → `computeTotal` |
| All DB/Storage calls (CRUD, signed URLs, templates, resubmit) | `src/lib/applications.js` |
| Auth flows (signUp + profile insert, signIn, signOut, role load) | `src/lib/auth.jsx` |

Run order for a fresh project: **mvp1 → mvp2 → mvp3 → mvp4** (each is idempotent).

## 2. Dashboard-only config (NOT in code — follow this checklist)

Supabase Dashboard → Authentication → Providers → **Email**:
- [ ] Email provider: **ON** (master switch — OFF kills all login)
- [ ] Confirm email: **OFF** (instant login for MVP 1)

Supabase Dashboard → Project Settings → API: copy Project URL + `anon`
public key into `.env.local` (local) and the Vercel dashboard (deploy).
Never commit keys; never use the `service_role` key client-side.

First admin: register via the app, then
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## 3. Live-only data (export separately, never to the public repo)

`profiles` / `applications` / `application_documents` / `doc_templates` rows
and both buckets' objects contain student PII (names, phones, guardians,
IDs, medical docs). Dumps and file downloads belong in a **git-ignored local
`backups/` folder only**. `auth.users` passwords cannot be exported at all —
after a rebuild, users re-register and `profiles` rows re-link by id.

## 4. Disaster recovery (fresh project, ~15 min)

1. Create project → run mvp1 → mvp2 → mvp3 → mvp4 in SQL Editor.
2. Apply the §2 checklist + re-enter Vercel env vars.
3. Restore `backups/` data rows and bucket files if they exist.
4. Users re-register; promote admins per §2.

## 5. Edge Functions verdict (MVP 1): none needed

Nothing in MVP 1 requires server-side code (no emails, no external APIs, no
scheduled jobs). First post-MVP candidates: decision-notification emails and
orphaned-file cleanup. Rule going forward: any function starts as
`supabase/functions/<name>/index.ts` **in this repo from day one** and is
deployed with `supabase functions deploy` — code is never created only in
the cloud.
