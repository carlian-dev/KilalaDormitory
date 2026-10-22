import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  FileText,
  ExternalLink,
  GraduationCap,
  Building2,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../lib/auth";
import { formatFirstAndLastName } from "../lib/profile";
import { StatusBadge } from "./ui";
import { fetchMyApplications } from "../lib/applications";
import { formatPeso } from "../lib/mockData";

function ProfileDialog({ onClose }) {
  const { user, profile, isAdmin, avatarUrl, displayName } = useAuth();
  const nav = useNavigate();

  const [imgError, setImgError] = useState(false);
  const [app, setApp] = useState(null);
  const [loadingApp, setLoadingApp] = useState(!isAdmin && Boolean(user?.id));

  useEffect(() => {
    let cancelled = false;
    if (user?.id && !isAdmin) {
      fetchMyApplications(user.id)
        .then((apps) => {
          if (!cancelled && apps && apps.length > 0) {
            setApp(apps[0]);
          }
        })
        .catch((e) => {
          console.warn("[Profile] Failed to load application summary:", e.message);
        })
        .finally(() => {
          if (!cancelled) setLoadingApp(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [user?.id, isAdmin]);

  // Handle Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const rawFullName = profile?.full_name || "Kilala User";
  const formattedName = displayName || formatFirstAndLastName(rawFullName);
  const email = user?.email || "No email on file";
  const roleName = isAdmin ? "Administrator" : "Student Resident";
  const initials =
    formattedName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "U";

  const memberSince = (profile?.created_at || user?.created_at)
    ? new Date(profile?.created_at || user?.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Active Member";

  return (
    <div
      className="fixed inset-0 z-[75] grid place-items-center bg-[#041743]/50 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onMouseDown={onClose}
    >
      <motion.section
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", bounce: 0, duration: 0.25 }}
        className="w-full max-w-lg my-8 rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-[#0A2456] dark:ring-white/15 dark:text-white"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0B2A6B]/10 text-[#0B2A6B] dark:bg-[#FFD120]/15 dark:text-[#FFD120]">
              <User size={16} />
            </span>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-[#0B2A6B] dark:text-white">
                User Profile
              </h2>
              <p className="text-[11px] text-slate-400">Bukidnon State University</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pressable grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close profile"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Identity Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-2xl bg-gradient-to-br from-[#0B2A6B]/5 to-[#FFD120]/10 p-4 ring-1 ring-[#0B2A6B]/10 dark:from-white/5 dark:to-white/10 dark:ring-white/10">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={formattedName}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md ring-2 ring-[#0B2A6B]/20 dark:ring-[#FFD120]/30"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#0B2A6B] text-xl font-extrabold text-[#FFD120] shadow-md dark:bg-[#FFD120] dark:text-[#0B2A6B]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-lg font-bold tracking-tight text-[#0B2A6B] dark:text-white">
                {formattedName}
              </h3>
              {rawFullName && rawFullName !== formattedName && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Institutional record: <span className="font-semibold text-slate-700 dark:text-slate-200">{rawFullName}</span>
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isAdmin
                      ? "bg-[#0B2A6B] text-[#FFD120] dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                      : "bg-[#FFD120]/30 text-[#0B2A6B] dark:bg-[#FFD120]/20 dark:text-[#FFD120]"
                  }`}
                >
                  <Shield size={12} /> {roleName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isAdmin ? "BukSU Housing Office Staff" : "Google Workspace Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Credentials Grid (User Reference ID removed) */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Account Credentials
            </h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Mail size={13} /> Email Address
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-[#0B2A6B] dark:text-white" title={email}>
                  {email}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {email.endsWith("@student.buksu.edu.ph") ? "✓ BukSU Student Domain" : "✓ Authorized Account"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Calendar size={13} /> Member Since
                </div>
                <p className="mt-1 text-xs font-semibold text-[#0B2A6B] dark:text-white">
                  {memberSince}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  BukSU Kilala Housing Portal
                </p>
              </div>
            </div>
          </div>

          {/* Role-Specific Overview Section */}
          {isAdmin ? (
            /* Admin Section */
            <div className="rounded-2xl border border-[#0B2A6B]/15 bg-[#0B2A6B]/5 p-4 dark:border-white/15 dark:bg-white/5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0B2A6B] dark:text-[#FFD120]">
                <Building2 size={16} /> Dormitory Office Controls
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                You have administrative access to manage applicant files, update approval statuses, and configure downloadable templates.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    nav("/admin/apps");
                  }}
                  className="pressable inline-flex items-center gap-1.5 rounded-xl bg-[#0B2A6B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0B2A6B]/90 dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                >
                  <FileText size={13} /> Review Applications
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    nav("/admin/templates");
                  }}
                  className="pressable inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0B2A6B] shadow-xs hover:bg-slate-50 dark:border-white/15 dark:bg-white/10 dark:text-white"
                >
                  Manage Templates
                </button>
              </div>
            </div>
          ) : (
            /* Student Section */
            <div className="rounded-2xl border border-[#FFD120]/40 bg-[#FFD120]/10 p-4 dark:border-[#FFD120]/20 dark:bg-[#FFD120]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0B2A6B] dark:text-[#FFD120]">
                  <GraduationCap size={16} /> Dormitory Application
                </div>
                {app && <StatusBadge status={app.status} />}
              </div>

              {loadingApp ? (
                <p className="mt-2 text-xs text-slate-500">Loading application details…</p>
              ) : app ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400">Student ID:</span>{" "}
                      <span className="font-semibold text-[#0B2A6B] dark:text-white">{app.studentId || "-"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Term:</span>{" "}
                      <span className="font-semibold text-[#0B2A6B] dark:text-white">{app.term}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Course / Year:</span>{" "}
                      <span className="font-semibold text-[#0B2A6B] dark:text-white">{app.course} · {app.year}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Monthly Rate:</span>{" "}
                      <span className="font-semibold text-[#0B2A6B] dark:text-white">{formatPeso(app.monthlyTotal)}/mo</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        nav(`/dashboard?id=${app.id}`);
                      }}
                      className="pressable inline-flex items-center gap-1.5 rounded-xl bg-[#0B2A6B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0B2A6B]/90 dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                    >
                      <span>Open in My Dashboard</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    You have not submitted a dormitory residency application for AY 2026-27 yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      nav("/apply");
                    }}
                    className="pressable mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0B2A6B] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0B2A6B]/90 dark:bg-[#FFD120] dark:text-[#0B2A6B]"
                  >
                    <span>Apply for a Room</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3 rounded-b-3xl text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-[11px] text-slate-400">
            BukSU Kilala Dormitory Management
          </p>
        </div>
      </motion.section>
    </div>
  );
}

export default function ProfileModal({ open, onClose }) {
  if (!open) return null;
  return <ProfileDialog onClose={onClose} />;
}
