import { Link, NavLink, useNavigate } from "react-router-dom";
import { Building2, LogOut, Sun, Moon } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";

export function TopBar() {
  const { theme, toggleTheme } = useStore();
  const { student, signOut } = useAuth();
  const nav = useNavigate();
  const dark = theme === "dark";
  return (
    <header className="material-bar sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="pressable flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0A1F44] text-[#FFC72C] shadow-sm dark:bg-[#FFC72C] dark:text-[#0A1F44]">
            <Building2 size={19} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-[#0A1F44] dark:text-white">Kilala Dormitory</span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Bukidnon State University</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <NavLink to="/apply" className={({isActive}) => `pressable rounded-full px-4 py-2 ${isActive ? "bg-[#0A1F44] text-white dark:bg-[#FFC72C] dark:text-[#0A1F44]" : "text-[#0A1F44]/70 hover:bg-[#FFC72C]/20 dark:text-white/70"}`}>Apply</NavLink>
          <NavLink to="/dashboard" className={({isActive}) => `pressable rounded-full px-4 py-2 ${isActive ? "bg-[#0A1F44] text-white dark:bg-[#FFC72C] dark:text-[#0A1F44]" : "text-[#0A1F44]/70 hover:bg-[#FFC72C]/20 dark:text-white/70"}`}>My dashboard</NavLink>
          <button
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            className="pressable ml-1 grid h-9 w-9 place-items-center rounded-full bg-[#0A1F44]/5 text-[#0A1F44] hover:bg-[#FFC72C]/30 dark:bg-white/10 dark:text-[#FFC72C]"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {student ? (
            <span className="ml-1 hidden sm:flex items-center gap-2 rounded-full bg-slate-100 py-1 pl-3 pr-1 dark:bg-white/10">
              <Link to="/dashboard" className="max-w-[140px] truncate text-[13px] font-semibold hover:underline dark:text-white">{student.name}</Link>
              <button
                onClick={async () => { await signOut(); nav("/"); }}
                className="pressable grid h-7 w-7 place-items-center rounded-full bg-white shadow-sm dark:bg-white/10 dark:text-white"
                title="Sign out"
              ><LogOut size={13} /></button>
            </span>
          ) : (
            <Link to="/login" className="pressable ml-1 rounded-full bg-[#FFC72C] px-4 py-2 font-semibold text-[#0A1F44] shadow-sm hover:bg-[#F5B800]">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
