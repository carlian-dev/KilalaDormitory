import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Files, FileText, ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import { useStore } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import DormiChat from "../../components/DormiChat";
import ConsentBanner from "../../components/ConsentBanner";
import { ConfirmDialog } from "../../components/ui";

export default function AdminLayout() {
  const { theme, toggleTheme } = useStore();
  const { signOut, profile } = useAuth();
  const nav = useNavigate();
  const dark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const userMenuRef = useRef(null);
  const link = ({ isActive }) =>
    `pressable flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${isActive ? "bg-[#FFD120] text-[#0B2A6B] shadow-sm" : dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-[#0B2A6B]/70 hover:bg-[#FFD120]/20 hover:text-[#0B2A6B]"}`;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!userMenuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${dark ? "bg-[#041743] text-slate-100" : "bg-[#F7F8FC] text-[#0B2A6B]"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-end px-4 sm:px-6 pt-5" onKeyDown={(e) => e.key === "Escape" && setMenuOpen(false)}>
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="pressable flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 shadow-sm dark:bg-white/10"
          >
            <span className="max-w-[140px] truncate text-[13px] font-semibold text-[#0B2A6B] dark:text-white">{profile?.full_name}</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#0B2A6B] shadow-sm dark:bg-white/10 dark:text-white">
              <ChevronDown size={13} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 text-[#0B2A6B] shadow-xl ring-1 ring-slate-200 dark:bg-[#0A2456] dark:text-white dark:ring-white/15">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Settings</p>
              <button role="menuitem" onClick={toggleTheme} className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold hover:bg-slate-100 dark:hover:bg-white/10">
                {dark ? <Sun size={14} /> : <Moon size={14} />} {dark ? "Light mode" : "Dark mode"}
              </button>
              <div className="my-1.5 h-px bg-slate-200 dark:bg-white/10" />
              <button role="menuitem" onClick={() => { setMenuOpen(false); setConfirmingSignOut(true); }} className="pressable flex w-full items-center gap-2 rounded-xl px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl gap-4 px-4 sm:px-6 py-6">
        <aside className={`sticky top-20 hidden h-fit w-60 shrink-0 rounded-3xl p-3 backdrop-blur md:block ${dark ? "bg-white/5 ring-1 ring-white/10" : "bg-white shadow-sm ring-1 ring-slate-200"}`}>
          <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-widest text-[#FFD120]">Kilala admin</p>
          <nav className="mt-2 grid gap-1">
            <NavLink to="/admin" end className={link}><LayoutDashboard size={16} /> Dashboard</NavLink>
            <NavLink to="/admin/apps" className={link}><Files size={16} /> Applications</NavLink>
            <NavLink to="/admin/templates" className={link}><FileText size={16} /> Templates</NavLink>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className={`mb-4 flex gap-1 rounded-2xl p-1 ring-1 ring-[#FFD120]/20 md:hidden ${dark ? "bg-white/5" : "bg-white shadow-sm"}`}>
            <NavLink to="/admin" end className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : dark ? "text-slate-300" : "text-[#0B2A6B]/70"}`}>Dashboard</NavLink>
            <NavLink to="/admin/apps" className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : dark ? "text-slate-300" : "text-[#0B2A6B]/70"}`}>Apps</NavLink>
            <NavLink to="/admin/templates" className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFD120] text-[#0B2A6B]" : dark ? "text-slate-300" : "text-[#0B2A6B]/70"}`}>Forms</NavLink>
          </nav>
          <Outlet />
        </div>
      </div>
      <DormiChat />
      <ConsentBanner />
      <ConfirmDialog
        open={confirmingSignOut}
        title="Log out?"
        message="Are you sure you want to log out? You will need to sign in again to access the housing office."
        confirmLabel="Log out"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={async () => { setConfirmingSignOut(false); if (await signOut()) nav("/"); }}
      />
    </div>
  );
}
