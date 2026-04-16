"use client";

import { ButtonHTMLAttributes } from "react";
import { Zap } from "lucide-react";

interface GenerateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  label?: string;
}

export default function GenerateButton({
  loading = false,
  label = "Generate Schema",
  disabled,
  className = "",
  ...props
}: GenerateButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        relative group w-full py-4 px-8
        font-mono font-bold text-base tracking-wide text-cream
        rounded-xl border-2 border-brown
        bg-orange
        shadow-ag-lg
        transition-all duration-150 cubic-bezier(0.34,1.56,0.64,1)
        ${isDisabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:-translate-x-1 hover:-translate-y-1 hover:shadow-ag-xl active:translate-x-0.5 active:translate-y-0.5 active:shadow-ag-sm cursor-pointer"
        }
        ${className}
      `}
    >
      {/* Inner gradient overlay */}
      <span
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <span className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-cream/40 border-t-cream rounded-full animate-spin" />
            <span>Generating…</span>
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 fill-cream" />
            <span>{label}</span>
          </>
        )}
      </span>
    </button>
  );
}
