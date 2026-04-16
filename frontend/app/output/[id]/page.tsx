"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import {
  MOCK_SCHEMA,
  MOCK_SQL,
  MOCK_PRISMA,
  MOCK_DBML,
  MOCK_MIGRATION,
} from "@/lib/mock-data";

/* SSR-safe dynamic imports */
const ERDCanvas = dynamic(() => import("@/components/canvas/ERDCanvas"), { ssr: false });
const CodePanel = dynamic(() => import("@/components/editor/CodePanel"), { ssr: false });

/* ──────────────────────────────────────────────────────────
   FEEDBACK WIDGET
────────────────────────────────────────────────────────── */
const REACTIONS = [
  { key: "like",  emoji: "👍", label: "Solid"     },
  { key: "love",  emoji: "❤️", label: "Love it"   },
  { key: "ship",  emoji: "🚀", label: "Ship it"   },
  { key: "think", emoji: "🤔", label: "Needs work" },
];

function FeedbackWidget() {
  const [open,      setOpen]      = useState(false);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function pick(key: string) {
    setSelected(key);
    setTimeout(() => setSubmitted(true), 350);
  }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
      {open && (
        <div style={{
          background: "#f5e9d8",
          border: "2px solid rgba(62,44,35,0.18)",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "4px 4px 0 rgba(62,44,35,0.15)",
          minWidth: "190px",
          animation: "fadeUp 0.25s ease both",
        }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>
                {REACTIONS.find(r => r.key === selected)?.emoji}
              </div>
              <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "11px", fontWeight: 700, color: "rgba(62,44,35,0.5)" }}>Thanks for the feedback!</p>
              <button onClick={() => { setSelected(null); setSubmitted(false); }}
                style={{ marginTop: "8px", fontSize: "10px", color: "#2fa4d7", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
                Rate again
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(62,44,35,0.4)", marginBottom: "12px" }}>
                Rate this schema
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {REACTIONS.map(r => (
                  <button key={r.key} onClick={() => pick(r.key)} title={r.label}
                    style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      border: `2px solid ${selected === r.key ? "#2fa4d7" : "rgba(62,44,35,0.13)"}`,
                      background: selected === r.key ? "rgba(47,164,215,0.08)" : "transparent",
                      fontSize: "18px", cursor: "pointer",
                      transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >{r.emoji}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "46px", height: "46px", borderRadius: "50%",
          background: "#e76f2e", color: "#f5e9d8", fontSize: "18px",
          border: "2px solid rgba(62,44,35,0.2)",
          boxShadow: "3px 3px 0 rgba(62,44,35,0.2)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px,-1px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "5px 5px 0 rgba(62,44,35,0.2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0 rgba(62,44,35,0.2)"; }}
        title="Rate this schema"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   EXPORT BUTTON
────────────────────────────────────────────────────────── */
function ExportBtn({ label, accent, onClick }: { label: string; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 16px",
        borderRadius: "8px",
        border: `1.5px solid ${accent}40`,
        background: `${accent}0d`,
        color: accent,
        fontFamily: "var(--font-space-mono, monospace)",
        fontWeight: 700, fontSize: "11px",
        cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px",
        transition: "all 0.12s",
        whiteSpace: "nowrap" as const,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}18`; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}0d`; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
    >
      ↓ {label}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
   OUTPUT PAGE
────────────────────────────────────────────────────────── */
export default function OutputPage({ params }: { params: { id: string } }) {
  const schema = MOCK_SCHEMA;

  function downloadFile(content: string, filename: string, mime = "text/plain") {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: mime })),
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5e9d8", overflow: "hidden" }}>

      {/* ── Top bar ── */}
      <header style={{
        flexShrink: 0,
        height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        background: "rgba(245,233,216,0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1.5px solid rgba(62,44,35,0.10)",
        gap: "16px",
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", overflow: "hidden" }}>
          <Link href="/generator" style={{
            display: "flex", alignItems: "center", gap: "5px",
            textDecoration: "none",
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "12px", fontWeight: 700, color: "rgba(62,44,35,0.45)",
            whiteSpace: "nowrap" as const, flexShrink: 0,
          }}>← Back</Link>

          <div style={{ width: "1px", height: "20px", background: "rgba(62,44,35,0.12)", flexShrink: 0 }} />

          {/* Schema info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
            <span style={{
              fontFamily: "var(--font-space-mono, monospace)",
              fontWeight: 700, fontSize: "14px", color: "#3e2c23",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
            }}>{schema.title ?? schema.schema_name}</span>

            <span style={{
              padding: "3px 9px", borderRadius: "999px",
              background: "rgba(62,44,35,0.08)",
              fontFamily: "var(--font-space-mono, monospace)",
              fontSize: "10px", fontWeight: 700, color: "rgba(62,44,35,0.55)",
              flexShrink: 0,
            }}>{schema.db_target}</span>

            <span style={{
              padding: "3px 9px", borderRadius: "999px",
              background: "rgba(231,111,46,0.10)", color: "#e76f2e",
              border: "1px solid rgba(231,111,46,0.20)",
              fontFamily: "var(--font-space-mono, monospace)",
              fontSize: "10px", fontWeight: 700, flexShrink: 0,
            }}>{schema.tables.length} tables</span>
          </div>
        </div>

        {/* Right: Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <ExportBtn label="SQL"    accent="#2fa4d7" onClick={() => downloadFile(MOCK_SQL,       `${schema.schema_name}.sql`)} />
          <ExportBtn label="Prisma" accent="#e76f2e" onClick={() => downloadFile(MOCK_PRISMA,    "schema.prisma")} />
          <ExportBtn label="DBML"   accent="#3e2c23" onClick={() => downloadFile(MOCK_DBML,      `${schema.schema_name}.dbml`)} />
        </div>
      </header>

      {/* ── Split body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT — ERD Canvas (60%) */}
        <div style={{ flex: "3 1 0", minWidth: 0, minHeight: 0, padding: "16px", position: "relative" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", border: "1.5px solid rgba(62,44,35,0.12)" }}>
            <ERDCanvas schema={schema} />
          </div>

          {/* Hint badge */}
          <div style={{
            position: "absolute", top: "28px", left: "28px",
            display: "flex", alignItems: "center", gap: "7px",
            padding: "6px 12px", borderRadius: "999px",
            background: "rgba(245,233,216,0.90)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(62,44,35,0.12)",
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "10px", color: "rgba(62,44,35,0.45)",
            pointerEvents: "none" as const,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2fa4d7", flexShrink: 0, animation: "pulseRing 2s ease infinite" }} />
            Interactive ERD · drag nodes to rearrange
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "rgba(62,44,35,0.08)", flexShrink: 0 }} />

        {/* RIGHT — Code Panel (40%) */}
        <div style={{ flex: "2 1 0", minWidth: 0, minHeight: 0, padding: "16px" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <CodePanel
              sql={MOCK_SQL}
              prisma={MOCK_PRISMA}
              dbml={MOCK_DBML}
              migration={MOCK_MIGRATION}
            />
          </div>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}
