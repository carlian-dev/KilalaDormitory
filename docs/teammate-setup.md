# Teammate Installation & Setup Guide — Kilala Dormitory

Welcome to the **Kilala Dormitory** project! This guide walks you through all required tools, repository setup, environment configuration, and troubleshooting steps needed to get up and running smoothly.

---

## 1. Required Installations (Prerequisites)

Ensure the following tools are installed on your machine before cloning the project.

### A. Git
- **Download**: [git-scm.com](https://git-scm.com/)
- **Verification**:
  ```powershell
  git --version
  ```

### B. Bun (Mandatory Runtime & Package Manager)
> [!IMPORTANT]
> This project strictly uses **Bun**, **NOT** `npm`, `yarn`, or `pnpm`. The project lockfile is `bun.lock`, and our CI runs `bun install --frozen-lockfile`. Do not run `npm install`.

- **Windows (PowerShell)**:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **macOS / Linux**:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

> [!TIP]
> After running the install command, **restart your terminal** so `bun` is available in your system `PATH`.
- **Verification**:
  ```powershell
  bun --version
  ```
  *(Should output v1.1.0 or higher, e.g. `1.4.0`)*

### C. Code Editor (Recommended)
- **VS Code**: [code.visualstudio.com](https://code.visualstudio.com/)
- Recommended extensions:
  - **Tailwind CSS IntelliSense**
  - **Oxlint** / **ESLint**
  - **PostgreSQL** (optional, for viewing SQL files)

*(Note: If you have Node.js / npm installed globally for other projects, you do **not** need to uninstall them. Just make sure to use `bun` commands inside this repository).*

---

## 2. Cloning the Repository & Branch Setup

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/carlian-dev/KilalaDormitory.git
   cd KilalaDormitory
   ```

2. **Switch to the integration branch**:
   ```powershell
   git checkout integration
   ```
   > [!IMPORTANT]
   > `main` is our protected release branch. All active development, feature branches, and pull requests must target **`integration`**.

3. **Install dependencies**:
   ```powershell
   bun install --frozen-lockfile
   ```
   *(If Bun asks to synchronize the lockfile on first run, use `bun install`).*

---

## 3. Environment Configuration (`.env.local`)

The frontend connects directly to Supabase via `@supabase/supabase-js`. You must create a local `.env.local` file (this file is git-ignored and never committed).

1. **Create `.env.local` from the template**:
   - **Windows PowerShell**:
     ```powershell
     Copy-Item .env.example .env.local
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env.local
     ```

2. **Fill in the credentials**:
   Open `.env.local` in your editor:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key-here
   ```

> [!NOTE]
> **Where to get these keys?**
> - **Option 1 (Shared Dev Backend)**: Ask your team lead / project owner for the development Supabase URL and client key (publishable `sb_publishable_…`, or the legacy anon key).
> - **Option 2 (Personal Supabase Project)**: Create a free project at [supabase.com](https://supabase.com). Run migrations in the SQL Editor in order:
>   1. `supabase/mvp1_schema.sql`
>   2. `supabase/mvp2_cleanup_resubmit.sql`
>   3. `supabase/mvp3_billing_docs.sql`
>   4. `supabase/mvp4_one_application.sql`
>   5. `supabase/mvp5_ai_usage.sql`
>   6. `supabase/mvp6_google_auth.sql`
>   Then in Dashboard → Authentication → Providers:
>   - **Google**: **ON** (Client ID + Secret; students sign in with `@student.buksu.edu.ph` only)
>   - **Email**: **ON** (admin sign-in only)
>   - Confirm email: **OFF**
>   - URL Configuration → Redirect URLs: `http://localhost:5173/**`
>
> **Dormi AI (assistant)**: the chat widget talks to the shared `dormi-chat`
> Edge Function — nothing to configure on your machine. Local function testing
> needs the Supabase CLI + your own free Gemini key; see `docs/AI-integration.md`.

---

## 4. Running the Application

### Start Development Server
```powershell
bun run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Linter
```powershell
bun run lint
```
Uses **Oxlint**. Note: `only-export-components` and `set-state-in-effect` are pre-existing warnings in `lib/` and pages; 0 errors is expected.

### Verify Production Build
```powershell
bun run build
```
Builds the production bundle using Vite.

---

## 5. Troubleshooting: What if you already ran `npm`?

If you accidentally ran `npm install` or `npm run`:

1. **Remove npm artifacts**:
   - **Windows PowerShell**:
     ```powershell
     Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
     ```
   - **macOS / Linux**:
     ```bash
     rm -rf node_modules package-lock.json
     ```
   *(Don't worry — your code edits are safe! Only downloaded packages and lockfile are deleted).*

2. **Re-install cleanly with Bun**:
   ```powershell
   bun install --frozen-lockfile
   ```

3. **Check Git Status**:
   ```powershell
   git status
   ```
   Ensure `package-lock.json` is **not** staged or tracked. If it was staged, run:
   ```powershell
   git restore --staged package-lock.json
   ```

---

## 6. Important Team Conventions & Best Practices

1. **Bun Only**: Always use `bun run dev`, `bun run build`, and `bun add <pkg>`. Never use `npm` or `yarn`.
2. **Windows File Locking**: When Vite is running under Bun on Windows, it can hold locks on folders in the workspace. If you need to rename or delete directories, stop the dev server (`Ctrl+C`) first.
3. **Security Boundary**: PostgreSQL Row-Level Security (RLS) is the security boundary. Never filter another user's data in client-side JavaScript. User ownership is stamped automatically from `auth.jsx`.
4. **Never Commit Secrets**: `.env.local` contains credentials and must never be pushed to git. Never use the `service_role` key in client code.
5. **Git Flow**:
   - Always branch off `integration`: `git checkout -b feature/your-feature-name`
   - Test `bun run lint` and `bun run build` before pushing.
   - Open Pull Requests against `integration`.
