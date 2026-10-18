import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PageFade } from "../components/ui";
import DormiAvatar from "../components/DormiAvatar";
import { useAuth } from "../lib/auth";

// The three steps mirror the real Apply → upload → track flow. No public
// rates or numbers (see AGENTS.md UI conventions).
const STEPS = [
  { title: "Apply online", body: "Create your account, fill the application, and declare any appliances you'll bring." },
  { title: "Upload requirements", body: "Download the 5 dorm forms, sign them, and upload all 9 documents in one go." },
  { title: "Track your status", body: "Follow your application — including resubmit requests — right up to a decision." },
];

export default function Landing() {
  const { user } = useAuth();
  const applyHref = user ? "/apply" : "/login?next=/apply";
  const dashboardHref = user ? "/dashboard" : "/login?next=/dashboard";

  return (
    <PageFade>
      <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-14 pb-8">
        <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="text-center sm:text-left"
          >
            <div className="mb-4 flex justify-center gap-1.5 sm:justify-start" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#FFD120]" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#E2402F]" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[#0B2A6B] dark:bg-[#FFD120]" />
            </div>
            <h1 className="h-section text-4xl text-[#0B2A6B] dark:text-white">
              Welcome to <span className="text-[#E2402F]">Kilala Dormitory.</span>
            </h1>
            <p className="body-text mx-auto mt-3 max-w-md text-[15px] text-slate-500 sm:mx-0 dark:text-slate-300">
              Bukidnon State University's paperless dormitory admission. Sign in to apply and follow your application status — nothing to print at the office window.
            </p>
            <div className="mt-6 flex justify-center flex-wrap gap-2 sm:justify-start">
              <Link to={applyHref} className="pressable inline-flex items-center gap-2 rounded-full bg-[#FFD120] px-6 py-3 text-sm font-bold text-[#0B2A6B] shadow hover:bg-[#F0BB00]">
                {user ? "Start application" : "Sign in & apply"} <ArrowRight size={16} />
              </Link>
              <Link to={dashboardHref} className="pressable inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0B2A6B] shadow-sm ring-1 ring-[#0B2A6B]/15 hover:ring-[#0B2A6B]/30 dark:bg-white/10 dark:text-white dark:ring-white/15">
                {user ? "My dashboard" : "Sign in to dashboard"}
              </Link>
            </div>
          </motion.div>

          <div className="flex flex-col items-center" aria-hidden="true">
            <div className="mb-2 max-w-[220px] rounded-2xl rounded-bl-md bg-white px-3.5 py-2 text-center text-[12px] font-semibold leading-snug text-[#0B2A6B] shadow-sm ring-1 ring-[#FFD120] dark:bg-white/10 dark:text-white dark:ring-white/15">
              Hi, I'm Dormi — the dorm owl! Sign in and I'll help you apply and track your status.
            </div>
            <DormiAvatar size={128} mood="wave" className="dormi-bob" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 sm:px-6 pb-16">
        <h2 className="h-section text-center text-sm uppercase tracking-widest text-slate-400 dark:text-slate-500">How it works</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.45, delay: 0.08 * i }}
              className="material-card rounded-2xl p-4 ring-1 ring-slate-200 dark:ring-white/10"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B2A6B] font-extrabold text-sm text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">{i + 1}</span>
              <h3 className="h-section mt-3 text-[15px] text-[#0B2A6B] dark:text-white">{s.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-300">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </PageFade>
  );
}
