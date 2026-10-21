import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

// Real Supabase auth (MVP 1). Replaces the old passwordless localStorage
// mock: sessions are bound to auth.users, ownership enforced by RLS.
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return null; }
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", userId)
        .single();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (e) {
      console.warn("[Kilala] profile fetch failed:", e.message);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) fetchProfile(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    student: profile ? { name: profile.full_name, email: user?.email || "" } : null,
    isAdmin: profile?.role === "admin",
    loading: loading || profileLoading,
    configured: isSupabaseConfigured,
    signUp: async ({ name, email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      const newUser = data.user;
      if (newUser) {
        const { error: pErr } = await supabase.from("profiles").insert({
          id: newUser.id,
          full_name: name.trim(),
          role: "student",
        });
        if (pErr) return { ok: false, error: pErr.message };
      }
      // If email confirmation is ON, there is no session yet — user must confirm.
      if (!data.session) {
        return { ok: true, needsConfirm: true };
      }
      const newProfile = newUser ? await fetchProfile(newUser.id) : null;
      return { ok: true, profile: newProfile };
    },
    signIn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, error: error.message };
      const profile = data.user ? await fetchProfile(data.user.id) : null;
      return { ok: true, profile };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[Kilala] sign out failed:", error.message);
        return false;
      }
      setUser(null);
      setProfile(null);
      return true;
    },
  }), [user, profile, loading, profileLoading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
