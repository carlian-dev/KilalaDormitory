import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import { StatusBadge } from "../../components/ui";
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

  const counts = useMemo(() => {
    const by = { all: applications.length, pending: 0, under_review: 0, approved: 0, rejected: 0 };
    for (const a of applications) by[a.status] = (by[a.status] || 0) + 1;
    return by;
  }, [applications]);

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
      <p className="eyebrow">Queue</p>
      <div className="mt-2 flex flex-wrap items-center gap-2.5">
        <h1 className="h-section text-2xl text-[var(--ink)] sm:text-3xl">Applications</h1>
        <span className="chip border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]">{list.length} shown</span>
      </div>

      {fetchErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">{fetchErr}</p>}

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 shadow-sm">
          <Search size={14} className="shrink-0 text-[var(--muted-soft)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, student ID, course…"
            className="w-full bg-transparent py-2.5 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-soft)]"
          />
        </label>
        <div className="nice-scroll flex gap-1.5 overflow-x-auto pb-0.5">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setF(k)}
              className={`pressable inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold ${
                f === k
                  ? "bg-[#0B2A6B] text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                f === k
                  ? "bg-white/20 text-white dark:bg-[#0B2A6B]/15 dark:text-[#0B2A6B]"
                  : "bg-[var(--surface-2)] text-[var(--muted-soft)]"
              }`}>{counts[k] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card mt-3 overflow-hidden">
        {loading && <p className="p-10 text-center text-[13px] text-[var(--muted-soft)]">Loading…</p>}
        {!loading && list.length === 0 && (
          <p className="p-10 text-center text-[13px] text-[var(--muted-soft)]">
            {applications.length === 0 ? "No applications yet." : "No applications match. Try clearing the search."}
          </p>
        )}
        {list.map((a) => (
          <Link key={a.id} to={`/admin/apps/${a.id}`} className="pressable group flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-0 hover:bg-[var(--surface-2)] sm:px-5">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
              a.status === "approved"
                ? "bg-emerald-500 text-white"
                : a.status === "rejected"
                  ? "bg-rose-500 text-white"
                  : a.status === "under_review"
                    ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                    : "bg-[#F0BB00] text-[#0B2A6B]"
            }`}>
              {(a.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold text-[var(--ink)]">{a.name}</span>
              <span className="mt-0.5 block truncate text-[11px] text-[var(--muted-soft)]">
                {a.course} · {a.year} · {a.docs.length}/10 docs · {new Date(a.submittedAt).toLocaleDateString()}
              </span>
            </span>
            <StatusBadge status={a.status} />
            <ChevronRight size={16} className="shrink-0 text-[var(--muted-soft)] transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
