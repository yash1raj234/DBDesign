"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();

  const links = [
    { href: "/",          label: "Home"      },
    { href: "/generator", label: "Generator" },
  ];

  return (
    <header
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 8px 8px 20px",
        background: "rgba(245,233,216,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "2px solid rgba(62,44,35,0.15)",
        borderRadius: "999px",
        boxShadow: "0 4px 24px rgba(62,44,35,0.10), 3px 3px 0 rgba(62,44,35,0.08)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginRight: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "8px",
            background: "#3e2c23", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 800, color: "#f5e9d8", letterSpacing: "-0.5px" }}>DB</span>
          </div>
          <span style={{ fontFamily: "var(--font-space-mono, monospace)", fontWeight: 700, fontSize: "14px", color: "#3e2c23", letterSpacing: "-0.02em" }}>
            Design
          </span>
        </div>
      </Link>

      {/* Separator */}
      <div style={{ width: "1px", height: "20px", background: "rgba(62,44,35,0.15)" }} />

      {/* Nav links */}
      <nav style={{ display: "flex", gap: "2px" }}>
        {links.map(({ href, label }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <span style={{
                display: "block",
                padding: "7px 16px",
                borderRadius: "999px",
                fontFamily: "var(--font-space-mono, monospace)",
                fontWeight: 700,
                fontSize: "13px",
                letterSpacing: "0.01em",
                color: active ? "#f5e9d8" : "rgba(62,44,35,0.6)",
                background: active ? "#3e2c23" : "transparent",
                transition: "all 0.15s ease",
                cursor: "pointer",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* CTA */}
      <Link href="/generator" className="btn-primary" style={{
        padding: "9px 20px",
        fontSize: "13px",
        borderRadius: "999px",
        boxShadow: "3px 3px 0 #3e2c23",
        marginLeft: "4px",
      }}>
        Try Now ↗
      </Link>
    </header>
  );
}
