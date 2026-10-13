# AGENTS.md — Kilala Dormitory

## Toolchain
- **Bun, not npm.** `bun install`, `bun run dev|build|lint`. `bun.lock` is committed; CI uses `bun install --frozen-lockfile`.
- Windows PowerShell shell. No test runner exists — verification is `bun run build` (+ `bun run lint`); both must pass.
- `oxlint` warnings `only-export-components` / `set-state-in-effect` are pre-existing noise across `lib/` and pages. Don't chase them.

## Branches & workflow
- Work on **`integration`**; `main` is the protected target (PR `integration` → `main`).
- User commits/pushes themselves — stage with `git add`, never commit unless asked.

## Env & Supabase
- `.env.local` (git-ignored) holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; `.env.example` is the template. Build succeeds without keys (client only warns) — a missing-key banner at runtime means env, not code.
- Migrations in `supabase/` run **in order mvp1 → mvp2 → mvp3**, all idempotent. Dashboard-only Auth config (Email ON, Confirm-email OFF) is checklist-documented in `supabase/BACKEND.md`, not in code.
- Backend is **100% auto API** (PostgREST/GoTrue/Storage via `supabase-js`) — no custom endpoints exist. **RLS is the security boundary**: never filter other users' data client-side; stamp ownership from the session (`auth.jsx`), never from form input.

## Data-model gotchas
- `application_documents.doc_type` is CHECK-locked to 9 keys (`mockData.js` `DOC_TYPES`); `doc_templates` holds the 5 downloadable forms.
- Storage paths: `dorm-requirements/{app_id}/{doctype}`, `dorm-templates/{key}{ext}` (upsert on).
- `applications.devices` jsonb drives billing: total = `775 + 150 × appliances`, computed in `computeTotal`, **never stored**. `room_pref`/`assigned_room` columns are legacy (rooms cut) — mapper still passes them through; leave alone.
- File inputs can't be refilled by code: `Apply.jsx` draft autosave (`kilala-draft:<userId>`) covers text/step/devices only; files + consent checkbox always reset.

## UI conventions
- Palette: navy `#0A1F44` + gold `#FFC72C` + white; dark mode via `.dark` class + Tailwind `dark:` variants. No public numbers/rates on landing/login.
- Motion: Motion springs only; keep `backdrop-filter` blurs small and never restore global `will-change` (documented Brave GPU crashes — see `Architecture.md` §8).
- Canonical docs: `Architecture.md` (system design), `supabase/BACKEND.md` (backend inventory + DR runbook), `docs/ci-cd-plan.md` (**deferred** — CI/Vercel not yet executed).

## Windows ops
- A running `bun run dev` locks `C:\DormitorySystem` against renames — stop bun/vite PIDs first.
- CRLF warnings from git on write are harmless.
- Deploy (not yet done): Vercel needs SPA fallback rewrite + the two `VITE_…` vars re-entered in its dashboard; `.env.local` never leaves this machine.
