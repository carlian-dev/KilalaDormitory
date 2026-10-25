import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, FileText, PlusCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { PageFade, StatusBadge } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, formatPeso, deviceKindLabel } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { fetchMyApplications, signedDocUrl, resubmitDocuments } from "../lib/applications";

const docLabel = (t) => DOC_TYPES.find((d) => d.key === t)?.label || t;

function timelineOf(status) {
  if (status === "rejected") return ["Submitted", "Reviewed", "Needs resubmit"];
  const order = ["pending", "under_review", "approved"];
  const idx = order.indexOf(status);
  return ["Submitted", idx >= 1 ? "Under review" : "Review", idx === 2 ? "Approved" : "Decision"];
}

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
    const steps = timelineOf(selected.status);
    return (
      <PageFade>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <button onClick={() => setParams({})} className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#0B2A6B]/5 px-4 py-2 text-[13px] font-bold text-[#0B2A6B] dark:bg-white/10 dark:text-white">
            <ArrowLeft size={14} /> My applications
          </button>
          <div className="mt-4 rounded-3xl bg-white p-5 sm:p-7 shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10 dark:text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold tracking-tight">{profile?.full_name}</p>
                <p className="text-[13px] text-slate-500 dark:text-slate-300">{selected.studentId} · {selected.course} · {selected.year}</p>
                <p className="text-xs text-slate-400">{selected.term} · Submitted {new Date(selected.submittedAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 rounded-2xl bg-[#0B2A6B] p-3.5 text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]">
              <div className="flex justify-between text-sm font-bold">
                <span>Expected monthly total</span><span>{formatPeso(selected.monthlyTotal)}/mo</span>
              </div>
              <p className="mt-0.5 text-xs opacity-80">
                {formatPeso(BILLING.BASE_RATE)} base
                {(selected.devices || []).length > 0
                  ? ` · Devices: ${selected.devices.map((d) => `${d.name} (${deviceKindLabel(d.kind)})`).join(", ")}`
                  : " · No devices declared"}
              </p>
              {selected.devices?.some((d) => d.kind === "other") && (
                <p className="mt-1 text-xs opacity-80">Items marked “For review” are assessed by the Housing Office and are not included in the expected total.</p>
              )}
              <p className="mt-1 text-xs opacity-80">Payment is made face-to-face at the Housing Office — no online payment is collected.</p>
            </div>

            <div className="mt-5 flex items-center gap-1">
              {steps.map((t, i, arr) => (
                <div key={t} className="flex flex-1 items-center gap-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i === arr.length - 1 ? (selected.status === "rejected" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white") : "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"}`}>{i + 1}</span>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600 dark:text-slate-300">{t}</span>
                  </div>
                  {i < arr.length - 1 && <span className="mx-1 mb-5 h-px flex-1 bg-slate-200 dark:bg-white/15" />}
                </div>
              ))}
            </div>

            {selected.remarks && (
              <div className={`mt-4 rounded-2xl p-3.5 text-[13px] ring-1 ${selected.status === "rejected" ? "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30" : "bg-[#FFF8E1] text-[#0B2A6B] ring-[#FFD120] dark:bg-[#FFD120]/10 dark:text-[#FFE9A8] dark:ring-[#FFD120]/40"}`}>
                <b>Admin note:</b> {selected.remarks}
              </div>
            )}

            <p className="mt-5 text-sm font-bold">Signed forms ({selected.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length}/{TEMPLATE_DOCS.length})</p>
            <div className="mt-2 grid gap-2">
              {selected.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{docLabel(d.type)}</p>
                    <p className="truncate text-xs text-slate-400">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-[#0B2A6B] px-3 py-1.5 text-xs font-bold text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                    <ExternalLink size={12} /> View
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm font-bold">Your documents ({selected.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length}/{UPLOAD_DOCS.length})</p>
            <div className="mt-2 grid gap-2">
              {selected.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{docLabel(d.type)}</p>
                    <p className="truncate text-xs text-slate-400">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-[#0B2A6B] px-3 py-1.5 text-xs font-bold text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                    <ExternalLink size={12} /> View
                  </button>
                </div>
              ))}
            </div>

            {selected.status === "rejected" && (
              <ResubmitBox
                appId={selected.id}
                onDone={async () => { await load(); setParams({}); }}
              />
            )}
          </div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div>
          <h1 className="h-section text-3xl font-bold text-[#0B2A6B] dark:text-white">
            Hello, {profile?.full_name?.split(" ")[0] || "applicant"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{user?.email}</p>
        </div>

        {fetchErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">{fetchErr}</p>}

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-400">Loading your applications…</p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Pending", count("pending"), "bg-amber-400 dark:bg-amber-300"],
                ["Under review", count("under_review"), "bg-sky-500 dark:bg-sky-400"],
                ["Approved", count("approved"), "bg-emerald-500 dark:bg-emerald-400"],
                ["Needs resubmit", count("rejected"), "bg-rose-500 dark:bg-rose-400"],
              ].map(([k, v, dot]) => (
                <div key={k} className="rounded-2xl bg-white px-3 py-3.5 text-center shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10">
                  <p className="text-2xl font-bold text-[#0B2A6B] dark:text-[#FFD120]">{v}</p>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />{k}
                  </p>
                </div>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/15 dark:text-white">
              <Search size={15} className="text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by course or status…"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400" />
            </label>

            {filtered.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10">
                <p className="text-lg font-bold dark:text-white">{mine.length === 0 ? "No applications yet" : "No matches"}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-300">
                  {mine.length === 0
                    ? "Submit your first dorm application with the 3 requirements."
                    : "Try a different search term."}
                </p>
                {mine.length === 0 && (
                  <Link to="/apply" className="pressable mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFD120] px-6 py-3 text-sm font-bold text-[#0B2A6B] hover:bg-[#F0BB00]">
                    <PlusCircle size={15} /> Start application
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10 dark:text-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-bold">My applications</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {filtered.length} of {mine.length} shown
                  </p>
                </div>
                {filtered.map((a) => (
                  <button key={a.id} onClick={() => setParams({ id: a.id })}
                    className="pressable flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left last:border-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{a.course} · {a.year}</span>
                      <span className="block truncate text-xs text-slate-400">{formatPeso(a.monthlyTotal)}/mo · Submitted {new Date(a.submittedAt).toLocaleDateString()}</span>
                    </span>
                    <StatusBadge status={a.status} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageFade>
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
    <div className="mt-5 rounded-2xl bg-[#FFF8E1] p-4 ring-1 ring-[#FFD120] dark:bg-[#FFD120]/10 dark:ring-[#FFD120]/40">
      <p className="text-sm font-bold text-[#0B2A6B] dark:text-[#FFE9A8]">Fix your documents and resubmit</p>
      <p className="mt-0.5 text-[13px] text-[#0B2A6B]/70 dark:text-[#FFE9A8]/70">
        Upload fresh copies of all 10 documents. Your application goes back to Pending for re-review.
      </p>
      <div className="mt-3 grid gap-3 rounded-2xl bg-white p-3 dark:bg-[#0A2456]">
        {DOC_TYPES.map((d) => (
          <FileUploader key={d.key} label={d.label} hint={d.hint}
            value={files[d.key]} onChange={(v) => setFiles((f) => ({ ...f, [d.key]: v }))} />
        ))}
      </div>
      {err && <p className="mt-2 text-[13px] font-semibold text-rose-500">{err}</p>}
      <button onClick={submit} disabled={busy || !ready}
        className="pressable mt-3 w-full rounded-full bg-[#FFD120] py-2.5 text-sm font-bold text-[#0B2A6B] hover:bg-[#F0BB00] disabled:opacity-50">
        {busy ? "Uploading…" : "Resubmit for review"}
      </button>
    </div>
  );
}
