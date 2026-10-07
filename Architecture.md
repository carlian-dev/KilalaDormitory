# Kilala Dormitory — Architecture

## 1. Overview

Kilala Dormitory is a **single-page application (SPA) on a Backend-as-a-Service (BaaS)**.
There is **no custom backend server**. A React frontend talks directly to Supabase
(Postgres + Auth + Storage), and **PostgreSQL Row-Level Security (RLS) is the
security boundary** — not server code. Privacy (students see only their own
applications) is enforced by the database, so it holds even if client code is
bypassed.

This style was chosen for solo-developer speed: Supabase owns identity, data,
file storage, and access control; the repo owns UI, data-access calls, and SQL
migrations.

## 2. Stack

| Layer    | Technology | Notes |
|----------|-----------|-------|
| UI       | React 19 + Vite 8 (SPA) | Bun toolchain (`bun install`, `bun run dev/build`) |
| Routing  | React Router 7 | Public, student-gated, and admin-gated routes |
| Styling  | Tailwind CSS v4 | Class-based dark mode (`.dark` on `<html>`), navy `#0A1F44` + gold `#FFC72C` + white |
| Motion   | Motion (`motion/react`) | Critically-damped springs for page/step/sheet transitions |
| Icons    | Lucide (`lucide-react`) | — |
| Backend  | Supabase | Email/password Auth, Postgres, private Storage buckets |
| Deploys  | Vercel (planned) | SPA fallback rewrite + `VITE_…` env vars; CI/CD deferred post-MVP 1 |

## 3. Directory map

```
C:\DormitorySystem
├── index.html                  Title/meta + pre-paint theme script (no white flash)
├── .env.local                  Supabase URL + anon key (GIT-IGNORED, never committed)
├── .env.example                Key template for new machines
├── supabase/
│   ├── mvp1_schema.sql         Base schema + RLS + dorm-requirements bucket (run 1st)
│   ├── mvp2_cleanup_resubmit.sql  room_pref nullable + resubmit UPDATE policies (run 2nd)
│   └── mvp3_billing_docs.sql   devices column + 9 doc keys + templates table/bucket (run 3rd)
├── src/
│   ├── main.jsx / App.jsx      Entry + router mount
│   ├── index.css               Tailwind + theme tokens, materials, press feedback, a11y
│   ├── routes/AppRoutes.jsx    Route table + StudentGate + AdminGate + footer
│   ├── lib/
│   │   ├── supabase.js         Supabase client (reads VITE_… env)
│   │   ├── auth.jsx            AuthProvider: session, profile+role, signUp/signIn/signOut
│   │   ├── applications.js     All DB/Storage calls (CRUD, signed URLs, templates, resubmit)
│   │   ├── store.jsx           Theme state only (persisted `kilala-theme`)
│   │   └── mockData.js         Static constants: DOC_TYPES, statusMeta, BILLING rates
│   ├── components/
│   │   ├── chrome.jsx          TopBar (nav, theme toggle, session chip)
│   │   ├── ui.jsx              StatusBadge, PageFade, Stepper
│   │   └── FileUploader.jsx    Validated drag-and-drop upload (5 MB, PDF/JPG/PNG)
│   └── pages/
│       ├── Landing.jsx         Public welcome (no applicant data, no rates)
│       ├── Login.jsx           Sign in / Create account tabs + `next` redirect
│       ├── Apply.jsx           4-step wizard: Personal → Downloads → Upload → Payment
│       ├── Dashboard.jsx       Applicant home: my apps, detail, re-upload box
│       └── admin/
│           ├── AdminLayout.jsx Console shell (role-gated)
│           ├── Dashboard.jsx   Counts + latest submissions
│           ├── Applications.jsx Searchable, filterable queue
│           ├── AppDetail.jsx   Review + Approve/Reject + remarks
│           └── Templates.jsx   Upload/replace the 5 downloadable forms
└── dist/                       Build output (git-ignored)
```

