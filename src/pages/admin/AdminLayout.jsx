import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, FileText, Files, LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { useAuth } from "../../lib/auth";
import DormiChat from "../../components/DormiChat";
import ConsentBanner from "../../components/ConsentBanner";
import { ConfirmDialog } from "../../components/ui";
import ProfileModal from "../../components/ProfileModal";
import { ThemeToggle } from "../../components/chrome";

export default function AdminLayout() {
  const { signOut, profile, user, displayName, avatarUrl } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userMenuRef = useRef(null);

  const link = ({ isActive }) =>
    `pressable flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold ${
      isActive
        ? "bg-[#0B2A6B] text-white shadow-sm dark:bg-[#FFD120] dark:text-[#0B2A6B]"
        : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
    }`;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!userMenuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const adminName = displayName || profile?.full_name || "Admin";
  const initials = adminName.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="material-bar sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/admin" className="pressable flex items-center gap-2.5 rounded-xl py-1">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
              <Building2 size={18} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Kilala Dormitory</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-soft)]">Housing office</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <span className="chip mr-1 hidden bg-[#FFF8E1] text-[#0B2A6B] ring-1 ring-[#FFD120]/50 sm:inline-flex dark:bg-[#FFD120]/10 dark:text-[#FFD120] dark:ring-[#FFD120]/30">
              <Shield size={12} /> Admin
            </span>
            <ThemeToggle />

            <div className="relative ml-0.5" ref={userMenuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="pressable flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pl-1 pr-2 shadow-sm"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0B2A6B] text-[10px] font-bold text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                    {initials}
                  </span>
                )}
                <span className="hidden max-w-[120px] truncate text-[12px] font-semibold text-[var(--ink)] sm:block">{adminName}</span>
                <ChevronDown size={13} className={`text-[var(--muted-soft)] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 text-[var(--ink)] shadow-[var(--shadow-float)]">
                  <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-2.5 pb-2.5 pt-1.5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B2A6B] text-[11px] font-bold text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold">{adminName}</p>
                      <p className="truncate text-[11px] text-[var(--muted-soft)]">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                    className="pressable mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold hover:bg-[var(--surface-2)]"
                  >
                    <User size={15} /> Profile
                  </button>
                  <Link to="/" onClick={() => setMenuOpen(false)} className="pressable mt-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold hover:bg-[var(--surface-2)] sm:hidden">
                    <LayoutDashboard size={15} /> View public site
                  </Link>
                  <div className="my-1 h-px bg-[var(--line)]" />
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); setConfirmingSignOut(true); }}
                    className="pressable flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 md:block">
          <div className="card p-2">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-soft)]">Housing office</p>
            <nav className="grid gap-1">
              <NavLink to="/admin" end className={link}><LayoutDashboard size={16} /> Dashboard</NavLink>
              <NavLink to="/admin/apps" className={link}><Files size={16} /> Applications</NavLink>
              <NavLink to="/admin/templates" className={link}><FileText size={16} /> Templates</NavLink>
            </nav>
            <div className="mx-3 my-2 h-px bg-[var(--line)]" />
            <Link to="/" className="pressable flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-semibold text-[var(--muted-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">
              <Building2 size={15} /> View public site
            </Link>
          </div>
          <p className="px-3 pt-4 text-[11px] leading-relaxed text-[var(--muted-soft)]">
            Review applications and publish the forms students download.
          </p>
        </aside>

        <main className="min-w-0 flex-1">
          <nav className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1 md:hidden">
            <NavLink to="/admin" end className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[12px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : "text-[var(--muted)]"}`}>Dashboard</NavLink>
            <NavLink to="/admin/apps" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[12px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : "text-[var(--muted)]"}`}>Applications</NavLink>
            <NavLink to="/admin/templates" className={({ isActive }) => `rounded-xl px-2 py-2 text-center text-[12px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : "text-[var(--muted)]"}`}>Templates</NavLink>
          </nav>
          <Outlet />
        </main>
      </div>

      <DormiChat />
      <ConsentBanner />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ConfirmDialog
        open={confirmingSignOut}
        title="Log out?"
        message="You will need to sign in again to access the housing office."
        confirmLabel="Log out"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={async () => { setConfirmingSignOut(false); if (await signOut()) nav("/"); }}
      />
    </div>
  );
}
