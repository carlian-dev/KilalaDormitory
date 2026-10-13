import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileText, X, CheckCircle2, Eye } from "lucide-react";

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileUploader({ label, hint, value, onChange, accept = ".pdf,.jpg,.jpeg,.png" }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const file = value?._file || null;
  const isPdf = (file?.type || "").includes("pdf") || /\.pdf$/i.test(value?.fileName || "");

  // Revoke the object URL when the preview closes or the file changes.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Close the preview if the file is replaced or removed.
  useEffect(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const openPreview = () => {
    setError("");
    if (!file) { setError("No preview available — please re-select the file."); return; }
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch {
      setError("Could not preview this file.");
    }
  };

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
        <>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-400/30">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-white/10"><FileText size={18} /></span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold dark:text-white">{value.fileName}</p>
              <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 size={12} /> Attached · {formatSize(value.size)} · saved on this device</p>
            </div>
            <span className="flex gap-1">
              <button type="button" onClick={() => inputRef.current?.click()} className="pressable rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm dark:bg-white/10 dark:text-white">Replace</button>
              <button type="button" onClick={() => onChange(null)} aria-label="Remove file" className="pressable grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm dark:bg-white/10 dark:text-white"><X size={14} /></button>
            </span>
          </div>
          <button
            type="button"
            onClick={openPreview}
            className="pressable mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#0A1F44]/5 px-4 py-2 text-[13px] font-bold text-[#0A1F44] hover:bg-[#0A1F44]/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <Eye size={14} /> Verify — check this file looks right
          </button>
        </>
      )}
      {previewUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={`Preview ${value?.fileName || "file"}`} onClick={closePreview}>
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-[#0B1E3A] dark:ring-1 dark:ring-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10">
              <p className="min-w-0 truncate text-sm font-bold text-[#0A1F44] dark:text-white">{value?.fileName || "Preview"}</p>
              <button type="button" onClick={closePreview} aria-label="Close preview" className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-white/10 dark:text-white"><X size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3 dark:bg-white/5">
              {isPdf ? (
                <iframe title={`Preview ${value?.fileName || "PDF"}`} src={previewUrl} className="h-[60vh] w-full rounded-2xl bg-white" />
              ) : (
                <img src={previewUrl} alt={`Preview of ${value?.fileName || "upload"}`} className="mx-auto max-h-[60vh] w-auto rounded-2xl object-contain" />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <p className="text-xs text-slate-500 dark:text-slate-300">{value?.fileName} · {formatSize(value?.size)}</p>
              <span className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="pressable rounded-full bg-[#0A1F44]/5 px-4 py-2 text-xs font-bold text-[#0A1F44] dark:bg-white/10 dark:text-white">Open in new tab</a>
                <button type="button" onClick={closePreview} className="pressable rounded-full bg-[#FFC72C] px-4 py-2 text-xs font-bold text-[#0A1F44] hover:bg-[#F5B800]">Done</button>
              </span>
            </div>
          </div>
        </div>
      )}
      <input
        ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
