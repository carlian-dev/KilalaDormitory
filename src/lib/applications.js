import { supabase } from "./supabase";
import { computeTotal, normalizeDevices } from "./mockData";

const BUCKET = "dorm-requirements";
const TEMPLATE_BUCKET = "dorm-templates";

// DB (snake_case) -> UI (camelCase) mapper shared by student + admin views.
export function toApp(row, docs = [], profileName = "") {
  const devices = normalizeDevices(row.devices);
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: profileName || row.profiles?.full_name || "",
    studentId: row.student_id_no,
    course: row.course,
    year: row.year,
    phone: row.phone,
    guardian: row.guardian,
    address: row.address || "",
    roomPref: row.room_pref,
    term: row.term,
    devices,
    monthlyTotal: computeTotal(devices),
    status: row.status,
    remarks: row.remarks || "",
    assignedRoom: row.assigned_room || "",
    submittedAt: row.submitted_at,
    docs: docs.map((d) => ({ type: d.doc_type, fileName: d.file_name, path: d.file_path })),
  };
}

export async function fetchMyApplications(userId) {
  const { data: apps, error } = await supabase
    .from("applications")
    .select("*")
    .eq("owner_id", userId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  if (!apps.length) return [];
  const { data: docs, error: dErr } = await supabase
    .from("application_documents")
    .select("*")
    .in("application_id", apps.map((a) => a.id));
  if (dErr) throw dErr;
  return apps.map((a) =>
    toApp(a, (docs || []).filter((d) => d.application_id === a.id))
  );
}

export async function fetchAllApplications() {
  const { data: apps, error } = await supabase
    .from("applications")
    .select("*, profiles!applications_owner_id_fkey (full_name)")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  if (!apps.length) return [];
  const { data: docs, error: dErr } = await supabase
    .from("application_documents")
    .select("*")
    .in("application_id", apps.map((a) => a.id));
  if (dErr) throw dErr;
  return apps.map((a) =>
    toApp(a, (docs || []).filter((d) => d.application_id === a.id))
  );
}

const extOf = (name) => {
  const m = /\.[a-z0-9]+$/i.exec(name || "");
  return m ? m[0].toLowerCase() : "";
};

// One student = one application. Enforced by unique index
// applications_owner_unique (mvp4_one_application.sql); this pre-check
// gives a friendly message before the DB raises 23505. The only way to
// revise is the resubmit flow (admin marks rejected → back to pending).
export async function createApplication({ userId, form, files }) {
  const { data: existing, error: existErr } = await supabase
    .from("applications")
    .select("id,status")
    .eq("owner_id", userId)
    .limit(1);
  if (existErr) throw existErr;
  if (existing && existing.length) {
    throw new Error(
      "You already have an application. Track it in My dashboard — if corrections are needed, the housing office will mark it Needs resubmit and you'll revise the same application."
    );
  }

  const { data: app, error } = await supabase
    .from("applications")
    .insert({
      owner_id: userId,
      student_id_no: form.studentId.trim(),
      course: form.course.trim(),
      year: form.year,
      phone: form.phone.trim(),
      guardian: form.guardian.trim(),
      address: (form.address || "").trim(),
      term: form.term,
      devices: normalizeDevices(form.devices),
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505" || /duplicate|unique/i.test(error.message || "")) {
      throw new Error(
        "You already have an application. Track it in My dashboard — if corrections are needed, the housing office will mark it Needs resubmit and you'll revise the same application."
      );
    }
    throw error;
  }

  try {
    for (const [docType, v] of Object.entries(files)) {
      const file = v?._file;
      if (!file) throw new Error(`Missing file for ${docType}.`);
      const path = `${app.id}/${docType}${extOf(v.fileName)}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { error: docErr } = await supabase.from("application_documents").insert({
        application_id: app.id,
        doc_type: docType,
        file_path: path,
        file_name: v.fileName,
      });
      if (docErr) throw docErr;
    }
  } catch (e) {
    await supabase.from("applications").delete().eq("id", app.id);
    throw e;
  }
  return app.id;
}

export async function updateApplication(id, { status, remarks, assignedRoom, devices }) {
  const { error } = await supabase
    .from("applications")
    .update({
      ...(status !== undefined ? { status } : {}),
      ...(remarks !== undefined ? { remarks } : {}),
      ...(assignedRoom !== undefined ? { assigned_room: assignedRoom } : {}),
      ...(devices !== undefined ? { devices: normalizeDevices(devices) } : {}),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function signedDocUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ---------- Admin-managed templates (downloadable softcopies) ----------

export async function listTemplates() {
  const { data, error } = await supabase
    .from("doc_templates")
    .select("*")
    .order("key");
  if (error) throw error;
  // Birth Certificate is student-provided, never an admin template. Filter by
  // key and label so older rows (e.g. "birth_certificate") also stay hidden.
  return (data || []).filter(
    (r) => !/birth/i.test(r.key || "") && !/birth certificate/i.test(r.label || "")
  );
}

export async function downloadTemplate(path) {
  const { data, error } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadTemplate({ key, file, fileName }) {
  const extMatch = /\.[a-z0-9]+$/i.exec(fileName || "");
  const path = `${key}${extMatch ? extMatch[0].toLowerCase() : ""}`;
  const { error: upErr } = await supabase.storage
    .from(TEMPLATE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (upErr) throw upErr;
  const { error: rowErr } = await supabase
    .from("doc_templates")
    .update({ file_path: path, file_name: fileName, updated_at: new Date().toISOString() })
    .eq("key", key);
  if (rowErr) throw rowErr;
  return path;
}

// Resubmit: replace documents on a rejected application and send it back
// to pending for re-review. Requires mvp2_cleanup_resubmit.sql
// (documents owner UPDATE policy).
export async function resubmitDocuments({ appId, files }) {
  for (const [docType, v] of Object.entries(files)) {
    const file = v?._file;
    if (!file) throw new Error(`Missing file for ${docType}.`);
    const path = `${appId}/${docType}${extOf(v.fileName)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) throw upErr;
    const { error: docErr } = await supabase
      .from("application_documents")
      .update({ file_path: path, file_name: v.fileName })
      .eq("application_id", appId)
      .eq("doc_type", docType);
    if (docErr) throw docErr;
  }
  const { error } = await supabase
    .from("applications")
    .update({ status: "pending", remarks: "" })
    .eq("id", appId);
  if (error) throw error;
}
