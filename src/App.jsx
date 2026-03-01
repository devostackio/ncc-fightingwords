import React from "react";
import FightingWords from "./fighting-words.jsx";

const APPS = [
  {
    id: "fighting-words",
    name: "Fighting Words",
    description: "Carry scripture cards curated by the National Community family to speak truth in every season.",
    href: "/fighting-words",
    badge: "Featured",
    theme: {
      bg: "#151515",
      accent: "#F5D19C",
      soft: "#2A2A2A",
    },
  },
  {
    id: "bible-youversion",
    name: "Bible App (YouVersion)",
    description: "Read, listen, and meditate on Scripture anywhere with the YouVersion Bible App.",
    href: "https://www.bible.com/app",
    external: true,
    theme: {
      bg: "#1F252F",
      accent: "#F0B27A",
      soft: "#2B3340",
    },
  },
  {
    id: "faith-events",
    name: "Faith Events",
    description: "Discover concerts, gatherings, and Bible studies across DC, Virginia, and Maryland.",
    href: "#",
    theme: {
      bg: "#221D29",
      accent: "#CFA6FF",
      soft: "#30253A",
    },
  },
  {
    id: "prayer-rhythm",
    name: "Daily Prayer Rhythm",
    description: "Create gentle reminders to pause, pray, and re-center your day on God.",
    href: "#",
    theme: {
      bg: "#1E2522",
      accent: "#A6E0C2",
      soft: "#25302B",
    },
  },
  {
    id: "practice-the-way",
    name: "Practicing the Way",
    description: "Tools to help you build habits of Scripture, silence, Sabbath, and community.",
    href: "#",
    theme: {
      bg: "#261E1E",
      accent: "#F2A6A6",
      soft: "#332727",
    },
  },
];

function AppCard({ app }) {
  const content = (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 24px 22px",
        borderRadius: "20px",
        background: `radial-gradient(circle at top left, ${app.theme.accent}22 0, transparent 55%), ${app.theme.bg}`,
        boxShadow:
          "0 18px 45px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.02)",
        color: "#F9F9F9",
        overflow: "hidden",
        minHeight: "170px",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, background 0.25s ease",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 120% -10%, ${app.theme.accent}33 0, transparent 55%)`,
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: app.theme.accent,
                boxShadow: `0 0 0 6px ${app.theme.accent}33`,
              }}
            />
            <span
              style={{
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#FFFFFF88",
                fontWeight: 600,
              }}
            >
              NCC App
            </span>
          </div>
          {app.badge && (
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 2,
                padding: "4px 10px",
                borderRadius: 999,
                background: `${app.theme.accent}22`,
                color: app.theme.accent,
                border: `1px solid ${app.theme.accent}55`,
              }}
            >
              {app.badge}
            </span>
          )}
        </div>

        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22,
            fontWeight: 400,
            margin: "0 0 6px",
            letterSpacing: "-0.01em",
          }}
        >
          {app.name}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: "#FFFFFFAA",
          }}
        >
          {app.description}
        </p>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 18,
        }}
      >
        <span
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: "#FFFFFF99",
          }}
        >
          Open app
        </span>
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "999px",
            background: `${app.theme.soft}`,
            border: `1px solid ${app.theme.accent}55`,
            color: app.theme.accent,
            fontSize: 14,
          }}
        >
          ↗
        </span>
      </div>
    </div>
  );

  const commonProps = {
    style: {
      textDecoration: "none",
      color: "inherit",
      display: "block",
    },
  };

  if (app.external) {
    return (
      <a
        href={app.href}
        target="_blank"
        rel="noreferrer"
        {...commonProps}
      >
        {content}
      </a>
    );
  }

  return (
    <a href={app.href} {...commonProps}>
      {content}
    </a>
  );
}

function AppCenter() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #2A2A35 0, #050508 45%, #020204 100%)",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
          background: #050508;
        }
      `}</style>

      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 0% 0%, rgba(245, 209, 156, 0.16) 0, transparent 55%), radial-gradient(circle at 100% 0%, rgba(207, 166, 255, 0.18) 0, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1040px",
          margin: "0 auto",
          padding: "40px 20px 28px",
        }}
      >
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 30% 30%, #FFFFFF, #F5D19C)",
                boxShadow: "0 0 0 6px rgba(245, 209, 156, 0.26)",
              }}
            />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#FFFFFF88",
              }}
            >
              National Community
            </span>
          </div>
          <div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 32,
                lineHeight: 1.1,
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              National Community – App Center
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 520,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#FFFFFFAA",
              }}
            >
              Your toolkit for life, faith and walking humbly with our God.
            </p>
          </div>
        </header>

        <main>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.1fr)",
              gap: 20,
            }}
            className="app-grid"
          >
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              <AppCard app={APPS[0]} />
              <AppCard app={APPS[1]} />
            </div>
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              <AppCard app={APPS[2]} />
              <AppCard app={APPS[3]} />
              <AppCard app={APPS[4]} />
            </div>
          </div>
        </main>
      </div>

      <footer
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1040px",
          margin: "0 auto",
          padding: "0 20px 26px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "#FFFFFF55",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Created by Origin 2026</span>
        <span
          style={{
            opacity: 0.7,
          }}
        >
          National Community Church
        </span>
      </footer>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname || "/";
  const normalizedPath = path.toLowerCase();
  const isFightingWords =
    normalizedPath === "/fighting-words" ||
    normalizedPath.endsWith("/fighting-words") ||
    normalizedPath.endsWith("/fighting-words/");

  return isFightingWords ? <FightingWords /> : <AppCenter />;
}

