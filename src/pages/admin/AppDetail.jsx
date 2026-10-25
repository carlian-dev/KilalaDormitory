import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, ExternalLink, Check, X, PlugZap } from "lucide-react";
import {
  DOC_TYPES,
  TEMPLATE_DOCS,
  UPLOAD_DOCS,
  BILLING,
  formatPeso,
  deviceKindLabel,
  computeTotal,
  normalizeDevices,
} from "../../lib/mockData";
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
  const [devices, setDevices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [savingDevices, setSavingDevices] = useState(false);
  const [deviceSaveMsg, setDeviceSaveMsg] = useState("");
  const [deviceSaveErr, setDeviceSaveErr] = useState("");

  useEffect(() => {
    fetchAllApplications()
      .then((all) => {
        const found = all.find((a) => a.id === id) || null;
        setApp(found);
        if (found) {
          setRemarks(found.remarks || "");
          setDevices(found.devices || []);
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
        <Link to="/admin/apps" className="mt-2 inline-block font-bold text-[#0B2A6B] underline decoration-[#FFD120] decoration-2 hover:underline">Back to queue</Link>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center text-slate-900 dark:bg-[#0A2456] dark:text-white dark:ring-1 dark:ring-white/10">
        <p className="font-bold">Application not found</p>
        <Link to="/admin/apps" className="mt-2 inline-block font-bold text-[#0B2A6B] underline decoration-[#FFD120] decoration-2 hover:underline dark:text-[#FFD120]">Back to queue</Link>
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
        devices,
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
      await updateApplication(app.id, { status: "under_review", remarks, devices });
      const normalized = normalizeDevices(devices);
      setDevices(normalized);
      setApp({
        ...app,
        status: "under_review",
        remarks,
        devices: normalized,
        monthlyTotal: computeTotal(normalized),
      });
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const classifyDevice = (targetIndex, kind) => {
    setDeviceSaveMsg("");
    setDeviceSaveErr("");
    setDevices((prev) =>
      prev.map((d, i) => (i === targetIndex ? { ...d, kind } : d))
    );
  };

  const saveDeviceAssessment = async () => {
    setDeviceSaveErr("");
    setDeviceSaveMsg("");
    setSavingDevices(true);
    try {
      await updateApplication(app.id, { devices });
      const normalized = normalizeDevices(devices);
      setDevices(normalized);
      setApp((prev) =>
        prev
          ? {
              ...prev,
              devices: normalized,
              monthlyTotal: computeTotal(normalized),
            }
          : prev
      );
      setDeviceSaveMsg("Device assessment saved.");
      setTimeout(() => setDeviceSaveMsg(""), 3000);
    } catch (e) {
      setDeviceSaveErr(e.message || "Failed to save device assessment.");
    } finally {
      setSavingDevices(false);
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

  const currentTotal = computeTotal(devices);
  const applianceCount = devices.filter((d) => d.kind === "appliance").length;
  const pendingCount = devices.filter((d) => d.kind === "other").length;
  const customDevices = devices
    .map((d, index) => ({ ...d, originalIndex: index }))
    .filter((d) => !d.key);
  const presetDevices = devices.filter((d) => d.key);
  const hasDeviceChanges = JSON.stringify(devices) !== JSON.stringify(app?.devices || []);

  return (
    <div>
      <button onClick={() => nav("/admin/apps")} className="pressable inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#0B2A6B] shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-0">
        <ArrowLeft size={14} /> Queue
      </button>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-5 sm:p-6 text-slate-900 shadow dark:bg-[#0A2456] dark:text-white dark:ring-1 dark:ring-white/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="h-section text-2xl tracking-tight">{app.name}</h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-300">{app.studentId} · {app.course} · {app.year}</p>
              <p className="text-xs text-slate-400">{app.term} · Submitted {new Date(app.submittedAt).toLocaleString()}</p>
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

          {/* Billing card */}
          <div className="mt-4 rounded-2xl bg-[#0B2A6B] p-4 text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]">
            <div className="flex justify-between items-center text-sm font-bold">
              <span>Expected monthly total</span>
              <span className="text-base sm:text-lg">{formatPeso(currentTotal)}/mo</span>
            </div>
            <div className="mt-2 text-xs space-y-1 opacity-90">
              <div className="flex justify-between">
                <span>Base rate:</span>
                <span className="font-semibold">{formatPeso(BILLING.BASE_RATE)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid appliances ({applianceCount}):</span>
                <span className="font-semibold">+{formatPeso(applianceCount * BILLING.PER_APPLIANCE)}</span>
              </div>
              {pendingCount > 0 && (
                <div className="flex justify-between font-semibold text-amber-300 dark:text-amber-800">
                  <span>Pending assessment:</span>
                  <span>{pendingCount} other item{pendingCount > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] opacity-80 border-t border-white/20 dark:border-[#0B2A6B]/20 pt-2">
              Collected face-to-face at the Housing Office.
            </p>
          </div>

          {/* Declared appliances & devices */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                <PlugZap size={16} /> Declared appliances & gadgets
                <span className="text-xs font-semibold text-slate-400">({devices.length})</span>
              </p>
              {customDevices.length > 0 && (
                pendingCount > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                    {pendingCount} for review
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <Check size={12} /> All assessed
                  </span>
                )
              )}
            </div>

            {devices.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                No appliances or gadgets declared by applicant.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {presetDevices.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Standard presets
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {presetDevices.map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-xs dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                          <span>{d.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              d.kind === "appliance"
                                ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                            }`}
                          >
                            {deviceKindLabel(d.kind)}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customDevices.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-400/30 dark:bg-amber-400/10">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                        Custom declared items (Review & Classify)
                      </p>
                      <span className="text-[11px] text-amber-700/80 dark:text-amber-200/80">
                        Face-to-face assessment
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-200/80">
                      Classify each as Free (gadget) or +₱150/mo (paid appliance). Changes update the expected monthly total.
                    </p>

                    <div className="mt-2.5 space-y-2">
                      {customDevices.map((cd) => (
                        <div
                          key={cd.originalIndex}
                          className="flex flex-col gap-2 rounded-xl border border-amber-200/60 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#0A2456]"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white text-[13px]">
                              {cd.name}
                            </span>
                            <span className="ml-2 inline-block text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Current: {deviceKindLabel(cd.kind)}
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-white/10 shrink-0">
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "gadget")}
                              className={`pressable rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                                cd.kind === "gadget"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                              }`}
                            >
                              Free
                            </button>
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "appliance")}
                              className={`pressable rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                                cd.kind === "appliance"
                                  ? "bg-[#0B2A6B] text-[#FFD120] shadow-xs dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                              }`}
                            >
                              +₱150 Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "other")}
                              className={`pressable rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                                cd.kind === "other"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                              }`}
                            >
                              For review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-amber-200/60 pt-2 dark:border-amber-400/20">
                      <div className="text-xs">
                        {deviceSaveMsg ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {deviceSaveMsg}
                          </span>
                        ) : deviceSaveErr ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {deviceSaveErr}
                          </span>
                        ) : hasDeviceChanges ? (
                          <span className="font-medium text-amber-800 dark:text-amber-200">
                            Unsaved device changes
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            All classifications saved
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={saveDeviceAssessment}
                        disabled={savingDevices || !hasDeviceChanges}
                        className="pressable rounded-full bg-[#0B2A6B] px-3.5 py-1.5 text-xs font-bold text-[#FFD120] hover:bg-[#0B2A6B]/90 disabled:opacity-50 dark:bg-[#FFD120] dark:text-[#0B2A6B] dark:hover:bg-[#FFD120]/90"
                      >
                        {savingDevices ? "Saving…" : "Save classification"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="h-section mt-5 text-sm">Signed forms ({app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length}/{TEMPLATE_DOCS.length})</p>
          <div className="mt-2 grid gap-2">
            {app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).map((d) => (
              <div key={d.type} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"><FileText size={16} /></span>
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

          <p className="h-section mt-5 text-sm">Student documents ({app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length}/{UPLOAD_DOCS.length})</p>
          <div className="mt-2 grid gap-2">
            {app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).map((d) => (
              <div key={d.type} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"><FileText size={16} /></span>
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

        <div className="h-fit rounded-3xl bg-white p-5 sm:p-6 text-slate-900 shadow dark:bg-[#0A2456] dark:text-white dark:ring-1 dark:ring-white/10">
          <p className="h-section text-sm">Decision</p>
          <label className="mt-3 block text-[13px] font-bold">Admin remarks <span className="font-medium text-slate-400">(shown to student)</span>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} placeholder="e.g. Requirements complete and verified."
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0B2A6B] focus:ring-4 focus:ring-[#FFD120]/40 dark:border-white/15 dark:bg-white/5 dark:text-white" />
          </label>
          {saveErr && <p className="mt-2 text-[13px] font-semibold text-rose-500">{saveErr}</p>}
          <div className="mt-3 grid gap-2">
            <button onClick={markReview} disabled={saving} className="pressable rounded-full bg-[#DCE6FA] py-2.5 text-sm font-bold text-[#0B2A6B] ring-1 ring-[#0B2A6B]/20 disabled:opacity-50">
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
