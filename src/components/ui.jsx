import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { statusMeta } from "../lib/mockData";

export function StatusBadge({ status }) {
  const m = statusMeta[status] || statusMeta.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${m.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

export function PageFade({ children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#041743]/45 px-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-3xl bg-[var(--surface)] p-6 shadow-[var(--shadow-float)] ring-1 ring-[var(--line)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="h-section text-lg text-[var(--ink)]">{title}</h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="pressable btn btn-ghost">Cancel</button>
          <button type="button" onClick={onConfirm} className="pressable btn bg-rose-600 text-white hover:bg-rose-700">{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-1.5 last:flex-none sm:gap-2">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                    : "bg-[#0B2A6B]/[0.08] text-[#0B2A6B]/45 dark:bg-white/10 dark:text-white/40"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`hidden truncate text-[12px] font-semibold sm:block ${active ? "text-[var(--ink)]" : done ? "text-emerald-600 dark:text-emerald-300" : "text-[var(--muted-soft)]"}`}>
              {s}
            </span>
            {i < steps.length - 1 && (
              <span className={`mx-0.5 h-px flex-1 rounded-full ${done ? "bg-emerald-400/70" : "bg-[var(--line-strong)]"}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
