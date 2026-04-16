"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";

/* ──────────────────────────────────────────────────────────
   TEMPLATE CARD — 3D hover tilt
────────────────────────────────────────────────────────── */
function TemplateCard({
  tag, title, description, tables, accent, onClick,
}: {
  tag: string; title: string; description: string;
  tables: string[]; accent: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onMouseMove={(e) => {
        const el  = e.currentTarget as HTMLElement;
        const r   = el.getBoundingClientRect();
        const dx  = (e.clientX - r.left)  / r.width  - 0.5;
        const dy  = (e.clientY - r.top)   / r.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${dx*16}deg) rotateX(${-dy*12}deg) translateY(-6px)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "perspective(600px) rotateY(0) rotateX(0) translateY(0)";
      }}
      style={{
        background: "#f5e9d8",
        border: "2px solid rgba(62,44,35,0.18)",
        borderRadius: "20px",
        padding: "28px",
        cursor: "pointer",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease",
        boxShadow: "0 4px 20px rgba(62,44,35,0.08)",
        willChange: "transform",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 60px rgba(62,44,35,0.14), 0 0 0 2px ${accent}`;
      }}
    >
      {/* Accent glow blob */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: accent, opacity: 0.08, pointerEvents: "none",
      }} />

      {/* Tag */}
      <span style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        background: `${accent}18`,
        color: accent,
        border: `1px solid ${accent}30`,
        fontFamily: "var(--font-space-mono, monospace)",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase" as const,
        marginBottom: "14px",
      }}>{tag}</span>

      {/* Title */}
      <h3 style={{
        fontFamily: "var(--font-space-mono, monospace)",
        fontWeight: 700, fontSize: "18px",
        color: "#3e2c23", marginBottom: "10px", lineHeight: 1.3,
      }}>{title}</h3>

      {/* Description */}
      <p style={{
        fontSize: "14px", color: "rgba(62,44,35,0.58)",
        lineHeight: 1.65, marginBottom: "20px",
      }}>{description}</p>

      {/* Table pills */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginBottom: "20px" }}>
        {tables.map(t => (
          <span key={t} style={{
            padding: "4px 10px",
            border: "1px solid rgba(62,44,35,0.14)",
            borderRadius: "8px",
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "11px", color: "rgba(62,44,35,0.5)",
          }}>{t}</span>
        ))}
      </div>

      {/* Link */}
      <span style={{
        fontFamily: "var(--font-space-mono, monospace)",
        fontSize: "12px", fontWeight: 700,
        color: accent, display: "flex", alignItems: "center", gap: "4px",
      }}>
        Use template →
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   FLOATING TABLE PREVIEW
────────────────────────────────────────────────────────── */
function FloatingTablePreview() {
  return (
    <div
      className="anim-float"
      style={{
        background: "#f5e9d8",
        border: "2px solid rgba(62,44,35,0.18)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "6px 6px 0 #3e2c23, 0 20px 40px rgba(62,44,35,0.12)",
        minWidth: "260px",
        fontFamily: "var(--font-space-mono, monospace)",
      }}
    >
      {/* Header */}
      <div style={{ background: "#3e2c23", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: "rgba(245,233,216,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>⊞</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#f5e9d8" }}>users</span>
        <span style={{ marginLeft: "auto", fontSize: "10px", color: "rgba(245,233,216,0.35)" }}>6 cols</span>
      </div>
      {/* Columns */}
      {[
        { name: "id",         type: "UUID",        pk: true  },
        { name: "email",      type: "VARCHAR(255)", pk: false },
        { name: "name",       type: "VARCHAR(120)", pk: false },
        { name: "created_at", type: "TIMESTAMPTZ",  pk: false },
      ].map((col, i) => (
        <div key={col.name} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 16px",
          borderBottom: i < 3 ? "1px solid rgba(62,44,35,0.06)" : "none",
          background: i % 2 === 0 ? "transparent" : "rgba(62,44,35,0.018)",
        }}>
          <span style={{ width: "16px", fontSize: "11px", textAlign: "center" as const }}>
            {col.pk ? "🔑" : ""}
          </span>
          <span style={{ flex: 1, fontSize: "12px", fontWeight: col.pk ? 700 : 400, color: "#3e2c23" }}>{col.name}</span>
          <span style={{
            fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "6px",
            background: "rgba(47,164,215,0.12)", color: "#2fa4d7",
          }}>{col.type}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   FEATURE CARD
────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: "#f5e9d8", borderRadius: "16px",
      border: "2px solid rgba(62,44,35,0.13)",
      padding: "28px 24px",
      boxShadow: "4px 4px 0 rgba(62,44,35,0.12)",
      transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s",
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "6px 6px 0 rgba(62,44,35,0.15)"; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 0 rgba(62,44,35,0.12)"; }}
    >
      <div style={{ fontSize: "28px", marginBottom: "16px" }}>{icon}</div>
      <h3 style={{ fontFamily: "var(--font-space-mono, monospace)", fontWeight: 700, fontSize: "15px", color: "#3e2c23", marginBottom: "8px" }}>{title}</h3>
      <p style={{ fontSize: "14px", color: "rgba(62,44,35,0.6)", lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   STEP BADGE
────────────────────────────────────────────────────────── */
function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px",
        background: "#3e2c23", color: "#f5e9d8",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-space-mono, monospace)", fontWeight: 700, fontSize: "16px",
        flexShrink: 0,
      }}>{num}</div>
      <div style={{ paddingTop: "4px" }}>
        <h4 style={{ fontFamily: "var(--font-space-mono, monospace)", fontWeight: 700, fontSize: "16px", color: "#3e2c23", marginBottom: "6px" }}>{title}</h4>
        <p style={{ fontSize: "14px", color: "rgba(62,44,35,0.6)", lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   LANDING PAGE
────────────────────────────────────────────────────────── */
const TEMPLATES = [
  {
    tag: "E-Commerce", title: "Online Store Schema",
    description: "Everything to launch a production-ready online store — from product catalogs to checkout flows and order tracking.",
    tables: ["users","products","orders","order_items","payments","reviews"],
    accent: "#e76f2e", slug: "ecommerce",
  },
  {
    tag: "SaaS", title: "Multi-Tenant Platform",
    description: "Organization-based access control, subscription billing, and per-team feature flags — built for scale from day one.",
    tables: ["organizations","members","subscriptions","plans","usage_events"],
    accent: "#2fa4d7", slug: "saas",
  },
  {
    tag: "CMS", title: "Blog & Content Hub",
    description: "Authors, posts, rich-media attachments, comment threads, and tag taxonomies. Everything a modern publication needs.",
    tables: ["authors","posts","categories","comments","tags","media"],
    accent: "#3e2c23", slug: "blog",
  },
];

const FEATURES = [
  { icon: "⚡", title: "Instant ERD Generation",   desc: "Describe your data model in plain English. Get a live, interactive entity-relationship diagram in under 3 seconds." },
  { icon: "🗄️", title: "Multi-Database Output",    desc: "Switch between PostgreSQL, MySQL, and SQLite targets. The schema and type mappings adapt automatically." },
  { icon: "📦", title: "Full Export Suite",          desc: "Download raw SQL migrations, a Prisma schema, DBML, or copy any output directly to your clipboard." },
  { icon: "🔁", title: "Conversational Refinement", desc: "Iterate with follow-up prompts. Add a column, rename a table, or restructure relations — all in plain English." },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: "#f5e9d8", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar />

      {/* ╔═════════════════════════════════╗
          ║           HERO                  ║
          ╚═════════════════════════════════╝ */}
      <section
        className="dot-grid"
        style={{ paddingTop: "140px", paddingBottom: "100px", position: "relative", overflow: "hidden" }}
      >
        {/* Ambient blobs */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(47,164,215,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(231,111,46,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="anim-fadeUp" style={{ marginBottom: "28px" }}>
              <span className="badge badge-cyan">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2fa4d7", display: "inline-block", animation: "pulseRing 2s ease infinite" }} />
                AI-Powered · Phase 3 Preview
              </span>
            </div>

            {/* Headline */}
            <h1 className="anim-fadeUp-d1 title-xl" style={{ marginBottom: "24px" }}>
              Turn plain{" "}
              <span style={{ color: "#2fa4d7", textDecoration: "none", position: "relative" }}>
                English
                <svg style={{ position: "absolute", bottom: "-4px", left: 0, width: "100%" }} viewBox="0 0 200 8" fill="none">
                  <path d="M2 6 Q100 1 198 6" stroke="#2fa4d7" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span>{" "}
              into a<br />
              database schema.
            </h1>

            {/* Subheadline */}
            <p className="anim-fadeUp-d2 body" style={{ marginBottom: "40px", maxWidth: "440px" }}>
              Describe your database in natural language. DBDesign generates a live ERD diagram,
              SQL migrations, a Prisma schema, and DBML — ready to ship.
            </p>

            {/* CTAs */}
            <div className="anim-fadeUp-d3" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/generator" className="btn-primary">
                ⚡ Open Generator
              </Link>
              <Link href="/output/mock" className="btn-secondary">
                👁 View Live Example
              </Link>
            </div>

            {/* Social proof */}
            <p className="anim-fadeUp-d3" style={{ marginTop: "28px", fontSize: "13px", color: "rgba(62,44,35,0.4)" }}>
              No SQL knowledge required · Supports PostgreSQL, MySQL, SQLite
            </p>
          </div>

          {/* Right: Floating ERD preview */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            {/* Connection line decoration */}
            <div className="anim-float2" style={{ position: "absolute", top: "50%", left: "-30px", transform: "translateY(-50%)", zIndex: 0 }}>
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                <circle cx="30" cy="30" r="28" stroke="#2fa4d7" strokeWidth="1.5" strokeDasharray="5 3" />
              </svg>
            </div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <FloatingTablePreview />
            </div>
          </div>
        </div>
      </section>

      {/* ╔═════════════════════════════════╗
          ║        HOW IT WORKS             ║
          ╚═════════════════════════════════╝ */}
      <section style={{ padding: "80px 24px", borderTop: "1px solid rgba(62,44,35,0.08)", borderBottom: "1px solid rgba(62,44,35,0.08)", background: "#eddfc6" }}>
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          {/* Steps */}
          <div>
            <p className="label" style={{ marginBottom: "16px" }}>How it works</p>
            <h2 className="title-lg" style={{ marginBottom: "48px" }}>
              Schema design in{" "}
              <span style={{ color: "#e76f2e" }}>3 steps</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <Step num="1" title="Describe It" desc="Type what your database needs to do — no SQL, just plain English. Be as detailed or as vague as you like." />
              <Step num="2" title="Generate" desc="Our AI analyzes your prompt and produces a complete, normalized schema — tables, columns, types, relations, and indexes." />
              <Step num="3" title="Export" desc="Download SQL migrations, a Prisma schema, or DBML. Copy and paste straight into your project." />
            </div>
          </div>

          {/* Code preview box */}
          <div style={{
            background: "#2a1e18",
            borderRadius: "16px",
            padding: "24px",
            border: "2px solid rgba(62,44,35,0.3)",
            boxShadow: "6px 6px 0 rgba(62,44,35,0.2)",
            fontFamily: "var(--font-space-mono, monospace)",
            fontSize: "12px",
            lineHeight: 1.8,
            color: "rgba(245,233,216,0.55)",
          }}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "10px", marginBottom: "16px", display: "flex", gap: "6px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ff5f57" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#febc2e" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28c840" }} />
              <span style={{ marginLeft: "auto", color: "rgba(245,233,216,0.25)", fontSize: "11px" }}>output.sql</span>
            </div>
            <div><span style={{ color: "#2fa4d7" }}>CREATE TABLE</span><span style={{ color: "#f5e9d8" }}> users (</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>id</span>         <span style={{ color: "#a8c" }}>UUID</span>         <span style={{ color: "rgba(245,233,216,0.4)" }}>PRIMARY KEY,</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>email</span>      <span style={{ color: "#a8c" }}>VARCHAR(255)</span> <span style={{ color: "rgba(245,233,216,0.4)" }}>UNIQUE,</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>name</span>       <span style={{ color: "#a8c" }}>VARCHAR(120)</span><span style={{ color: "rgba(245,233,216,0.4)" }}>,</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>created_at</span> <span style={{ color: "#a8c" }}>TIMESTAMPTZ</span> <span style={{ color: "rgba(245,233,216,0.4)" }}>DEFAULT NOW()</span></div>
            <div><span style={{ color: "#f5e9d8" }}>);</span></div>
            <div style={{ marginTop: "10px" }}><span style={{ color: "#2fa4d7" }}>CREATE TABLE</span><span style={{ color: "#f5e9d8" }}> orders (</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>id</span>         <span style={{ color: "#a8c" }}>UUID</span>         <span style={{ color: "rgba(245,233,216,0.4)" }}>PRIMARY KEY,</span></div>
            <div style={{ paddingLeft: "16px" }}><span style={{ color: "#e76f2e" }}>user_id</span>    <span style={{ color: "#a8c" }}>UUID</span>         <span style={{ color: "rgba(245,233,216,0.4)" }}>REFERENCES users(id)</span></div>
            <div><span style={{ color: "#f5e9d8" }}>);</span></div>
          </div>
        </div>
      </section>

      {/* ╔═════════════════════════════════╗
          ║          FEATURES               ║
          ╚═════════════════════════════════╝ */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p className="label" style={{ marginBottom: "14px" }}>Why DBDesign</p>
            <h2 className="title-lg">Built for modern development teams</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ╔═════════════════════════════════╗
          ║         TEMPLATES               ║
          ╚═════════════════════════════════╝ */}
      <section className="section stripe-bg" style={{ borderTop: "1px solid rgba(62,44,35,0.08)", borderBottom: "1px solid rgba(62,44,35,0.08)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p className="label" style={{ marginBottom: "14px" }}>Templates</p>
            <h2 className="title-lg">Start from a proven schema</h2>
            <p className="body" style={{ maxWidth: "480px", margin: "14px auto 0" }}>
              Jump-start your design with a battle-tested starting point. Every template is fully customizable.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {TEMPLATES.map(t => (
              <TemplateCard
                key={t.slug} tag={t.tag} title={t.title}
                description={t.description} tables={t.tables}
                accent={t.accent}
                onClick={() => router.push(`/generator?template=${t.slug}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ╔═════════════════════════════════╗
          ║          FINAL CTA              ║
          ╚═════════════════════════════════╝ */}
      <section className="section">
        <div className="container-sm" style={{ textAlign: "center" }}>
          <div style={{
            background: "#3e2c23", borderRadius: "28px",
            padding: "64px 48px",
            boxShadow: "8px 8px 0 rgba(62,44,35,0.25)",
          }}>
            <p className="label" style={{ color: "rgba(245,233,216,0.4)", marginBottom: "16px" }}>Ready to ship?</p>
            <h2 style={{
              fontFamily: "var(--font-space-mono, monospace)", fontWeight: 700,
              fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.2,
              color: "#f5e9d8", marginBottom: "14px",
            }}>
              Stop drawing boxes.<br />Start describing tables.
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(245,233,216,0.55)", marginBottom: "36px", lineHeight: 1.65 }}>
              DBDesign turns your ideas into production-ready database schemas — instantly.
            </p>
            <Link href="/generator" className="btn-primary" style={{ fontSize: "15px", padding: "16px 40px" }}>
              ⚡ Open the Generator
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px", textAlign: "center", borderTop: "1px solid rgba(62,44,35,0.08)" }}>
        <p style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: "12px", color: "rgba(62,44,35,0.35)" }}>
          DBDesign Platform · Next.js 14 · Phase 3 MVP
        </p>
      </footer>
    </div>
  );
}
