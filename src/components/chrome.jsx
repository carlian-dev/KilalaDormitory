import { Link, NavLink, useLocation } from "react-router-dom";
import { Building2, Bell, Sun, Moon, UserRound } from "lucide-react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { fetchNotifications } from "../lib/applications";
import { useEffect, useState } from "react";

export function TopBar() {
  const { theme, toggleTheme } = useStore();
  const { user, profile } = useAuth();
  const location = useLocation();
  const dark = theme === "dark";
  const [notificationSummary, setNotificationSummary] = useState({ userId: "", unreadCount: 0 });
  const unreadCount = notificationSummary.userId === user?.id ? notificationSummary.unreadCount : 0;

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    fetchNotifications(user.id)
      .then((items) => {
        if (active) {
          setNotificationSummary({
            userId: user.id,
            unreadCount: items.filter((item) => !item.is_read).length,
          });
        }
      })
      .catch((error) => {
        console.warn("[Kilala] notification count could not be loaded:", error.message);
      });
    return () => { active = false; };
  }, [user, location.pathname, location.search]);

  return (
    <header className="material-bar sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="pressable flex items-center gap-2.5 rounded-xl px-1 py-1">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0A1F44] text-[#FFC72C] shadow-sm dark:bg-[#FFC72C] dark:text-[#0A1F44]">
            <Building2 size={19} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-[#0A1F44] dark:text-white">Kilala Dormitory</span>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Online Dorm Application</span>
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
          {user ? (
            <>
              <Link
                to="/dashboard?view=notifications"
                aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
                title="Notifications"
                className="pressable relative ml-1 grid h-9 w-9 place-items-center rounded-full bg-[#0A1F44]/5 text-[#0A1F44] hover:bg-[#FFC72C]/30 dark:bg-white/10 dark:text-white"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                aria-label="Profile settings"
                title={`${profile?.full_name || "Profile"} settings`}
                className="pressable ml-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#0A1F44] text-sm font-bold text-[#FFC72C] ring-2 ring-[#FFC72C]/50 dark:bg-[#FFC72C] dark:text-[#0A1F44]"
              >
                {profile?.full_name?.trim()?.charAt(0)?.toUpperCase() || <UserRound size={17} />}
              </Link>
            </>
          ) : (
            <Link to="/login" className="pressable ml-1 rounded-full bg-[#FFC72C] px-4 py-2 font-semibold text-[#0A1F44] shadow-sm hover:bg-[#F5B800]">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
