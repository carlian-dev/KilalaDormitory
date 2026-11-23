import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { TopBar } from "../components/chrome";
import DormiChat from "../components/DormiChat";
import ConsentBanner from "../components/ConsentBanner";
import { StoreProvider } from "../lib/store";
import { AuthProvider, useAuth } from "../lib/auth";
import Landing from "../pages/Landing";
import Apply from "../pages/Apply";
import ApplicantDashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import Privacy from "../pages/Privacy";
import Terms from "../pages/Terms";
import StoragePolicy from "../pages/StoragePolicy";
import NotFound from "../pages/NotFound";
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Applications from "../pages/admin/Applications";
import AppDetail from "../pages/admin/AppDetail";
import Templates from "../pages/admin/Templates";

function SiteShell() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--ink)]">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-6 border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-display text-sm font-extrabold tracking-tight text-[var(--ink)]">Kilala Dormitory</p>
            <p className="mt-1 text-[11px] text-[var(--muted-soft)]">Bukidnon State University · Housing Office</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-[var(--muted)]">
            <Link to="/privacy" className="transition-colors hover:text-[var(--ink)]">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors hover:text-[var(--ink)]">Terms of Service</Link>
            <Link to="/storage-policy" className="transition-colors hover:text-[var(--ink)]">Cookie Policy</Link>
          </nav>
          <p className="text-[11px] text-[var(--muted-soft)]">© 2026 Kilala Dormitory</p>
        </div>
      </footer>
      <ConsentBanner />
      {user && <DormiChat />}
    </div>
  );
}

function Loading() {
  return <p className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-400">Loading…</p>;
}

function StudentGate() {
  const { user, profile, loading, configured } = useAuth();
  const loc = useLocation();
  if (!configured) return <p className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-rose-500">Supabase is not configured. Add keys to .env.local (see .env.example).</p>;
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (profile?.role === "admin") return <Navigate to="/admin" replace />;
  return <Outlet />;
}

function AdminGate() {
  const { user, profile, loading, configured } = useAuth();
  if (!configured) return <p className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-rose-500">Supabase is not configured. Add keys to .env.local (see .env.example).</p>;
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (profile?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <AdminLayout />;
}

export default function AppRoutes() {
  return (
    <StoreProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<SiteShell />}>
              <Route index element={<Landing />} />
              <Route path="login" element={<Login />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="storage-policy" element={<StoragePolicy />} />
              <Route element={<StudentGate />}>
                <Route path="apply" element={<Apply />} />
                <Route path="dashboard" element={<ApplicantDashboard />} />
              </Route>
              <Route path="track" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin" element={<AdminGate />}>
              <Route index element={<Dashboard />} />
              <Route path="apps" element={<Applications />} />
              <Route path="apps/:id" element={<AppDetail />} />
              <Route path="templates" element={<Templates />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  );
}
