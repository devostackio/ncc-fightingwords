import { useState, useRef, useEffect, useCallback } from "react";
import { Analytics } from "@vercel/analytics/react";
import SCRIPTURES from "./scripture.json";

// ── FIGHTING WORDS DATA (from scripture.json) ──────────────────

// ── 13 COLOR THEMES (soft, medium-hue, monochromatic) ────────
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

// ── ABSTRACT ARTWORK SVGs ────────────────────────────────────
const ArtworkPatterns = [
  // Flowing arcs
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <circle cx="320" cy="80" r="180" fill="${color}" opacity="0.18"/>
      <circle cx="380" cy="160" r="120" fill="${color}" opacity="0.14"/>
      <path d="M200,0 Q400,150 350,350" stroke="${color}" stroke-width="40" fill="none" opacity="0.12"/>
      <circle cx="280" cy="40" r="60" fill="${color}" opacity="0.1"/>
    </svg>`,
  // Geometric blocks
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <rect x="220" y="-20" width="200" height="200" rx="20" fill="${color}" opacity="0.15" transform="rotate(15 320 80)"/>
      <rect x="280" y="100" width="150" height="150" rx="12" fill="${color}" opacity="0.12" transform="rotate(-10 355 175)"/>
      <rect x="180" y="60" width="80" height="80" rx="8" fill="${color}" opacity="0.1" transform="rotate(25 220 100)"/>
    </svg>`,
  // Organic blobs
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <path d="M250,20 Q380,40 370,180 Q360,280 280,260 Q200,240 220,120 Q230,40 250,20Z" fill="${color}" opacity="0.16"/>
      <path d="M300,80 Q400,100 380,220 Q360,300 300,270 Q240,240 260,140 Q270,80 300,80Z" fill="${color}" opacity="0.1"/>
      <circle cx="350" cy="50" r="40" fill="${color}" opacity="0.12"/>
    </svg>`,
  // Cross / plus pattern
  (color) => `
    <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <rect x="290" y="20" width="30" height="180" rx="15" fill="${color}" opacity="0.18"/>
      <rect x="220" y="85" width="180" height="30" rx="15" fill="${color}" opacity="0.18"/>
      <circle cx="340" cy="220" r="50" fill="${color}" opacity="0.1"/>
      <rect x="330" y="160" width="20" height="100" rx="10" fill="${color}" opacity="0.12"/>
    </svg>`,
  // Radial burst
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

// ── SCRIPTURE CARD ───────────────────────────────────────────
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
      {/* Artwork - top right bleed */}
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

      {/* Subtle texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at top right, transparent 30%, ${theme.bg} 75%)`,
          pointerEvents: "none",
        }}
      />

      {/* Text block area - bottom left */}
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
        {/* Monochromatic text block background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: theme.textBlock,
            opacity: 0.85,
            borderRadius: "0 20px 0 0",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Fighting Words badge */}
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

          {/* Scripture text */}
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

          {/* Reference */}
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

// ── DOT INDICATOR ────────────────────────────────────────────
function DotIndicator({ total, current }) {
  const maxDots = 7;
  const halfRange = Math.floor(maxDots / 2);
  let start = Math.max(0, current - halfRange);
  let end = Math.min(total, start + maxDots);
  if (end - start < maxDots) start = Math.max(0, end - maxDots);

  const dots = [];
  for (let i = start; i < end; i++) {
    dots.push(i);
  }

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
      {start > 0 && (
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#999", opacity: 0.4 }} />
      )}
      {dots.map((i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: "4px",
            background: i === current ? getTheme(current).accent : "#ccc",
            opacity: i === current ? 1 : 0.4,
            transition: "all 0.3s ease",
          }}
        />
      ))}
      {end < total && (
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#999", opacity: 0.4 }} />
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function FightingWords() {
  Analytics;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const [cardWidth, setCardWidth] = useState(340);

  useEffect(() => {
    const w = Math.min(340, window.innerWidth * 0.82);
    setCardWidth(w);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const gap = 20;
    const totalCardWidth = cardWidth + gap;
    const centerOffset = (container.clientWidth - cardWidth) / 2;
    const index = Math.round((scrollLeft - centerOffset + totalCardWidth / 2) / totalCardWidth);
    setCurrentIndex(Math.max(0, Math.min(index, SCRIPTURES.length - 1)));
  }, [cardWidth]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      {/* Background ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: `radial-gradient(circle, ${getTheme(currentIndex).bg}33 0%, transparent 70%)`,
          transition: "background 0.8s ease",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px 20px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
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
            fontSize: "32px",
            fontWeight: 400,
            color: "#fff",
            margin: "0",
            letterSpacing: "-0.02em",
          }}
        >
          Fighting Words
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#ffffff55",
            margin: "8px 0 0",
            fontWeight: 400,
          }}
        >
          Scriptures submitted by our family. Keep them close.
        </p>
      </div>

      {/* Card Carousel */}
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
        {SCRIPTURES.map((scripture, i) => (
          <ScriptureCard
            key={i}
            scripture={scripture}
            index={i}
            isActive={i === currentIndex}
          />
        ))}
      </div>

      {/* Dots */}
      <DotIndicator total={SCRIPTURES.length} current={currentIndex} />

      {/* Counter */}
      <div
        style={{
          fontSize: "12px",
          color: "#ffffff33",
          paddingBottom: "30px",
          fontWeight: 500,
          letterSpacing: "1px",
        }}
      >
        {currentIndex + 1} / {SCRIPTURES.length}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

