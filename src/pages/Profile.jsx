import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Save } from "lucide-react";
import { PageFade } from "../components/ui";
import { useAuth } from "../lib/auth";

const inputCls = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0A1F44] outline-none focus:border-[#0A1F44] focus:ring-4 focus:ring-[#FFC72C]/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400";

export default function Profile() {
  const { user, profile, updateProfileName, updateAccountEmail, signOut } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const saveName = async (event) => {
    event.preventDefault();
    setNameError("");
    setNameMessage("");
    setNameBusy(true);
    try {
      const result = await updateProfileName(name);
      if (!result.ok) {
        setNameError(result.error);
        return;
      }
      setNameMessage("Your name has been updated.");
    } catch (error) {
      setNameError(error.message || "Could not update your name.");
    } finally {
      setNameBusy(false);
    }
  };

  const saveEmail = async (event) => {
    event.preventDefault();
    setEmailError("");
    setEmailMessage("");
    if (email.trim().toLowerCase() === user?.email?.toLowerCase()) {
      setEmailError("Enter a different email address to change it.");
      return;
    }
    setEmailBusy(true);
    try {
      const result = await updateAccountEmail(email);
      if (!result.ok) {
        setEmailError(result.error);
        return;
      }
      setEmailMessage("Check your email inbox to confirm the address change. Your account email will update after confirmation.");
    } catch (error) {
      setEmailError(error.message || "Could not update your email.");
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <PageFade>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <Link to="/dashboard" className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#0A1F44]/5 px-4 py-2 text-[13px] font-bold text-[#0A1F44] dark:bg-white/10 dark:text-white">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="mt-4 rounded-3xl bg-white p-5 sm:p-7 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#0A1F44] text-lg font-bold text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">
              {profile?.full_name?.trim()?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Account settings</p>
              <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
            </div>
          </div>

          <form onSubmit={saveName} className="mt-6 grid gap-3">
            <label className="text-sm font-semibold">Full name
              <input className={inputCls} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
            </label>
            {nameError && <p role="alert" className="text-[13px] font-semibold text-rose-500">{nameError}</p>}
            {nameMessage && <p role="status" className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">{nameMessage}</p>}
            <button type="submit" disabled={nameBusy || name.trim() === profile?.full_name}
              className="pressable inline-flex items-center justify-center gap-2 rounded-full bg-[#FFC72C] px-5 py-2.5 text-sm font-bold text-[#0A1F44] disabled:opacity-50">
              <Save size={15} /> {nameBusy ? "Saving…" : "Save name"}
            </button>
          </form>

          <form onSubmit={saveEmail} className="mt-6 grid gap-3 border-t border-slate-100 pt-5 dark:border-white/10">
            <label className="text-sm font-semibold">Email address
              <input className={inputCls} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supabase may require email confirmation before the new address takes effect.</p>
            {emailError && <p role="alert" className="text-[13px] font-semibold text-rose-500">{emailError}</p>}
            {emailMessage && <p role="status" className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-300">{emailMessage}</p>}
            <button type="submit" disabled={emailBusy || email.trim().toLowerCase() === user?.email?.toLowerCase()}
              className="pressable inline-flex items-center justify-center gap-2 rounded-full bg-[#0A1F44] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 dark:bg-white/10">
              <Save size={15} /> {emailBusy ? "Saving…" : "Change email"}
            </button>
          </form>

          <button onClick={async () => { await signOut(); nav("/"); }}
            className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </PageFade>
  );
}
