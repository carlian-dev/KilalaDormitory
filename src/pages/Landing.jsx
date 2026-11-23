import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowRight, Check, ClipboardList, FileCheck2, MapPin, SearchCheck, ShieldCheck } from "lucide-react";
import { PageFade } from "../components/ui";
import DormiAvatar from "../components/DormiAvatar";
import { useAuth } from "../lib/auth";
import heroImage from "../assets/Landing page UI.jpg";

// The three steps mirror the real Apply → upload → track flow. No public
// rates or numbers (see AGENTS.md UI conventions).
const STEPS = [
  {
    icon: ClipboardList,
    title: "Apply online",
    body: "Sign in with your BukSU Google account and tell us a little about yourself and your course.",
  },
  {
    icon: FileCheck2,
    title: "Upload requirements",
    body: "Download the five dorm forms, sign them, and attach every requirement in one sitting.",
  },
  {
    icon: SearchCheck,
    title: "Track your status",
    body: "Follow your application from submission to decision — and resubmit from home if needed.",
  },
];

const NEEDED = ["BukSU Google account", "Student ID number", "5 signed forms", "5 supporting documents"];

export default function Landing() {
  const { user } = useAuth();
  const reduce = useReducedMotion();

  const rise = (delay = 0) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", bounce: 0, duration: 0.6, delay: reduce ? 0 : delay },
  });

  const primaryTo = user ? "/dashboard" : "/login?next=/apply";
  const primaryLabel = user ? "Open my dashboard" : "Start your application";

  return (
    <PageFade>
      {/* The photo is the stage: washed out, then lit with navy and gold so the
          copy stays readable without hiding the hall itself. */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-20">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover object-[54%_58%] opacity-[0.58] saturate-[0.76] contrast-[0.96] dark:opacity-[0.34] dark:saturate-[0.6] dark:brightness-[0.55]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Colour lighting */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(46%_62%_at_86%_4%,rgba(255,209,32,0.4),transparent_68%)] dark:bg-[radial-gradient(46%_62%_at_86%_4%,rgba(255,209,32,0.24),transparent_68%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(42%_58%_at_6%_94%,rgba(11,42,107,0.16),transparent_70%)] dark:bg-[radial-gradient(42%_58%_at_6%_94%,rgba(21,66,127,0.45),transparent_70%)]"
        />

        {/* Faded scrim: heavy on the copy, almost gone over the photo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(96deg,rgba(245,247,251,0.98)_0%,rgba(245,247,251,0.93)_28%,rgba(245,247,251,0.68)_48%,rgba(245,247,251,0.08)_74%,rgba(245,247,251,0.2)_100%)] dark:bg-[linear-gradient(96deg,rgba(5,19,49,0.98)_0%,rgba(5,19,49,0.94)_28%,rgba(5,19,49,0.72)_50%,rgba(5,19,49,0.2)_78%,rgba(5,19,49,0.46)_100%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-b from-transparent to-[var(--bg)]" />

        <div className="mx-auto flex min-h-[600px] max-w-6xl flex-col justify-between px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:min-h-[680px] lg:pb-28">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-xl">
              <motion.p {...rise(0)} className="eyebrow flex items-center gap-2 !text-[#475569] dark:!text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E2402F]" aria-hidden="true" />
                Bukidnon State University · Housing Office
              </motion.p>

              <motion.h1 {...rise(0.05)} className="display mt-4 text-[#0B2A6B] dark:text-white">
                A simpler way into{" "}
                <span className="relative whitespace-nowrap">
                  Kilala.
                  <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-[#FFD120]" />
                </span>
              </motion.h1>

              <motion.p {...rise(0.1)} className="body-text mt-5 max-w-lg text-[15px] text-[#41506a] sm:text-base dark:text-slate-300">
                Apply to Kilala Residence Hall, upload your requirements, and follow your status — all in one place. No queues, no printed forms at the window.
              </motion.p>

              <motion.div {...rise(0.15)} className="mt-7 flex flex-wrap items-center gap-2.5">
                <Link to={primaryTo} className="pressable btn btn-accent btn-lg">
                  {primaryLabel} <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="pressable btn btn-lg border border-[#0B2A6B]/15 bg-white/65 text-[#0B2A6B] backdrop-blur-[3px] hover:bg-white/85 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  How it works <ArrowDown size={16} />
                </a>
              </motion.div>

              <motion.p {...rise(0.2)} className="mt-4 flex items-center gap-1.5 text-[12px] text-[#5b6880] dark:text-white/65">
                <ShieldCheck size={14} className="shrink-0" />
                Sign in with your @student.buksu.edu.ph Google account.
              </motion.p>
            </div>

            <div aria-hidden="true" />
          </div>

          <motion.div {...rise(0.25)} className="mt-12 flex justify-start sm:justify-end">
            <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[#0B2A6B] shadow-[0_18px_44px_-32px_rgba(8,31,82,0.7)] backdrop-blur-[3px] dark:border-white/12 dark:bg-[#071f4f]/55 dark:text-white">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B2A6B]/8 ring-1 ring-[#0B2A6B]/10 dark:bg-white/10 dark:ring-white/15">
                <MapPin size={15} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[12px] font-bold sm:text-[13px]">Kilala Residence Hall</p>
                <p className="truncate text-[11px] text-[#5b6880] dark:text-white/60">F. Montano St. · Bukidnon State University</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Requirements float over the photo's soft bottom edge */}
      <div className="relative z-10 mx-auto -mt-9 max-w-5xl px-4 sm:px-6">
        <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 shadow-[var(--shadow-float)]">
          <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--muted-soft)]">You'll need</span>
          {NEEDED.map((n) => (
            <span key={n} className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted)]">
              <Check size={13} className="text-emerald-500" /> {n}
            </span>
          ))}
        </div>
      </div>

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-4 pt-12 sm:px-6 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="h-section mt-2 text-2xl text-[var(--ink)] sm:text-3xl">Three steps, one application.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            Everything happens online. Your draft saves as you go, so you can finish when you're ready.
          </p>
        </div>

        <ol className="mt-9 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: "spring", bounce: 0, duration: 0.5, delay: reduce ? 0 : 0.06 * i }}
              className="card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-[11px] font-extrabold tracking-[0.14em] text-[var(--muted-soft)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF8E1] text-[#0B2A6B] ring-1 ring-[#FFD120]/50 dark:bg-[#FFD120]/10 dark:text-[#FFD120]">
                  <s.icon size={16} />
                </span>
              </div>
              <h3 className="h-section mt-5 text-base text-[var(--ink)]">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted)]">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#0B2A6B] px-6 py-9 shadow-[0_30px_70px_-40px_rgba(8,31,82,0.8)] sm:px-10 sm:py-11 dark:ring-1 dark:ring-white/10">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[58%_55%] opacity-20 saturate-[0.5]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(98deg,rgba(8,31,82,0.97)_0%,rgba(8,31,82,0.9)_42%,rgba(8,31,82,0.55)_72%,rgba(8,31,82,0.4)_100%)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 bg-[radial-gradient(closest-side,rgba(255,209,32,0.3),transparent)]"
          />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#FFD120]">Kilala Residence Hall</p>
              <h2 className="h-section mt-2 text-2xl text-white sm:text-3xl">Ready when you are.</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Start your application and keep every update in one dashboard — from first upload to final decision.
              </p>
              <div className="mt-5">
                <Link to={primaryTo} className="pressable btn btn-accent">
                  {primaryLabel} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="flex items-end gap-3 self-start sm:self-auto">
              <div className="hidden max-w-[180px] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[12px] font-semibold leading-snug text-[#0B2A6B] shadow-lg sm:block">
                Hi, I'm Dormi. I'll help you get settled.
              </div>
              <DormiAvatar size={92} mood="wave" className="dormi-bob" />
            </div>
          </div>
        </div>
      </section>
    </PageFade>
  );
}
