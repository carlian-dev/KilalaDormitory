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

  if (loading) return <p className="py-10 text-center text-[13px] text-[var(--muted-soft)]">Loading…</p>;

  if (fetchErr) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold text-[var(--ink)]">Could not load application</p>
        <p className="mt-1 text-[12px] text-[var(--muted)]">{fetchErr}</p>
        <Link to="/admin/apps" className="mt-3 inline-block text-[12px] font-bold text-[var(--ink)] underline decoration-[#FFD120] decoration-2 hover:underline">Back to queue</Link>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold text-[var(--ink)]">Application not found</p>
        <Link to="/admin/apps" className="mt-3 inline-block text-[12px] font-bold text-[var(--ink)] underline decoration-[#FFD120] decoration-2 hover:underline">Back to queue</Link>
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
      <button onClick={() => nav("/admin/apps")} className="pressable btn btn-secondary btn-sm">
        <ArrowLeft size={14} /> Queue
      </button>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <div>
              <p className="eyebrow">Application</p>
              <h1 className="h-section mt-1.5 text-2xl text-[var(--ink)]">{app.name}</h1>
              <p className="mt-1 text-[12px] text-[var(--muted)]">{app.studentId} · {app.course} · {app.year}</p>
              <p className="mt-0.5 text-[11px] text-[var(--muted-soft)]">{app.term} · Submitted {new Date(app.submittedAt).toLocaleString()}</p>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2.5 text-[12px]">
            {[["Phone", app.phone], ["Guardian", app.guardian], ["Address", app.address], ["Term", app.term], ["Submitted", new Date(app.submittedAt).toLocaleString()]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-soft)]">{k}</dt>
                <dd className="mt-0.5 break-words font-semibold text-[var(--ink)]">{v || "—"}</dd>
              </div>
            ))}
          </dl>

          {/* Billing card */}
          <div className="mt-4 rounded-2xl border border-[#FFD120]/60 bg-[#FFF8E1] p-4 dark:border-[#FFD120]/30 dark:bg-[#FFD120]/10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B2A6B]/55 dark:text-[#FFD120]/70">Expected monthly total</p>
                <p className="mt-1 text-[#0B2A6B] dark:text-white">
                  <span className="text-2xl font-extrabold tracking-tight">{formatPeso(currentTotal)}</span>
                  <span className="ml-1 text-[12px] font-semibold opacity-60">/mo</span>
                </p>
              </div>
              {pendingCount > 0 && (
                <span className="chip bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30">
                  {pendingCount} for review
                </span>
              )}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-[#0B2A6B]/10 pt-3 text-[11px] text-[#0B2A6B]/75 dark:border-white/10 dark:text-slate-300">
              <div className="flex justify-between"><span>Base rate</span><span className="font-semibold">{formatPeso(BILLING.BASE_RATE)}</span></div>
              <div className="flex justify-between"><span>Paid appliances ({applianceCount})</span><span className="font-semibold">+{formatPeso(applianceCount * BILLING.PER_APPLIANCE)}</span></div>
            </div>
            <p className="mt-2 border-t border-[#0B2A6B]/10 pt-2 text-[10px] text-[#0B2A6B]/60 dark:border-white/10 dark:text-slate-400">
              Collected face-to-face at the Housing Office.
            </p>
          </div>

          {/* Declared appliances & devices */}
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--ink)]">
                <PlugZap size={15} /> Declared appliances & gadgets
                <span className="text-[11px] font-semibold text-[var(--muted-soft)]">({devices.length})</span>
              </p>
              {customDevices.length > 0 && (
                pendingCount > 0 ? (
                  <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200">
                    {pendingCount} for review
                  </span>
                ) : (
                  <span className="chip bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Check size={12} /> All assessed
                  </span>
                )
              )}
            </div>

            {devices.length === 0 ? (
              <p className="mt-2 text-[11px] text-[var(--muted-soft)]">
                No appliances or gadgets declared by applicant.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {presetDevices.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                      Standard presets
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {presetDevices.map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)]"
                        >
                          <span>{d.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              d.kind === "appliance"
                                ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
                        Custom declared items
                      </p>
                      <span className="text-[10px] text-amber-700/80 dark:text-amber-200/80">
                        Face-to-face assessment
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-200/80">
                      Classify each as Free (gadget) or +₱150/mo (paid appliance). Changes update the expected monthly total.
                    </p>

                    <div className="mt-2.5 space-y-2">
                      {customDevices.map((cd) => (
                        <div
                          key={cd.originalIndex}
                          className="flex flex-col gap-2 rounded-xl border border-amber-200/60 bg-[var(--surface)] p-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                        >
                          <div className="min-w-0">
                            <span className="text-[12px] font-bold text-[var(--ink)]">
                              {cd.name}
                            </span>
                            <span className="ml-2 inline-block text-[10px] font-semibold text-[var(--muted)]">
                              Current: {deviceKindLabel(cd.kind)}
                            </span>
                          </div>

                          <div className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[var(--surface-2)] p-0.5">
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "gadget")}
                              className={`pressable rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                cd.kind === "gadget"
                                  ? "bg-emerald-600 text-white"
                                  : "text-[var(--muted)] hover:text-[var(--ink)]"
                              }`}
                            >
                              Free
                            </button>
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "appliance")}
                              className={`pressable rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                cd.kind === "appliance"
                                  ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                                  : "text-[var(--muted)] hover:text-[var(--ink)]"
                              }`}
                            >
                              +₱150 Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => classifyDevice(cd.originalIndex, "other")}
                              className={`pressable rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                                cd.kind === "other"
                                  ? "bg-amber-500 text-white"
                                  : "text-[var(--muted)] hover:text-[var(--ink)]"
                              }`}
                            >
                              For review
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 pt-2.5 dark:border-amber-400/20">
                      <div className="text-[11px]">
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
                          <span className="text-[var(--muted)]">
                            All classifications saved
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={saveDeviceAssessment}
                        disabled={savingDevices || !hasDeviceChanges}
                        className="pressable btn btn-primary btn-sm"
                      >
                        {savingDevices ? "Saving…" : "Save classification"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-[var(--ink)]">Signed forms</p>
            <span className="text-[11px] font-semibold text-[var(--muted-soft)]">
              {app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length}/{TEMPLATE_DOCS.length}
            </span>
          </div>
          {app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length === 0 ? (
            <p className="mt-2 rounded-xl bg-[var(--surface-2)] px-3 py-3 text-[11px] text-[var(--muted-soft)]">No signed forms attached.</p>
          ) : (
            <div className="mt-2 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
              {app.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0B2A6B]/[0.06] text-[#0B2A6B] dark:bg-white/10 dark:text-[#FFD120]"><FileText size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[var(--ink)]">{label(d.type)}</p>
                    <p className="truncate font-mono text-[10px] text-[var(--muted-soft)]">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable btn btn-secondary btn-sm shrink-0">
                    <ExternalLink size={12} /> Open
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-[var(--ink)]">Student documents</p>
            <span className="text-[11px] font-semibold text-[var(--muted-soft)]">
              {app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length}/{UPLOAD_DOCS.length}
            </span>
          </div>
          {app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length === 0 ? (
            <p className="mt-2 rounded-xl bg-[var(--surface-2)] px-3 py-3 text-[11px] text-[var(--muted-soft)]">No student documents attached.</p>
          ) : (
            <div className="mt-2 divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
              {app.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0B2A6B]/[0.06] text-[#0B2A6B] dark:bg-white/10 dark:text-[#FFD120]"><FileText size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[var(--ink)]">{label(d.type)}</p>
                    <p className="truncate font-mono text-[10px] text-[var(--muted-soft)]">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable btn btn-secondary btn-sm shrink-0">
                    <ExternalLink size={12} /> Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card h-fit p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-[var(--ink)]">Decision</p>
            <StatusBadge status={app.status} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted-soft)]">Remarks are shown to the student.</p>
          <label className="mt-3 block text-[11px] font-bold text-[var(--ink)]">
            Admin remarks
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={4} placeholder="e.g. Requirements complete and verified."
              className="field mt-1.5 resize-y" />
          </label>
          {saveErr && <p className="mt-2 text-[12px] font-semibold text-rose-500">{saveErr}</p>}
          <div className="mt-4 grid gap-2">
            <button onClick={markReview} disabled={saving} className="pressable btn btn-secondary w-full">
              Mark under review
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => decide("approved")} disabled={saving} className="pressable btn bg-emerald-600 text-white hover:bg-emerald-700">
                <Check size={15} /> Approve
              </button>
              <button onClick={() => decide("rejected")} disabled={saving} className="pressable btn bg-rose-600 text-white hover:bg-rose-700">
                <X size={15} /> Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
