import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, FileText, PlusCircle, Search } from "lucide-react";
import { PageFade, StatusBadge } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, formatPeso, deviceKindLabel } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { fetchMyApplications, signedDocUrl, resubmitDocuments } from "../lib/applications";

const docLabel = (t) => DOC_TYPES.find((d) => d.key === t)?.label || t;
const formatDate = (value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function ApplicantDashboard() {
  const { user, profile } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");

  const load = () => {
    if (!user) return Promise.resolve();
    setLoading(true);
    setFetchErr("");
    return fetchMyApplications(user.id)
      .then(setMine)
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return mine;
    return mine.filter((a) => [a.course, a.status].join(" ").toLowerCase().includes(needle));
  }, [mine, q]);

  const selectedId = params.get("id");
  const selected = selectedId ? mine.find((a) => a.id === selectedId) || null : null;

  const count = (s) => mine.filter((a) => a.status === s).length;

  const openDoc = async (doc) => {
    try {
      const url = await signedDocUrl(doc.path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("Could not open document: " + e.message);
    }
  };

  if (selected) {
    const signedForms = selected.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type));
    const studentDocs = selected.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type));

    return (
      <PageFade>
        <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-11">
          <button onClick={() => setParams({})} className="pressable inline-flex items-center gap-1.5 rounded-full py-1 text-[12px] font-bold text-[var(--muted)] hover:text-[var(--ink)]">
            <ArrowLeft size={14} /> My applications
          </button>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="grid gap-4">
              <section className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Application</p>
                    <h1 className="h-section mt-1.5 text-2xl text-[var(--ink)]">{profile?.full_name}</h1>
                    <p className="mt-1 text-[13px] text-[var(--muted)]">
                      {selected.studentId} · {selected.course} · {selected.year}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-soft)]">
                      {selected.term} · Submitted {formatDate(selected.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <ApplicationTimeline status={selected.status} />

                {selected.remarks && (
                  <div className={`mt-5 rounded-2xl p-3.5 text-[12px] leading-relaxed ring-1 ${
                    selected.status === "rejected"
                      ? "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30"
                      : "bg-[#FFF8E1] text-[#0B2A6B] ring-[#FFD120] dark:bg-[#FFD120]/10 dark:text-[#FFE9A8] dark:ring-[#FFD120]/40"
                  }`}>
                    <b>Note from the Housing Office:</b> {selected.remarks}
                  </div>
                )}
              </section>

              <section className="card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="h-section text-base text-[var(--ink)]">Documents</h2>
                  <span className="text-[11px] font-semibold text-[var(--muted-soft)]">
                    {selected.docs.length}/{DOC_TYPES.length} attached
                  </span>
                </div>

                <DocGroup title="Signed forms" docs={signedForms} total={TEMPLATE_DOCS.length} onOpen={openDoc} />
                <DocGroup title="Your documents" docs={studentDocs} total={UPLOAD_DOCS.length} onOpen={openDoc} />
              </section>

              {selected.status === "rejected" && (
                <ResubmitBox
                  appId={selected.id}
                  onDone={async () => { await load(); setParams({}); }}
                />
              )}
            </div>

            <aside className="grid gap-4 self-start">
              <section className="rounded-3xl border border-[#FFD120]/60 bg-[#FFF8E1] p-5 dark:border-[#FFD120]/30 dark:bg-[#FFD120]/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2A6B]/60 dark:text-[#FFD120]/70">Expected monthly total</p>
                <p className="mt-1.5 flex items-baseline gap-1 text-[#0B2A6B] dark:text-white">
                  <span className="text-3xl font-extrabold tracking-tight">{formatPeso(selected.monthlyTotal)}</span>
                  <span className="text-[13px] font-semibold opacity-60">/mo</span>
                </p>
                <div className="mt-4 space-y-1.5 border-t border-[#0B2A6B]/10 pt-3 text-[12px] text-[#0B2A6B]/75 dark:border-white/10 dark:text-slate-300">
                  <div className="flex justify-between gap-2"><span>Base rate</span><span className="font-semibold">{formatPeso(BILLING.BASE_RATE)}</span></div>
                  {selected.devices?.length > 0 && (
                    <div className="flex justify-between gap-2">
                      <span>Paid appliances</span>
                      <span className="font-semibold">
                        {(selected.devices || []).filter((d) => d.kind === "appliance").length} × {formatPeso(BILLING.PER_APPLIANCE)}
                      </span>
                    </div>
                  )}
                </div>

                {selected.devices?.length > 0 && (
                  <div className="mt-3 border-t border-[#0B2A6B]/10 pt-3 dark:border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0B2A6B]/55 dark:text-[#FFD120]/70">Declared</p>
                    <ul className="mt-1.5 space-y-1 text-[12px] text-[#0B2A6B] dark:text-slate-200">
                      {selected.devices.map((d, i) => (
                        <li key={`${d.name}-${i}`} className="flex justify-between gap-2">
                          <span className="truncate">{d.name}</span>
                          <span className={`shrink-0 font-semibold ${d.kind === "appliance" ? "text-[#0B2A6B] dark:text-[#FFD120]" : d.kind === "gadget" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
                            {deviceKindLabel(d.kind)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mt-3 border-t border-[#0B2A6B]/10 pt-3 text-[11px] leading-relaxed text-[#0B2A6B]/65 dark:border-white/10 dark:text-slate-300">
                  Payment is made face-to-face at the Housing Office — no online payment is collected.
                  {selected.devices?.some((d) => d.kind === "other") ? " Items marked “For review” are assessed by the office and aren't included yet." : ""}
                </p>
              </section>

              <section className="card p-5">
                <p className="eyebrow">Application details</p>
                <dl className="mt-3 grid gap-2.5 text-[12px]">
                  {[
                    ["Term", selected.term],
                    ["Submitted", formatDate(selected.submittedAt)],
                    ["Student ID", selected.studentId],
                    ["College", selected.college || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-[var(--muted)]">{k}</dt>
                      <dd className="text-right font-semibold text-[var(--ink)]">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </PageFade>
    );
  }

  const stats = [
    { label: "Pending", value: count("pending"), dot: "bg-[#F0BB00]" },
    { label: "Under review", value: count("under_review"), dot: "bg-[#0B2A6B] dark:bg-[#FFD120]" },
    { label: "Approved", value: count("approved"), dot: "bg-emerald-500" },
    { label: "Needs resubmit", value: count("rejected"), dot: "bg-rose-500" },
  ];

  return (
    <PageFade>
      <div className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-11">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Student portal</p>
            <h1 className="h-section mt-2 text-3xl text-[var(--ink)] sm:text-[2.4rem]">
              Hello, {profile?.full_name?.split(" ")[0] || "applicant"}.
            </h1>
            <p className="mt-1.5 text-[13px] text-[var(--muted)]">{user?.email}</p>
          </div>
          {!loading && mine.length === 0 && (
            <Link to="/apply" className="pressable btn btn-accent">
              <PlusCircle size={15} /> Start application
            </Link>
          )}
        </div>

        {fetchErr && (
          <p className="mt-5 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30">
            {fetchErr}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-center text-[13px] text-[var(--muted-soft)]">Loading your applications…</p>
        ) : (
          <>
            <div className="card mt-7 grid grid-cols-2 gap-px overflow-hidden bg-[var(--line)] sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-[var(--surface)] px-4 py-4">
                  <p className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">{s.value}</span>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">{s.label}</p>
                </div>
              ))}
            </div>

            {mine.length === 0 ? (
              <div className="card mt-4 flex flex-col items-center px-6 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#FFF8E1] text-[#0B2A6B] ring-1 ring-[#FFD120]/50 dark:bg-[#FFD120]/10 dark:text-[#FFD120]">
                  <FileText size={20} />
                </span>
                <h2 className="h-section mt-4 text-lg text-[var(--ink)]">No applications yet</h2>
                <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[var(--muted)]">
                  Start your dorm application and keep every update in this dashboard. Your draft saves as you go.
                </p>
                <Link to="/apply" className="pressable btn btn-accent mt-5">
                  <PlusCircle size={15} /> Start application
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="h-section text-base text-[var(--ink)]">My applications</h2>
                  <label className="flex w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 shadow-sm sm:w-64">
                    <Search size={14} className="shrink-0 text-[var(--muted-soft)]" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search by course or status…"
                      className="w-full bg-transparent py-2.5 text-[12px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-soft)]"
                    />
                  </label>
                </div>

                {filtered.length === 0 ? (
                  <div className="card mt-3 p-10 text-center">
                    <p className="h-section text-base text-[var(--ink)]">No matches</p>
                    <p className="mt-1 text-[13px] text-[var(--muted)]">Try a different search term.</p>
                  </div>
                ) : (
                  <div className="card mt-3 overflow-hidden">
                    {filtered.map((a, i) => (
                      <button
                        key={a.id}
                        onClick={() => setParams({ id: a.id })}
                        className={`pressable group flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[var(--surface-2)] sm:px-5 ${i ? "border-t border-[var(--line)]" : ""}`}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B2A6B]/[0.06] text-[#0B2A6B] dark:bg-white/10 dark:text-[#FFD120]">
                          <FileText size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-[var(--ink)]">{a.course} · {a.year}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-[var(--muted)]">
                            {formatPeso(a.monthlyTotal)}/mo · Submitted {formatDate(a.submittedAt)}
                          </span>
                        </span>
                        <StatusBadge status={a.status} />
                        <ChevronRight size={15} className="shrink-0 text-[var(--muted-soft)] transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </PageFade>
  );
}

function ApplicationTimeline({ status }) {
  const labels = ["Submitted", "Review", status === "rejected" ? "Needs resubmit" : status === "approved" ? "Approved" : "Decision"];
  const finalTone = status === "rejected" ? "rose" : "emerald";

  return (
    <div className="relative mt-6 px-2">
      <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-3.5 h-px bg-[var(--line-strong)]" />
      <ol className="relative grid grid-cols-3 gap-2">
        {labels.map((label, i) => {
          const done = i === 0
            || (i === 1 && status !== "pending")
            || (i === 2 && (status === "approved" || status === "rejected"));
          const active = !done && ((i === 1 && status === "pending") || (i === 2 && status === "under_review"));
          const isFinal = i === 2;
          return (
            <li key={label} className="flex flex-col items-center gap-2 text-center">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ring-4 ring-[var(--surface)] ${
                  done
                    ? isFinal && finalTone === "rose"
                      ? "bg-rose-500 text-white"
                      : "bg-emerald-500 text-white"
                    : active
                      ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                      : "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted-soft)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className={`text-[11px] font-semibold ${active ? "text-[var(--ink)]" : done ? "text-[var(--muted)]" : "text-[var(--muted-soft)]"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DocGroup({ title, docs, total, onOpen }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-bold text-[var(--ink)]">{title}</p>
        <span className="text-[11px] font-semibold text-[var(--muted-soft)]">{docs.length}/{total}</span>
      </div>
      {docs.length === 0 ? (
        <p className="mt-2 rounded-xl bg-[var(--surface-2)] px-3 py-3 text-[12px] text-[var(--muted-soft)]">No files attached yet.</p>
      ) : (
        <div className="mt-2 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
          {docs.map((d) => (
            <div key={d.type} className="flex items-center gap-3 px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)]">
                <FileText size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[var(--ink)]">{docLabel(d.type)}</p>
                <p className="truncate text-[11px] text-[var(--muted-soft)]">{d.fileName}</p>
              </div>
              <button
                onClick={() => onOpen(d)}
                className="pressable inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[var(--ink)] hover:bg-[var(--surface-2)]"
              >
                <ExternalLink size={12} /> View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResubmitBox({ appId, onDone }) {
  const [files, setFiles] = useState(() => Object.fromEntries(DOC_TYPES.map((d) => [d.key, null])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = DOC_TYPES.every((d) => files[d.key]);

  const submit = async () => {
    if (!ready) { setErr("Please re-upload all 10 documents."); return; }
    setErr("");
    setBusy(true);
    try {
      await resubmitDocuments({ appId, files });
      await onDone();
    } catch (e) {
      setErr(e.message || "Re-upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-[#FFD120] bg-[#FFF8E1] p-5 dark:border-[#FFD120]/40 dark:bg-[#FFD120]/10">
      <h2 className="h-section text-base text-[#0B2A6B] dark:text-[#FFE9A8]">Fix your documents and resubmit</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-[#0B2A6B]/70 dark:text-[#FFE9A8]/70">
        Upload fresh copies of all 10 documents. Your application goes back to Pending for re-review.
      </p>
      <div className="mt-3 grid gap-3 rounded-2xl bg-[var(--surface)] p-3">
        {DOC_TYPES.map((d) => (
          <FileUploader key={d.key} label={d.label} hint={d.hint}
            value={files[d.key]} onChange={(v) => setFiles((f) => ({ ...f, [d.key]: v }))} />
        ))}
      </div>
      {err && <p className="mt-2 text-[12px] font-semibold text-rose-600">{err}</p>}
      <button onClick={submit} disabled={busy || !ready} className="pressable btn btn-accent mt-3 w-full">
        {busy ? "Uploading…" : "Resubmit for review"}
      </button>
    </section>
  );
}
