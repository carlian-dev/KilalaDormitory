import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { formatFirstAndLastName, getUserAvatarUrl } from "./profile";

// Real Supabase auth. Students sign in with Google Workspace only; the
// email/password path remains for the dorm office. The domain rule is
// enforced in supabase/mvp6_google_auth.sql, not in this file — the
// client is never the security boundary.
const AuthCtx = createContext(null);
const STUDENT_EMAIL_DOMAIN = "student.buksu.edu.ph";

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
        .select("id, full_name, role, created_at")
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

  const value = useMemo(() => {
    const avatar = getUserAvatarUrl(user);
    const display = profile ? formatFirstAndLastName(profile.full_name) : "";

    return {
      user,
      profile,
      displayName: display,
      avatarUrl: avatar,
      student: profile ? {
        name: display,
        fullName: profile.full_name,
        email: user?.email || "",
        avatarUrl: avatar,
      } : null,
      isAdmin: profile?.role === "admin",
      loading: loading || profileLoading,
      configured: isSupabaseConfigured,
      refreshProfile: () => (user ? fetchProfile(user.id) : Promise.resolve(null)),
      // Google OAuth. `hd` filters Google's account chooser to the student
      // Workspace domain; the auth.users trigger is what actually enforces it.
      signInWithGoogle: async (next) => {
        if (!isSupabaseConfigured) {
          return { ok: false, error: "Supabase is not configured yet." };
        }
        const redirectTo = new URL("/login", window.location.origin);
        if (next && next.startsWith("/")) redirectTo.searchParams.set("next", next);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectTo.toString(),
            queryParams: {
              hd: STUDENT_EMAIL_DOMAIN,
              prompt: "select_account",
            },
          },
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
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
    };
  }, [user, profile, loading, profileLoading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
