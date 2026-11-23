import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
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

  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "";
  const destFor = (role) => next || (role === "admin" ? "/admin" : "/dashboard");
  const destination = next === "/apply" ? "start your application" : next === "/dashboard" ? "view your dashboard" : "continue";

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
      <div className="relative isolate overflow-hidden px-4 py-10 sm:flex sm:min-h-[calc(100vh-11rem)] sm:items-center sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(55%_42%_at_50%_0%,rgba(255,209,32,0.15),transparent_70%)] dark:bg-[radial-gradient(55%_42%_at_50%_0%,rgba(255,209,32,0.08),transparent_70%)]"
        />

        <div className="mx-auto w-full max-w-md">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                <Building2 size={18} />
              </span>
              <div className="leading-tight">
                <p className="font-display text-sm font-extrabold tracking-tight text-[var(--ink)]">Kilala Dormitory</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted-soft)]">Student portal</p>
              </div>
            </div>

            <h1 className="h-section mt-6 text-2xl text-[var(--ink)]">Sign in to {destination}</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">
              {destination === "view your dashboard"
                ? "Your dashboard is private and shows only your applications and status."
                : "Use your BukSU account to continue securely."}
            </p>

            {!configured && (
              <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30">
                Supabase is not configured yet — add keys to .env.local (see .env.example).
              </p>
            )}

            {err && (
              <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30">
                {err}
              </p>
            )}

            <button
              type="button"
              onClick={google}
              disabled={busy || !configured}
              className="pressable btn btn-secondary mt-5 w-full border-[var(--line-strong)] py-3"
            >
              <GoogleMark />
              {busy ? "Opening Google…" : "Continue with Google"}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--muted-soft)]">
              <ShieldCheck size={12} /> Use your @student.buksu.edu.ph account
            </p>

            <div className="my-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[var(--line)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--muted-soft)]">Housing office</span>
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <form onSubmit={go} className="grid gap-3.5">
              <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">
                Email
                <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@buksu.edu.ph" autoComplete="email" spellCheck={false} />
              </label>
              <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">
                Password
                <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" autoComplete="current-password" />
              </label>
              <button type="submit" disabled={busy || !configured} className="pressable btn btn-primary mt-1 w-full py-3">
                {busy ? "Please wait…" : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-[var(--muted-soft)]">
              By continuing, you agree to the{" "}
              <Link to="/terms" className="font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy" className="font-semibold text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)]">Privacy Policy</Link>.
            </p>
          </div>

          <Link to="/" className="pressable mx-auto mt-5 flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </div>
    </PageFade>
  );
}
