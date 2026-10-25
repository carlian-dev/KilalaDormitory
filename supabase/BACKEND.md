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
| `doc_type` 10-key CHECK | `mvp3_billing_docs.sql` |
| `is_admin()` security-definer function | `mvp1_schema.sql` |
| All RLS policies (owner-only + admin override) | `mvp1_schema.sql`, `mvp2_cleanup_resubmit.sql`, `mvp6_google_auth.sql` |
| Buckets `dorm-requirements`, `dorm-templates` (private) + Storage policies | `mvp1_schema.sql`, `mvp3_billing_docs.sql` |
| `devices` jsonb column (preset gadgets/appliances + custom “other” items, classifiable by admin) | `mvp3_billing_docs.sql` |
| Billing math (₱775 + ₱150/paid appliance, display-only — payment is face-to-face, computed never stored) | `src/lib/mockData.js` → `computeTotal` |
| All DB/Storage calls (CRUD, signed URLs, templates, resubmit) | `src/lib/applications.js` |
| Auth flows (Google OAuth, admin email signIn, signOut, role load) | `src/lib/auth.jsx` |
| Institutional-email guard on `auth.users` + auto profile trigger + `admin_emails` allowlist | `mvp6_google_auth.sql` |
| Dormi AI quota tables + `dormi_take_quota()` / `dormi_refund_quota()` | `mvp5_ai_usage.sql` |
| Dormi chat proxy (Gemini free tier — first Edge Function) | `supabase/functions/dormi-chat/index.ts` |
| Dormi client calls (context builders + `askDormi()`) | `src/lib/dormi.js` |
| Dormi widget UI (placeholder mascot) | `src/components/DormiChat.jsx`, `DormiAvatar.jsx` |

Run order for a fresh project: **mvp1 → mvp2 → mvp3 → mvp4 → mvp5 → mvp6 → mvp7** (each is idempotent).
Deploy order for an existing project: **run mvp6 first, then ship the client** —
the trigger replaces the old client-side profile insert, so new Google users
have no `profiles` row until the migration is applied.

## 2. Dashboard-only config (NOT in code — follow this checklist)

**Students: Google only.** `mvp6_google_auth.sql` rejects any new
`auth.users` row that is not `@student.buksu.edu.ph`, so the provider and
redirect settings must match that flow.

Supabase Dashboard → Authentication → Providers → **Google**:
- [ ] Google provider: **ON**
- [ ] Client ID + Client Secret from Google Cloud Console → APIs & Services →
      Credentials → OAuth client (Web application)
- [ ] Authorized redirect URI in Google Cloud:
      `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] OAuth consent screen published for the BukSU Workspace (or Internal
      if the student domain lives in the same Workspace)

Supabase Dashboard → Authentication → URL Configuration:
- [ ] Site URL: the deployed app URL (e.g. `https://kilaladormitory.pages.dev`)
- [ ] Redirect URLs: `http://localhost:5173/**` and
      `https://<deployed-domain>/**`
      (Google returns to `/login?next=…`; unlisted URLs silently fall back
      to the Site URL)

Supabase Dashboard → Authentication → Providers → **Email**:
- [ ] Email provider: **ON** (dorm-office accounts sign in here; students use Google)
- [ ] Confirm email: **OFF**

Supabase Dashboard → Project Settings → API Keys: copy Project URL + the
client key — the **publishable** key (`sb_publishable_…`) on new projects,
or the legacy `anon` public key on older ones — into `.env.local` (local)
and the Cloudflare Pages dashboard (deploy). Never commit keys; never use the
`service_role`/secret key client-side.

**Admin accounts** (email/password) are allowlisted in the DB before the
user exists — the allowlist bypasses the student-domain guard and makes the
auto-created profile `role = 'admin'`:
```sql
insert into public.admin_emails (email, note)
values ('dormadmin@buksu.edu.ph', 'dorm office')
on conflict (email) do nothing;
```
Then Dashboard → Authentication → Users → **Add user** with that email and
a password. To promote an existing account instead:
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

> The client also passes Google's `hd=student.buksu.edu.ph` hint to filter
> the account chooser. It is **UX only** — the trigger in
> `mvp6_google_auth.sql` is the security boundary.

## 3. Live-only data (export separately, never to the public repo)

`profiles` / `applications` / `application_documents` / `doc_templates` rows
and both buckets' objects contain student PII (names, phones, guardians,
IDs, medical docs). Dumps and file downloads belong in a **git-ignored local
`backups/` folder only**. `auth.users` passwords cannot be exported at all —
after a rebuild, students sign in with Google again and `profiles` rows
re-link by id (the trigger in `mvp6_google_auth.sql` recreates them).

## 4. Disaster recovery (fresh project, ~15 min)

1. Create project → run mvp1 → mvp2 → mvp3 → mvp4 → mvp5 → mvp6 → mvp7 in SQL Editor.
2. Apply the §2 checklist (including Google OAuth + redirect URLs) and
   re-enter Cloudflare Pages env vars.
3. Restore `backups/` data rows and bucket files if they exist.
4. Students sign in with Google again; admins re-allowlist + Add user per §2.

## 5. Edge Functions: one, `dormi-chat` (Dormi AI, Gemini free tier)

MVP 1 needed none. The first (and so far only) function is **`dormi-chat`**,
added with the Dormi assistant (plan + privacy rules: `docs/AI-integration.md`):

- Source: `supabase/functions/dormi-chat/index.ts` — in-repo from day one.
- Job: verify the caller's JWT and DB role, enforce the free-tier daily quotas
  (`mvp5_ai_usage.sql`), then proxy one `generateContent` call to Google Gemini.
- Key handling: `GEMINI_API_KEY` exists **only** as a Supabase secret — never in
  `.env.local`, never in the client bundle.
- Secrets (CLI): `GEMINI_API_KEY` (required), `GEMINI_MODEL`,
  `DORMI_USER_DAILY_LIMIT`, `DORMI_GLOBAL_DAILY_LIMIT`.
- Local test: `supabase functions serve dormi-chat --env-file supabase/functions/.env.local`
  (copy `supabase/functions/.env.example` first).
- Deploy: `supabase functions deploy dormi-chat` — or paste the same file in
  Dashboard → Edge Functions → editor. Either way this file is the source of
  truth; redeploy after every change to it.
- Graceful absence: without the function or secret, the widget shows a quiet
  "isn't set up yet" notice and `bun run build` never needs these values.

Still-open post-MVP candidates: decision-notification emails and orphaned-file
cleanup. Rule going forward: any function starts as
`supabase/functions/<name>/index.ts` **in this repo from day one** and is
deployed with `supabase functions deploy` — code is never created only in
the cloud.
