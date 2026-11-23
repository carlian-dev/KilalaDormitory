import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, UploadCloud } from "lucide-react";
import { listTemplates, uploadTemplate, downloadTemplate } from "../../lib/applications";

export default function Templates() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef(null);
  const [targetKey, setTargetKey] = useState("");

  const load = () => {
    setLoading(true);
    setFetchErr("");
    listTemplates()
      .then((data) => setRows(
        (data || []).filter((r) => !/birth/i.test(r.key || "") && !/birth certificate/i.test(r.label || ""))
      ))
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (key) => {
    setErr("");
    setTargetKey(key);
    inputRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !targetKey) return;
    setBusyKey(targetKey);
    try {
      await uploadTemplate({ key: targetKey, file, fileName: file.name });
      await load();
    } catch (ex) {
      setErr(ex.message || "Upload failed.");
    } finally {
      setBusyKey("");
    }
  };

  const open = async (row) => {
    if (!row.file_path) return;
    try {
      const url = await downloadTemplate(row.file_path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setErr("Could not open file: " + e.message);
    }
  };

  return (
    <div>
      <p className="eyebrow">Forms students download</p>
      <h1 className="h-section mt-2 text-2xl text-[var(--ink)] sm:text-3xl">Templates</h1>
      <p className="mt-1.5 max-w-xl text-[12px] leading-relaxed text-[var(--muted)]">
        Upload the five softcopy forms. Students download, print, sign, and upload them back with their application.
      </p>

      {fetchErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">{fetchErr}</p>}
      {err && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[12px] font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/30">{err}</p>}

      <div className="mt-5 grid gap-3">
        {loading && <p className="text-[13px] text-[var(--muted-soft)]">Loading…</p>}
        {!loading && rows.length === 0 && !fetchErr && (
          <p className="card p-8 text-center text-[13px] text-[var(--muted)]">
            No templates yet — run <span className="font-mono text-[12px]">mvp3_billing_docs.sql</span> to seed the five rows.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.key} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[var(--ink)]">{r.label}</p>
                <p className="mt-0.5 truncate text-[11px] font-mono text-[var(--muted-soft)]">
                  {r.file_name || "No file uploaded yet"}
                  {r.updated_at && r.file_name ? ` · ${new Date(r.updated_at).toLocaleDateString()}` : ""}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pl-[52px] sm:pl-0">
              <span className={`chip ${r.file_path
                ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200 dark:text-emerald-300 dark:ring-emerald-400/25"
                : "bg-[#FFF8E1] text-[#0B2A6B] ring-1 ring-[#FFD120]/60 dark:bg-[#FFD120]/10 dark:text-[#FFD120] dark:ring-[#FFD120]/25"}`}>
                {r.file_path ? "Uploaded" : "Missing"}
              </span>
              {r.file_path && (
                <button onClick={() => open(r)} className="pressable btn btn-secondary btn-sm">
                  <ExternalLink size={13} /> View
                </button>
              )}
              <button onClick={() => pick(r.key)} disabled={busyKey === r.key}
                className="pressable btn btn-accent btn-sm">
                <UploadCloud size={13} /> {busyKey === r.key ? "Uploading…" : r.file_path ? "Replace" : "Upload"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={onFile} />
    </div>
  );
}
