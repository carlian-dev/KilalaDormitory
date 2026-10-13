// Draft file persistence via IndexedDB (Option A).
// File/Blob objects can't go in localStorage, but IndexedDB stores them
// with structured clone — so uploads survive reload on the same browser.
// Text draft stays in localStorage (Apply.jsx); binary lives here.
// Key format: `${userId}:${docKey}`. All ops fail silently (private mode).

const DB_NAME = "kilala-drafts";
const STORE = "files";
const DB_VERSION = 1;

const idbSupported = () => typeof indexedDB !== "undefined";

function openDB() {
  return new Promise((resolve, reject) => {
    if (!idbSupported()) return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB open failed"));
  });
}

const idbKey = (userId, docKey) => `${userId}:${docKey}`;

function tx(db, mode, run) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let out;
    try {
      out = run(store);
    } catch (e) {
      reject(e);
      return;
    }
    t.oncomplete = () => resolve(out?.result ?? out);
    t.onerror = () => reject(t.error || new Error("IDB transaction failed"));
    // For get/getAll the result arrives via request.onsuccess before complete.
    if (out && "onsuccess" in out) {
      out.onsuccess = () => resolve(out.result);
      out.onerror = () => reject(out.error || new Error("IDB request failed"));
    }
  });
}

export async function saveDraftFile(userId, docKey, file) {
  if (!userId || !docKey || !file) return;
  try {
    const db = await openDB();
    const rec = {
      key: idbKey(userId, docKey),
      userId,
      docKey,
      blob: file,
      fileName: file.name || "upload",
      type: file.type || "",
      size: file.size || 0,
      updatedAt: Date.now(),
    };
    await tx(db, "readwrite", (s) => s.put(rec));
    db.close();
  } catch { /* quota / privacy mode — uploads simply won't persist */ }
}

export async function removeDraftFile(userId, docKey) {
  if (!userId || !docKey) return;
  try {
    const db = await openDB();
    await tx(db, "readwrite", (s) => s.delete(idbKey(userId, docKey)));
    db.close();
  } catch { /* ignore */ }
}

// Returns { [docKey]: { fileName, size, _file } } — ready for Apply's files state.
export async function loadDraftFiles(userId) {
  if (!userId || !idbSupported()) return {};
  try {
    const db = await openDB();
    const all = await tx(db, "readonly", (s) => s.getAll());
    db.close();
    const out = {};
    for (const rec of Array.isArray(all) ? all : []) {
      if (!rec || rec.userId !== userId || !rec.docKey || !rec.blob) continue;
      try {
        const blob = rec.blob;
        const file =
          blob instanceof File
            ? blob
            : new File([blob], rec.fileName || "upload", { type: rec.type || blob.type || "" });
        out[rec.docKey] = { fileName: rec.fileName, size: rec.size ?? file.size, _file: file };
      } catch { /* skip corrupt entry */ }
    }
    return out;
  } catch {
    return {};
  }
}

export async function clearDraftFiles(userId) {
  if (!userId || !idbSupported()) return;
  try {
    const db = await openDB();
    const allKeys = await tx(db, "readonly", (s) => s.getAllKeys());
    const mine = (Array.isArray(allKeys) ? allKeys : []).filter(
      (k) => typeof k === "string" && k.startsWith(`${userId}:`)
    );
    if (mine.length) {
      await tx(db, "readwrite", (s) => {
        for (const k of mine) s.delete(k);
      });
    }
    db.close();
  } catch { /* ignore */ }
}
