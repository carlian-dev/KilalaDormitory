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
import AdminLayout from "../pages/admin/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Applications from "../pages/admin/Applications";
import AppDetail from "../pages/admin/AppDetail";
import Templates from "../pages/admin/Templates";

function SiteShell() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#0A1F44] dark:bg-[#040F24] dark:text-slate-100">
      <TopBar />
      <Outlet />
      <footer className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 pt-4 text-[12px] text-slate-400 dark:text-slate-500">
        <div className="border-t border-slate-200 pt-4 text-center dark:border-white/10">
          <nav className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
            <Link to="/storage-policy" className="hover:underline">Cookie Policy</Link>
          </nav>
          <span>© 2026 Kilala Dormitory · Bukidnon State University</span>
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
            </Route>
            <Route path="/admin" element={<AdminGate />}>
              <Route index element={<Dashboard />} />
              <Route path="apps" element={<Applications />} />
              <Route path="apps/:id" element={<AppDetail />} />
              <Route path="templates" element={<Templates />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </StoreProvider>
  );
}
