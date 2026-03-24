import { parseReference } from "./parseReference";
const LOCAL_SCRIPTURES_KEY = "fighting-words-local-scriptures-v1";

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadLocalScriptures() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage?.getItem(LOCAL_SCRIPTURES_KEY);
  const parsed = safeJsonParse(raw, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      reference: typeof s.reference === "string" ? s.reference : "",
      text: typeof s.text === "string" ? s.text : "",
      submittedBy: typeof s.submittedBy === "string" ? s.submittedBy : "",
      tags: Array.isArray(s.tags) ? s.tags.filter((t) => typeof t === "string") : [],
    }))
    .filter((s) => s.reference.trim() && s.text.trim())
    .slice(0, 200);
}

export function saveLocalScriptures(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(LOCAL_SCRIPTURES_KEY, JSON.stringify(list));
  } catch (_) {}
}

function normalizeSpaces(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

export function referencesOverlap(aRef, bRef) {
  const a = parseReference(aRef);
  const b = parseReference(bRef);
  if (!a.ok || !b.ok) {
    return normalizeSpaces(aRef).toLowerCase() === normalizeSpaces(bRef).toLowerCase();
  }
  if (a.book !== b.book) return false;

  // If either reference is chapter-level (e.g. "Psalm 23"), overlap is chapter span overlap.
  if (a.type === "chapter" || b.type === "chapter") {
    return a.chapterStart <= b.chapterEnd && b.chapterStart <= a.chapterEnd;
  }

  if (a.chapterStart !== b.chapterStart || a.chapterEnd !== b.chapterEnd) return false;
  return a.verseStart <= b.verseEnd && b.verseStart <= a.verseEnd;
}

export function isDuplicateReference(newRef, scriptures) {
  return (scriptures || []).some((s) => referencesOverlap(newRef, s?.reference));
}

export function addLocalScripture({ reference, text, tags, submittedBy }, builtIn, local) {
  const entry = {
    reference: normalizeSpaces(reference),
    text: normalizeSpaces(text),
    submittedBy: normalizeSpaces(submittedBy || ""),
    tags: Array.from(new Set((tags || []).map((t) => normalizeSpaces(t)).filter(Boolean))),
  };

  const existing = [...(builtIn || []), ...(local || [])];
  if (isDuplicateReference(entry.reference, existing)) {
    return { ok: false, reason: "duplicate", next: local || [] };
  }

  const next = [{ ...entry, createdAt: Date.now() }, ...(local || [])].slice(0, 200);
  saveLocalScriptures(next);
  return { ok: true, next };
}

