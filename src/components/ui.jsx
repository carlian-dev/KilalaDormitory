import { motion } from "motion/react";
import { statusMeta } from "../lib/mockData";

export function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function PageFade({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              done ? "bg-emerald-500 text-white" : active ? "bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
            }`}>{done ? "✓" : i + 1}</span>
            <span className={`hidden sm:block text-[13px] font-semibold ${active ? "text-[#0A1F44] dark:text-white" : "text-slate-400"}`}>{s}</span>
            {i < steps.length - 1 && <span className={`mx-1 h-px flex-1 ${done ? "bg-emerald-300" : "bg-slate-200 dark:bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
