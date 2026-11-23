import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, X, Download, PlugZap, Pencil, ClipboardCheck } from "lucide-react";
import { PageFade, Stepper } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, DEVICE_PRESETS, COLLEGES, collegeOfCourse, computeTotal, formatPeso, deviceKindLabel, normalizeDevices } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { createApplication, fetchMyApplications, listTemplates, downloadTemplate } from "../lib/applications";
import { saveDraftFile, loadDraftFiles, removeDraftFile, clearDraftFiles } from "../lib/draftFiles";

const inputCls = "field";

const STEP_LABELS = ["Personal", "Downloads", "Upload", "Review", "Summary"];

const emptyFiles = () => Object.fromEntries(DOC_TYPES.map((d) => [d.key, null]));

const draftKey = (userId) => `kilala-draft:${userId}`;

const FREE_PRESETS = DEVICE_PRESETS.filter((d) => d.kind === "gadget");
const PAID_PRESETS = DEVICE_PRESETS.filter((d) => d.kind === "appliance");

// Text draft lives in localStorage; binary uploads live in IndexedDB
// (see lib/draftFiles) so they survive a reload on the same browser.
// File inputs still can't be refilled by code — instead we rehydrate the
// File objects from IndexedDB into state on mount.
function loadDraft(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    const form = { studentId: "", college: "", course: "", year: "1st Year", phone: "", guardian: "", guardianContact: "", address: "", term: "1st Sem AY 2026–27", ...(d.form || {}) };
    // "Summer 2027" term was removed — remap stale drafts to the default.
    if (form.term === "Summer 2027") form.term = "1st Sem AY 2026–27";
    // Drafts saved before College existed only have the typed course.
    if (!form.college && form.course) form.college = collegeOfCourse(form.course);
    return {
      form,
      devices: normalizeDevices(d.devices),
      step: [0, 1, 2, 3, 4].includes(d.step) ? d.step : 0,
    };
  } catch { return null; }
}

