import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { statusMeta } from "../../lib/mockData";
import { fetchAllApplications } from "../../lib/applications";

const FILTERS = [["all", "All"], ["pending", "Pending"], ["under_review", "Under review"], ["approved", "Approved"], ["rejected", "Needs resubmit"]];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchAllApplications()
      .then(setApplications)
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    return applications.filter((a) => {
      if (f !== "all" && a.status !== f) return false;
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return [a.name, a.studentId, a.course].join(" ").toLowerCase().includes(needle);
    });
  }, [applications, f, q]);

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Queue · {list.length} shown</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Applications</h1>

      {fetchErr && <p className="mt-3 rounded-2xl bg-rose-500/10 p-3 text-[13px] font-semibold text-rose-300 ring-1 ring-rose-400/30">{fetchErr}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 text-slate-900 dark:bg-white/5 dark:text-white dark:ring-1 dark:ring-white/15">
          <Search size={15} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, student ID, course…" className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400" />
        </label>
        <div className="nice-scroll flex gap-1.5 overflow-x-auto">
          {FILTERS.map(([k, label]) => (
            <button key={k} onClick={() => setF(k)}
              className={`pressable whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] font-bold ${f === k ? "bg-[#FFC72C] text-[#0A1F44]" : "bg-white/10 text-slate-300"}`}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl bg-white text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
        {loading && <p className="p-8 text-center text-sm text-slate-400">Loading…</p>}
        {!loading && list.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No applications match. Try clearing search.</p>}
        {list.map((a) => (
          <Link key={a.id} to={`/admin/apps/${a.id}`} className="pressable flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${a.status === "approved" ? "bg-emerald-500 text-white" : a.status === "rejected" ? "bg-rose-500 text-white" : a.status === "under_review" ? "bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]" : "bg-[#F5B800] text-[#0A1F44]"}`}>
              {(a.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{a.name}</span>
              <span className="block truncate text-xs text-slate-400">{a.course} · {a.year} · {a.docs.length}/9 docs</span>
            </span>
            <span className={`hidden sm:inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusMeta[a.status].pill}`}>{statusMeta[a.status].label}</span>
            <ChevronRight size={16} className="text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
