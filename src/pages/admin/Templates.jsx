import { useEffect, useRef, useState } from "react";
import { FileText, UploadCloud, ExternalLink } from "lucide-react";
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
      .then(setRows)
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
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Forms students download</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Templates</h1>
      <p className="mt-1 text-sm text-slate-400">
        Upload the 5 softcopy forms. Students download, print, sign, and upload them back with their application.
      </p>

      {fetchErr && <p className="mt-3 rounded-2xl bg-rose-500/10 p-3 text-[13px] font-semibold text-rose-300 ring-1 ring-rose-400/30">{fetchErr}</p>}
      {err && <p className="mt-3 rounded-2xl bg-rose-500/10 p-3 text-[13px] font-semibold text-rose-300 ring-1 ring-rose-400/30">{err}</p>}

      <div className="mt-4 grid gap-2.5">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {!loading && rows.length === 0 && !fetchErr && (
          <p className="rounded-3xl bg-white/5 p-6 text-center text-sm text-slate-300 ring-1 ring-white/10">
            No templates yet — run <span className="font-mono">mvp3_billing_docs.sql</span> to seed the 5 rows.
          </p>
        )}
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 rounded-3xl bg-white p-4 text-slate-900 shadow dark:bg-[#0B1E3A] dark:text-white dark:ring-1 dark:ring-white/10">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">
              <FileText size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{r.label}</p>
              <p className="truncate font-mono text-xs text-slate-400">
                {r.file_name || "No file uploaded yet"}
                {r.updated_at && r.file_name ? ` · ${new Date(r.updated_at).toLocaleDateString()}` : ""}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${r.file_path ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-[#FFF8E1] text-[#0A1F44] ring-1 ring-[#FFC72C]"}`}>
              {r.file_path ? "Uploaded" : "Missing"}
            </span>
            <div className="flex shrink-0 gap-1.5">
              {r.file_path && (
                <button onClick={() => open(r)} className="pressable inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold dark:bg-white/10">
                  <ExternalLink size={13} /> View
                </button>
              )}
              <button onClick={() => pick(r.key)} disabled={busyKey === r.key}
                className="pressable inline-flex items-center gap-1 rounded-full bg-[#FFC72C] px-3 py-1.5 text-xs font-bold text-[#0A1F44] hover:bg-[#F5B800] disabled:opacity-50">
                <UploadCloud size={13} /> {busyKey === r.key ? "…" : r.file_path ? "Replace" : "Upload"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={onFile} />
    </div>
  );
}
