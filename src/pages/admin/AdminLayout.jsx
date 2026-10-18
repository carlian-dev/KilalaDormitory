import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Files, FileText, LogOut, Sun, Moon } from "lucide-react";
import { useStore } from "../../lib/store";
import { useAuth } from "../../lib/auth";
import DormiChat from "../../components/DormiChat";

export default function AdminLayout() {
  const { theme, toggleTheme } = useStore();
  const { signOut, profile } = useAuth();
  const nav = useNavigate();
  const dark = theme === "dark";
  const link = ({ isActive }) =>
    `pressable flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${isActive ? "bg-[#FFC72C] text-[#0A1F44] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#071633] text-slate-100 dark:bg-[#040F24]">
      <div className="mx-auto flex max-w-6xl gap-4 px-4 sm:px-6 py-6">
        <aside className="sticky top-20 hidden h-fit w-60 shrink-0 rounded-3xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur md:block">
          <div className="flex items-center justify-between px-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#FFC72C]">Kilala admin</p>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="pressable grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[#FFC72C]">
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <p className="px-2 pt-1 text-xs text-slate-400 truncate">{profile?.full_name}</p>
          <nav className="mt-2 grid gap-1">
            <NavLink to="/admin" end className={link}><LayoutDashboard size={16} /> Dashboard</NavLink>
            <NavLink to="/admin/apps" className={link}><Files size={16} /> Applications</NavLink>
            <NavLink to="/admin/templates" className={link}><FileText size={16} /> Templates</NavLink>
          </nav>
          <div className="mt-4 grid gap-1 border-t border-white/10 pt-3">
            <button onClick={async () => { await signOut(); nav("/"); }} className="pressable flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-rose-300 hover:bg-white/10">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <nav className="mb-4 flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-[#FFC72C]/20 md:hidden">
            <NavLink to="/admin" end className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFC72C] text-[#0A1F44]" : "text-slate-300"}`}>Dashboard</NavLink>
            <NavLink to="/admin/apps" className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFC72C] text-[#0A1F44]" : "text-slate-300"}`}>Apps</NavLink>
            <NavLink to="/admin/templates" className={({isActive}) => `flex-1 rounded-xl px-2 py-2 text-center text-[13px] font-bold ${isActive ? "bg-[#FFC72C] text-[#0A1F44]" : "text-slate-300"}`}>Forms</NavLink>
          </nav>
          <Outlet />
        </div>
      </div>
      <DormiChat />
    </div>
  );
}
