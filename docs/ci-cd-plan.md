# KilalaDormitory — CI/CD Plan

## Current state (as of 2026-10-25)
- Scripts: `dev`, `build` (`vite build`), `lint` (`oxlint`), `preview`.
  Build needs zero secrets (Supabase keys are injected at build-time
  via env vars; the client warns at runtime if missing).
- `bun.lock` committed → `bun install --frozen-lockfile` reproduces local env.
- Branches: `main` (protected target), `integration` (active work).
- Deploy target: **Cloudflare Pages** (static SPA).

## 1. CI workflow — `.github/workflows/ci.yml`
- Triggers: every pull request + every push to `main` and `integration`.
- Runner: `ubuntu-latest`.
- Steps: checkout → `oven-sh/setup-bun` (cached) →
  `bun install --frozen-lockfile` → `bun run lint` → `bun run build`.
- Bun in CI matches the local toolchain; frozen lockfile pins versions.

## 2. Branch protection (GitHub settings, manual)
- `main`: require PR + green `ci` check before merge.
- `integration`: unprotected for fast iteration.
- Flow: work → PR into `integration` → stable → PR `integration` → `main`.

## 3. CD via Cloudflare Pages GitHub integration
- Install Cloudflare Pages GitHub app on the repo.
- Build settings:
  - **Production branch:** `main`
  - **Preview branches:** `integration` (and optionally `feature/*`)
  - **Build command:** `bun run build`
  - **Build output directory:** `dist`
  - **Framework preset:** Vite (or None)
- Environment variables (set in Cloudflare dashboard for both Production
  and Preview):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- SPA fallback: `public/_redirects` contains `/* /index.html 200`,
  ensuring all client-side routes resolve correctly.
- Result: every PR / branch push gets a preview URL; merges to `main`
  go to production at `https://kilaladormitory.pages.dev`.

## 4. Supabase dashboard updates (manual, post-deploy)
- Authentication → URL Configuration:
  - **Site URL:** `https://kilaladormitory.pages.dev`
  - **Redirect URLs:** add `https://kilaladormitory.pages.dev/**`
    (keep `http://localhost:5173/**` for local dev)
- Google OAuth → Authorized redirect URI in Google Cloud Console remains
  `https://<project-ref>.supabase.co/auth/v1/callback` (unchanged).

## 5. Out of scope (post-MVP 1)
Environments/approvals, E2E tests, Supabase migration auto-apply,
preview databases. The workflow file must stay structured so these
slot in as extra jobs later.

## Execution checklist
1. ✅ Create `public/_redirects` for SPA fallback.
2. ✅ Create `.github/workflows/ci.yml` on `integration`.
3. ✅ Validate `bun run lint` + `bun run build` green locally.
4. Cloudflare: connect GitHub repo, set build settings, add the two env vars.
5. Supabase: update Site URL to `https://kilaladormitory.pages.dev` +
   add `https://kilaladormitory.pages.dev/**` to Redirect URLs.
6. GitHub: enable branch protection on `main` (require `ci`).
7. Open a test PR to watch CI run + Cloudflare preview deploy.
