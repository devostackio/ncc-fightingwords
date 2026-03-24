import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import SCRIPTURES from "./scripture.json";
import { SCRIPTURE_TAGS } from "./scriptureTags.js";
import { addLocalScripture, loadLocalScriptures } from "./localScriptures.js";
import { parseReference } from "./parseReference.js";
import { track } from "@vercel/analytics/react";

const CACHE_KEY = "fighting-words-custom-terms";
const MIN_TYPEAHEAD_CHARS = 2;
const MAX_CACHED_TERMS = 4;
const VISIBLE_BUBBLE_COUNT = 5;
let dblLookupModulePromise = null;

async function getDblLookupModule() {
  if (!dblLookupModulePromise) {
    dblLookupModulePromise = import("./dblScriptureLookup.js");
  }
  return dblLookupModulePromise;
}

function loadCachedTerms() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CACHED_TERMS) : [];
  } catch {
    return [];
  }
}

function saveCachedTerms(list) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list.slice(0, MAX_CACHED_TERMS)));
    track("saved_cached_terms", { list: list.slice(0, MAX_CACHED_TERMS) });
  } catch (_) {}
}

// Tokenize all scripture text into unique words (lowercase, letters only, min length 2)
function buildScriptureWords(scriptures) {
  const seen = new Set();
  const words = [];
  for (const s of scriptures) {
    const tokens = (s.text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    for (const w of tokens) {
      if (!seen.has(w)) {
        seen.add(w);
        words.push(w);
      }
    }
  }
  return words.sort((a, b) => a.localeCompare(b));
}

// ── Human-friendly labels for filter bubbles (never show raw tags on cards) ──
const TAG_LABELS = {
  anxiety: "Worried or anxious?",
  enemy: "Under spiritual attack?",
  faith: "Need to believe?",
  fear: "Afraid?",
  grief: "Grieving?",
  guidance: "Need direction?",
  healing: "Need healing?",
  hope: "Need hope?",
  humility: "Struggling with pride?",
  identity: "Who am I?",
  justice: "Want to do right?",
  joy: "Need joy?",
  marriage: "Struggling in marriage?",
  peace: "Need peace?",
  presence: "Feel alone?",
  protection: "Need safety?",
  provision: "Will I have enough?",
  salvation: "Need rescue?",
  shame: "Ashamed?",
  trust: "Struggling to trust?",
  trials: "Going through trials?",
  weakness: "Feeling weak?",
};

// ── DESIGN TOKENS ──────────────────────────────────────────────────────────
const ACCENT = "#7C8F7C"; // muted sage-grey-green
const W92 = "rgba(255,255,255,0.92)";
const W58 = "rgba(255,255,255,0.58)";
const W32 = "rgba(255,255,255,0.32)";
const W18 = "rgba(255,255,255,0.18)";

// ── SUB-LABELS for filter rows ──────────────────────────────────────────────
const TAG_SUBLABELS = {
  anxiety:    "fear · overthinking · dread",
  enemy:      "temptation · warfare · doubt",
  faith:      "assurance · belief · doubt",
  fear:       "courage · safety · peace",
  grief:      "loss · sorrow · comfort",
  guidance:   "direction · wisdom · clarity",
  healing:    "restoration · wholeness · renewal",
  hope:       "expectation · future · promise",
  humility:   "pride · surrender · grace",
  identity:   "belonging · purpose · worth",
  justice:    "righteousness · truth · equity",
  joy:        "gladness · delight · gratitude",
  marriage:   "love · covenant · unity",
  peace:      "stillness · rest · calm",
  presence:   "loneliness · closeness · communion",
  protection: "safety · refuge · shield",
  provision:  "scarcity · abundance · trust",
  salvation:  "rescue · redemption · grace",
  shame:      "guilt · forgiveness · acceptance",
  trust:      "surrender · faith · confidence",
  trials:     "suffering · perseverance · hope",
  weakness:   "strength · endurance · power",
};

// ── COLOR THEMES (from fighting-words) ─────────────────────────────────────
const COLOR_THEMES = [
  { name: "sage",      bg: "#8FA98B", textBlock: "#6B8567", accent: "#4A6346", textColor: "#2D3F2B" },
  { name: "dustyrose", bg: "#C4929A", textBlock: "#A87078", accent: "#8C4F58", textColor: "#5E2D35" },
  { name: "slate",     bg: "#8E9AAE", textBlock: "#6E7C94", accent: "#505F78", textColor: "#333F53" },
  { name: "terracotta",bg: "#C49A7C", textBlock: "#A87B5C", accent: "#8C5D3E", textColor: "#5E3820" },
  { name: "lavender",  bg: "#A595B6", textBlock: "#877598", accent: "#6A577B", textColor: "#453758" },
  { name: "ocean",     bg: "#7BA3A8", textBlock: "#5C868B", accent: "#3E696E", textColor: "#244648" },
  { name: "mauve",     bg: "#B39DAD", textBlock: "#977D8F", accent: "#7C5E72", textColor: "#553A4D" },
  { name: "denim",     bg: "#7E96B5", textBlock: "#607A9A", accent: "#435E7F", textColor: "#283D58" },
  { name: "moss",      bg: "#9AA682", textBlock: "#7D8B66", accent: "#60704B", textColor: "#3E4C2E" },
  { name: "copper",    bg: "#BFA089", textBlock: "#A5836B", accent: "#8B664E", textColor: "#5E4030" },
  { name: "plum",      bg: "#A08BA8", textBlock: "#836D8C", accent: "#665070", textColor: "#45334D" },
  { name: "clay",      bg: "#B8A090", textBlock: "#9C8373", accent: "#806657", textColor: "#56403A" },
  { name: "steel",     bg: "#95A0A5", textBlock: "#78858B", accent: "#5C6A71", textColor: "#3B484F" },
];

const ArtworkPatterns = [
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <circle cx="320" cy="80" r="180" fill="${color}" opacity="0.18"/>
      <circle cx="380" cy="160" r="120" fill="${color}" opacity="0.14"/>
      <path d="M200,0 Q400,150 350,350" stroke="${color}" stroke-width="40" fill="none" opacity="0.12"/>
      <circle cx="280" cy="40" r="60" fill="${color}" opacity="0.1"/>
    </svg>`,
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <rect x="220" y="-20" width="200" height="200" rx="20" fill="${color}" opacity="0.15" transform="rotate(15 320 80)"/>
      <rect x="280" y="100" width="150" height="150" rx="12" fill="${color}" opacity="0.12" transform="rotate(-10 355 175)"/>
      <rect x="180" y="60" width="80" height="80" rx="8" fill="${color}" opacity="0.1" transform="rotate(25 220 100)"/>
    </svg>`,
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <path d="M250,20 Q380,40 370,180 Q360,280 280,260 Q200,240 220,120 Q230,40 250,20Z" fill="${color}" opacity="0.16"/>
      <path d="M300,80 Q400,100 380,220 Q360,300 300,270 Q240,240 260,140 Q270,80 300,80Z" fill="${color}" opacity="0.1"/>
      <circle cx="350" cy="50" r="40" fill="${color}" opacity="0.12"/>
    </svg>`,
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <rect x="290" y="20" width="30" height="180" rx="15" fill="${color}" opacity="0.18"/>
      <rect x="220" y="85" width="180" height="30" rx="15" fill="${color}" opacity="0.18"/>
      <circle cx="340" cy="220" r="50" fill="${color}" opacity="0.1"/>
      <rect x="330" y="160" width="20" height="100" rx="10" fill="${color}" opacity="0.12"/>
    </svg>`,
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <circle cx="330" cy="100" r="140" fill="${color}" opacity="0.12"/>
      <circle cx="330" cy="100" r="100" fill="${color}" opacity="0.1"/>
      <circle cx="330" cy="100" r="60" fill="${color}" opacity="0.08"/>
      <line x1="330" y1="100" x2="400" y2="0" stroke="${color}" stroke-width="3" opacity="0.15"/>
      <line x1="330" y1="100" x2="400" y2="200" stroke="${color}" stroke-width="3" opacity="0.15"/>
      <line x1="330" y1="100" x2="200" y2="30" stroke="${color}" stroke-width="3" opacity="0.15"/>
    </svg>`,
];

function getTheme(index) {
  return COLOR_THEMES[index % COLOR_THEMES.length];
}

function getArtwork(index, color) {
  const fn = ArtworkPatterns[index % ArtworkPatterns.length];
  return `data:image/svg+xml,${encodeURIComponent(fn(color))}`;
}

function calculateFontSize(text) {
  const len = text.length;
  if (len < 60) return 28;
  if (len < 100) return 24;
  if (len < 150) return 20;
  if (len < 220) return 17;
  return 15;
}

// ── SCRIPTURE CARD (no tags shown) ────────────────────────────────────────
function ScriptureCard({ scripture, index, isActive }) {
  const theme = getTheme(index);
  const artworkSrc = getArtwork(index, theme.accent);
  const fontSize = calculateFontSize(scripture.text);

  return (
    <div
      style={{
        flex: "0 0 auto",
        width: "min(340px, 82vw)",
        height: "520px",
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
        background: theme.bg,
        boxShadow: isActive
          ? "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)"
          : "0 8px 30px rgba(0,0,0,0.1)",
        transform: isActive ? "scale(1)" : "scale(0.94)",
        opacity: isActive ? 1 : 0.7,
        transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
        scrollSnapAlign: "center",
        userSelect: "none",
      }}
    >
      <img
        src={artworkSrc}
        alt=""
        style={{
          position: "absolute",
          top: "-20px",
          right: "-20px",
          width: "110%",
          height: "80%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at top right, transparent 30%, ${theme.bg} 75%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "32px 28px 36px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: "50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: theme.textBlock,
            opacity: 0.85,
            borderRadius: "0 20px 0 0",
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "14px",
              opacity: 0.7,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill={theme.textColor} opacity="0.6" />
            </svg>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: theme.textColor,
                opacity: 0.8,
              }}
            >
              Fighting Words
            </span>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              lineHeight: 1.2,
              textTransform: "uppercase",
              color: theme.textColor,
              opacity: 0.88,
              margin: "0 0 18px 0",
              letterSpacing: "-0.01em",
              wordSpacing: "0.02em",
            }}
          >
            {scripture.text}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "15px",
                fontWeight: 400,
                color: theme.textColor,
                opacity: 0.7,
                letterSpacing: "0.02em",
              }}
            >
              {scripture.reference}
            </span>
            {scripture.submittedBy && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "10px",
                  color: theme.textColor,
                  opacity: 0.45,
                  letterSpacing: "0.5px",
                }}
              >
                via {scripture.submittedBy}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SCRIPTURE LIST ITEM (editorial / list view) ───────────────────────────
function ScriptureListItem({ scripture }) {
  const tags = scripture.tags || [];
  return (
    <div
      style={{
        padding: "32px 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "rgba(232,218,192,0.5)",
          marginBottom: "14px",
        }}
      >
        {scripture.reference}
      </div>
      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(20px, 3.5vw, 26px)",
          fontWeight: 100,
          fontStyle: "italic",
          lineHeight: 1.5,
          color: "#e8dac0",
          margin: "0 0 16px 0",
          letterSpacing: "-0.01em",
        }}
      >
        {scripture.text}
      </p>
      {tags.length > 0 && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14.5px",
            color: "rgba(232,218,192,0.35)",
            letterSpacing: "0.3px",
          }}
        >
          {tags.map((t, i) => (
            <span key={t}>
              {i > 0 && <span style={{ margin: "0 7px", opacity: 0.6 }}>·</span>}
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── VIEW TOGGLE (card ↔ list) ─────────────────────────────────────────────
function ViewToggle({ mode, onChange }) {
  const btnBase = {
    minHeight: 32,
    padding: "6px 16px",
    border: "none",
    borderRadius: 999,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s ease, color 0.2s ease",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 999,
        padding: 3,
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={mode === "card"}
        aria-label="Card view"
        style={{
          ...btnBase,
          background: mode === "card" ? "rgba(255,255,255,0.9)" : "transparent",
          color: mode === "card" ? "#1a1a1a" : "rgba(255,255,255,0.5)",
        }}
      >
        Cards
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        aria-label="List view"
        style={{
          ...btnBase,
          background: mode === "list" ? "rgba(255,255,255,0.9)" : "transparent",
          color: mode === "list" ? "#1a1a1a" : "rgba(255,255,255,0.5)",
        }}
      >
        List
      </button>
    </div>
  );
}

// ── Typeahead search (tags, scripture words, previous searches) ──────────
const MIN_TOUCH_PX = 44;
const BUBBLE_PADDING_V = 14;
const BUBBLE_PADDING_H = 20;
const BUBBLE_FONT_SIZE = 17;

function getTypeaheadSuggestions(query, cachedTerms, selectedTags, selectedCustomTerms, scriptureWords) {
  const q = (query || "").trim().toLowerCase();
  if (q.length < MIN_TYPEAHEAD_CHARS) return { tags: [], words: [], previous: [] };

  const tagMatches = SCRIPTURE_TAGS.filter((tag) => {
    const label = (TAG_LABELS[tag] ?? tag).toLowerCase();
    return label.includes(q) || tag.toLowerCase().includes(q);
  });
  const wordMatches = scriptureWords.filter((w) => w.includes(q)).slice(0, 25);
  const previousMatches = cachedTerms
    .filter((t) => t.toLowerCase().includes(q) && !selectedTags.has(t) && !selectedCustomTerms.has(t))
    .slice(0, MAX_CACHED_TERMS);

  return { tags: tagMatches, words: wordMatches, previous: previousMatches };
}

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "#ffffff88",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

function TagChip({ value, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${value}`}
      style={{
        minHeight: 32,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)",
        color: "#fff",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {(TAG_LABELS[value] ?? value).replace(/\?$/, "")} ×
    </button>
  );
}

