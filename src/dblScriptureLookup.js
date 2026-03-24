import versificationRaw from "./dbl-lsv-literalstandard-mar2026/release/versification.vrs?raw";
import { parseReference } from "./parseReference.js";

const usxModules = import.meta.glob("./dbl-lsv-literalstandard-mar2026/release/USX_1/*.usx", {
  query: "?raw",
  import: "default",
});

const BOOKS = [
  { code: "GEN", name: "Genesis", aliases: ["genesis", "gen"] },
  { code: "EXO", name: "Exodus", aliases: ["exodus", "exo"] },
  { code: "LEV", name: "Leviticus", aliases: ["leviticus", "lev"] },
  { code: "NUM", name: "Numbers", aliases: ["numbers", "num"] },
  { code: "DEU", name: "Deuteronomy", aliases: ["deuteronomy", "deu"] },
  { code: "JOS", name: "Joshua", aliases: ["joshua", "jos"] },
  { code: "JDG", name: "Judges", aliases: ["judges", "jdg"] },
  { code: "RUT", name: "Ruth", aliases: ["ruth", "rut"] },
  { code: "1SA", name: "1 Samuel", aliases: ["1 samuel", "1samuel", "1sa"] },
  { code: "2SA", name: "2 Samuel", aliases: ["2 samuel", "2samuel", "2sa"] },
  { code: "1KI", name: "1 Kings", aliases: ["1 kings", "1kings", "1ki"] },
  { code: "2KI", name: "2 Kings", aliases: ["2 kings", "2kings", "2ki"] },
  { code: "1CH", name: "1 Chronicles", aliases: ["1 chronicles", "1chronicles", "1ch"] },
  { code: "2CH", name: "2 Chronicles", aliases: ["2 chronicles", "2chronicles", "2ch"] },
  { code: "EZR", name: "Ezra", aliases: ["ezra", "ezr"] },
  { code: "NEH", name: "Nehemiah", aliases: ["nehemiah", "neh"] },
  { code: "EST", name: "Esther", aliases: ["esther", "est"] },
  { code: "JOB", name: "Job", aliases: ["job"] },
  { code: "PSA", name: "Psalms", aliases: ["psalms", "psalm", "psa"] },
  { code: "PRO", name: "Proverbs", aliases: ["proverbs", "prov", "pro"] },
  { code: "ECC", name: "Ecclesiastes", aliases: ["ecclesiastes", "ecc"] },
  { code: "SNG", name: "Song of Songs", aliases: ["song of songs", "song of solomon", "sng"] },
  { code: "ISA", name: "Isaiah", aliases: ["isaiah", "isa"] },
  { code: "JER", name: "Jeremiah", aliases: ["jeremiah", "jer"] },
  { code: "LAM", name: "Lamentations", aliases: ["lamentations", "lam"] },
  { code: "EZK", name: "Ezekiel", aliases: ["ezekiel", "ezk"] },
  { code: "DAN", name: "Daniel", aliases: ["daniel", "dan"] },
  { code: "HOS", name: "Hosea", aliases: ["hosea", "hos"] },
  { code: "JOL", name: "Joel", aliases: ["joel", "jol"] },
  { code: "AMO", name: "Amos", aliases: ["amos", "amo"] },
  { code: "OBA", name: "Obadiah", aliases: ["obadiah", "oba"] },
  { code: "JON", name: "Jonah", aliases: ["jonah", "jon"] },
  { code: "MIC", name: "Micah", aliases: ["micah", "mic"] },
  { code: "NAM", name: "Nahum", aliases: ["nahum", "nam"] },
  { code: "HAB", name: "Habakkuk", aliases: ["habakkuk", "hab"] },
  { code: "ZEP", name: "Zephaniah", aliases: ["zephaniah", "zep"] },
  { code: "HAG", name: "Haggai", aliases: ["haggai", "hag"] },
  { code: "ZEC", name: "Zechariah", aliases: ["zechariah", "zec"] },
  { code: "MAL", name: "Malachi", aliases: ["malachi", "mal"] },
  { code: "MAT", name: "Matthew", aliases: ["matthew", "mat"] },
  { code: "MRK", name: "Mark", aliases: ["mark", "mrk"] },
  { code: "LUK", name: "Luke", aliases: ["luke", "luk"] },
  { code: "JHN", name: "John", aliases: ["john", "jhn"] },
  { code: "ACT", name: "Acts", aliases: ["acts", "act"] },
  { code: "ROM", name: "Romans", aliases: ["romans", "rom"] },
  { code: "1CO", name: "1 Corinthians", aliases: ["1 corinthians", "1corinthians", "1co"] },
  { code: "2CO", name: "2 Corinthians", aliases: ["2 corinthians", "2corinthians", "2co"] },
  { code: "GAL", name: "Galatians", aliases: ["galatians", "gal"] },
  { code: "EPH", name: "Ephesians", aliases: ["ephesians", "eph"] },
  { code: "PHP", name: "Philippians", aliases: ["philippians", "php"] },
  { code: "COL", name: "Colossians", aliases: ["colossians", "col"] },
  { code: "1TH", name: "1 Thessalonians", aliases: ["1 thessalonians", "1thessalonians", "1th"] },
  { code: "2TH", name: "2 Thessalonians", aliases: ["2 thessalonians", "2thessalonians", "2th"] },
  { code: "1TI", name: "1 Timothy", aliases: ["1 timothy", "1timothy", "1ti"] },
  { code: "2TI", name: "2 Timothy", aliases: ["2 timothy", "2timothy", "2ti"] },
  { code: "TIT", name: "Titus", aliases: ["titus", "tit"] },
  { code: "PHM", name: "Philemon", aliases: ["philemon", "phm"] },
  { code: "HEB", name: "Hebrews", aliases: ["hebrews", "heb"] },
  { code: "JAS", name: "James", aliases: ["james", "jas"] },
  { code: "1PE", name: "1 Peter", aliases: ["1 peter", "1peter", "1pe"] },
  { code: "2PE", name: "2 Peter", aliases: ["2 peter", "2peter", "2pe"] },
  { code: "1JN", name: "1 John", aliases: ["1 john", "1john", "1jn"] },
  { code: "2JN", name: "2 John", aliases: ["2 john", "2john", "2jn"] },
  { code: "3JN", name: "3 John", aliases: ["3 john", "3john", "3jn"] },
  { code: "JUD", name: "Jude", aliases: ["jude", "jud"] },
  { code: "REV", name: "Revelation", aliases: ["revelation", "rev"] },
];

