import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";
import { PageFade } from "../components/ui";
import DormiAvatar from "../components/DormiAvatar";

// Dormi stands in for the "0" — the room number that doesn't exist.
export default function NotFound() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const reduceMotion = useReducedMotion();

  const rise = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { type: "spring", bounce: 0, duration: 0.5, delay: reduceMotion ? 0 : delay },
  });

  return (
    <PageFade>
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[460px] bg-[radial-gradient(65%_100%_at_50%_0%,rgba(255,209,32,0.16),transparent_70%)] dark:bg-[radial-gradient(65%_100%_at_50%_0%,rgba(255,209,32,0.09),transparent_70%)]"
        />

        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <motion.p
            {...rise(0)}
            className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B2A6B] ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#E2402F]" />
            Error 404
          </motion.p>

          <motion.div
            {...rise(0.06)}
            aria-hidden="true"
            className="mt-7 flex select-none items-center justify-center gap-1.5 sm:mt-9 sm:gap-2"
          >
            <span className="font-display text-[92px] font-extrabold leading-none tracking-[-0.04em] text-[#0B2A6B] sm:text-[112px] dark:text-white">
              4
            </span>
            <span className="grid place-items-center rounded-full bg-[#FFD120]/25 p-1.5 dark:bg-[#FFD120]/15">
              <DormiAvatar size={84} mood="worried" className="dormi-bob" />
            </span>
            <span className="font-display text-[92px] font-extrabold leading-none tracking-[-0.04em] text-[#0B2A6B] sm:text-[112px] dark:text-white">
              4
            </span>
          </motion.div>

          <motion.h1
            {...rise(0.12)}
            className="h-section mt-7 text-3xl text-[#0B2A6B] sm:text-4xl dark:text-white"
          >
            Page not available
          </motion.h1>

          <motion.p
            {...rise(0.18)}
            className="body-text mt-3 max-w-md text-[15px] text-slate-500 dark:text-slate-300"
          >
            The link may be broken, or the page has moved. Dormi checked every room down the hall — it simply isn&rsquo;t here.
          </motion.p>

          {pathname !== "/" && (
            <motion.p
              {...rise(0.22)}
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-[12px] text-slate-500 dark:border-white/15 dark:text-slate-400"
            >
              <span className="shrink-0 font-semibold text-slate-400 dark:text-slate-500">Lost at</span>
              <span className="min-w-0 truncate font-mono" title={pathname}>{pathname}</span>
            </motion.p>
          )}

          <motion.div
            {...rise(0.28)}
            className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
          >
            <Link
              to="/"
              className="pressable inline-flex items-center gap-2 rounded-full bg-[#FFD120] px-6 py-3 text-sm font-bold text-[#0B2A6B] shadow-sm hover:bg-[#F0BB00] hover:shadow"
            >
              <Home size={16} /> Back to home
            </Link>
            <button
              type="button"
              onClick={() => nav(-1)}
              className="pressable inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0B2A6B] ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
            >
              <ArrowLeft size={16} /> Go back
            </button>
          </motion.div>
        </div>
      </section>
    </PageFade>
  );
}
