import { useState, useRef, useEffect, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";
import SCRIPTURES from "./scripture.json";
import { SCRIPTURE_TAGS } from "./scriptureTags.js";

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

// ── Filter bubble (min 44px touch target, inclusive toggle) ──────────────
const MIN_TOUCH_PX = 44;
const BUBBLE_PADDING_V = 14;
const BUBBLE_PADDING_H = 20;
const BUBBLE_FONT_SIZE = 17;

function FilterBubble({ tag, label, selected, onToggle, disabled }) {
  const isSelected = selected.has(tag);
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={label}
      style={{
        minHeight: MIN_TOUCH_PX,
        padding: `${BUBBLE_PADDING_V}px ${BUBBLE_PADDING_H}px`,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: BUBBLE_FONT_SIZE,
        fontWeight: 600,
        lineHeight: 1.25,
        color: isSelected ? "#1a1a1a" : "#f5f5f5",
        background: isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.12)",
        border: `2px solid ${isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)"}`,
        borderRadius: 999,
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease",
        boxShadow: isSelected ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
    >
      {label}
    </button>
  );
}

// ── MAIN INTERACTIVE APP ──────────────────────────────────────────────────
export default function FightingWordsInteractive() {
  Analytics;
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [showResults, setShowResults] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(340);

  useEffect(() => {
    const w = Math.min(340, window.innerWidth * 0.82);
    setCardWidth(w);
  }, []);

  const toggleTag = useCallback((tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else if (next.size < 3) {
        next.add(tag);
      }
      return next;
    });
  }, []);

  const filteredScriptures = useCallback(() => {
    if (selectedTags.size === 0) return [];
    const arr = Array.from(selectedTags);
    return SCRIPTURES.filter((s) => s.tags && s.tags.some((t) => arr.includes(t)));
  }, [selectedTags]);

  const results = filteredScriptures();
  const canShowResults = selectedTags.size > 0 && results.length > 0;

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
    setCurrentIndex(0);
  };

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
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap"
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
          textAlign: "center",
          padding: "clamp(24px, 5vw, 40px) 20px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 0L11.5 6.5L18 9L11.5 11.5L9 18L6.5 11.5L0 9L6.5 6.5L9 0Z" fill="#fff" opacity="0.5" />
          </svg>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#ffffff88",
            }}
          >
            FaithBuilder
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(26px, 5vw, 32px)",
            fontWeight: 400,
            color: "#fff",
            margin: "0",
            letterSpacing: "-0.02em",
          }}
        >
          Fighting Words
        </h1>
        <p style={{ fontSize: "13px", color: "#ffffff55", margin: "8px 0 0", fontWeight: 400 }}>
          {showResults ? "Verses that speak to what you chose." : "Scriptures for every season."}
        </p>
      </header>

      {!showResults ? (
        /* ── Bubble filter (spatial) ── */
        <main
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "720px",
            padding: "0 20px 40px",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(20px, 4vw, 24px)",
              fontWeight: 400,
              color: "#fff",
              margin: "0 0 8px",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            Are you struggling with …
          </p>
          <p
            style={{
              fontSize: "clamp(15px, 2.5vw, 17px)",
              color: "#ffffff99",
              margin: "0 0 24px",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Worried? Confused? Challenged? Need hope? Choose up to 3—we’ll show verses that speak to any of them.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {SCRIPTURE_TAGS.map((tag) => (
              <FilterBubble
                key={tag}
                tag={tag}
                label={TAG_LABELS[tag] ?? tag}
                selected={selectedTags}
                onToggle={toggleTag}
                disabled={selectedTags.size >= 3 && !selectedTags.has(tag)}
              />
            ))}
          </div>
          {canShowResults && (
            <div style={{ textAlign: "center", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setShowResults(true)}
                aria-label="Show matching verses"
                style={{
                  minHeight: MIN_TOUCH_PX,
                  padding: "14px 28px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  background: "#fff",
                  border: "none",
                  borderRadius: 999,
                  cursor: "pointer",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                  transition: "transform 0.15s ease, box-shadow 0.2s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                Show {results.length} verse{results.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}
        </main>
      ) : (
        /* ── Results: card carousel ── */
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "8px 20px 16px",
              flexWrap: "wrap",
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
            <span
              style={{
                fontSize: "14px",
                color: "#ffffff66",
                fontWeight: 500,
              }}
            >
              {results.length} verse{results.length !== 1 ? "s" : ""} for you
            </span>
          </div>
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
      )}

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
