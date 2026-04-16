"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSchemaContext } from "@/components/SchemaProvider";
import { refineSchema } from "@/lib/api";
import { saveToHistory } from "@/lib/history";

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
   REFINE BAR
────────────────────────────────────────────────────────── */
function RefineBar({ onRefine, refining }: { onRefine: (prompt: string) => void; refining: boolean }) {
  const [value,   setValue]   = useState("");
  const [focused, setFocused] = useState(false);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || refining) return;
    onRefine(trimmed);
    setValue("");
  }

  return (
    <div style={{
      flexShrink: 0,
      padding: "10px 20px 10px",
      borderTop: "1.5px solid rgba(62,44,35,0.10)",
      background: "rgba(245,233,216,0.97)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}>
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        borderRadius: "10px",
        border: `1.5px solid ${focused ? "#e76f2e" : "rgba(62,44,35,0.18)"}`,
        boxShadow: focused ? "3px 3px 0 #e76f2e" : "3px 3px 0 rgba(62,44,35,0.10)",
        background: "#f5e9d8",
        transform: focused ? "translate(-1px,-1px)" : "translate(0,0)",
        transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        overflow: "hidden",
      }}>
        <span style={{ padding: "0 12px", fontSize: "14px", flexShrink: 0 }}>✦</span>
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Enter") submit(); }}
          disabled={refining}
          placeholder="Refine your schema… e.g. 'Add a notifications table' or 'Make email optional'"
          style={{
            flex: 1,
            padding: "9px 8px 9px 0",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: "13px",
            color: "#3e2c23",
            opacity: refining ? 0.5 : 1,
          }}
        />
      </div>

      <button
        onClick={submit}
        disabled={!value.trim() || refining}
        style={{
          flexShrink: 0,
          padding: "9px 18px",
          borderRadius: "10px",
          border: "2px solid rgba(62,44,35,0.2)",
          background: (!value.trim() || refining) ? "rgba(231,111,46,0.4)" : "#e76f2e",
          color: "#f5e9d8",
          fontFamily: "var(--font-space-mono, monospace)",
          fontWeight: 700, fontSize: "12px",
          cursor: (!value.trim() || refining) ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: "7px",
          transition: "all 0.15s",
          whiteSpace: "nowrap" as const,
        }}
      >
        {refining
          ? <><span style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid rgba(245,233,216,0.3)", borderTopColor: "#f5e9d8", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Refining…</>
          : <>⚡ Refine</>
        }
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   OUTPUT PAGE
────────────────────────────────────────────────────────── */
export default function OutputPage({ params: _params }: { params: { id: string } }) {
  const router = useRouter();
  const { result, setResult } = useSchemaContext();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [refining,      setRefining]      = useState(false);
  const [refineError,   setRefineError]   = useState<string | null>(null);
  const [exportingPng,  setExportingPng]  = useState(false);

  useEffect(() => {
    if (!result) router.replace("/generator");
  }, [result, router]);

  if (!result) return null;

  const { schema, sql, prisma, dbml, migration } = result;

  function downloadFile(content: string, filename: string, mime = "text/plain") {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: mime })),
      download: filename,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function exportCanvasPng() {
    if (!canvasRef.current || exportingPng) return;
    setExportingPng(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(canvasRef.current, {
        backgroundColor: "#f5e9d8",
        cacheBust: true,
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${schema.schema_name}-erd.png`;
      a.click();
    } catch (err) {
      console.error("Canvas export failed:", err);
    } finally {
      setExportingPng(false);
    }
  }

  async function handleRefine(refinePrompt: string) {
    if (!result) return;
    setRefining(true);
    setRefineError(null);
    try {
      const res = await refineSchema({ schema: result.schema, follow_up: refinePrompt });
      setResult(res);
      saveToHistory(refinePrompt, res);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refinement failed. Is the backend running?");
    } finally {
      setRefining(false);
    }
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

            {refining && (
              <span style={{
                padding: "3px 9px", borderRadius: "999px",
                background: "rgba(47,164,215,0.10)", color: "#2fa4d7",
                border: "1px solid rgba(47,164,215,0.20)",
                fontFamily: "var(--font-space-mono, monospace)",
                fontSize: "10px", fontWeight: 700, flexShrink: 0,
                display: "flex", alignItems: "center", gap: "5px",
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1.5px solid rgba(47,164,215,0.3)", borderTopColor: "#2fa4d7", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Refining…
              </span>
            )}
          </div>
        </div>

        {/* Right: Export */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <ExportBtn label="SQL"    accent="#2fa4d7" onClick={() => downloadFile(sql,    `${schema.schema_name}.sql`)} />
          <ExportBtn label="Prisma" accent="#e76f2e" onClick={() => downloadFile(prisma, "schema.prisma")} />
          <ExportBtn label="DBML"   accent="#3e2c23" onClick={() => downloadFile(dbml,   `${schema.schema_name}.dbml`)} />
        </div>
      </header>

      {/* ── Split body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT — ERD Canvas (60%) */}
        <div style={{ flex: "3 1 0", minWidth: 0, minHeight: 0, padding: "16px", position: "relative" }}>
          <div ref={canvasRef} style={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", border: "1.5px solid rgba(62,44,35,0.12)" }}>
            <ERDCanvas schema={schema} />
          </div>

          {/* Hint badge — bottom-left */}
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

          {/* Export PNG button — top-right */}
          <button
            onClick={exportCanvasPng}
            disabled={exportingPng}
            style={{
              position: "absolute", top: "28px", right: "28px",
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", borderRadius: "999px",
              background: "rgba(245,233,216,0.90)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(62,44,35,0.15)",
              fontFamily: "var(--font-space-mono, monospace)",
              fontSize: "10px", color: "rgba(62,44,35,0.55)",
              cursor: exportingPng ? "wait" : "pointer",
              boxShadow: "2px 2px 0 rgba(62,44,35,0.08)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!exportingPng) { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,233,216,1)"; (e.currentTarget as HTMLButtonElement).style.color = "#3e2c23"; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,233,216,0.90)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(62,44,35,0.55)"; }}
          >
            {exportingPng ? "Exporting…" : "↓ Export PNG"}
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", background: "rgba(62,44,35,0.08)", flexShrink: 0 }} />

        {/* RIGHT — Code Panel (40%) */}
        <div style={{ flex: "2 1 0", minWidth: 0, minHeight: 0, padding: "16px" }}>
          <div style={{ width: "100%", height: "100%" }}>
            <CodePanel
              sql={sql}
              prisma={prisma}
              dbml={dbml}
              migration={migration ?? ""}
            />
          </div>
        </div>
      </div>

      {/* ── Refine bar ── */}
      <RefineBar onRefine={handleRefine} refining={refining} />

      {refineError && (
        <div style={{
          flexShrink: 0,
          padding: "6px 20px 8px",
          background: "rgba(192,57,43,0.06)",
          borderTop: "1px solid rgba(192,57,43,0.12)",
          fontFamily: "var(--font-space-mono, monospace)",
          fontSize: "11px", color: "#c0392b",
          textAlign: "center" as const,
        }}>
          {refineError}
        </div>
      )}

      <FeedbackWidget />
    </div>
  );
}
