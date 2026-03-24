function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeBookKey(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\b(song of songs|song of solomon)\b/g, "song of solomon")
    .replace(/\bpsalm\b/g, "psalms")
    .replace(/\s+/g, "");
}

const BOOK_ALIASES = {
  gen: "GEN",
  genesis: "GEN",
  exo: "EXO",
  exodus: "EXO",
  lev: "LEV",
  leviticus: "LEV",
  num: "NUM",
  numbers: "NUM",
  deu: "DEU",
  deuteronomy: "DEU",
  jos: "JOS",
  joshua: "JOS",
  jdg: "JDG",
  judges: "JDG",
  rut: "RUT",
  ruth: "RUT",
  "1sa": "1SA",
  "1samuel": "1SA",
  "2sa": "2SA",
  "2samuel": "2SA",
  "1ki": "1KI",
  "1kings": "1KI",
  "2ki": "2KI",
  "2kings": "2KI",
  "1ch": "1CH",
  "1chronicles": "1CH",
  "2ch": "2CH",
  "2chronicles": "2CH",
  ezr: "EZR",
  ezra: "EZR",
  neh: "NEH",
  nehemiah: "NEH",
  est: "EST",
  esther: "EST",
  job: "JOB",
  psa: "PSA",
  psalm: "PSA",
  psalms: "PSA",
  pro: "PRO",
  prov: "PRO",
  proverbs: "PRO",
  ecc: "ECC",
  ecclesiastes: "ECC",
  sng: "SNG",
  songofsolomon: "SNG",
  songofsongs: "SNG",
  isa: "ISA",
  isaiah: "ISA",
  jer: "JER",
  jeremiah: "JER",
  lam: "LAM",
  lamentations: "LAM",
  ezk: "EZK",
  ezekiel: "EZK",
  dan: "DAN",
  daniel: "DAN",
  hos: "HOS",
  hosea: "HOS",
  jol: "JOL",
  joel: "JOL",
  amo: "AMO",
  amos: "AMO",
  oba: "OBA",
  obadiah: "OBA",
  jon: "JON",
  jonah: "JON",
  mic: "MIC",
  micah: "MIC",
  nam: "NAM",
  nahum: "NAM",
  hab: "HAB",
  habakkuk: "HAB",
  zep: "ZEP",
  zephaniah: "ZEP",
  hag: "HAG",
  haggai: "HAG",
  zec: "ZEC",
  zechariah: "ZEC",
  mal: "MAL",
  malachi: "MAL",
  mat: "MAT",
  matthew: "MAT",
  mrk: "MRK",
  mark: "MRK",
  luk: "LUK",
  luke: "LUK",
  jhn: "JHN",
  john: "JHN",
  act: "ACT",
  acts: "ACT",
  rom: "ROM",
  romans: "ROM",
  "1co": "1CO",
  "1corinthians": "1CO",
  "2co": "2CO",
  "2corinthians": "2CO",
  gal: "GAL",
  galatians: "GAL",
  eph: "EPH",
  ephesians: "EPH",
  php: "PHP",
  philippians: "PHP",
  col: "COL",
  colossians: "COL",
  "1th": "1TH",
  "1thessalonians": "1TH",
  "2th": "2TH",
  "2thessalonians": "2TH",
  "1ti": "1TI",
  "1timothy": "1TI",
  "2ti": "2TI",
  "2timothy": "2TI",
  tit: "TIT",
  titus: "TIT",
  phm: "PHM",
  philemon: "PHM",
  heb: "HEB",
  hebrews: "HEB",
  jas: "JAS",
  james: "JAS",
  "1pe": "1PE",
  "1peter": "1PE",
  "2pe": "2PE",
  "2peter": "2PE",
  "1jn": "1JN",
  "1john": "1JN",
  "2jn": "2JN",
  "2john": "2JN",
  "3jn": "3JN",
  "3john": "3JN",
  jud: "JUD",
  jude: "JUD",
  rev: "REV",
  revelation: "REV",
};

function parseVerseToken(token) {
  const match = String(token || "").trim().match(/^(\d+)([a-z])?$/i);
  if (!match) return null;
  return { number: Number(match[1]), segment: match[2]?.toLowerCase() || "" };
}

function toRangeBoundary(chapter, verseToken) {
  if (!verseToken || !Number.isFinite(chapter)) return null;
  return {
    chapter,
    verse: verseToken.number,
    segment: verseToken.segment || "",
  };
}

export function parseReference(input) {
  const normalized = normalizeSpaces(input);
  if (!normalized) return { ok: false, raw: "" };

  const match = normalized.match(
    /^(.+?)\s+(\d+)(?:\s*:\s*(\d+[a-z]?)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+[a-z]?))?)?\s*$/i
  );

  if (!match) {
    return { ok: false, raw: normalized.toLowerCase() };
  }

  const bookKey = normalizeBookKey(match[1]);
  const book = BOOK_ALIASES[bookKey];
  const chapterStart = Number(match[2]);

  if (!book || !Number.isFinite(chapterStart)) {
    return { ok: false, raw: normalized.toLowerCase() };
  }

  // Chapter-only input: "Psalm 23"
  if (!match[3]) {
    return {
      ok: true,
      type: "chapter",
      input: normalized,
      book,
      chapterStart,
      chapterEnd: chapterStart,
      verseStart: null,
      verseEnd: null,
      rangeStart: { chapter: chapterStart, verse: null, segment: "" },
      rangeEnd: { chapter: chapterStart, verse: null, segment: "" },
    };
  }

  const startVerse = parseVerseToken(match[3]);
  const endChapter = Number(match[4] || chapterStart);
  const endVerse = parseVerseToken(match[5] || match[3]);

  if (!startVerse || !endVerse || !Number.isFinite(endChapter)) {
    return { ok: false, raw: normalized.toLowerCase() };
  }

  let rangeStart = toRangeBoundary(chapterStart, startVerse);
  let rangeEnd = toRangeBoundary(endChapter, endVerse);

  const startsAfterEnd =
    rangeStart.chapter > rangeEnd.chapter ||
    (rangeStart.chapter === rangeEnd.chapter && rangeStart.verse > rangeEnd.verse);

  if (startsAfterEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
  }

  return {
    ok: true,
    type: "verse",
    input: normalized,
    book,
    chapterStart: rangeStart.chapter,
    chapterEnd: rangeEnd.chapter,
    verseStart: rangeStart.verse,
    verseEnd: rangeEnd.verse,
    rangeStart,
    rangeEnd,
  };
}

