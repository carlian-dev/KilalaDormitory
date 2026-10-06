import { supabase } from "./supabase";

const BUCKET = "dorm-requirements";

// DB (snake_case) -> UI (camelCase) mapper shared by student + admin views.
export function toApp(row, docs = [], profileName = "") {
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

// Insert application + upload 3 files + insert document rows.
// Rolls back the application row if uploads fail.
export async function createApplication({ userId, form, files }) {
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
    })
    .select("*")
    .single();
  if (error) throw error;

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

export async function updateApplication(id, { status, remarks, assignedRoom }) {
  const { error } = await supabase
    .from("applications")
    .update({
      ...(status !== undefined ? { status } : {}),
      ...(remarks !== undefined ? { remarks } : {}),
      ...(assignedRoom !== undefined ? { assigned_room: assignedRoom } : {}),
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
