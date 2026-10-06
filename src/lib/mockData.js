export const DOC_TYPES = [
  { key: "school_id", label: "School ID / Valid ID", hint: "Front photo, PDF / JPG / PNG, max 5MB", required: true },
  { key: "coe", label: "Certificate of Enrollment", hint: "Current semester COE or registration form", required: true },
  { key: "birth_cert", label: "Birth Certificate", hint: "PSA / NSO copy", required: true },
];

export const statusMeta = {
  pending: { label: "Pending", dot: "bg-[#F5B800]", pill: "bg-[#FFF8E1] text-[#0A1F44] ring-[#FFC72C] dark:bg-[#FFC72C]/15 dark:text-[#FFE9A8] dark:ring-[#FFC72C]/40" },
  under_review: { label: "Under Review", dot: "bg-[#0A1F44] dark:bg-[#FFC72C]", pill: "bg-[#DCE6FA] text-[#0A1F44] ring-[#0A1F44]/20 dark:bg-white/10 dark:text-white dark:ring-white/20" },
  approved: { label: "Approved", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30" },
  rejected: { label: "Needs Resubmit", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30" },
};
