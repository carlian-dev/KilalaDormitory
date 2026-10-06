import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { statusMeta } from "../../lib/mockData";
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
    { label: "Pending", v: count("pending"), icon: Clock, tone: "bg-[#F5B800] text-[#0A1F44]" },
    { label: "Under review", v: count("under_review"), icon: AlertTriangle, tone: "bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]" },
    { label: "Approved", v: count("approved"), icon: CheckCircle2, tone: "bg-emerald-500 text-white" },
    { label: "Needs resubmit", v: count("rejected"), icon: AlertTriangle, tone: "bg-rose-500 text-white" },
  ];
  const recent = applications.slice(0, 5);

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Overview</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Kilala Housing Office</h1>
      <p className="mt-1 text-sm text-slate-400">{applications.length} total applications · paperless queue</p>

      {fetchErr && <p className="mt-3 rounded-2xl bg-rose-500/10 p-3 text-[13px] font-semibold text-rose-300 ring-1 ring-rose-400/30">{fetchErr}</p>}
      {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}

      {!loading && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, type: "spring", bounce: 0, duration: 0.4 }}
                className="rounded-3xl bg-white p-4 text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
                <span className={`inline-grid h-8 w-8 place-items-center rounded-xl ${s.tone}`}><s.icon size={16} /></span>
                <p className="mt-2 text-2xl font-bold">{s.v}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl bg-white p-4 sm:p-5 text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
            <div className="flex items-center justify-between">
              <p className="font-bold">Latest submissions</p>
              <Link to="/admin/apps" className="pressable inline-flex items-center gap-1 rounded-full bg-[#0A1F44] px-4 py-2 text-xs font-bold text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">Review all <ArrowRight size={13} /></Link>
            </div>
            <div className="mt-3 divide-y divide-slate-100 dark:divide-white/10">
              {recent.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No applications yet.</p>}
              {recent.map((a) => (
                <Link key={a.id} to={`/admin/apps/${a.id}`} className="pressable flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.course} · {new Date(a.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusMeta[a.status].pill}`}>{statusMeta[a.status].label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
            <p className="font-bold text-white">Reviewer tip</p>
            <p className="mt-1 text-[13px] text-slate-300">Open an application → view the 3 uploads → Approve, or Reject with a clear remark. Remarks appear in the student's dashboard.</p>
          </div>
        </>
      )}
    </div>
  );
}
