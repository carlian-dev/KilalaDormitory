# KilalaDormitory — CI/CD Plan (deferred, not yet executed)

## Current state (as of 2026-10-07)
- Scripts: `dev`, `build` (`vite build`), `lint` (`oxlint`), `preview`.
  CI needs zero secrets (build only warns without Supabase keys).
- `bun.lock` committed → `bun install --frozen-lockfile` reproduces local env.
- Branches: `main` (protected target), `integration` (active work).
- No `.github/workflows` yet. Deploy target: Vercel.

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

## 3. CD via Vercel GitHub integration (no CLI tokens)
- Install Vercel GitHub app on the repo; set project root; add the two
  `VITE_SUPABASE_*` env vars once in the Vercel dashboard.
- Result: every PR gets a preview URL; merges to `main` go to production.
- Deliberately avoided: `VERCEL_TOKEN` deploys from Actions.

## 4. Out of scope (post-MVP 1)
Environments/approvals, E2E tests, Supabase migration auto-apply,
preview databases. The workflow file must stay structured so these
slot in as extra jobs later.

## Execution checklist (when this plan is activated)
1. Create `.github/workflows/ci.yml` on `integration`.
2. Validate YAML parses + `bun run build` still green locally.
3. Vercel: install GitHub app, set root, add the two env vars.
4. GitHub: enable branch protection on `main` (require `ci`).
5. Open a test PR to watch CI run and (once Vercel is linked) a preview deploy.
