import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { PageFade } from "../components/ui";
import { useAuth } from "../lib/auth";

export default function Login({ role }) {
  const { signIn, signUp, configured } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [tab, setTab] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const cls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0A1F44] outline-none focus:border-[#0A1F44] focus:ring-4 focus:ring-[#FFC72C]/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400";

  if (!role) {
    return (
      <PageFade>
        <div className="mx-auto max-w-md px-4 py-12">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kilala Dormitory</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Choose how to sign in</h1>
            <div className="mt-5 grid gap-3">
              <Link to="/login/student" className="pressable rounded-full bg-[#FFC72C] py-3 text-center text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800]">Student sign in</Link>
              <Link to="/login/admin" className="pressable rounded-full bg-[#0A1F44] py-3 text-center text-sm font-bold text-white hover:bg-[#123365] dark:bg-white/10 dark:text-white">Admin sign in</Link>
              <Link to="/" className="text-center text-[13px] font-semibold text-slate-400 hover:underline">Back home</Link>
            </div>
          </div>
        </div>
      </PageFade>
    );
  }

  const go = async () => {
    setErr("");
    setBusy(true);
    try {
      const defaultDest = role === "admin" ? "/admin" : "/dashboard";
      const dest = next.startsWith("/") ? next : defaultDest;
      if (tab === "signin") {
        const r = await signIn({ email, password, expectedRole: role });
        if (!r.ok) { setErr(r.error); return; }
        nav(dest, { replace: true });
      } else {
        if (!name.trim()) { setErr("Please enter your full name."); return; }
        const r = await signUp({ name, email, password });
        if (!r.ok) { setErr(r.error); return; }
        if (r.needsConfirm) {
          setErr("");
          nav(`/login/student?next=${encodeURIComponent(dest)}`, { replace: true });
          setTab("signin");
          setErr("Account created — check your email to confirm, then sign in.");
          return;
        }
        nav(dest, { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageFade>
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kilala Dormitory · {role} portal</p>
          <h1 className="text-2xl font-bold tracking-tight">{role === "admin" ? "Admin sign in" : "Student sign in"}</h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-300">
            Your applications belong to your account only. Other students can never see them.
          </p>

          {!configured && (
            <p className="mt-3 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">
              Supabase is not configured yet — add keys to .env.local (see .env.example).
            </p>
          )}

          <div className={`mt-4 grid ${role === "student" ? "grid-cols-2" : "grid-cols-1"} gap-1 rounded-full bg-slate-100 p-1 dark:bg-white/10`}>
            {[["signin", role === "admin" ? "Admin sign in" : "Sign in"], ...(role === "student" ? [["register", "Create account"]] : [])].map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); }}
                className={`pressable rounded-full py-2 text-sm font-bold ${tab === k ? "bg-[#0A1F44] text-white dark:bg-[#FFC72C] dark:text-[#0A1F44]" : "text-slate-500 dark:text-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            {tab === "register" && (
              <label className="text-sm font-semibold">Full name
                <input className={cls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan dela Cruz" autoComplete="name" spellCheck={false} />
              </label>
            )}
            <label className="text-sm font-semibold">Email
              <input className={cls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="JuanDelaCruz@buksu.edu.ph" autoComplete="email" spellCheck={false} />
            </label>
            <label className="text-sm font-semibold">Password
              <input className={cls} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "Min. 6 characters" : "Your password"} autoComplete={tab === "register" ? "new-password" : "current-password"}
                onKeyDown={(e) => { if (e.key === "Enter") go(); }} />
            </label>
            {err && <p className="text-[13px] font-semibold text-rose-500">{err}</p>}
            <button
              onClick={go} disabled={busy || !configured}
              className="pressable rounded-full bg-[#FFC72C] py-3 text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800] disabled:opacity-40"
            >{busy ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account & continue"}</button>
            <Link to="/login" className="text-center text-[13px] font-semibold text-slate-400 hover:underline">Choose another sign-in type</Link>
            <Link to="/" className="text-center text-[13px] font-semibold text-slate-400 hover:underline">Back home</Link>
          </div>
        </div>
      </div>
    </PageFade>
  );
}