function TypeaheadSearch({
  value,
  onChange,
  onAddTerm,
  suggestions,
  isOpen,
  onOpenChange,
  highlightedIndex,
  onHighlightedChange,
  cachedTerms,
  selectedTags,
  selectedCustomTerms,
  totalActiveCount,
}) {
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const flatten = useMemo(() => {
    const { tags, words, previous } = suggestions;
    const out = [];
    tags.forEach((tag) => out.push({ type: "tag", value: tag, label: TAG_LABELS[tag] ?? tag }));
    words.forEach((w) => out.push({ type: "word", value: w, label: w }));
    previous.forEach((t) => out.push({ type: "previous", value: t, label: t }));
    return out;
  }, [suggestions]);

  const canAdd = totalActiveCount < 3 && value.trim().length >= MIN_TYPEAHEAD_CHARS;

  const addCurrent = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || totalActiveCount >= 3) return;
    onAddTerm(trimmed, null);
    onChange("");
    onOpenChange(false);
  }, [value, totalActiveCount, onAddTerm, onChange, onOpenChange]);

  useEffect(() => {
    if (highlightedIndex >= flatten.length) onHighlightedChange(Math.max(0, flatten.length - 1));
  }, [flatten.length, highlightedIndex, onHighlightedChange]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current;
    if (el && highlightedIndex >= 0) {
      const item = el.children[highlightedIndex];
      if (item) item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isOpen, highlightedIndex]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "480px", margin: "0 auto 16px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minHeight: MIN_TOUCH_PX,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${W32}`,
          padding: "8px 0",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onOpenChange(true);
            onHighlightedChange(0);
          }}
          onFocus={() => flatten.length > 0 && onOpenChange(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (flatten.length > 0 && highlightedIndex >= 0 && flatten[highlightedIndex]) {
                const item = flatten[highlightedIndex];
                onAddTerm(item.value, item.type);
                onChange("");
                onOpenChange(false);
                e.preventDefault();
              } else {
                addCurrent();
                e.preventDefault();
              }
            } else if (e.key === "Escape") {
              onOpenChange(false);
              inputRef.current?.blur();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              onHighlightedChange(Math.min(highlightedIndex + 1, flatten.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              onHighlightedChange(Math.max(highlightedIndex - 1, 0));
            }
          }}
          placeholder="peace, trust, overcome…"
          aria-label="Search topics or words in verses"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="typeahead-list"
          id="typeahead-input"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 32,
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "20px",
            letterSpacing: "0.01em",
            color: W92,
            background: "transparent",
            border: "none",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={addCurrent}
          disabled={!canAdd}
          aria-label="Add current search as filter"
          style={{
            minWidth: MIN_TOUCH_PX,
            minHeight: MIN_TOUCH_PX,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            color: canAdd ? W58 : W18,
            border: "none",
            borderRadius: 0,
            cursor: canAdd ? "pointer" : "default",
            fontSize: "20px",
            fontWeight: 300,
            fontFamily: "'Inter', sans-serif",
            transition: "color 0.2s ease",
          }}
        >
          +
        </button>
      </div>
      {isOpen && flatten.length > 0 && (
        <ul
          ref={listRef}
          id="typeahead-list"
          role="listbox"
          aria-labelledby="typeahead-input"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            margin: "6px 0 0",
            padding: "8px 0",
            listStyle: "none",
            background: "rgba(18,18,18,0.98)",
            border: "none",
            borderTop: `1px solid ${W18}`,
            borderRadius: "0 0 4px 4px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
            maxHeight: "280px",
            overflowY: "auto",
            zIndex: 10,
          }}
        >
          {flatten.map((item, i) => (
            <li
              key={`${item.type}-${item.value}`}
              role="option"
              aria-selected={i === highlightedIndex}
              style={{
                padding: "12px 16px",
                minHeight: MIN_TOUCH_PX,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                background: i === highlightedIndex ? "rgba(255,255,255,0.06)" : "transparent",
                color: W92,
                fontSize: 15,
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={() => onHighlightedChange(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (item.type === "previous") {
                  onAddTerm(item.value, "previous");
                } else {
                  onAddTerm(item.value, item.type);
                }
                onChange("");
                track("added_term", { term: item.value, type: item.type });
                onOpenChange(false);
              }}
            >
              <span>{item.type === "tag" ? item.label : item.label}</span>
              {item.type === "previous" && (
                <span style={{ color: "#ffffff99", marginLeft: "8px" }}>+</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Cached terms row (inline "Recent x · y · z" format) ──────────────────
function CachedTermsRow({ terms, onAdd, onRemove, selectedTags, selectedCustomTerms, totalActiveCount }) {
  const visibleTerms = terms.slice(0, MAX_CACHED_TERMS);
  if (visibleTerms.length === 0) return null;
  const canAdd = totalActiveCount < 3;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0",
        marginTop: "14px",
      }}
    >
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "10px",
          fontWeight: 500,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: W32,
          marginRight: "12px",
          flexShrink: 0,
        }}
      >
        Recent
      </span>
      {visibleTerms.map((term, idx) => {
        const isActive = selectedTags.has(term) || selectedCustomTerms.has(term);
        const handleClick = () => {
          if (isActive) onRemove(term);
          else if (canAdd) onAdd(term);
        };
        return (
          <span key={term} style={{ display: "inline-flex", alignItems: "center" }}>
            {idx > 0 && (
              <span style={{ color: W18, margin: "0 7px", fontFamily: "'Inter', sans-serif", fontSize: "11px" }}>·</span>
            )}
            <button
              type="button"
              onClick={handleClick}
              disabled={!isActive && !canAdd}
              aria-label={isActive ? `Remove "${term}" from filters` : `Add "${term}" as filter`}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: isActive ? ACCENT : W58,
                background: "transparent",
                border: "none",
                padding: "2px 0",
                cursor: isActive || canAdd ? "pointer" : "default",
                transition: "color 0.15s ease",
              }}
            >
              {term}
            </button>
          </span>
        );
      })}
    </div>
  );
}

// ── Filter row (editorial list style, hairline rule, hover slides right) ──
function FilterRow({ tag, label, selected, onToggle, disabled }) {
  const isSelected = selected.has(tag);
  const sublabel = TAG_SUBLABELS[tag] || "";
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { onToggle(tag); track("filtered_by_tag", { tag }); }}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={label}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 0",
        background: "transparent",
        border: "none",
        borderBottom: `1px solid ${W18}`,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        transform: hovered && !disabled ? "translateX(8px)" : "translateX(0)",
        transition: "transform 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        opacity: disabled && !isSelected ? 0.32 : 1,
      }}
    >
      <span
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(22px, 3.2vw, 28px)",
          fontWeight: isSelected ? 600 : 400,
          fontStyle: isSelected ? "italic" : "normal",
          color: isSelected ? ACCENT : W92,
          lineHeight: 1,
          transition: "color 0.2s ease, font-style 0.15s ease",
        }}
      >
        {label.replace(/\?$/, "")}
      </span>
      {sublabel && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: isSelected ? ACCENT : W32,
            letterSpacing: "0.2px",
            whiteSpace: "nowrap",
            marginLeft: "16px",
            flexShrink: 0,
            transition: "color 0.2s ease",
          }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