const BOOK_BY_CODE = new Map(BOOKS.map((b) => [b.code, b]));
const verseLimits = parseVerseLimits(versificationRaw);
const usxCache = new Map();
const chapterCache = new Map();

function parseVerseLimits(raw) {
  const out = new Map();
  for (const line of String(raw || "").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    if (line.includes("=")) break;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const book = parts[0];
    const chapterMap = new Map();
    for (const token of parts.slice(1)) {
      const [chapterStr, maxVerseStr] = token.split(":");
      const chapter = Number(chapterStr);
      const maxVerse = Number(maxVerseStr);
      if (Number.isFinite(chapter) && Number.isFinite(maxVerse)) {
        chapterMap.set(chapter, maxVerse);
      }
    }
    if (chapterMap.size) out.set(book, chapterMap);
  }
  return out;
}

function stripUsxMarkup(segment) {
  return String(segment || "")
    .replace(/<note\b[\s\S]*?<\/note>/g, " ")
    .replace(/<char\b[^>]*>/g, "")
    .replace(/<\/char>/g, "")
    .replace(/<verse\b[^>]*\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loadUsxForBook(bookCode) {
  if (usxCache.has(bookCode)) return usxCache.get(bookCode);
  const key = `./dbl-lsv-literalstandard-mar2026/release/USX_1/${bookCode}.usx`;
  const loader = usxModules[key];
  if (!loader) return null;
  const raw = await loader();
  usxCache.set(bookCode, raw);
  return raw;
}

async function getChapterVerses(bookCode, chapter) {
  const cacheKey = `${bookCode}:${chapter}`;
  if (chapterCache.has(cacheKey)) return chapterCache.get(cacheKey);

  const usx = await loadUsxForBook(bookCode);
  if (!usx) return null;

  const chapterStartRx = new RegExp(
    `<chapter\\s+number="${chapter}"[^>]*sid="${escapeRegex(bookCode)} ${chapter}"[^>]*/>`,
    "i"
  );
  const startMatch = chapterStartRx.exec(usx);
  if (!startMatch) return null;
  const chapterStartIndex = startMatch.index + startMatch[0].length;
  const chapterEndRx = new RegExp(`<chapter\\s+eid="${escapeRegex(bookCode)} ${chapter}"\\s*/>`, "i");
  const chapterEndMatch = chapterEndRx.exec(usx.slice(chapterStartIndex));
  const chapterEndIndex = chapterEndMatch
    ? chapterStartIndex + chapterEndMatch.index
    : usx.length;
  const chapterBody = usx.slice(chapterStartIndex, chapterEndIndex);

  const verseRx = /<verse\b[^>]*number="([^"]+)"[^>]*\/>/g;
  const starts = [];
  for (const m of chapterBody.matchAll(verseRx)) {
    const number = Number(String(m[1]).match(/\d+/)?.[0]);
    if (Number.isFinite(number) && typeof m.index === "number") {
      starts.push({ number, index: m.index, tag: m[0] });
    }
  }
  const verseMap = new Map();
  for (let i = 0; i < starts.length; i += 1) {
    const current = starts[i];
    const next = starts[i + 1];
    const from = current.index + current.tag.length;
    const to = next ? next.index : chapterBody.length;
    const text = stripUsxMarkup(chapterBody.slice(from, to));
    if (text) verseMap.set(current.number, text);
  }

  chapterCache.set(cacheKey, verseMap);
  return verseMap;
}

