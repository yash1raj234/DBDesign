"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/shared/Navbar";

/* ──────────────────────────────────────────────────────────
   GHOST LOADER OVERLAY
────────────────────────────────────────────────────────── */
function GhostLoader({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(245,233,216,0.92)",
      backdropFilter: "blur(10px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "0",
    }}>
      {/* Ghost SVG */}
      <div style={{ animation: "ghostBob 2s ease-in-out infinite" }}>
        <svg width="88" height="108" viewBox="0 0 88 108" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <path d="M44 6C20 6 8 24 8 44 L8 88 L20 78 L32 88 L44 78 L56 88 L68 78 L80 88 L80 44 C80 24 68 6 44 6Z" fill="#2fa4d7" />
          {/* Eyes */}
          <ellipse cx="32" cy="48" rx="8" ry="9" fill="#f5e9d8" />
          <ellipse cx="56" cy="48" rx="8" ry="9" fill="#f5e9d8" />
          <circle cx="34" cy="50" r="4.5" fill="#3e2c23" />
          <circle cx="58" cy="50" r="4.5" fill="#3e2c23" />
          <circle cx="36" cy="48" r="1.8" fill="white" />
          <circle cx="60" cy="48" r="1.8" fill="white" />
        </svg>
      </div>

      {/* Shadow */}
      <div style={{
        width: "60px", height: "10px", borderRadius: "50%",
        background: "rgba(47,164,215,0.2)",
        animation: "ghostShadow 2s ease-in-out infinite",
        marginTop: "4px",
      }} />

      {/* Dots */}
      <div style={{ display: "flex", gap: "8px", marginTop: "32px" }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: "#2fa4d7",
            animation: `dotBounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <p style={{
        marginTop: "20px",
        fontFamily: "var(--font-space-mono, monospace)",
        fontWeight: 700, fontSize: "14px",
        color: "rgba(62,44,35,0.65)", letterSpacing: "0.04em",
      }}>Analyzing your prompt…</p>
      <p style={{ marginTop: "6px", fontSize: "13px", color: "rgba(62,44,35,0.4)" }}>Building tables, columns, and relations</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   DB TARGET SELECTOR
────────────────────────────────────────────────────────── */
const DB_OPTIONS = [
  { value: "postgresql", label: "PostgreSQL", desc: "Full-featured & robust",  emoji: "🐘" },
  { value: "mysql",      label: "MySQL",      desc: "Widely compatible",        emoji: "🐬" },
  { value: "sqlite",     label: "SQLite",     desc: "Lightweight & local",       emoji: "🪶" },
];

function DBSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "10px" }}>
      {DB_OPTIONS.map(opt => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "14px 12px",
              borderRadius: "14px",
              border: `2px solid ${sel ? "#2fa4d7" : "rgba(62,44,35,0.15)"}`,
              background: sel ? "rgba(47,164,215,0.06)" : "#f5e9d8",
              boxShadow: sel ? "3px 3px 0 #2fa4d7" : "3px 3px 0 rgba(62,44,35,0.10)",
              transform: sel ? "translate(-1px,-1px)" : "translate(0,0)",
              cursor: "pointer",
              textAlign: "left" as const,
              transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>{opt.emoji}</div>
            <div style={{
              fontFamily: "var(--font-space-mono, monospace)",
              fontWeight: 700, fontSize: "13px",
              color: sel ? "#2fa4d7" : "#3e2c23",
              marginBottom: "2px",
            }}>{opt.label}</div>
            <div style={{ fontSize: "11px", color: "rgba(62,44,35,0.5)" }}>{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PROMPT INPUT (3D Shadow style)
────────────────────────────────────────────────────────── */
function SchemaInput({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <label style={{
        display: "block",
        fontFamily: "var(--font-space-mono, monospace)",
        fontSize: "10px", fontWeight: 700,
        letterSpacing: "0.16em", textTransform: "uppercase" as const,
        color: "rgba(62,44,35,0.45)",
        marginBottom: "10px",
      }}>
        Schema Prompt
      </label>

      {/* Input wrapper */}
      <div style={{
        position: "relative",
        borderRadius: "16px",
        border: `2px solid ${focused ? "#e76f2e" : "rgba(62,44,35,0.2)"}`,
        boxShadow: focused ? "5px 5px 0 #e76f2e" : "5px 5px 0 rgba(62,44,35,0.18)",
        transform: focused ? "translate(-2px,-2px)" : "translate(0,0)",
        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        background: "#f5e9d8",
        overflow: "hidden",
      }}>
        {/* Orange accent bar at top */}
        <div style={{
          height: "3px",
          background: focused ? "#e76f2e" : "transparent",
          transition: "background 0.2s ease",
        }} />

        <textarea
          id="schema-prompt"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={5}
          placeholder="Describe your database in plain English…&#10;e.g. 'An e-commerce store with users, products, orders, and a review system'"
          style={{
            display: "block",
            width: "100%",
            padding: "18px 20px 16px",
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: "15px",
            lineHeight: 1.7,
            color: "#3e2c23",
            opacity: disabled ? 0.5 : 1,
          }}
        />

        {/* Char count */}
        <div style={{
          padding: "6px 16px 10px",
          fontFamily: "var(--font-space-mono, monospace)",
          fontSize: "10px",
          color: "rgba(62,44,35,0.3)",
          textAlign: "right" as const,
        }}>
          {value.length} chars
        </div>
      </div>

      <p style={{ marginTop: "8px", fontSize: "12px", color: "rgba(62,44,35,0.4)" }}>
        Tip: Include table names, relations, and any special requirements for better results.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   EXAMPLE PROMPTS
────────────────────────────────────────────────────────── */
const EXAMPLES = [
  "E-commerce store with users, products, orders, and reviews",
  "SaaS platform with organizations, members, and subscription plans",
  "Blog with authors, posts, tags, and nested comments",
  "Hospital system with patients, doctors, and appointments",
];

/* ──────────────────────────────────────────────────────────
   INNER PAGE (needs useSearchParams — wrapped in Suspense)
────────────────────────────────────────────────────────── */
function GeneratorInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [prompt,   setPrompt]   = useState("");
  const [dbTarget, setDbTarget] = useState("postgresql");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const tmpl = searchParams.get("template");
    const map: Record<string,string> = {
      ecommerce: EXAMPLES[0],
      saas:      EXAMPLES[1],
      blog:      EXAMPLES[2],
    };
    if (tmpl && map[tmpl]) setPrompt(map[tmpl]);
  }, [searchParams]);

  function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setTimeout(() => router.push("/output/mock"), 3000);
  }

  return (
    <>
      <GhostLoader visible={loading} />

      {/* Page */}
      <div style={{ background: "#f5e9d8", minHeight: "100vh" }} className="dot-grid">
        <Navbar />

        <main style={{ paddingTop: "120px", paddingBottom: "80px", padding: "120px 24px 80px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>

            {/* Page header */}
            <div className="anim-fadeUp" style={{ textAlign: "center", marginBottom: "48px" }}>
              <span className="badge badge-orange" style={{ marginBottom: "16px" }}>Schema Generator</span>
              <h1 className="title-lg" style={{ marginBottom: "12px" }}>
                Describe your{" "}
                <span style={{ color: "#e76f2e" }}>database</span>
              </h1>
              <p className="body-sm" style={{ maxWidth: "460px", margin: "0 auto" }}>
                Plain English. No SQL required. Our AI builds a complete, normalized schema with tables, relations, types, and indexes.
              </p>
            </div>

            {/* ── Main card ── */}
            <div className="anim-fadeUp-d1 soft-card" style={{ padding: "32px", marginBottom: "16px" }}>
              <SchemaInput value={prompt} onChange={setPrompt} disabled={loading} />

              {/* Quick-fill examples */}
              <div style={{ marginTop: "20px" }}>
                <p className="label" style={{ marginBottom: "10px" }}>Quick fill</p>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "8px" }}>
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      disabled={loading}
                      style={{
                        padding: "6px 14px",
                        background: "rgba(62,44,35,0.05)",
                        border: "1px solid rgba(62,44,35,0.12)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "rgba(62,44,35,0.6)",
                        cursor: "pointer",
                        fontFamily: "var(--font-inter, sans-serif)",
                        transition: "all 0.12s",
                        whiteSpace: "nowrap" as const,
                        maxWidth: "220px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ex.length > 42 ? ex.slice(0,42) + "…" : ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── DB target ── */}
            <div className="anim-fadeUp-d2 soft-card" style={{ padding: "28px", marginBottom: "16px" }}>
              <p className="label" style={{ marginBottom: "14px" }}>Target Database</p>
              <DBSelector value={dbTarget} onChange={setDbTarget} />
            </div>

            {/* ── Generate button ── */}
            <div className="anim-fadeUp-d3">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading}
                style={{
                  width: "100%",
                  padding: "17px",
                  background: (!prompt.trim() || loading) ? "rgba(231,111,46,0.45)" : "#e76f2e",
                  color: "#f5e9d8",
                  fontFamily: "var(--font-space-mono, monospace)",
                  fontWeight: 700, fontSize: "15px",
                  letterSpacing: "0.04em",
                  border: "2px solid rgba(62,44,35,0.3)",
                  borderRadius: "14px",
                  boxShadow: (!prompt.trim() || loading) ? "4px 4px 0 rgba(62,44,35,0.15)" : "5px 5px 0 #3e2c23",
                  cursor: (!prompt.trim() || loading) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  transform: "translate(0,0)",
                  transition: "all 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={e => {
                  if (!prompt.trim() || loading) return;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "7px 7px 0 #3e2c23";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = (!prompt.trim() || loading) ? "4px 4px 0 rgba(62,44,35,0.15)" : "5px 5px 0 #3e2c23";
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid rgba(245,233,216,0.3)", borderTopColor: "#f5e9d8", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Generating schema…
                  </>
                ) : (
                  <>⚡ Generate Schema</>
                )}
              </button>

              <p style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "rgba(62,44,35,0.35)", fontFamily: "var(--font-space-mono, monospace)" }}>
                Mock mode — no AI calls in Phase 3
              </p>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   EXPORT (wrapped in Suspense for useSearchParams)
────────────────────────────────────────────────────────── */
export default function GeneratorPage() {
  return (
    <Suspense>
      <GeneratorInner />
    </Suspense>
  );
}
