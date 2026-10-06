import { useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";

export function FileUploader({ label, hint, value, onChange, accept = ".pdf,.jpg,.jpeg,.png" }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");

  const pick = (file) => {
    setError("");
    if (!file) return;
    const okTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (file.size > 5 * 1024 * 1024) { setError("File exceeds 5MB."); return; }
    if (file.type && !okTypes.includes(file.type) && !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      setError("Only PDF / JPG / PNG allowed."); return;
    }
    onChange({ fileName: file.name, size: file.size, _file: file });
  };

  return (
    <div>
      <p className="text-sm font-semibold dark:text-white">{label} <span className="text-rose-500">*</span></p>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      {!value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
          className={`pressable flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-center ${drag ? "drop-active" : "border-[#0A1F44]/20 bg-white dark:border-white/15 dark:bg-white/5"}`}
        >
          <UploadCloud className="text-[#0A1F44] dark:text-[#FFC72C]" size={26} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">Tap to upload or drag & drop</span>
          <span className="text-xs text-slate-400">PDF / JPG / PNG · max 5MB</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/30">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/10"><FileText size={18} /></span>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold dark:text-white">{value.fileName}</p>
            <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={12} /> Ready to submit (mock — stored locally)</p>
          </div>
          <span className="flex gap-1">
            <button type="button" onClick={() => inputRef.current?.click()} className="pressable rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm dark:bg-white/10 dark:text-white">Replace</button>
            <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="pressable grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm dark:bg-white/10 dark:text-white"><X size={14} /></button>
          </span>
        </div>
      )}
      <input
        ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
