import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, FileText, LogOut, PlusCircle, ArrowLeft, ExternalLink, Bell, Check } from "lucide-react";
import { PageFade, StatusBadge } from "../components/ui";
import { FileUploader } from "../components/FileUploader";
import { DOC_TYPES, TEMPLATE_DOCS, UPLOAD_DOCS, BILLING, formatPeso } from "../lib/mockData";
import { useAuth } from "../lib/auth";
import {
  fetchMyApplications,
  fetchApplicationHistory,
  fetchNotifications,
  markNotificationRead,
  signedDocUrl,
  resubmitDocuments,
} from "../lib/applications";

const docLabel = (t) => DOC_TYPES.find((d) => d.key === t)?.label || t;

function timelineOf(status) {
  if (status === "rejected") return ["Submitted", "Reviewed", "Needs resubmit"];
  const order = ["pending", "under_review", "approved"];
  const idx = order.indexOf(status);
  return ["Submitted", idx >= 1 ? "Under review" : "Review", idx === 2 ? "Approved" : "Decision"];
}

export default function ApplicantDashboard() {
  const { user, profile, signOut } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationErr, setNotificationErr] = useState("");
  const [notificationBusy, setNotificationBusy] = useState("");
  const [historyResult, setHistoryResult] = useState({ applicationId: "", events: [], error: "" });

  const load = () => {
    if (!user) return Promise.resolve();
    setLoading(true);
    setFetchErr("");
    return fetchMyApplications(user.id)
      .then(setMine)
      .catch((e) => setFetchErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id)
      .then(setNotifications)
      .catch((e) => setNotificationErr(e.message));
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return mine;
    return mine.filter((a) => [a.id, a.course, a.status].join(" ").toLowerCase().includes(needle));
  }, [mine, q]);

  const selectedId = params.get("id");
  const selected = selectedId ? mine.find((a) => a.id === selectedId) || null : null;
  const historyLoading = Boolean(selectedId && historyResult.applicationId !== selectedId);
  const history = historyResult.applicationId === selectedId ? historyResult.events : [];
  const historyErr = historyResult.applicationId === selectedId ? historyResult.error : "";
  const showNotifications = params.get("view") === "notifications";

  useEffect(() => {
    if (!selectedId) return;
    fetchApplicationHistory(selectedId)
      .then((events) => setHistoryResult({ applicationId: selectedId, events, error: "" }))
      .catch((e) => setHistoryResult({ applicationId: selectedId, events: [], error: e.message }));
  }, [selectedId]);

  useEffect(() => {
    if (showNotifications) {
      document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showNotifications]);

  const count = (s) => mine.filter((a) => a.status === s).length;
  const openNotification = async (notification) => {
    if (notification.is_read) return;
    setNotificationBusy(notification.id);
    setNotificationErr("");
    try {
      await markNotificationRead(notification.id);
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item
      ));
    } catch (e) {
      setNotificationErr(e.message);
    } finally {
      setNotificationBusy("");
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

  if (selected) {
    const steps = timelineOf(selected.status);
    return (
      <PageFade>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <button onClick={() => setParams({})} className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#0A1F44]/5 px-4 py-2 text-[13px] font-bold text-[#0A1F44] dark:bg-white/10 dark:text-white">
            <ArrowLeft size={14} /> My applications
          </button>
          <div className="mt-4 rounded-3xl bg-white p-5 sm:p-7 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-slate-500 dark:text-slate-300 break-all">{selected.id}</p>
                <p className="text-xl font-bold tracking-tight">{profile?.full_name}</p>
                <p className="text-[13px] text-slate-500 dark:text-slate-300">{selected.studentId} · {selected.course} · {selected.year}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 rounded-2xl bg-[#0A1F44] p-3.5 text-white dark:bg-[#FFC72C] dark:text-[#0A1F44]">
              <div className="flex justify-between text-sm font-bold">
                <span>Monthly rate</span><span>{formatPeso(selected.monthlyTotal)}/mo</span>
              </div>
              <p className="mt-0.5 text-xs opacity-80">
                {formatPeso(BILLING.BASE_RATE)} base
                {(selected.devices || []).length > 0
                  ? ` · Devices: ${selected.devices.map((d) => `${d.name} (${d.kind === "appliance" ? "+₱150" : "free"})`).join(", ")}`
                  : " · No devices declared"}
              </p>
            </div>

            <div className="mt-5 flex items-center gap-1">
              {steps.map((t, i, arr) => (
                <div key={t} className="flex flex-1 items-center gap-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${i === arr.length - 1 ? (selected.status === "rejected" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white") : "bg-[#0A1F44] text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]"}`}>{i + 1}</span>
                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-600 dark:text-slate-300">{t}</span>
                  </div>
                  {i < arr.length - 1 && <span className="mx-1 mb-5 h-px flex-1 bg-slate-200 dark:bg-white/15" />}
                </div>
              ))}
            </div>

            {selected.remarks && (
              <div className={`mt-4 rounded-2xl p-3.5 text-[13px] ring-1 ${selected.status === "rejected" ? "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30" : "bg-[#FFF8E1] text-[#0A1F44] ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:text-[#FFE9A8] dark:ring-[#FFC72C]/40"}`}>
                <b>Admin note:</b> {selected.remarks}
              </div>
            )}

            <section className="mt-5">
              <h2 className="text-sm font-bold">Application history</h2>
              {historyErr && <p className="mt-2 text-[13px] font-semibold text-rose-500">{historyErr}</p>}
              {historyLoading ? (
                <p className="mt-2 text-sm text-slate-400">Loading history…</p>
              ) : (
                <ol className="mt-2 grid gap-2">
                  {history.map((event) => (
                    <li key={event.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[13px] font-bold">
                          {event.event_type === "submitted" ? "Application submitted"
                            : event.event_type === "resubmitted" ? "Documents resubmitted"
                              : event.event_type === "remarks_updated" ? "Staff note added"
                                : `Status changed to ${event.status.replaceAll("_", " ")}`}
                        </p>
                        <time className="text-xs text-slate-400">{new Date(event.created_at).toLocaleString()}</time>
                      </div>
                      {event.remarks && <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-300">{event.remarks}</p>}
                    </li>
                  ))}
                  {!historyLoading && history.length === 0 && !historyErr && (
                    <li className="text-sm text-slate-400">No history yet.</li>
                  )}
                </ol>
              )}
            </section>

            <p className="mt-5 text-sm font-bold">Signed forms ({selected.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).length}/{TEMPLATE_DOCS.length})</p>
            <div className="mt-2 grid gap-2">
              {selected.docs.filter((d) => TEMPLATE_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{docLabel(d.type)}</p>
                    <p className="truncate text-xs text-slate-400">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-[#0A1F44] px-3 py-1.5 text-xs font-bold text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">
                    <ExternalLink size={12} /> View
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm font-bold">Your documents ({selected.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).length}/{UPLOAD_DOCS.length})</p>
            <div className="mt-2 grid gap-2">
              {selected.docs.filter((d) => UPLOAD_DOCS.some((t) => t.key === d.type)).map((d) => (
                <div key={d.type} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-sm dark:bg-white/10"><FileText size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{docLabel(d.type)}</p>
                    <p className="truncate text-xs text-slate-400">{d.fileName}</p>
                  </div>
                  <button onClick={() => openDoc(d)} className="pressable inline-flex items-center gap-1 rounded-full bg-[#0A1F44] px-3 py-1.5 text-xs font-bold text-[#FFC72C] dark:bg-[#FFC72C] dark:text-[#0A1F44]">
                    <ExternalLink size={12} /> View
                  </button>
                </div>
              ))}
            </div>

            {selected.status === "rejected" && (
              <ResubmitBox
                appId={selected.id}
                onDone={async () => { await load(); setParams({}); }}
              />
            )}
          </div>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kilala Dormitory · my dashboard</p>
            <h1 className="h-section text-3xl font-bold text-[#0A1F44] dark:text-white">
              Hello, {profile?.full_name?.split(" ")[0] || "applicant"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{user?.email} · {mine.length} application{mine.length === 1 ? "" : "s"}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/apply" className="pressable inline-flex items-center gap-1.5 rounded-full bg-[#FFC72C] px-5 py-2.5 text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800]">
              <PlusCircle size={15} /> New application
            </Link>
            <button
              onClick={async () => { await signOut(); nav("/"); }}
              className="pressable inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#0A1F44] ring-1 ring-[#0A1F44]/15 dark:bg-white/10 dark:text-white dark:ring-white/15"
            ><LogOut size={14} /> Sign out</button>
          </div>
        </div>

        {fetchErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">{fetchErr}</p>}
        {notificationErr && <p className="mt-4 rounded-2xl bg-rose-50 p-3 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200">{notificationErr}</p>}

        <section id="notifications" className="mt-5 scroll-mt-24 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Bell size={16} /> Notifications
            </h2>
            {notifications.some((item) => !item.is_read) && (
              <span className="rounded-full bg-[#FFC72C] px-2.5 py-1 text-[11px] font-bold text-[#0A1F44]">
                {notifications.filter((item) => !item.is_read).length} unread
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No notifications yet. We’ll let you know when your application is updated.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    onClick={() => openNotification(notification)}
                    disabled={notificationBusy === notification.id}
                    className={`pressable flex w-full items-start gap-3 rounded-2xl p-3 text-left ring-1 disabled:opacity-50 ${
                      notification.is_read
                        ? "bg-slate-50 ring-slate-100 dark:bg-white/5 dark:ring-white/10"
                        : "bg-[#FFF8E1] ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:ring-[#FFC72C]/40"
                    }`}
                  >
                    <span className="mt-0.5 text-[#0A1F44] dark:text-[#FFC72C]">
                      {notification.is_read ? <Check size={16} /> : <Bell size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold">{notification.title}</span>
                      <span className="mt-0.5 block text-[13px] text-slate-600 dark:text-slate-300">{notification.message}</span>
                      <time className="mt-1 block text-xs text-slate-400">{new Date(notification.created_at).toLocaleString()}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-400">Loading your applications…</p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Pending", count("pending")], ["Under review", count("under_review")], ["Approved", count("approved")], ["Needs resubmit", count("rejected")]].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white px-3 py-3.5 text-center shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10">
                  <p className="text-2xl font-bold text-[#0A1F44] dark:text-[#FFC72C]">{v}</p>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">{k}</p>
                </div>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 shadow-sm ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/15 dark:text-white">
              <Search size={15} className="text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search my applications by ID, course, status…"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400" />
            </label>

            {filtered.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10">
                <p className="text-lg font-bold dark:text-white">{mine.length === 0 ? "No applications yet" : "No matches"}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-300">
                  {mine.length === 0
                    ? "Submit your first dorm application with the 3 requirements."
                    : "Try a different search term."}
                </p>
                {mine.length === 0 && (
                  <Link to="/apply" className="pressable mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FFC72C] px-6 py-3 text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800]">
                    <PlusCircle size={15} /> Start application
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#0B1E3A] dark:ring-white/10 dark:text-white">
                {filtered.map((a) => (
                  <button key={a.id} onClick={() => setParams({ id: a.id })}
                    className="pressable flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left last:border-0 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">Application <span className="font-mono font-medium text-slate-400">· {String(a.id).slice(0, 8)}</span></span>
                      <span className="block truncate text-xs text-slate-400">{a.course} · {a.year} · {formatPeso(a.monthlyTotal)}/mo · {new Date(a.submittedAt).toLocaleDateString()}</span>
                    </span>
                    <StatusBadge status={a.status} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageFade>
  );
}

function ResubmitBox({ appId, onDone }) {
  const [files, setFiles] = useState(() => Object.fromEntries(DOC_TYPES.map((d) => [d.key, null])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = DOC_TYPES.every((d) => files[d.key]);

  const submit = async () => {
    if (!ready) { setErr(`Please re-upload all ${DOC_TYPES.length} documents.`); return; }
    setErr("");
    setBusy(true);
    try {
      await resubmitDocuments({ appId, files });
      await onDone();
    } catch (e) {
      setErr(e.message || "Re-upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl bg-[#FFF8E1] p-4 ring-1 ring-[#FFC72C] dark:bg-[#FFC72C]/10 dark:ring-[#FFC72C]/40">
      <p className="text-sm font-bold text-[#0A1F44] dark:text-[#FFE9A8]">Fix your documents and resubmit</p>
      <p className="mt-0.5 text-[13px] text-[#0A1F44]/70 dark:text-[#FFE9A8]/70">
        Upload fresh copies of all {DOC_TYPES.length} documents. Your application goes back to Pending for re-review.
      </p>
      <div className="mt-3 grid gap-3 rounded-2xl bg-white p-3 dark:bg-[#0B1E3A]">
        {DOC_TYPES.map((d) => (
          <FileUploader key={d.key} label={d.label} hint={d.hint}
            value={files[d.key]} onChange={(v) => setFiles((f) => ({ ...f, [d.key]: v }))} />
        ))}
      </div>
      {err && <p className="mt-2 text-[13px] font-semibold text-rose-500">{err}</p>}
      <button onClick={submit} disabled={busy || !ready}
        className="pressable mt-3 w-full rounded-full bg-[#FFC72C] py-2.5 text-sm font-bold text-[#0A1F44] hover:bg-[#F5B800] disabled:opacity-50">
        {busy ? "Uploading…" : "Resubmit for review"}
      </button>
    </div>
  );
}
