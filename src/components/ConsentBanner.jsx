import { useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("kilala-consent");
    } catch {
      return true;
    }
  });
  const [showPrefs, setShowPrefs] = useState(false);

  if (!visible) return null;

  const choose = (value) => {
    try {
      localStorage.setItem("kilala-consent", value);
    } catch {
      /* ignore — banner simply won't persist */
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200 dark:bg-[#0B1E3A] dark:ring-white/15 dark:text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-[#0A1F44] dark:text-white">We use essential storage, not tracking cookies</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-300">
              Kilala Dormitory uses browser storage (localStorage / IndexedDB) to keep you signed in, remember your theme, save your application draft, and record this choice. We do not use analytics, advertising, or third-party tracking cookies.{" "}
              <a href="/storage-policy" className="font-semibold text-[#0A1F44] underline dark:text-[#FFC72C]">Learn more</a>.
            </p>
            {showPrefs && (
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-400">
                “Essential only” keeps only the storage required to run the app (sign-in, theme, draft, consent). There are no optional trackers to disable.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrefs((v) => !v)}
              className="pressable rounded-full px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Preferences
            </button>
            <button
              type="button"
              onClick={() => choose("essential")}
              className="pressable rounded-full bg-slate-100 px-4 py-2 text-[12px] font-bold text-[#0A1F44] hover:bg-slate-200 dark:bg-white/10 dark:text-white"
            >
              Essential only
            </button>
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="pressable rounded-full bg-[#FFC72C] px-4 py-2 text-[12px] font-bold text-[#0A1F44] hover:bg-[#F5B800]"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}