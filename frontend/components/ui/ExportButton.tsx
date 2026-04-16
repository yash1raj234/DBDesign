"use client";

import { ButtonHTMLAttributes } from "react";
import { Download } from "lucide-react";

interface ExportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: "sql" | "prisma" | "dbml";
}

const variantConfig = {
  sql:    { emoji: "⚙️", color: "text-cyan   border-cyan   hover:bg-cyan/8   hover:shadow-[3px_3px_0_#2fa4d7]" },
  prisma: { emoji: "🔷", color: "text-orange border-orange hover:bg-orange/8 hover:shadow-[3px_3px_0_#e76f2e]" },
  dbml:   { emoji: "📐", color: "text-brown  border-brown/50 hover:border-brown hover:shadow-ag-sm" },
};

export default function ExportButton({
  label = "Export SQL",
  variant = "sql",
  disabled,
  className = "",
  ...props
}: ExportButtonProps) {
  const cfg = variantConfig[variant];

  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2
        font-mono text-sm font-bold tracking-wide
        rounded-xl border-2 bg-cream
        transition-all duration-150
        ${cfg.color}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0"}
        ${className}
      `}
    >
      <Download className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}
