import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { PageFade, Stepper } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import { createApplication } from "../lib/applications";

const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#0A1F44] outline-none focus:border-[#0A1F44] focus:ring-4 focus:ring-[#FFC72C]/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-400";

export default function Apply() {
  const { user, profile } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    studentId: "", course: "", year: "1st Year",
    phone: "", guardian: "", address: "",
    term: "1st Sem AY 2026–27",
  });
  // Identity comes from the signed-in account — applicants can't file as someone else.
  const identityName = profile?.full_name || "";
  const identityEmail = user?.email || "";
  const [files, setFiles] = useState({ school_id: null, coe: null, birth_cert: null });
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");
  const [doneId, setDoneId] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validStep0 = identityName && identityEmail && form.studentId.trim() && form.course.trim() && form.phone.trim() && form.guardian.trim();
  const validStep2 = DOC_TYPES.every((d) => files[d.key]) && agree;

  const submit = async () => {
    if (!validStep2) { setErr("Upload all 3 requirements and accept the declaration."); return; }
    setErr("");
    setBusy(true);
    try {
      const id = await createApplication({ userId: user.id, form, files });
      setDoneId(id);
    } catch (e) {
      setErr(e.message || "Submission failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <PageFade>
        <div className="mx-auto max-w-xl px-4 py-14 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={30} />
          </motion.div>
          <h1 className="display mt-4 !text-4xl text-[#0A1F44] dark:text-white">Application sent!</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Paperless received — no need to visit the office. Save your application ID:</p>
          <p className="mx-auto mt-4 w-fit break-all rounded-2xl bg-[#0A1F44] px-6 py-3 font-mono text-sm font-bold tracking-wider text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">{doneId}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button onClick={() => nav(`/dashboard?id=${doneId}`)} className="pressable rounded-full bg-[#FFC72C] px-6 py-3 text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800]">View in my dashboard</button>
            <button onClick={() => nav("/dashboard")} className="pressable rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A1F44] ring-1 ring-[#0A1F44]/15 dark:bg-white/10 dark:text-white dark:ring-white/15">My dashboard</button>
          </div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Online admission · prototype</p>
        <h1 className="h-section text-3xl font-bold text-[#0A1F44] dark:text-white">Kilala Dormitory application</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">3 steps · validated in-browser · stored securely</p>

        <div className="mt-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10">
          <Stepper steps={["Personal", "Dorm prefs", "Upload"]} current={step} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
            className="mt-4 rounded-3xl bg-white p-5 sm:p-7 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white"
          >
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#FFF8E1] px-3.5 py-2.5 ring-1 ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:ring-[#FFC72C]/40 sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Applying as (your account)</p>
                  <p className="text-sm font-bold">{identityName} · {identityEmail}</p>
                </div>
                <label className="text-sm font-semibold">Student ID<input className={inputCls} value={form.studentId} onChange={set("studentId")} placeholder="2024-01209" /></label>
                <label className="text-sm font-semibold">Mobile<input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="09xx-xxx-xxxx" /></label>
                <label className="text-sm font-semibold">Course<input className={inputCls} value={form.course} onChange={set("course")} placeholder="BS Nursing" /></label>
                <label className="text-sm font-semibold">Year level
                  <select className={inputCls} value={form.year} onChange={set("year")}>
                    {["1st Year","2nd Year","3rd Year","4th Year","5th Year"].map((y) => <option key={y} className="text-slate-900">{y}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold sm:col-span-2">Parent / Guardian + contact<input className={inputCls} value={form.guardian} onChange={set("guardian")} placeholder="Name — mobile" /></label>
                <label className="text-sm font-semibold sm:col-span-2">Home address<input className={inputCls} value={form.address} onChange={set("address")} placeholder="Street, City" /></label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <label className="text-sm font-semibold">Term
                  <select className={inputCls} value={form.term} onChange={set("term")}>
                    <option className="text-slate-900">1st Sem AY 2026–27</option>
                    <option className="text-slate-900">2nd Sem AY 2026–27</option>
                    <option className="text-slate-900">Summer 2027</option>
                    <option className="text-slate-900">Full AY 2026–27</option>
                  </select>
                </label>
                <div className="rounded-2xl bg-[#FFF8E1] p-4 text-[13px] text-[#0A1F44] ring-1 ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:text-[#FFE9A8] dark:ring-[#FFC72C]/40">
                  Your application covers the selected term. The Housing Office reviews requirements in the order received.
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                {DOC_TYPES.map((d) => (
                  <FileUploader key={d.key} label={d.label} hint={d.hint}
                    value={files[d.key]} onChange={(v) => setFiles((f) => ({ ...f, [d.key]: v }))} />
                ))}
                <label className="flex cursor-pointer items-start gap-2 rounded-2xl bg-slate-50 p-3 text-[13px] ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/15">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-[#F5B800]" />
                  I certify these uploads are true copies. I agree to paperless processing for this prototype demo.
                </label>
                {err && <p className="text-[13px] font-semibold text-rose-500">{err}</p>}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                className="pressable inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 disabled:opacity-30 dark:text-slate-300"
              ><ArrowLeft size={15} /> Back</button>
              {step < 2 ? (
                <button
                  onClick={() => { setStep((s) => s + 1); }}
                  disabled={step === 0 && !validStep0}
                  className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#0A1F44] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-[#FFC72C] dark:text-[#0A1F44]"
                >Continue <ArrowRight size={15} /></button>
              ) : (
                <button onClick={submit} disabled={busy} className="pressable rounded-full bg-[#FFC72C] px-6 py-2.5 text-sm font-bold text-[#0A1F44] shadow hover:bg-[#F5B800] disabled:opacity-50">
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
