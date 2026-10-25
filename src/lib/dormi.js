import { supabase } from "./supabase";
import { DOC_TYPES, statusMeta } from "./mockData";
import { fetchAllApplications, fetchMyApplications } from "./applications";

// Dormi client library — context builders + the single call into the
// dormi-chat Edge Function. Privacy rules live in docs/AI-integration.md §2.2:
// only data the user already sees through RLS is sent, and never IDs, phones,
// guardians, addresses, or any document contents.

export const DORMI_MAX_HISTORY = 8; // keep free-tier requests small

export const DORMI_SUGGESTIONS = {
  student: [
    "What's my application status?",
    "Which documents am I still missing?",
    "How is my monthly rate computed?",
  ],
  admin: [
    "How many applications are pending?",
    "Summarize the latest submissions.",
    "Which courses applied the most?",
  ],
};

export function buildStudentContext(apps = []) {
  const a = apps[0]; // one student = one application (mvp4)
  if (!a) return { hasApplication: false };
  const uploaded = new Set((a.docs || []).map((d) => d.type));
  return {
    hasApplication: true,
    status: a.status,
    statusLabel: statusMeta[a.status]?.label || a.status,
    remarks: a.remarks || "",
    term: a.term,
    course: a.course,
    year: a.year,
    submittedAt: a.submittedAt,
    monthlyTotal: a.monthlyTotal,
    devices: (a.devices || []).map((d) => ({ name: d.name, kind: d.kind })),
    uploadedDocs: uploaded.size,
    missingDocs: DOC_TYPES.filter((d) => !uploaded.has(d.key)).map((d) => d.label),
  };
}

export function buildAdminContext(apps = []) {
  const byStatus = { pending: 0, under_review: 0, approved: 0, rejected: 0 };
  const byCourse = {};
  let revenue = 0;
  for (const a of apps) {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byCourse[a.course] = (byCourse[a.course] || 0) + 1;
    revenue += a.monthlyTotal || 0;
  }
  return {
    totalApplications: apps.length,
    byStatus,
    byCourse,
    estimatedMonthlyRevenue: revenue,
    recent: apps.slice(0, 10).map((a) => ({
      name: a.name,
      course: a.course,
      status: a.status,
      submittedAt: a.submittedAt,
    })),
  };
}

export async function loadDormiContext({ userId, isAdmin }) {
  const apps = isAdmin ? await fetchAllApplications() : await fetchMyApplications(userId);
  return isAdmin ? buildAdminContext(apps) : buildStudentContext(apps);
}

// messages: [{ role: "user" | "model", text }]
export async function askDormi({ messages, context }) {
  try {
    const { data, error } = await supabase.functions.invoke("dormi-chat", {
      body: { messages, context: context ?? null },
    });
    if (error) {
      let code = "unreachable";
      let message = "Dormi couldn't be reached.";
      try {
        const payload = await error.context?.json?.();
        if (payload?.code) code = payload.code;
        if (payload?.message) message = payload.message;
      } catch { /* keep defaults (e.g. a non-JSON 404 page) */ }
      return { ok: false, code, message };
    }
    // A deployed-but-default (or undeployed) function returns a payload without
    // `ok`/`reply` (e.g. Supabase's starter template: { message: "Hello …!" }).
    // Treat that as "not set up" so users get a clear message instead of the
    // raw template text leaking through as the reply.
    if (!data?.ok || typeof data?.reply !== "string") {
      return {
        ok: false,
        code: data?.code || "not_configured",
        message: (data?.code ? data?.message : null) || "Dormi isn't fully set up yet (the chat function may not be deployed). Ask an admin to finish setup.",
        remaining: data?.remaining,
        resetAt: data?.resetAt,
      };
    }
    return data;
  } catch (e) {
    return { ok: false, code: "unreachable", message: e?.message || "Network error." };
  }
}
