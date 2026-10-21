import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PageFade } from "../components/ui";
import { useAuth } from "../lib/auth";

// Google redirects back with either query params (PKCE) or a hash
// fragment (implicit). Translate the raw error into student-facing copy.
function readOAuthError() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const description = (hash.get("error_description") || query.get("error_description") || "").replace(/\+/g, " ");
  const code = hash.get("error") || query.get("error") || "";
  if (!description && !code) return "";
  if (/database error saving new user|student\.buksu\.edu\.ph|institutional/i.test(description)) {
    return "Only @student.buksu.edu.ph Google accounts can sign in.";
  }
  if (code === "access_denied") return "Google sign-in was cancelled.";
  return description || "Google sign-in failed. Please try again.";
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2823-1.71V4.9582H.9573A8.9965 8.9965 0 0 0 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}

export default function Login() {
  const { user, profile, loading, signIn, signInWithGoogle, configured } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(readOAuthError);
  const [busy, setBusy] = useState(false);
  const cls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B2A6B] outline-none focus:border-[#0B2A6B] focus:ring-4 focus:ring-[#FFD120]/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400";

  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "";
  const destFor = (role) => next || (role === "admin" ? "/admin" : "/dashboard");
  const destination = next === "/apply" ? "start an application" : next === "/dashboard" ? "view your dashboard" : "continue";

  // Handles the return trip from Google: once the session + profile are
  // ready, honour ?next= or fall back to the role's home page.
  useEffect(() => {
    if (!user || loading) return;
    if (!profile) {
      setErr("We couldn't load your profile. Please sign out and try again.");
      return;
    }
    nav(destFor(profile.role), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, profile, next, nav]);

  const google = async () => {
    setErr("");
    setBusy(true);
    try {
      const r = await signInWithGoogle(next);
      if (!r.ok) { setErr(r.error); setBusy(false); }
      // On success the browser leaves for Google — keep the button busy.
    } catch (e) {
      setErr(e.message || "Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  const go = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    setBusy(true);
    try {
      const r = await signIn({ email, password });
      if (!r.ok) { setErr(r.error); return; }
      if (!r.profile) { setErr("We couldn't load your profile. Please try again."); return; }
      nav(destFor(r.profile.role), { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageFade>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10 dark:text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kilala Dormitory · student portal</p>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to {destination}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            {destination === "view your dashboard"
              ? "Your dashboard is private and shows only your applications and status."
              : "Use your BukSU account to securely continue."}
          </p>

          {!configured && (
            <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">
              Supabase is not configured yet — add keys to .env.local (see .env.example).
            </p>
          )}

          {err && (
            <p role="alert" className="mt-3 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30">
              {err}
            </p>
          )}

          <button
            type="button"
            onClick={google}
            disabled={busy || !configured}
            className="pressable mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white py-3 text-sm font-bold text-[#0B2A6B] shadow-sm hover:bg-slate-50 disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            <GoogleMark />
            {busy ? "Opening Google…" : "Continue with Google"}
          </button>
          <p className="mt-2 text-center text-[12px] text-slate-400 dark:text-slate-400">
            Use your @student.buksu.edu.ph Google account.
          </p>

          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">or sign in with email</span>
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <form onSubmit={go} className="grid gap-3">
            <label className="text-sm font-semibold">Email
              <input className={cls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@buksu.edu.ph" autoComplete="email" spellCheck={false} />
            </label>
            <label className="text-sm font-semibold">Password
              <input className={cls} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" autoComplete="current-password" />
            </label>
            <button
              type="submit" disabled={busy || !configured}
              className="pressable rounded-full bg-[#0B2A6B] py-3 text-sm font-bold text-white hover:bg-[#081f50] disabled:opacity-40 dark:bg-[#FFD120] dark:text-[#0B2A6B] dark:hover:bg-[#F0BB00]"
            >{busy ? "Please wait…" : "Sign in"}</button>
          </form>

          <Link to="/" className="mt-3 block text-center text-[13px] font-semibold text-slate-400 hover:underline">Back home</Link>
        </div>
      </div>
    </PageFade>
  );
}
