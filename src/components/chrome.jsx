import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LayoutDashboard, LogOut, Sun, Moon, User, Shield } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { ConfirmDialog } from "./ui";
import ProfileModal from "./ProfileModal";

export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useStore();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`pressable icon-btn ${className}`}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

export function TopBar() {
  const { student, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const userMenuRef = useRef(null);
  const dashboardHref = student ? "/dashboard" : "/login?next=/dashboard";

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

  const initials = student?.name
    ? student.name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
      <header className="material-bar sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/" className="pressable flex items-center gap-2.5 rounded-xl py-1">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
              <Building2 size={18} />
            </span>
            <span className="leading-none">
              <span className="block font-display text-[15px] font-extrabold tracking-tight text-[var(--ink)]">Kilala Dormitory</span>
              <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-soft)] sm:block">Bukidnon State University</span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {student && (
              <NavLink
                to={dashboardHref}
                className={({ isActive }) => `pressable hidden rounded-full px-3.5 py-2 text-[13px] font-semibold sm:block ${
                  isActive
                    ? "bg-[#0B2A6B]/[0.06] text-[var(--ink)] dark:bg-white/10 dark:text-white"
                    : "text-[var(--muted)] hover:bg-[#0B2A6B]/[0.04] hover:text-[var(--ink)] dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                My dashboard
              </NavLink>
            )}

            <ThemeToggle />

            {student ? (
              <div className="relative ml-0.5" ref={userMenuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="pressable flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pl-1 pr-2 shadow-sm"
                >
                  {student.avatarUrl ? (
                    <img
                      src={student.avatarUrl}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0B2A6B] text-[10px] font-bold text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                      {initials}
                    </span>
                  )}
                  <span className="hidden max-w-[110px] truncate text-[12px] font-semibold text-[var(--ink)] sm:block">{student.name}</span>
                  <ChevronDown size={13} className={`text-[var(--muted-soft)] transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                {menuOpen && (
                  <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 text-[var(--ink)] shadow-[var(--shadow-float)]">
                    <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-2.5 pb-2.5 pt-1.5">
                      {student.avatarUrl ? (
                        <img
                          src={student.avatarUrl}
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
                        <p className="truncate text-[12px] font-bold">{student.name}</p>
                        <p className="truncate text-[11px] text-[var(--muted-soft)]">{student.email}</p>
                      </div>
                    </div>

                    <Link to={dashboardHref} onClick={() => setMenuOpen(false)} className="pressable mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold hover:bg-[var(--surface-2)] sm:hidden">
                      <LayoutDashboard size={15} /> My dashboard
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="pressable mt-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold hover:bg-[var(--surface-2)]">
                        <Shield size={15} /> Housing office
                      </Link>
                    )}
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                      className="pressable flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold hover:bg-[var(--surface-2)]"
                    >
                      <User size={15} /> Profile
                    </button>
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
            ) : (
              <div className="ml-0.5 flex items-center gap-1.5">
                <Link to="/login" className="pressable hidden rounded-full px-3.5 py-2 text-[13px] font-semibold text-[var(--muted)] hover:bg-[#0B2A6B]/[0.04] hover:text-[var(--ink)] sm:block dark:hover:bg-white/5 dark:hover:text-white">
                  Sign in
                </Link>
                <Link to="/login?next=/apply" className="pressable btn btn-accent btn-sm">Apply now</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ConfirmDialog
        open={confirmingSignOut}
        title="Log out?"
        message="You will need to sign in again to access your applications and documents."
        confirmLabel="Log out"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={async () => { setConfirmingSignOut(false); if (await signOut()) nav("/"); }}
      />
    </>
  );
}