// ── MAIN INTERACTIVE APP ──────────────────────────────────────────────────
export default function FightingWords() {
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedCustomTerms, setSelectedCustomTerms] = useState(new Set());
  const [cachedCustomTerms, setCachedCustomTerms] = useState(loadCachedTerms);
  const [localScriptures, setLocalScriptures] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const typeaheadContainerRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(340);
  const [showSubmit, setShowSubmit] = useState(false);
  const [newRef, setNewRef] = useState("");
  const [newRefSuggestions, setNewRefSuggestions] = useState([]);
  const [newLookupText, setNewLookupText] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [newTagPick, setNewTagPick] = useState(SCRIPTURE_TAGS[0] || "hope");
  const [newTags, setNewTags] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [viewMode, setViewMode] = useState("card"); // "card" | "list"

  const totalActiveCount = selectedTags.size + selectedCustomTerms.size;
  const canSelectMore = totalActiveCount < 3;

  useEffect(() => {
    setLocalScriptures(loadLocalScriptures());
  }, []);

  const allScriptures = useMemo(() => [...SCRIPTURES, ...localScriptures], [localScriptures]);
  const scriptureWords = useMemo(() => buildScriptureWords(allScriptures), [allScriptures]);

  useEffect(() => {
    if (!showSubmit) return;
    let cancelled = false;
    const run = async () => {
      try {
        const mod = await getDblLookupModule();
        const next = mod.getReferenceSuggestions(newRef);
        if (!cancelled) setNewRefSuggestions(Array.isArray(next) ? next : []);
      } catch {
        if (!cancelled) setNewRefSuggestions([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [newRef, showSubmit]);

  useEffect(() => {
    if (!showSubmit) return;
    let cancelled = false;
    const run = async () => {
      const reference = (newRef || "").trim();
      if (!reference) {
        setNewLookupText("");
        setIsLookupLoading(false);
        return;
      }
      const parsed = parseReference(reference);
      if (!parsed.ok || parsed.type === "chapter") {
        setNewLookupText("");
        setIsLookupLoading(false);
        return;
      }
      setIsLookupLoading(true);
      try {
        const mod = await getDblLookupModule();
        const result = await mod.lookupScriptureText(reference);
        if (cancelled) return;
        setNewLookupText(result.ok ? result.text : "");
      } catch {
        if (cancelled) return;
        setNewLookupText("");
      }
      setIsLookupLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [newRef, showSubmit]);

  useEffect(() => {
    const w = Math.min(340, window.innerWidth * 0.82);
    setCardWidth(w);
  }, []);

  useEffect(() => {
    if (!typeaheadOpen) return;
    const handle = (e) => {
      if (typeaheadContainerRef.current && !typeaheadContainerRef.current.contains(e.target)) {
        setTypeaheadOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [typeaheadOpen]);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else if (totalActiveCount < 3) next.add(tag);
      return next;
    });
  }, [totalActiveCount]);

  const addTerm = useCallback((term, type) => {
    const t = (term || "").trim();
    if (!t || totalActiveCount >= 3) return;
    const isTag = SCRIPTURE_TAGS.includes(t);
    const resolvedTag = isTag ? t : SCRIPTURE_TAGS.find((tag) => (TAG_LABELS[tag] ?? tag).toLowerCase() === t.toLowerCase());
    if (resolvedTag) {
      setSelectedTags((prev) => (prev.has(resolvedTag) ? prev : new Set([...prev, resolvedTag])));
    } else {
      setSelectedCustomTerms((prev) => (prev.has(t) ? prev : new Set([...prev, t])));
    }
    setCachedCustomTerms((prev) => {
      const next = [t, ...prev.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_CACHED_TERMS);
      saveCachedTerms(next);
      return next;
    });
  }, [totalActiveCount]);

  const removeCustomTerm = useCallback((term) => {
    setSelectedCustomTerms((prev) => {
      const next = new Set(prev);
      next.delete(term);
      return next;
    });
  }, []);

  const typeaheadSuggestions = useMemo(
    () =>
      getTypeaheadSuggestions(
        searchQuery,
        cachedCustomTerms,
        selectedTags,
        selectedCustomTerms,
        scriptureWords
      ),
    [searchQuery, cachedCustomTerms, selectedTags, selectedCustomTerms, scriptureWords]
  );

  const filteredScriptures = useCallback(() => {
    if (totalActiveCount === 0) return [];
    const tagArr = Array.from(selectedTags);
    const customArr = Array.from(selectedCustomTerms);
    return allScriptures.filter((s) => {
      if (tagArr.length && s.tags && s.tags.some((t) => tagArr.includes(t))) return true;
      const textLower = (s.text || "").toLowerCase();
      if (customArr.some((word) => textLower.includes(word.toLowerCase()))) return true;
      return false;
    });
  }, [selectedTags, selectedCustomTerms, totalActiveCount, allScriptures]);

  const results = filteredScriptures();
  const canShowResults = totalActiveCount > 0 && results.length > 0;

  const categoryLabel = [
    ...Array.from(selectedTags).map((t) => (TAG_LABELS[t] ?? t).replace(/\?$/, "")),
    ...Array.from(selectedCustomTerms),
  ]
    .join(" · ")
    .toUpperCase();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const gap = 20;
    const totalCardWidth = cardWidth + gap;
    const centerOffset = (container.clientWidth - cardWidth) / 2;
    const index = Math.round((scrollLeft - centerOffset + totalCardWidth / 2) / totalCardWidth);
    setCurrentIndex(Math.max(0, Math.min(index, results.length - 1)));
  }, [cardWidth, results.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll, canShowResults]);

  const goBackToBubbles = () => {
    setShowResults(false);
    setSelectedTags(new Set());
    setSelectedCustomTerms(new Set());
    setCurrentIndex(0);
  };

  const removeTerm = useCallback((term) => {
    if (selectedTags.has(term)) {
      setSelectedTags((prev) => {
        const next = new Set(prev);
        next.delete(term);
        return next;
      });
    } else {
      setSelectedCustomTerms((prev) => {
        const next = new Set(prev);
        next.delete(term);
        return next;
      });
    }
  }, [selectedTags]);

  //TODO: Unify search and add new tag functionality to be a single component
  const addNewTag = () => {
    setSubmitError("");
    setSubmitSuccess("");
    setNewTags((prev) => {
      if (!newTagPick) return prev;
      if (prev.includes(newTagPick)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, newTagPick];
    });
  };

  //TODO: Unify submit new verse and add new tag functionality to be a single component
  const submitNewVerse = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    const reference = (newRef || "").trim();
    const parsed = parseReference(reference);
    const tags = (newTags || []).slice(0, 3);

    if (!reference) return setSubmitError("Please add a scripture reference.");
    if (!parsed.ok) return setSubmitError("Use a valid reference format like Psalm 23:1-3.");
    if (parsed.type === "chapter") return setSubmitError("Select a verse or range (for example: Genesis 4:1-5).");
    if (tags.length === 0) return setSubmitError("Please choose at least 1 theme tag (up to 3).");

    let text = "";
    try {
      const mod = await getDblLookupModule();
      const lookup = await mod.lookupScriptureText(reference);
      if (!lookup.ok || !lookup.text.trim()) {
        return setSubmitError("Could not find that verse text in the DBL-USX source.");
      }
      text = lookup.text.trim();
    } catch {
      return setSubmitError("Scripture lookup failed. Please try again.");
    }

    const res = addLocalScripture(
      { reference, text, tags, submittedBy: "" },
      SCRIPTURES,
      localScriptures
    );

    if (!res.ok) {
      if (res.reason === "duplicate") {
        return setSubmitError("That reference already exists (or overlaps an existing reference).");
      }
      return setSubmitError("Couldn’t save that verse. Please try again.");
    }

    setLocalScriptures(res.next);
    setNewRef("");
    setNewTags([]);
    setSubmitSuccess("Saved to this browser. It’s now searchable like the built-in verses.");
  };

  //TODO: Add global terms of use, privacy policy, and other legal stuff to the bottom of the page
  //TODO: Add a feedback tab anchored 80% down the page on right side of screen
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Inter:wght@400;500;600&family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(143,169,139,0.2) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: showResults
            ? "clamp(20px, 4vw, 32px) 28px 0"
            : "clamp(36px, 7vw, 60px) 28px 0",
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "720px",
          boxSizing: "border-box",
          transition: "padding 0.3s ease",
        }}
      >
        {showResults ? (
          /* Compact header for results view */
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 400,
                color: W92,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Fighting <em>Words</em>
            </h1>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: W32,
              }}
            >
              Verses that speak to what you chose.
            </span>
          </div>
        ) : (
          /* Large editorial wordmark for filter view */
          <>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(52px, 11vw, 84px)",
                fontWeight: 300,
                lineHeight: 0.92,
                color: W92,
                margin: "0 0 18px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Fighting
              <br />
              <em>Words</em>
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "3.5px",
                textTransform: "uppercase",
                color: W32,
                margin: 0,
              }}
            >
              Scriptures for every season
            </p>
          </>
        )}
      </header>

      {!showResults ? (
        /* ── Filter screen ── */
        <main
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "720px",
            padding: "clamp(28px, 5vw, 48px) 28px 60px",
            boxSizing: "border-box",
          }}
        >
          {/* Prompt */}
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(16px, 2.5vw, 20px)",
              fontWeight: 400,
              color: W58,
              margin: "0 0 clamp(20px, 4vw, 32px) 0",
              letterSpacing: "0.01em",
            }}
          >
            What are you facing right now?
          </p>

          {/* Filter rows */}
          <div style={{ width: "100%", borderTop: `1px solid ${W18}` }}>
            {SCRIPTURE_TAGS.slice(0, VISIBLE_BUBBLE_COUNT).map((tag) => (
              <FilterRow
                key={tag}
                tag={tag}
                label={TAG_LABELS[tag] ?? tag}
                selected={selectedTags}
                onToggle={toggleTag}
                disabled={totalActiveCount >= 3 && !selectedTags.has(tag)}
              />
            ))}
          </div>

          {/* Search section */}
          <div style={{ marginTop: "clamp(28px, 5vw, 44px)" }}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: W32,
                margin: "0 0 14px 0",
              }}
            >
              Or search by word
            </p>
            <div ref={typeaheadContainerRef}>
              <TypeaheadSearch
                value={searchQuery}
                onChange={setSearchQuery}
                onAddTerm={addTerm}
                suggestions={typeaheadSuggestions}
                isOpen={typeaheadOpen}
                onOpenChange={setTypeaheadOpen}
                highlightedIndex={highlightedIndex}
                onHighlightedChange={setHighlightedIndex}
                cachedTerms={cachedCustomTerms}
                selectedTags={selectedTags}
                selectedCustomTerms={selectedCustomTerms}
                totalActiveCount={totalActiveCount}
              />
            </div>
            <CachedTermsRow
              terms={cachedCustomTerms}
              onAdd={addTerm}
              onRemove={removeTerm}
              selectedTags={selectedTags}
              selectedCustomTerms={selectedCustomTerms}
              totalActiveCount={totalActiveCount}
            />
          </div>

          {/* Show results */}
          {canShowResults && (
            <div style={{ marginTop: "clamp(24px, 4vw, 36px)" }}>
              <button
                type="button"
                onClick={() => { setShowResults(true); track("show_matching_verses", { results: results.length }); }}
                aria-label="Show matching verses"
                style={{
                  minHeight: MIN_TOUCH_PX,
                  padding: "14px 32px",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  fontWeight: 500,
                  fontStyle: "italic",
                  letterSpacing: "0.02em",
                  color: "#1a1a1a",
                  background: W92,
                  border: "none",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease, transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                Show {results.length} verse{results.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}

          {/* Add Verse — minimal text toggle at bottom */}
          <div
            style={{
              marginTop: "clamp(32px, 5vw, 48px)",
              borderTop: `1px solid ${W18}`,
              paddingTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowSubmit((v) => !v);
                setSubmitError("");
                setSubmitSuccess("");
              }}
              aria-expanded={showSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `1px solid ${W32}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: W32,
                  fontSize: "16px",
                  fontWeight: 300,
                  fontFamily: "'Inter', sans-serif",
                  flexShrink: 0,
                  transition: "border-color 0.2s ease",
                }}
              >
                {showSubmit ? "–" : "+"}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "11px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: W32,
                }}
              >
                Add a verse
              </span>
            </button>
            {showSubmit && (
              <form onSubmit={submitNewVerse} style={{ padding: "14px 16px 16px" }}>
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>Reference</FieldLabel>
                  <input
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    list="scripture-reference-suggestions"
                    placeholder='e.g. "Psalm 23:1-3"'
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      minHeight: MIN_TOUCH_PX,
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.18)",
                      color: "#fff",
                      outline: "none",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                    }}
                  />
                  <datalist id="scripture-reference-suggestions">
                    {(Array.isArray(newRefSuggestions) ? newRefSuggestions : []).map((ref) => (
                      <option key={ref} value={ref} />
                    ))}
                  </datalist>
                  <div style={{ color: "#ffffff66", fontSize: 12, marginTop: 8 }}>
                    Type any DBL scripture reference. Book only shows chapters; chapter input shows verses.
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>Verse text (auto-filled)</FieldLabel>
                  <div
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.18)",
                      background: "rgba(0,0,0,0.18)",
                      color: lookedUpText ? "#fff" : "#ffffff88",
                      minHeight: 92,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      lineHeight: 1.45,
                    }}
                  >
                    {isLookupLoading
                      ? "Looking up scripture text..."
                      : newLookupText || "Verse text will appear here after selecting a valid verse or range."}
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <FieldLabel>Theme tags (pick up to 3)</FieldLabel>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <select
                      value={newTagPick}
                      onChange={(e) => setNewTagPick(e.target.value)}
                      style={{
                        minHeight: MIN_TOUCH_PX,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "rgba(0,0,0,0.18)",
                        color: "#fff",
                        outline: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        flex: "1 1 240px",
                      }}
                    >
                      {SCRIPTURE_TAGS.map((t) => (
                        <option key={t} value={t}>
                          {TAG_LABELS[t] ?? t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addNewTag}
                      disabled={newTags.length >= 3 || newTags.includes(newTagPick)}
                      style={{
                        minHeight: MIN_TOUCH_PX,
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background:
                          newTags.length >= 3 || newTags.includes(newTagPick)
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(255,255,255,0.16)",
                        color: "#fff",
                        cursor:
                          newTags.length >= 3 || newTags.includes(newTagPick)
                            ? "default"
                            : "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      Add tag
                    </button>
                  </div>
                  {newTags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {newTags.map((t) => (
                        <TagChip
                          key={t}
                          value={t}
                          onRemove={() => setNewTags((prev) => prev.filter((x) => x !== t))}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {submitError && (
                  <div style={{ color: "#ffb4b4", fontSize: 13, marginBottom: 10 }}>
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div style={{ color: "#bfffd1", fontSize: 13, marginBottom: 10 }}>
                    {submitSuccess}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button
                    type="submit"
                    style={{
                      minHeight: MIN_TOUCH_PX,
                      padding: "12px 18px",
                      borderRadius: 999,
                      border: "none",
                      background: "#fff",
                      color: "#1a1a1a",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    Save verse
                  </button>
                  <span style={{ color: "#ffffff66", fontSize: 12 }}>
                    Saved verses: {localScriptures.length}
                  </span>
                </div>
              </form>
            )}
          </div>
        </main>
      ) : (
        /* ── Results: card carousel or list view ── */
        <>
          {/* Results header: back button + view toggle + count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              padding: "8px 20px 16px",
              width: "100%",
              maxWidth: "720px",
              boxSizing: "border-box",
              minHeight: MIN_TOUCH_PX,
            }}
          >
            <button
              type="button"
              onClick={goBackToBubbles}
              aria-label="Change topics and choose different verses"
              style={{
                minHeight: MIN_TOUCH_PX,
                padding: "10px 20px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#ffffffcc",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 999,
                cursor: "pointer",
              }}
            >
              Change topics
            </button>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <span
              style={{
                fontSize: "13px",
                color: "#ffffff55",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {results.length} verse{results.length !== 1 ? "s" : ""}
            </span>
          </div>

          {viewMode === "card" ? (
            /* ── Card carousel (existing) ── */
            <>
              <div
                ref={scrollRef}
                style={{
                  display: "flex",
                  gap: "20px",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  scrollBehavior: "smooth",
                  width: "100%",
                  padding: `30px calc((100% - ${cardWidth}px) / 2)`,
                  boxSizing: "border-box",
                  WebkitOverflowScrolling: "touch",
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {results.map((scripture, i) => (
                  <ScriptureCard
                    key={`${scripture.reference}-${i}`}
                    scripture={scripture}
                    index={i}
                    isActive={i === currentIndex}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#ffffff33",
                  padding: "16px 0 30px",
                  fontWeight: 500,
                  letterSpacing: "1px",
                  textAlign: "center",
                }}
              >
                {currentIndex + 1} / {results.length}
              </div>
            </>
          ) : (
            /* ── Editorial list view ── */
            <div
              style={{
                width: "100%",
                maxWidth: "720px",
                padding: "0 28px 60px",
                boxSizing: "border-box",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Category header */}
              {categoryLabel && (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                    color: "rgba(232,218,192,0.4)",
                    paddingBottom: "20px",
                  }}
                >
                  {categoryLabel}
                </div>
              )}
              {/* Top divider */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginBottom: 0 }} />

              {results.map((scripture, i) => (
                <ScriptureListItem
                  key={`${scripture.reference}-${i}`}
                  scripture={scripture}
                />
              ))}

              {/* Add a verse CTA */}
              <div style={{ paddingTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { goBackToBubbles(); setShowSubmit(true); }}
                  aria-label="Add a verse"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "20px 0",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "1px solid rgba(232,218,192,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(232,218,192,0.5)",
                      fontSize: "18px",
                      fontWeight: 300,
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "14px",
                      color: "rgba(232,218,192,0.4)",
                      fontWeight: 400,
                    }}
                  >
                    Add a verse
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
