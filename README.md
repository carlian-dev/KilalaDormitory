# Kilala Dormitory

Kilala Dormitory is a web application for dormitory management and student application workflows at Bukidnon State University. Built with React 19, Vite, Tailwind CSS v4, Motion, and Supabase.

## Teammate & Developer Setup
For full prerequisite installation instructions, environment keys, and troubleshooting, read the **[Development Setup Guide](docs/setup.md)**.

### Quickstart Summary
1. **Prerequisites**: [Git](https://git-scm.com/) and [Bun](https://bun.sh/) (`bun --version`).
2. **Clone & switch to `integration`**:
   ```bash
   git clone https://github.com/carlian-dev/KilalaDormitory.git
   cd KilalaDormitory
   git switch --track origin/integration
   ```
3. **Install dependencies** (strictly Bun):
   ```bash
   bun install --frozen-lockfile
   ```
4. **Environment setup**:
   ```bash
   cp .env.example .env.local
   ```
   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.
5. **Start dev server**:
   ```bash
   bun run dev
   ```

## Available Scripts
- `bun run dev`: Start Vite development server
- `bun run build`: Build production assets
- `bun run lint`: Run Oxlint checks
- `bun run preview`: Preview production build locally