## 4. Data flows

### Student apply
`Apply.jsx` → `createApplication()` (`lib/applications.js`):
1. Insert `applications` row (`owner_id` = session user, `devices` jsonb).
2. Upload each file to `dorm-requirements/{app_id}/{doctype}` (upsert).
3. Insert matching `application_documents` rows.
4. On any upload failure, the application row is deleted (rollback).

### Student tracking
`Dashboard.jsx` → `fetchMyApplications(user.id)` → RLS returns **only**
`owner_id = auth.uid()` rows → timeline, remarks, signed-URL doc views,
re-upload box when rejected (`resubmitDocuments()` overwrites files in place
and returns the row to `pending`).

### Admin review
`Applications.jsx` / `AppDetail.jsx` → `fetchAllApplications()` (allowed by
`is_admin()`) → signed-URL doc opens → `updateApplication()` writes
status/remarks. Admin UI is additionally hidden behind the `AdminGate`
role check.

### Template publishing
`Templates.jsx` → `uploadTemplate()` → `dorm-templates/{key}{ext}` (upsert) +
`doc_templates` row update → students fetch the list and open signed-URL
downloads in Apply step 2, then upload signed copies back in step 3.

## 5. Database & access control

Tables: `profiles (id, full_name, role)` · `applications (…, devices jsonb,
status, remarks, …)` · `application_documents (application_id, doc_type,
file_path, file_name)` · `doc_templates (key, label, file_path, …)`.
Buckets: `dorm-requirements` (private, `{app_id}/{doctype}`),
`dorm-templates` (private, `{key}{ext}`).

| Resource | Student | Admin |
|----------|---------|-------|
| `profiles` | read/update own row, insert own row | full read |
| `applications` | CRUD own rows; update only back to `pending` + blank remarks (resubmit) | full read/update |
| `application_documents` | CRUD own rows | full read |
| `doc_templates` | read | full write |
| Storage objects | own `dorm-requirements` prefix; read `dorm-templates` | full access |

Helper: `public.is_admin()` (security-definer) reads the caller's
`profiles.role` without tripping RLS recursion.

## 6. Auth & route gates

| Route | Gate | Rule |
|-------|------|------|
| `/`, `/login` | public | — |
| `/apply`, `/dashboard` | `StudentGate` | signed-in user, else `/login?next=…` |
| `/admin/*` | `AdminGate` | signed-in user **and** `profile.role = 'admin'`, else "Not authorized" |

Sessions come from Supabase Auth (persisted by the client library);
`AuthProvider` additionally loads the `profiles` row for name + role.
Ownership of new applications is stamped from the session — never from typed
form input.

## 7. Billing & document model (MVP 1 corrections)

* **Rates:** flat base `₱775/mo` per dorm + `₱150/mo` per declared **appliance**;
  gadgets are free but must be registered. Total = `775 + 150 × appliances`,
  computed client-side (`computeTotal`) and never stored. Shown only inside
  the application flow and dashboards — never on public pages.
* **Documents (9 per application):** 5 admin templates (Residency Application,
  Personal Data, Residency Agreement, Appliance Registration, Residency
  Admission — download → print → sign → upload back) + 4 student uploads
  (COR, Student ID copy, Medical Laboratory, Medical Certificate).
* Rejected applications are fixed by **re-upload** (same row back to Pending),
  not by filing a new application. Rooms were cut from MVP 1 (no room pages,
  no assignments).

## 8. Environments & operations

* Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env.local`,
  also set in the Vercel dashboard at deploy time).
* Supabase dashboard prerequisites: Email provider ON, Confirm-email OFF,
  migrations run in order mvp1 → mvp2 → mvp3; first admin promoted via
  `update profiles set role='admin' …`.
* Known environment quirk: heavy `backdrop-filter` blurs + a video-saturated
  GPU have crashed Brave during typing; blurs were reduced and global
  `will-change` removed (`src/index.css`). Dev-test in a light window.
