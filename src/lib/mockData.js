export const BILLING = {
  BASE_RATE: 775,
  PER_APPLIANCE: 150,
  CURRENCY: "₱",
};

export function computeTotal(devices = []) {
  const list = Array.isArray(devices) ? devices : [];
  const applianceCount = list.filter((d) => d.kind === "appliance").length;
  return BILLING.BASE_RATE + applianceCount * BILLING.PER_APPLIANCE;
}

export function formatPeso(n) {
  return `${BILLING.CURRENCY}${Number(n || 0).toLocaleString()}`;
}

// source: "template" = admin softcopy (download, print, sign, upload back)
// source: "upload"   = student-provided document (upload directly)
export const DOC_TYPES = [
  { key: "residency_application", label: "Residency Application for Students", hint: "Download the form, print, sign, then upload the signed copy", source: "template", required: true },
  { key: "personal_data", label: "Personal Data for Students", hint: "Download the form, print, sign, then upload the signed copy", source: "template", required: true },
  { key: "residency_agreement", label: "Residency Agreement", hint: "Download the form, print, sign, then upload the signed copy", source: "template", required: true },
  { key: "appliance_registration", label: "Registration of Appliance / Electronic Device", hint: "Download the form, print, sign, then upload the signed copy", source: "template", required: true },
  { key: "residency_admission", label: "Residency Admission", hint: "Download the form, print, sign, then upload the signed copy", source: "template", required: true },
  { key: "cor", label: "Certificate of Registration (COR)", hint: "Your COR for the current term, PDF / JPG / PNG, max 5MB", source: "upload", required: true },
  { key: "student_id_copy", label: "Photocopy of Student ID", hint: "Clear front copy, PDF / JPG / PNG, max 5MB", source: "upload", required: true },
  { key: "med_lab", label: "Medical Laboratory Result", hint: "Laboratory result copy, PDF / JPG / PNG, max 5MB", source: "upload", required: true },
  { key: "med_cert", label: "Medical Certificate", hint: "Medical certificate copy, PDF / JPG / PNG, max 5MB", source: "upload", required: true },
];

export const TEMPLATE_DOCS = DOC_TYPES.filter((d) => d.source === "template");
export const UPLOAD_DOCS = DOC_TYPES.filter((d) => d.source === "upload");

export const statusMeta = {
  pending: { label: "Pending", dot: "bg-[#F0BB00]", pill: "bg-[#FFF8E1] text-[#0B2A6B] ring-[#FFD120] dark:bg-[#FFD120]/15 dark:text-[#FFE9A8] dark:ring-[#FFD120]/40" },
  under_review: { label: "Under Review", dot: "bg-[#0B2A6B] dark:bg-[#FFD120]", pill: "bg-[#DCE6FA] text-[#0B2A6B] ring-[#0B2A6B]/20 dark:bg-white/10 dark:text-white dark:ring-white/20" },
  approved: { label: "Approved", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30" },
  rejected: { label: "Needs Resubmit", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30" },
};
