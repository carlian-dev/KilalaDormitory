import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ChevronRight, Clock, FileSearch, Files, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { StatusBadge } from "../../components/ui";
import { fetchAllApplications } from "../../lib/applications";

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    fetchAllApplications()
      .then(setApplications)
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const count = (s) => applications.filter((a) => a.status === s).length;
  const stats = [
    { label: "Pending", v: count("pending"), icon: Clock, tone: "bg-[#FFF8E1] text-[#0B2A6B] ring-[#FFD120]/50 dark:bg-[#FFD120]/10 dark:text-[#FFD120] dark:ring-[#FFD120]/25" },
    { label: "Under review", v: count("under_review"), icon: FileSearch, tone: "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]" },
    { label: "Approved", v: count("approved"), icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-400/25" },
    { label: "Needs resubmit", v: count("rejected"), icon: AlertTriangle, tone: "bg-rose-500/10 text-rose-600 ring-rose-200 dark:text-rose-300 dark:ring-rose-400/25" },
  ];
  const recent = applications.slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="h-section mt-2 text-2xl text-[var(--ink)] sm:text-3xl">Housing office</h1>
          <p className="mt-1.5 text-[12px] text-[var(--muted)]">Every application, in one queue.</p>
        </div>
        <Link to="/admin/apps" className="pressable btn btn-secondary btn-sm hidden sm:inline-flex">
          <Files size={14} /> Open queue
        </Link>
      </div>

      {fetchErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">{fetchErr}</p>}
      {loading && <p className="mt-8 text-[13px] text-[var(--muted-soft)]">Loading…</p>}

      {!loading && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", bounce: 0, duration: 0.4 }}
                className="card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${s.tone}`}>
                    <s.icon size={16} />
                  </span>
                  <span className="text-3xl font-extrabold tracking-tight text-[var(--ink)]">{s.v}</span>
                </div>
                <p className="mt-4 text-[11px] font-semibold text-[var(--muted)]">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <p className="text-[13px] font-bold text-[var(--ink)]">Latest submissions</p>
              <Link to="/admin/apps" className="pressable inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {recent.length === 0 && (
              <p className="px-5 py-10 text-center text-[13px] text-[var(--muted-soft)]">No applications yet.</p>
            )}

            {recent.map((a) => (
              <Link key={a.id} to={`/admin/apps/${a.id}`} className="pressable group flex items-center gap-3 border-b border-[var(--line)] px-5 py-3.5 last:border-0 hover:bg-[var(--surface-2)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0B2A6B]/[0.06] text-[11px] font-bold text-[#0B2A6B] dark:bg-white/10 dark:text-[#FFD120]">
                  {(a.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--ink)]">{a.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[var(--muted-soft)]">{a.course} · {new Date(a.submittedAt).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={a.status} />
                <ChevronRight size={15} className="shrink-0 text-[var(--muted-soft)] transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
