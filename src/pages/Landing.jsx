import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PageFade } from "../components/ui";

export default function Landing() {
  return (
    <PageFade>
      <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-16 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        >
          <h1 className="display mt-4 text-[#0A1F44] dark:text-white">Welcome to<br />Kilala Dormitory.</h1>
          <p className="body-text mx-auto mt-3 max-w-md text-[15px] text-slate-500 dark:text-slate-300">
            Sign in to apply for a dorm room and follow your application status.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/apply" className="pressable inline-flex items-center gap-2 rounded-full bg-[#FFC72C] px-6 py-3 text-sm font-bold text-[#0A1F44] shadow hover:bg-[#F5B800]">
              Sign in & apply <ArrowRight size={16} />
            </Link>
            <Link to="/dashboard" className="pressable inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A1F44] shadow-sm ring-1 ring-[#0A1F44]/15 hover:ring-[#0A1F44]/30 dark:bg-white/10 dark:text-white dark:ring-white/15">
              My dashboard
            </Link>
          </div>
        </motion.div>
      </section>
    </PageFade>
  );
}
