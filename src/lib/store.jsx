import { createContext, useContext, useEffect, useMemo, useState } from "react";

// MVP 1: auth + data live in Supabase (see lib/auth.jsx, lib/applications.js).
// This store keeps only UI theme.
const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("kilala-theme") || "light"; }
    catch { return "light"; }
  });

  useEffect(() => {
    try {
      localStorage.setItem("kilala-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch { /* ignore */ }
  }, [theme]);

  const value = useMemo(() => ({
    theme, setTheme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  }), [theme]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

//for trigger