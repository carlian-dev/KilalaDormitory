import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, ExternalLink, Check, X } from "lucide-react";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, formatPeso } from "../../lib/mockData";
import { StatusBadge } from "../../components/ui";
import { fetchAllApplications, updateApplication, signedDocUrl } from "../../lib/applications";

const label = (t) => DOC_TYPES.find((d) => d.key === t)?.label || t;

export default function AppDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  useEffect(() => {
    fetchAllApplications()
      .then((all) => {
        const found = all.find((a) => a.id === id) || null;
        setApp(found);
        if (found) {
          setRemarks(found.remarks || "");
        }
      })
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>;

  if (fetchErr) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-900">
        <p className="font-bold">Could not load application</p>
        <p className="mt-1 text-sm text-slate-500">{fetchErr}</p>
        <Link to="/admin/apps" className="mt-2 inline-block font-bold text-[#0A1F44] underline decoration-[#FFC72C] decoration-2 hover:underline">Back to queue</Link>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-900 dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
        <p className="font-bold">Application not found</p>
        <Link to="/admin/apps" className="mt-2 inline-block font-bold text-[#0A1F44] underline decoration-[#FFC72C] decoration-2 hover:underline dark:text-[#FFC72C]">Back to queue</Link>
      </div>
    );
  }

  const decide = async (status) => {
    setSaveErr("");
    setSaving(true);
    try {
      await updateApplication(app.id, {
        status,
        remarks,
      });
      nav("/admin/apps");
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const markReview = async () => {
    setSaveErr("");
    setSaving(true);
    try {
      await updateApplication(app.id, { status: "under_review", remarks });
      setApp({ ...app, status: "under_review", remarks });
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openDoc = async (doc) => {
    try {
      const url = await signedDocUrl(doc.path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("Could not open document: " + e.message);
    }
  };

  return (
    <div>
      <button onClick={() => nav("/admin/apps")} className="pressable inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold text-slate-200">
        <ArrowLeft size={14} /> Queue
      </button>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-5 sm:p-6 text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs font-bold text-slate-400 break-all">{app.id}</p>
              <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-300">{app.studentId} · {app.course} · {app.year}</p>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
            {[["Phone", app.phone], ["Guardian", app.guardian], ["Address", app.address], ["Term", app.term], ["Submitted", new Date(app.submittedAt).toLocaleString()]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="font-semibold break-words">{v || "—"}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-2xl bg-[#0A1F44] p-3.5 text-white dark:bg-[#FFC72C] dark:text-[#0A1F44]">
            <div className="flex justify-between text-sm font-bold">
              <span>Monthly rate</span><span>{formatPeso(app.monthlyTotal)}/mo</span>
            </div>
            <p className="mt-0.5 text-xs opacity-80">
              {formatPeso(BILLING.BASE_RATE)} base
              {(app.devices || []).length > 0
                ? ` · Devices: ${app.devices.map((d) => `${d.name} (${d.kind === "appliance" ? "+₱150" : "free"})`).join(", ")}`
                : " · No devices declared"}
            </p>
          </div>

          <p className="mt-5 text-sm font-bold">Signed forms ({app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length}/{TEMPLATE_DOCS.length})</p>
          <div className="mt-2 grid gap-2">
            {app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).map((d) => (
              <div key={d.type} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{label(d.type)}</p>
                  <p className="truncate font-mono text-xs text-slate-400">{d.fileName}</p>
                </div>
                <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-white/10">
                  <ExternalLink size={13} /> Open
                </button>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm font-bold">Student documents ({app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length}/{UPLOAD_DOCS.length})</p>
          <div className="mt-2 grid gap-2">
            {app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).map((d) => (
              <div key={d.type} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]"><FileText size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold">{label(d.type)}</p>
                  <p className="truncate font-mono text-xs text-slate-400">{d.fileName}</p>
                </div>
                <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-white/10">
                  <ExternalLink size={13} /> Open
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-3xl bg-white p-5 sm:p-6 text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
          <p className="font-bold">Decision</p>
          <label className="mt-3 block text-[13px] font-bold">Admin remarks <span className="font-medium text-slate-400">(shown to student)</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="e.g. Requirements complete and verified."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0A1F44] focus:ring-4 focus:ring-[#FFC72C]/40 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          {saveErr && <p className="mt-2 text-[13px] font-semibold text-rose-500">{saveErr}</p>}
          <div className="mt-3 grid gap-2">
            <button onClick={markReview} disabled={saving} className="pressable rounded-full bg-[#DCE6FA] py-2.5 text-sm font-bold text-[#0A1F44] ring-1 ring-[#0A1F44]/20 disabled:opacity-50">
              Mark under review
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => decide("approved")} disabled={saving} className="pressable inline-flex items-center justify-center gap-1 rounded-full bg-emerald-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <Check size={15} /> Approve
              </button>
              <button onClick={() => decide("rejected")} disabled={saving} className="pressable inline-flex items-center justify-center gap-1 rounded-full bg-rose-500 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                <X size={15} /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