function matchBooksPrefix(input) {
  const q = String(input || "").trim().toLowerCase();
  if (!q) return BOOKS.slice(0, 12);
  return BOOKS.filter((book) => {
    if (book.name.toLowerCase().startsWith(q)) return true;
    return book.aliases.some((a) => a.startsWith(q));
  }).slice(0, 20);
}

export function getReferenceSuggestions(input) {
  const value = String(input || "").trim();
  if (!value) return BOOKS.slice(0, 12).map((b) => b.name);

  const parsed = parseReference(value);
  if (parsed.ok) {
    const bookMeta = BOOK_BY_CODE.get(parsed.book);
    if (!bookMeta) return [];
    const chapterMap = verseLimits.get(parsed.book);
    if (!chapterMap) return [];

    if (parsed.type === "chapter") {
      const maxVerse = chapterMap.get(parsed.chapterStart);
      if (!maxVerse) return [];
      return Array.from({ length: maxVerse }, (_, i) => `${bookMeta.name} ${parsed.chapterStart}:${i + 1}`).slice(0, 60);
    }

    const start = parsed.verseStart;
    const end = parsed.verseEnd;
    if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
    return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => {
      const v = start + i;
      return `${bookMeta.name} ${parsed.chapterStart}:${v}`;
    }).slice(0, 60);
  }

  const chapterMatch = value.match(/^(.+?)\s+(\d+)$/);
  if (chapterMatch) {
    const maybe = parseReference(`${chapterMatch[1]} ${chapterMatch[2]}:1`);
    if (!maybe.ok) return [];
    const bookMeta = BOOK_BY_CODE.get(maybe.book);
    const maxVerse = verseLimits.get(maybe.book)?.get(Number(chapterMatch[2]));
    if (!bookMeta || !maxVerse) return [];
    return Array.from({ length: maxVerse }, (_, i) => `${bookMeta.name} ${chapterMatch[2]}:${i + 1}`).slice(0, 60);
  }

  return matchBooksPrefix(value).flatMap((book) => {
    const chapterCount = verseLimits.get(book.code)?.size || 0;
    if (!chapterCount) return [book.name];
    const chapters = Array.from({ length: Math.min(chapterCount, 20) }, (_, i) => `${book.name} ${i + 1}`);
    return chapters;
  }).slice(0, 60);
}

export async function lookupScriptureText(reference) {
  const parsed = parseReference(reference);
  if (!parsed.ok) return { ok: false, reason: "invalid_reference" };
  if (parsed.type === "chapter") return { ok: false, reason: "chapter_only_reference" };

  const maxByChapter = verseLimits.get(parsed.book);
  if (!maxByChapter) return { ok: false, reason: "book_not_supported" };

  const chapterStart = parsed.chapterStart;
  const chapterEnd = parsed.chapterEnd;
  const texts = [];

  for (let chapter = chapterStart; chapter <= chapterEnd; chapter += 1) {
    const chapterVerses = await getChapterVerses(parsed.book, chapter);
    if (!chapterVerses) return { ok: false, reason: "chapter_not_found" };

    const maxVerse = maxByChapter.get(chapter);
    if (!Number.isFinite(maxVerse)) return { ok: false, reason: "chapter_not_supported" };
    const start = chapter === chapterStart ? parsed.verseStart : 1;
    const end = chapter === chapterEnd ? parsed.verseEnd : maxVerse;
    if (start < 1 || end > maxVerse) return { ok: false, reason: "verse_out_of_range" };

    for (let verse = start; verse <= end; verse += 1) {
      const vText = chapterVerses.get(verse);
      if (vText) texts.push(vText);
    }
  }

  if (!texts.length) return { ok: false, reason: "verse_text_not_found" };
  return { ok: true, text: texts.join(" "), parsed };
}