export default function Apply() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(() => loadDraft(user?.id)?.step || 0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => loadDraft(user?.id)?.form || {
    studentId: "", college: "", course: "", year: "1st Year",
    phone: "", guardian: "", guardianContact: "", address: "",
    term: "1st Sem AY 2026–27",
  });
  // Identity comes from the signed-in account — applicants can't file as someone else.
  const identityName = profile?.full_name || "";
  const identityEmail = user?.email || "";
  const [devices, setDevices] = useState(() => loadDraft(user?.id)?.devices || []);
  const [restored, setRestored] = useState(() => {
    const d = loadDraft(user?.id);
    return !!d && (d.step > 0 || d.devices.length > 0 || Object.values(d.form).some((v) => String(v || "").trim() && v !== "1st Year" && v !== "1st Sem AY 2026–27"));
  });
  const [files, setFiles] = useState(emptyFiles);
  const [filesRestored, setFilesRestored] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [agree, setAgree] = useState(false);
  const [confirmCorrect, setConfirmCorrect] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  // 1 student = 1 application — block the wizard when one already exists.
  const [existingApp, setExistingApp] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Changing college invalidates the course picked under the old one.
  const setCollege = (e) => {
    const college = e.target.value;
    setForm((f) => ({ ...f, college, course: f.college === college ? f.course : "" }));
  };
  const collegeCourses = COLLEGES.find((c) => c.name === form.college)?.courses || [];
  const namedDevices = devices.filter((d) => d.name.trim());
  const total = computeTotal(namedDevices);
  const applianceCount = namedDevices.filter((d) => d.kind === "appliance").length;
  const pendingCount = namedDevices.filter((d) => d.kind === "other").length;
  const customDevices = devices.map((d, i) => ({ d, i })).filter(({ d }) => !d.key);
  const isPresetChecked = (key) => devices.some((d) => d.key === key);

  useEffect(() => {
    listTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, []);

  // Block re-applying: one row per student, revised only via resubmit.
  useEffect(() => {
    if (!user?.id) { setCheckingExisting(false); return; }
    let cancelled = false;
    fetchMyApplications(user.id)
      .then((apps) => { if (!cancelled) setExistingApp(apps[0] || null); })
      .catch(() => { if (!cancelled) setExistingApp(null); })
      .finally(() => { if (!cancelled) setCheckingExisting(false); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Autosave the text draft (debounced). Never includes files or consent.
  // Files are persisted separately to IndexedDB via handleFileChange.
  useEffect(() => {
    if (!user?.id || done) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(user.id), JSON.stringify({ form, devices, step }));
      } catch { /* quota or privacy mode — form simply won't persist */ }
    }, 500);
    return () => clearTimeout(t);
  }, [form, devices, step, user, done]);

  // Rehydrate uploads from IndexedDB after a reload (same browser).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    loadDraftFiles(user.id).then((saved) => {
      if (cancelled) return;
      const keys = Object.keys(saved || {});
      if (!keys.length) return;
      setFiles((f) => ({ ...f, ...saved }));
      setFilesRestored(true);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleFileChange = (docKey, value) => {
    setFiles((f) => ({ ...f, [docKey]: value }));
    if (!user?.id) return;
    if (value?._file) {
      saveDraftFile(user.id, docKey, value._file);
    } else if (!value) {
      removeDraftFile(user.id, docKey);
    }
  };

  const startOver = () => {
    try { if (user?.id) localStorage.removeItem(draftKey(user.id)); } catch { /* ignore */ }
    if (user?.id) clearDraftFiles(user.id);
    setForm({ studentId: "", college: "", course: "", year: "1st Year", phone: "", guardian: "", guardianContact: "", address: "", term: "1st Sem AY 2026–27" });
    setDevices([]);
    setFiles(emptyFiles());
    setFilesRestored(false);
    setAgree(false);
    setConfirmCorrect(false);
    setErr("");
    setStep(0);
    setRestored(false);
  };

  const addDevice = () => setDevices((ds) => [...ds, { name: "", kind: "other" }]);
  const setDevice = (i, patch) => setDevices((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const removeDevice = (i) => setDevices((ds) => ds.filter((_, j) => j !== i));
  // If a free-text name matches a preset, turn it into that preset on blur so
  // the classification/total update immediately instead of at submit time.
  const normalizeCustomDevice = (i) => setDevices((ds) => {
    const d = ds[i];
    if (!d || d.key) return ds;
    const preset = DEVICE_PRESETS.find((p) => p.label.toLowerCase() === d.name.trim().toLowerCase());
    if (!preset) return ds;
    // If the preset is already checked, drop the duplicate free-text row.
    if (ds.some((x, j) => j !== i && x.key === preset.key)) return ds.filter((_, j) => j !== i);
    return ds.map((x, j) => (j === i ? { key: preset.key, name: preset.label, kind: preset.kind } : x));
  });
  const togglePreset = (preset) => setDevices((ds) => {
    const exists = ds.some((d) => d.key === preset.key);
    if (exists) return ds.filter((d) => d.key !== preset.key);
    // Drop a same-named free-text row so checking the preset doesn't duplicate it.
    return [
      ...ds.filter((d) => d.key || d.name.trim().toLowerCase() !== preset.label.toLowerCase()),
      { key: preset.key, name: preset.label, kind: preset.kind },
    ];
  });

  const validStep0 = identityName && identityEmail && form.studentId.trim() && form.college && form.course.trim() && form.phone.trim() && form.guardian.trim() && (form.guardianContact || "").trim();
  const validUpload = DOC_TYPES.every((d) => files[d.key]);
  const validReview = Boolean(validStep0) && validUpload && confirmCorrect;
  const validSubmit = validUpload && agree;

  const openTemplate = async (t) => {
    if (!t.file_path) return;
    try {
      const url = await downloadTemplate(t.file_path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErr("Could not download form: " + e.message);
    }
  };

  const submit = async () => {
    if (!validSubmit) { setErr("Upload all 10 documents and accept the declaration."); return; }
    setErr("");
    setBusy(true);
    // Re-normalize at submit time too: a typed "Iron"/"Rice cooker" must be
    // stored as its paid preset, not as an unclassified "other" item.
    const finalDevices = normalizeDevices(namedDevices.map((d) => ({
      ...(d.key ? { key: d.key } : {}),
      name: d.name.trim(),
      kind: d.kind,
    })));
    try {
      await createApplication({
        userId: user.id,
        form: {
          ...form,
          // DB still has a single `guardian` column — store the split inputs
          // combined so no migration is needed; admin keeps reading one field.
          guardian: `${form.guardian.trim()} — ${(form.guardianContact || "").trim()}`,
          devices: finalDevices,
        },
        files,
      });
      setDone({ total: computeTotal(finalDevices) });
      try { localStorage.removeItem(draftKey(user.id)); } catch { /* ignore */ }
      clearDraftFiles(user.id);
    } catch (e) {
      setErr(e.message || "Submission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (checkingExisting) {
    return (
      <PageFade>
        <p className="mx-auto max-w-3xl px-4 py-16 text-center text-[13px] text-[var(--muted-soft)]">Loading…</p>
      </PageFade>
    );
  }

  if (existingApp && !done) {
    return (
      <PageFade>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FFF8E1] text-[#0B2A6B] ring-1 ring-[#FFD120]/60 dark:bg-[#FFD120]/10 dark:text-[#FFD120]">
            <ClipboardCheck size={24} />
          </span>
          <h1 className="h-section mt-5 text-2xl text-[var(--ink)]">You already applied</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
            One student, one application. Track your status in My dashboard
            {existingApp.status === "rejected"
              ? " — the housing office asked for corrections, so open your application there and resubmit the same one."
              : " — if corrections are needed, the housing office will mark it Needs resubmit and you'll revise the same application."}
          </p>
          <button onClick={() => nav("/dashboard")} className="pressable btn btn-accent mt-6">
            View my application
          </button>
        </div>
      </PageFade>
    );
  }

  if (done) {
    return (
      <PageFade>
        <div className="mx-auto max-w-md px-4 py-14 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={30} />
          </motion.div>
          <h1 className="h-section mt-5 text-3xl text-[var(--ink)]">Application sent.</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
            We've received your application securely. You can follow every update from your dashboard.
          </p>
          <div className="card mt-6 p-5 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[12px] font-semibold text-[var(--muted)]">Expected monthly total</p>
              <p className="text-lg font-extrabold text-[var(--ink)]">{formatPeso(done.total)}<span className="text-[12px] font-semibold text-[var(--muted)]">/mo</span></p>
            </div>
            <p className="mt-2 border-t border-[var(--line)] pt-2 text-[11px] leading-relaxed text-[var(--muted-soft)]">
              Payment is made face-to-face at the Housing Office — no online payment is collected.
            </p>
          </div>
          <button onClick={() => nav("/dashboard")} className="pressable btn btn-accent mt-5 w-full">
            Go to my dashboard
          </button>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl px-4 py-9 sm:px-6 sm:py-11">
        <p className="eyebrow">Online admission</p>
        <h1 className="h-section mt-2 text-3xl text-[var(--ink)]">Kilala Dormitory application</h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">Five steps, saved as you go — come back anytime.</p>

        <div className="card mt-6 px-4 py-4">
          <p className="mb-2 text-[11px] font-semibold text-[var(--muted-soft)] sm:hidden">
            Step {step + 1} of {STEP_LABELS.length} · {STEP_LABELS[step]}
          </p>
          <Stepper steps={STEP_LABELS} current={step} />
        </div>

        {(restored || filesRestored) && !done && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#FFD120]/60 bg-[#FFF8E1] px-4 py-2.5 text-[12px] font-semibold text-[#0B2A6B] dark:bg-[#FFD120]/10 dark:text-[#FFE9A8] dark:border-[#FFD120]/30">
            <span>{filesRestored
              ? "Draft restored — your info and uploads are back. Use Verify under each file to check it."
              : "Draft restored — your typed info is back. Your uploads are saved on this device as you attach them."}</span>
            <button onClick={startOver} className="pressable btn btn-sm border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]">Start over</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="card mt-4 p-5 sm:p-7"
          >
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#FFD120]/60 bg-[#FFF8E1] px-4 py-3 dark:border-[#FFD120]/30 dark:bg-[#FFD120]/10 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#0B2A6B]/55 dark:text-[#FFD120]/70">Applying as</p>
                  <p className="mt-0.5 text-sm font-bold text-[#0B2A6B] dark:text-white">{identityName} · {identityEmail}</p>
                </div>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Student ID<input className={inputCls} value={form.studentId} onChange={set("studentId")} placeholder="2024-01209" /></label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Contact number<input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="09xx-xxx-xxxx" inputMode="tel" /></label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)] sm:col-span-2">College
                  <select className={inputCls} value={form.college} onChange={setCollege}>
                    <option value="" disabled className="text-slate-900">Select your college</option>
                    {COLLEGES.map((c) => <option key={c.name} value={c.name} className="text-slate-900">{c.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Course
                  <select className={`${inputCls} disabled:opacity-50`} value={form.course} onChange={set("course")} disabled={!form.college}>
                    <option value="" disabled className="text-slate-900">{form.college ? "Select your course" : "Choose a college first"}</option>
                    {collegeCourses.map((c) => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Year level
                  <select className={inputCls} value={form.year} onChange={set("year")}>
                    {["1st Year","2nd Year","3rd Year","4th Year","5th Year"].map((y) => <option key={y} className="text-slate-900">{y}</option>)}
                  </select>
                </label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Parent / Guardian name<input className={inputCls} value={form.guardian} onChange={set("guardian")} placeholder="Full name" /></label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Parent / Guardian contact number<input className={inputCls} value={form.guardianContact} onChange={set("guardianContact")} placeholder="09xx-xxx-xxxx" inputMode="tel" /></label>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)] sm:col-span-2">Home address<input className={inputCls} value={form.address} onChange={set("address")} placeholder="Street, City" /></label>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <div className="rounded-2xl border border-[#FFD120]/60 bg-[#FFF8E1] px-4 py-3 dark:border-[#FFD120]/30 dark:bg-[#FFD120]/10">
                  <p className="text-[12px] font-bold text-[#0B2A6B] dark:text-[#FFE9A8]">Payment is face-to-face</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#0B2A6B]/70 dark:text-[#FFE9A8]/70">No payment is collected online. Your expected monthly total is shown below — please settle it in person at the Housing Office.</p>
                </div>
                <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--ink)]">Term covered
                  <select className={inputCls} value={form.term} onChange={set("term")}>
                    <option className="text-slate-900">1st Sem AY 2026–27</option>
                    <option className="text-slate-900">2nd Sem AY 2026–27</option>
                    <option className="text-slate-900">Full AY 2026–27</option>
                  </select>
                </label>

                <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
                  <span className="text-[12px] font-semibold text-[var(--ink)]">Dorm rate (every room)</span>
                  <span className="text-sm font-bold text-[var(--ink)]">{formatPeso(BILLING.BASE_RATE)}/mo</span>
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink)]"><PlugZap size={15} /> Appliances & gadgets</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                    Laptops, cellphones, and tablets are free but must still be registered. Iron and rice cooker add {formatPeso(BILLING.PER_APPLIANCE)}/mo each.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Free gadgets</p>
                      <div className="mt-2.5 grid gap-2.5">
                        {FREE_PRESETS.map((p) => (
                          <label key={p.key} className="flex cursor-pointer items-center justify-between gap-2 text-[12px] font-semibold text-[var(--ink)]">
                            <span className="flex items-center gap-2">
                              <input type="checkbox" checked={isPresetChecked(p.key)} onChange={() => togglePreset(p)} className="accent-[#F0BB00]" />
                              {p.label}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300">Free</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Paid appliances</p>
                      <div className="mt-2.5 grid gap-2.5">
                        {PAID_PRESETS.map((p) => (
                          <label key={p.key} className="flex cursor-pointer items-center justify-between gap-2 text-[12px] font-semibold text-[var(--ink)]">
                            <span className="flex items-center gap-2">
                              <input type="checkbox" checked={isPresetChecked(p.key)} onChange={() => togglePreset(p)} className="accent-[#F0BB00]" />
                              {p.label}
                            </span>
                            <span className="text-[11px] font-bold text-[var(--ink)] dark:text-[#FFD120]">+{formatPeso(BILLING.PER_APPLIANCE)}/mo</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12px] font-semibold text-[var(--ink)]">Other appliance or device</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]">
                      Add anything not listed above. The Housing Office will review it and confirm whether it is free or charged.
                    </p>
                    <div className="mt-2 grid gap-2">
                      {customDevices.map(({ d, i }) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={d.name} onChange={(e) => setDevice(i, { name: e.target.value })}
                            onBlur={() => normalizeCustomDevice(i)}
                            aria-label="Other appliance or device"
                            placeholder="e.g. Electric kettle" className={`${inputCls} flex-1`} />
                          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30">
                            {deviceKindLabel(d.kind)}
                          </span>
                          <button type="button" onClick={() => removeDevice(i)} onMouseDown={(e) => e.preventDefault()} aria-label="Remove device"
                            className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]">
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addDevice}
                      className="pressable btn btn-secondary btn-sm mt-2.5">
                      <Plus size={14} /> Add other device
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#0B2A6B] p-5 text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-65">Expected monthly total</p>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight">
                    {formatPeso(total)}<span className="ml-1 text-sm font-semibold opacity-65">/mo</span>
                  </p>
                  <div className="mt-3 space-y-1.5 border-t border-white/20 pt-3 text-[12px] opacity-90 dark:border-[#0B2A6B]/20">
                    <div className="flex justify-between"><span>Base rate</span><span className="font-semibold">{formatPeso(BILLING.BASE_RATE)}</span></div>
                    <div className="flex justify-between"><span>Paid appliances × {applianceCount}</span><span className="font-semibold">{formatPeso(applianceCount * BILLING.PER_APPLIANCE)}</span></div>
                    {pendingCount > 0 && (
                      <div className="flex justify-between"><span>Other items × {pendingCount}</span><span className="font-semibold">For review</span></div>
                    )}
                  </div>
                </div>
                {pendingCount > 0 && (
                  <p className="text-[11px] leading-relaxed text-[var(--muted)]">Other items are assessed by the Housing Office and are not included in the expected total yet.</p>
                )}
                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 text-[12px] leading-relaxed text-[var(--ink)]">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#F0BB00]" />
                  I certify these uploads are true copies. I agree to paperless processing and to the expected monthly total above, and to the Terms of Service and Privacy Policy. I understand payment is made face-to-face at the Housing Office.
                </label>
                {err && <p className="text-[12px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-2">
                <p className="text-[12px] font-semibold text-[var(--ink)]">Download each form, print it, and sign it. You will upload the signed copies next.</p>
                {TEMPLATE_DOCS.map((d) => {
                  const t = templates.find((r) => r.key === d.key);
                  const ready = !!t?.file_path;
                  return (
                    <div key={d.key} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-[var(--ink)]">{d.label}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[var(--muted-soft)]">{ready ? (t.file_name || "Softcopy available") : "Not available yet — check back soon"}</p>
                      </div>
                      <button type="button" onClick={() => openTemplate(t || {})} disabled={!ready}
                        className="pressable btn btn-primary btn-sm shrink-0">
                        <Download size={13} /> Download
                      </button>
                    </div>
                  );
                })}
                {err && <p className="text-[12px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5">
                <p className="text-[11px] leading-relaxed text-[var(--muted)]">Uploads auto-save on this device — you can reload and continue. Use Verify under each file to check you attached the right one.</p>
                <div>
                  <p className="text-[12px] font-bold text-[var(--ink)]">Signed forms ({TEMPLATE_DOCS.filter((d) => files[d.key]).length}/{TEMPLATE_DOCS.length})</p>
                  <div className="mt-2.5 grid gap-3">
                    {TEMPLATE_DOCS.map((d) => (
                      <FileUploader key={d.key} label={d.label} hint="Signed copy — PDF / JPG / PNG, max 5MB"
                        value={files[d.key]} onChange={(v) => handleFileChange(d.key, v)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[var(--ink)]">Your documents ({UPLOAD_DOCS.filter((d) => files[d.key]).length}/{UPLOAD_DOCS.length})</p>
                  <div className="mt-2.5 grid gap-3">
                    {UPLOAD_DOCS.map((d) => (
                      <FileUploader key={d.key} label={d.label} hint={d.hint}
                        value={files[d.key]} onChange={(v) => handleFileChange(d.key, v)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[var(--ink)]">Review your details</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">Confirm everything below is correct before the final step. Use Edit to fix anything.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between px-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Personal</p>
                    <button type="button" onClick={() => { setConfirmCorrect(false); setErr(""); setStep(0); }}
                      className="pressable btn btn-secondary btn-sm">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  <dl className="grid gap-x-4 gap-y-2.5 px-4 py-3 text-[12px] sm:grid-cols-2">
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Full name</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{identityName || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Email</dt><dd className="mt-0.5 break-all font-semibold text-[var(--ink)]">{identityEmail || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Student ID</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.studentId || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Contact number</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.phone || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">College</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.college || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Course</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.course || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Year level</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.year}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Parent / Guardian</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.guardian || "—"}</dd></div>
                    <div><dt className="text-[11px] text-[var(--muted-soft)]">Guardian contact</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.guardianContact || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-[11px] text-[var(--muted-soft)]">Home address</dt><dd className="mt-0.5 font-semibold text-[var(--ink)]">{form.address || "—"}</dd></div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between px-4 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                      Documents · {DOC_TYPES.filter((d) => files[d.key]).length}/{DOC_TYPES.length}
                    </p>
                    <button type="button" onClick={() => { setConfirmCorrect(false); setErr(""); setStep(2); }}
                      className="pressable btn btn-secondary btn-sm">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  <ul className="grid gap-1.5 px-4 py-3 text-[12px]">
                    {DOC_TYPES.map((d) => {
                      const f = files[d.key];
                      return (
                        <li key={d.key} className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--ink)]">{d.label}</span>
                          <span className={`shrink-0 text-[11px] font-bold ${f ? "text-emerald-600 dark:text-emerald-300" : "text-rose-500"}`}>
                            {f ? (f.fileName || f.name || "Attached") : "Missing"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#FFD120]/60 bg-[#FFF8E1] px-4 py-3 dark:border-[#FFD120]/30 dark:bg-[#FFD120]/10">
                  <p className="text-[12px] font-bold text-[#0B2A6B] dark:text-[#FFE9A8]">What happens next</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#0B2A6B]/70 dark:text-[#FFE9A8]/70">
                    Term ({form.term}) and appliance declaration happen on the final step. Base rate is {formatPeso(BILLING.BASE_RATE)}/mo plus {formatPeso(BILLING.PER_APPLIANCE)}/mo per paid appliance; your expected monthly total is shown there. Laptops, cellphones, and tablets are free; other items are reviewed by the Housing Office. Payment is made face-to-face at the Housing Office.
                    {namedDevices.length > 0 ? ` Currently listed: ${namedDevices.map((d) => `${d.name.trim()} (${deviceKindLabel(d.kind)})`).join(", ")}.` : " No devices listed yet — you can add them next."}
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 text-[12px] leading-relaxed text-[var(--ink)]">
                  <input type="checkbox" checked={confirmCorrect} onChange={(e) => setConfirmCorrect(e.target.checked)} className="mt-0.5 accent-[#F0BB00]" />
                  I confirm all the details above are correct and I'm ready to submit my application.
                </label>
                {err && <p className="text-[12px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
              <button
                onClick={() => { setErr(""); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}
                className="pressable btn btn-ghost"
              ><ArrowLeft size={15} /> Back</button>
              {step < 4 ? (
                <button
                  onClick={() => { setErr(""); setStep((s) => s + 1); }}
                  disabled={(step === 0 && !validStep0) || (step === 2 && !validUpload) || (step === 3 && !validReview)}
                  className="pressable btn btn-primary"
                >Continue <ArrowRight size={15} /></button>
              ) : (
                <button onClick={submit} disabled={busy} className="pressable btn btn-accent">
                  {busy ? "Uploading…" : "Submit application"}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </PageFade>
  );
}
