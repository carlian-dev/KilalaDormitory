import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, X, Download, PlugZap, Pencil, ClipboardCheck } from "lucide-react";
import { PageFade, Stepper } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, COLLEGES, collegeOfCourse, computeTotal, formatPeso } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { createApplication, fetchMyApplications, listTemplates, downloadTemplate } from "../lib/applications";
import { saveDraftFile, loadDraftFiles, removeDraftFile, clearDraftFiles } from "../lib/draftFiles";

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0B2A6B] outline-none focus:border-[#0B2A6B] focus:ring-4 focus:ring-[#FFD120]/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400";

const emptyFiles = () => Object.fromEntries(DOC_TYPES.map((d) => [d.key, null]));

const draftKey = (userId) => `kilala-draft:${userId}`;

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
      devices: Array.isArray(d.devices) ? d.devices.filter((x) => x && typeof x.name === "string") : [],
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

  const addDevice = () => setDevices((ds) => [...ds, { name: "", kind: "appliance" }]);
  const setDevice = (i, patch) => setDevices((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const removeDevice = (i) => setDevices((ds) => ds.filter((_, j) => j !== i));

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
    if (!validSubmit) { setErr("Upload all 9 documents and accept the declaration."); return; }
    setErr("");
    setBusy(true);
    try {
      await createApplication({
        userId: user.id,
        form: {
          ...form,
          // DB still has a single `guardian` column — store the split inputs
          // combined so no migration is needed; admin keeps reading one field.
          guardian: `${form.guardian.trim()} — ${(form.guardianContact || "").trim()}`,
          devices: namedDevices.map((d) => ({ name: d.name.trim(), kind: d.kind })),
        },
        files,
      });
      setDone({ total });
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
        <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-400">Loading…</p>
      </PageFade>
    );
  }

  if (existingApp && !done) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-4 py-14 text-center">
          <h1 className="display !text-4xl text-[#0B2A6B] dark:text-white">You already applied</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            One student, one application. Track your status in My dashboard
            {existingApp.status === "rejected"
              ? " — the housing office asked for corrections, so open your application there and resubmit the same one."
              : " — if corrections are needed, the housing office will mark it Needs resubmit and you'll revise the same application."}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => nav("/dashboard")} className="pressable rounded-full bg-[#FFD120] px-6 py-3 text-sm font-bold text-[#0B2A6B] hover:bg-[#F0BB00]">View my application</button>
          </div>
        </div>
      </PageFade>
    );
  }

  if (done) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-4 py-14 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={30} />
          </motion.div>
          <h1 className="display mt-4 !text-4xl text-[#0B2A6B] dark:text-white">Application sent!</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Paperless received — no need to visit the office. Track your status in My dashboard.</p>
          <p className="mt-3 text-sm font-bold text-[#0B2A6B] dark:text-white">Monthly rate: {formatPeso(done.total)}/mo</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => nav("/dashboard")} className="pressable rounded-full bg-[#FFD120] px-6 py-3 text-sm font-bold text-[#0B2A6B] hover:bg-[#F0BB00]">View my application</button>
          </div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Online admission</p>
        <h1 className="h-section text-3xl font-bold text-[#0B2A6B] dark:text-white">Kilala Dormitory application</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">5 steps · validated in-browser · stored securely</p>

        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10">
          <Stepper steps={["Personal", "Downloads", "Upload", "Review", "Payment"]} current={step} />
        </div>

        {(restored || filesRestored) && !done && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#FFF8E1] px-4 py-2.5 text-[13px] font-semibold text-[#0B2A6B] ring-1 ring-[#FFD120] dark:bg-[#FFD120]/10 dark:text-[#FFE9A8] dark:ring-[#FFD120]/40">
            <span>{filesRestored
              ? "Draft restored — your info and uploads are back. Use Verify under each file to check it."
              : "Draft restored — your typed info is back. Your uploads are saved on this device as you attach them."}</span>
            <button onClick={startOver} className="pressable rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm dark:bg-white/10 dark:text-white">Start over</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="mt-4 rounded-3xl bg-white p-5 sm:p-7 shadow-sm ring-1 ring-slate-100 dark:bg-[#0A2456] dark:ring-white/10 dark:text-white"
          >
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#FFF8E1] px-3.5 py-2.5 ring-1 ring-[#FFD120] dark:bg-[#FFD120]/10 dark:ring-[#FFD120]/40 sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Applying as (your account)</p>
                  <p className="text-sm font-bold">{identityName} · {identityEmail}</p>
                </div>
                <label className="text-sm font-semibold">Student ID<input className={inputCls} value={form.studentId} onChange={set("studentId")} placeholder="2024-01209" /></label>
                <label className="text-sm font-semibold">Contact number<input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="09xx-xxx-xxxx" inputMode="tel" /></label>
                <label className="text-sm font-semibold sm:col-span-2">College
                  <select className={inputCls} value={form.college} onChange={setCollege}>
                    <option value="" disabled className="text-slate-900">Select your college</option>
                    {COLLEGES.map((c) => <option key={c.name} value={c.name} className="text-slate-900">{c.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Course
                  <select className={`${inputCls} disabled:opacity-50`} value={form.course} onChange={set("course")} disabled={!form.college}>
                    <option value="" disabled className="text-slate-900">{form.college ? "Select your course" : "Choose a college first"}</option>
                    {collegeCourses.map((c) => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Year level
                  <select className={inputCls} value={form.year} onChange={set("year")}>
                    {["1st Year","2nd Year","3rd Year","4th Year","5th Year"].map((y) => <option key={y} className="text-slate-900">{y}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold">Parent / Guardian name<input className={inputCls} value={form.guardian} onChange={set("guardian")} placeholder="Full name" /></label>
                <label className="text-sm font-semibold">Parent / Guardian contact number<input className={inputCls} value={form.guardianContact} onChange={set("guardianContact")} placeholder="09xx-xxx-xxxx" inputMode="tel" /></label>
                <label className="text-sm font-semibold sm:col-span-2">Home address<input className={inputCls} value={form.address} onChange={set("address")} placeholder="Street, City" /></label>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-4">
                <label className="text-sm font-semibold">Term this payment covers
                  <select className={inputCls} value={form.term} onChange={set("term")}>
                    <option className="text-slate-900">1st Sem AY 2026–27</option>
                    <option className="text-slate-900">2nd Sem AY 2026–27</option>
                    <option className="text-slate-900">Full AY 2026–27</option>
                  </select>
                </label>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3.5 py-3 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <span className="text-sm font-semibold">Dorm rate (every room)</span>
                  <span className="text-sm font-bold">{formatPeso(BILLING.BASE_RATE)}/mo</span>
                </div>

                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold"><PlugZap size={15} /> Appliances & gadgets</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Each appliance adds {formatPeso(BILLING.PER_APPLIANCE)}/mo. Gadgets are free but must still be registered.</p>
                  <div className="mt-2 grid gap-2">
                    {devices.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={d.name} onChange={(e) => setDevice(i, { name: e.target.value })}
                          placeholder="e.g. Rice cooker" className={`${inputCls} flex-1`} />
                        <div className="flex shrink-0 gap-1 rounded-full bg-slate-100 p-1 dark:bg-white/10">
                          {[["appliance", "+₱150"], ["gadget", "Free"]].map(([k, label]) => (
                            <button key={k} type="button" onClick={() => setDevice(i, { kind: k })}
                              className={`pressable rounded-full px-3 py-1.5 text-xs font-bold ${d.kind === k ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]" : "text-slate-500 dark:text-slate-300"}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        <button type="button" onClick={() => removeDevice(i)} aria-label="Remove device"
                          className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-white/10">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addDevice}
                    className="pressable mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#0B2A6B]/5 px-4 py-2 text-[13px] font-bold text-[#0B2A6B] dark:bg-white/10 dark:text-white">
                    <Plus size={14} /> Add device
                  </button>
                </div>

                <div className="rounded-2xl bg-[#0B2A6B] p-4 text-white dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                  <div className="flex justify-between text-[13px]"><span>Base rate</span><span className="font-bold">{formatPeso(BILLING.BASE_RATE)}</span></div>
                  <div className="mt-1 flex justify-between text-[13px]"><span>Appliances × {applianceCount}</span><span className="font-bold">{formatPeso(applianceCount * BILLING.PER_APPLIANCE)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-white/20 pt-2 text-base font-bold dark:border-[#0B2A6B]/20">
                    <span>Monthly total</span><span>{formatPeso(total)}/mo</span>
                  </div>
                </div>
                <label className="flex cursor-pointer items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[13px] ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/15">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-[#F0BB00]" />
                  I certify these uploads are true copies. I agree to paperless processing and to the monthly rate above, and to the Terms of Service and Privacy Policy.
                </label>
                {err && <p className="text-[13px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-2">
                <p className="text-sm font-semibold">Download each form, print it, and sign it. You will upload the signed copies next.</p>
                {TEMPLATE_DOCS.map((d) => {
                  const t = templates.find((r) => r.key === d.key);
                  const ready = !!t?.file_path;
                  return (
                    <div key={d.key} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold">{d.label}</p>
                        <p className="text-xs text-slate-400">{ready ? (t.file_name || "Softcopy available") : "Not available yet — check back soon"}</p>
                      </div>
                      <button type="button" onClick={() => openTemplate(t || {})} disabled={!ready}
                        className="pressable inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0B2A6B] px-4 py-2 text-xs font-bold text-[#FFD120] disabled:opacity-30 dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                        <Download size={13} /> Download
                      </button>
                    </div>
                  );
                })}
                {err && <p className="text-[13px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <p className="-mb-1 text-xs text-slate-500 dark:text-slate-400">Uploads auto-save on this device — you can reload and continue. Use Verify under each file to check you attached the right one.</p>
                <div>
                  <p className="text-sm font-bold">Signed forms ({TEMPLATE_DOCS.filter((d) => files[d.key]).length}/{TEMPLATE_DOCS.length})</p>
                  <div className="mt-2 grid gap-3">
                    {TEMPLATE_DOCS.map((d) => (
                      <FileUploader key={d.key} label={d.label} hint="Signed copy — PDF / JPG / PNG, max 5MB"
                        value={files[d.key]} onChange={(v) => handleFileChange(d.key, v)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold">Your documents ({UPLOAD_DOCS.filter((d) => files[d.key]).length}/{UPLOAD_DOCS.length})</p>
                  <div className="mt-2 grid gap-3">
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
                    <p className="text-sm font-bold">Review your details</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Confirm everything below is correct before proceeding to payment. Use Edit to fix anything.</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <div className="flex items-center justify-between px-4 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Personal</p>
                    <button type="button" onClick={() => { setConfirmCorrect(false); setErr(""); setStep(0); }}
                      className="pressable inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0B2A6B] shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  <dl className="grid gap-x-4 gap-y-2 px-4 py-3 text-[13px] sm:grid-cols-2">
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Full name</dt><dd className="font-semibold">{identityName || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Email</dt><dd className="font-semibold break-all">{identityEmail || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Student ID</dt><dd className="font-semibold">{form.studentId || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Contact number</dt><dd className="font-semibold">{form.phone || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">College</dt><dd className="font-semibold">{form.college || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Course</dt><dd className="font-semibold">{form.course || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Year level</dt><dd className="font-semibold">{form.year}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Parent / Guardian</dt><dd className="font-semibold">{form.guardian || "—"}</dd></div>
                    <div><dt className="text-xs text-slate-500 dark:text-slate-400">Guardian contact</dt><dd className="font-semibold">{form.guardianContact || "—"}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs text-slate-500 dark:text-slate-400">Home address</dt><dd className="font-semibold">{form.address || "—"}</dd></div>
                  </dl>
                </div>

                <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <div className="flex items-center justify-between px-4 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      Documents · {DOC_TYPES.filter((d) => files[d.key]).length}/{DOC_TYPES.length}
                    </p>
                    <button type="button" onClick={() => { setConfirmCorrect(false); setErr(""); setStep(2); }}
                      className="pressable inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0B2A6B] shadow-sm ring-1 ring-slate-200 dark:bg-white/10 dark:text-white dark:ring-white/15">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                  <ul className="grid gap-1 px-4 py-3 text-[13px]">
                    {DOC_TYPES.map((d) => {
                      const f = files[d.key];
                      return (
                        <li key={d.key} className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{d.label}</span>
                          <span className={`shrink-0 text-xs font-bold ${f ? "text-emerald-600 dark:text-emerald-300" : "text-rose-500"}`}>
                            {f ? (f.fileName || f.name || "Attached") : "Missing"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#FFF8E1] px-4 py-3 text-[13px] ring-1 ring-[#FFD120] dark:bg-[#FFD120]/10 dark:ring-[#FFD120]/40">
                  <p className="font-bold">What happens next</p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    Term ({form.term}) and appliance declaration happen on the Payment step. Base rate is {formatPeso(BILLING.BASE_RATE)}/mo plus {formatPeso(BILLING.PER_APPLIANCE)}/mo per appliance.
                    {namedDevices.length > 0 ? ` Currently listed: ${namedDevices.map((d) => d.name.trim()).filter(Boolean).join(", ") || "—"}.` : " No devices listed yet — you can add them next."}
                  </p>
                </div>

                <label className="flex cursor-pointer items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[13px] ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/15">
                  <input type="checkbox" checked={confirmCorrect} onChange={(e) => setConfirmCorrect(e.target.checked)} className="mt-1 accent-[#F0BB00]" />
                  I confirm all the details above are correct and I want to proceed to payment.
                </label>
                {err && <p className="text-[13px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => { setErr(""); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0}
                className="pressable inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 disabled:opacity-30 dark:text-slate-300"
              ><ArrowLeft size={15} /> Back</button>
              {step < 4 ? (
                <button
                  onClick={() => { setErr(""); setStep((s) => s + 1); }}
                  disabled={(step === 0 && !validStep0) || (step === 2 && !validUpload) || (step === 3 && !validReview)}
                  className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#0B2A6B] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                >Continue <ArrowRight size={15} /></button>
              ) : (
                <button onClick={submit} disabled={busy} className="pressable rounded-full bg-[#FFD120] px-6 py-2.5 text-sm font-bold text-[#0B2A6B] shadow hover:bg-[#F0BB00] disabled:opacity-50">
                  {busy ? "Uploading…" : `Submit · ${formatPeso(total)}/mo`}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </PageFade>
  );
}
