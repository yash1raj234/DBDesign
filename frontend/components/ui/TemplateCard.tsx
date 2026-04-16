"use client";

import { useState } from "react";

interface TemplateCardProps {
  title: string;
  description: string;
  tables: string[];
  tag: string;
  badge?: string;
  accentColor?: "cyan" | "orange" | "brown";
  onClick?: () => void;
}

const accentMap = {
  cyan:   { border: "#2fa4d7", shadow: "rgba(47,164,215,0.25)",  badgeBg: "#2fa4d7" },
  orange: { border: "#e76f2e", shadow: "rgba(231,111,46,0.25)",  badgeBg: "#e76f2e" },
  brown:  { border: "#3e2c23", shadow: "rgba(62,44,35,0.25)",    badgeBg: "#3e2c23" },
};

export default function TemplateCard({
  title,
  description,
  tables,
  tag,
  badge,
  accentColor = "cyan",
  onClick,
}: TemplateCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const accent = accentMap[accentColor];

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={resetTilt}
      className="cursor-pointer rounded-2xl border-2 overflow-hidden select-none"
      style={{
        borderColor: hovered ? accent.border : "rgba(62,44,35,0.15)",
        background: "#f5e9d8",
        boxShadow: hovered
          ? `0 20px 60px ${accent.shadow}, 0 4px 20px rgba(62,44,35,0.08)`
          : "0 4px 16px rgba(62,44,35,0.08)",
        transform: hovered
          ? `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale(1.02)`
          : "perspective(600px) rotateX(0) rotateY(0) translateY(0) scale(1)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.2s ease",
        willChange: "transform",
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{ background: hovered ? accent.border : "rgba(62,44,35,0.1)" }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span
              className="inline-block font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-2"
              style={{
                background: hovered ? accent.border : "rgba(62,44,35,0.08)",
                color: hovered ? "#f5e9d8" : "rgba(62,44,35,0.5)",
                transition: "all 0.2s",
              }}
            >
              {tag}
            </span>
            <h3 className="font-mono font-bold text-lg text-brown leading-tight">{title}</h3>
          </div>
          {badge && (
            <span className="flex-shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-orange/15 text-orange border border-orange/20">
              {badge}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-brown/60 font-sans leading-relaxed mb-4">{description}</p>

        {/* Table pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {tables.map((t) => (
            <span
              key={t}
              className="font-mono text-[11px] px-2 py-1 rounded-lg border"
              style={{
                borderColor: hovered ? `${accent.border}40` : "rgba(62,44,35,0.12)",
                color: hovered ? accent.border : "rgba(62,44,35,0.6)",
                background: hovered ? `${accent.border}0f` : "transparent",
                transition: "all 0.2s",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div
          className="flex items-center gap-1.5 font-mono text-xs font-bold transition-all duration-200"
          style={{ color: hovered ? accent.border : "rgba(62,44,35,0.4)" }}
        >
          <span>Use this template</span>
          <span
            className="transition-transform duration-200"
            style={{ transform: hovered ? "translateX(4px)" : "translateX(0)" }}
          >
            →
          </span>
        </div>
      </div>
    </div>
  );
}
