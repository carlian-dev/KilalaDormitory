export const BILLING = {
  BASE_RATE: 775,
  PER_APPLIANCE: 150,
  CURRENCY: "₱",
};

// Preset device declarations shown as checkboxes in Apply. Free gadgets are
// kind "gadget"; paid appliances are kind "appliance". Anything typed under
// "Other" is stored as kind "other" and assessed by the Housing Office.
export const DEVICE_PRESETS = [
  { key: "laptop", label: "Laptop", kind: "gadget" },
  { key: "cellphone", label: "Cellphone", kind: "gadget" },
  { key: "tablet", label: "Tablet", kind: "gadget" },
  { key: "iron", label: "Iron", kind: "appliance" },
  { key: "rice_cooker", label: "Rice cooker", kind: "appliance" },
];

export function computeTotal(devices = []) {
  const list = Array.isArray(devices) ? devices : [];
  // Only "appliance" adds a charge. "gadget" is free; "other" awaits admin review.
  const applianceCount = list.filter((d) => d.kind === "appliance").length;
  return BILLING.BASE_RATE + applianceCount * BILLING.PER_APPLIANCE;
}

export function formatPeso(n) {
  return `${BILLING.CURRENCY}${Number(n || 0).toLocaleString()}`;
}

export function deviceKindLabel(kind) {
  if (kind === "appliance") return `+${formatPeso(BILLING.PER_APPLIANCE)}/mo`;
  if (kind === "gadget") return "Free";
  return "For review";
}

// Normalize saved/draft devices: known names become their preset (and their
// fixed free/paid classification); custom items retain their admin classification
// ('appliance' | 'gadget' | 'other') or default to 'other' awaiting review.
export function normalizeDevices(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((d) => d && typeof d.name === "string")
    .map((d) => {
      const preset = DEVICE_PRESETS.find(
        (p) => p.key === d.key || p.label.toLowerCase() === d.name.trim().toLowerCase()
      );
      return preset
        ? { key: preset.key, name: preset.label, kind: preset.kind }
        : {
            name: d.name.trim(),
            kind: d.kind === "appliance" || d.kind === "gadget" || d.kind === "other" ? d.kind : "other",
          };
    });
}

// Degree programs grouped by college — drives the College + Course dropdowns.
// Full program names are stored in applications.course (no DB migration needed).
export const COLLEGES = [
  {
    name: "College of Nursing",
    courses: ["Bachelor of Science in Nursing"],
  },
  {
    name: "College of Business",
    courses: [
      "Bachelor of Science in Accountancy",
      "Bachelor of Science in Business Administration",
      "Bachelor of Science in Hospitality Management",
    ],
  },
  {
    name: "College of Public Administration and Governance",
    courses: ["Bachelor of Public Administration"],
  },
  {
    name: "College of Technologies",
    courses: [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Automotive Technology",
      "Bachelor of Science in Food Technology",
      "Bachelor of Science in Entertainment and Multimedia Computing",
      "Bachelor of Science in Electronics",
    ],
  },
  {
    name: "College of Arts and Sciences",
    courses: [
      "Bachelor of Science in Biology",
      "Bachelor of Science in Mathematics",
      "Bachelor of Science in Environmental Science",
      "Bachelor of Arts in Economics",
      "Bachelor of Arts in English",
      "Bachelor of Arts in Philosophy",
      "Bachelor of Arts in Sociology",
      "Bachelor of Science in Development Communication",
    ],
  },
];

export function collegeOfCourse(course) {
  return COLLEGES.find((c) => c.courses.includes(course))?.name || "";
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
  { key: "birth_certificate", label: "Birth Certificate", hint: "Birth certificate copy, PDF / JPG / PNG, max 5MB", source: "upload", required: true },
];

export const TEMPLATE_DOCS = DOC_TYPES.filter((d) => d.source === "template");
export const UPLOAD_DOCS = DOC_TYPES.filter((d) => d.source === "upload");

export const statusMeta = {
  pending: { label: "Pending", dot: "bg-[#F0BB00]", pill: "bg-[#FFF8E1] text-[#0B2A6B] ring-[#FFD120] dark:bg-[#FFD120]/15 dark:text-[#FFE9A8] dark:ring-[#FFD120]/40" },
  under_review: { label: "Under Review", dot: "bg-[#0B2A6B] dark:bg-[#FFD120]", pill: "bg-[#DCE6FA] text-[#0B2A6B] ring-[#0B2A6B]/20 dark:bg-white/10 dark:text-white dark:ring-white/20" },
  approved: { label: "Approved", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30" },
  rejected: { label: "Needs Resubmit", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/30" },
};
