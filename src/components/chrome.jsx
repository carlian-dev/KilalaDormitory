import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LayoutDashboard, LogOut, Sun, Moon } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { ConfirmDialog } from "./ui";

export function TopBar() {
  const { theme, toggleTheme } = useStore();
  const { student, signOut } = useAuth();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const userMenuRef = useRef(null);
  const dark = theme === "dark";
  const dashboardHref = student ? "/dashboard" : "/login?next=/dashboard";

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!userMenuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <>
      <header className="material-bar sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="pressable flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] shadow-sm dark:bg-[#FFD120] dark:text-[#0B2A6B]">
            <Building2 size={19} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-[#0B2A6B] dark:text-white">Kilala Dormitory</span>
            <span className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400">Bukidnon State University</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <NavLink to={dashboardHref} className={({isActive}) => `pressable hidden rounded-full px-4 py-2 sm:block ${isActive ? "bg-[#0B2A6B] text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]" : "text-[#0B2A6B]/70 hover:bg-[#FFD120]/20 dark:text-white/70"}`}>My dashboard</NavLink>
          {student ? (
            <div className="relative ml-1" ref={userMenuRef} onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="pressable flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 dark:bg-white/10"
              >
                <span className="max-w-[90px] truncate text-[13px] font-semibold sm:max-w-[140px] dark:text-white">{student.name}</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm dark:bg-white/10 dark:text-white">
                  <ChevronDown size={13} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 text-[#0B2A6B] shadow-xl ring-1 ring-slate-200 dark:bg-[#0A2456] dark:text-white dark:ring-white/15">
                  <Link to={dashboardHref} onClick={() => setMenuOpen(false)} className="pressable flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-slate-100 sm:hidden dark:hover:bg-white/10">
                    <LayoutDashboard size={14} /> My dashboard
                  </Link>
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Settings</p>
                  <button role="menuitem" onClick={toggleTheme} className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                    {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? "Light mode" : "Dark mode"}
                  </button>
                  <div className="my-1.5 h-px bg-slate-200 dark:bg-white/10" />
                  <button role="menuitem" onClick={() => { setMenuOpen(false); setConfirmingSignOut(true); }} className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="pressable ml-1 rounded-full bg-[#FFD120] px-4 py-2 font-semibold text-[#0B2A6B] shadow-sm hover:bg-[#F0BB00]">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
    <ConfirmDialog
        open={confirmingSignOut}
        title="Log out?"
        message="Are you sure you want to log out? You will need to sign in again to access your applications."
        confirmLabel="Log out"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={async () => { setConfirmingSignOut(false); if (await signOut()) nav("/"); }}
      />
    </>
  );
}
