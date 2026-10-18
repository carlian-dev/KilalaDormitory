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

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[#041743]/45 px-4 backdrop-blur-sm" role="presentation" onMouseDown={onCancel}>
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-[#0A2456] dark:ring-white/15"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#0B2A6B] dark:text-white">{title}</h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="pressable rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Cancel</button>
          <button type="button" onClick={onConfirm} className="pressable rounded-full bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-600">{confirmLabel}</button>
        </div>
      </section>
    </div>
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
              done ? "bg-emerald-500 text-white" : active ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]" : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-300"
            }`}>{done ? "✓" : i + 1}</span>
            <span className={`hidden sm:block text-[13px] font-semibold ${active ? "text-[#0B2A6B] dark:text-white" : "text-slate-400"}`}>{s}</span>
            {i < steps.length - 1 && <span className={`mx-1 h-px flex-1 ${done ? "bg-emerald-300" : "bg-slate-200 dark:bg-white/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
