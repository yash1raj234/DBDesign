"use client";

import { DBTarget } from "@/lib/types";

const DB_OPTIONS: { value: DBTarget; label: string; desc: string }[] = [
  { value: DBTarget.POSTGRESQL, label: "PostgreSQL", desc: "Full-featured & robust" },
  { value: DBTarget.MYSQL,      label: "MySQL",      desc: "Widely compatible" },
  { value: DBTarget.SQLITE,     label: "SQLite",     desc: "Lightweight & local" },
];

interface DBTargetSelectorProps {
  value: DBTarget;
  onChange: (value: DBTarget) => void;
  disabled?: boolean;
}

export default function DBTargetSelector({
  value,
  onChange,
  disabled = false,
}: DBTargetSelectorProps) {
  return (
    <div className="w-full">
      <p className="font-mono text-xs font-bold tracking-[0.2em] text-brown/60 mb-3 uppercase">
        Target Database
      </p>

      <div className="flex gap-3 flex-wrap">
        {DB_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`
                relative flex-1 min-w-[110px] px-4 py-3.5
                rounded-xl border-2 text-left
                transition-all duration-200 cubic-bezier(0.34,1.56,0.64,1)
                select-none font-sans
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? "border-cyan bg-cyan/8 shadow-[3px_3px_0_#2fa4d7] -translate-x-0.5 -translate-y-0.5"
                  : "border-brown/25 bg-cream hover:border-brown/60 hover:shadow-ag-sm hover:-translate-x-0.5 hover:-translate-y-0.5"
                }
              `}
              aria-pressed={isSelected}
            >
              {/* Glitch top border */}
              <div
                className={`
                  absolute top-0 left-3 right-3 h-[2px] rounded-full
                  transition-all duration-300
                  ${isSelected ? "bg-cyan" : "bg-transparent"}
                `}
              />

              {/* Selection indicator dot */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`
                    w-2.5 h-2.5 rounded-full border-2 transition-all duration-200 flex-shrink-0
                    ${isSelected
                      ? "border-cyan bg-cyan shadow-[0_0_8px_rgba(47,164,215,0.6)]"
                      : "border-brown/30 bg-transparent"
                    }
                  `}
                />
                <span
                  className={`
                    font-mono font-bold text-sm tracking-wide
                    transition-colors duration-200
                    ${isSelected ? "text-cyan" : "text-brown"}
                  `}
                >
                  {opt.label}
                </span>
              </div>

              <p className="text-xs text-brown/50 pl-[18px]">{opt.desc}</p>

              {/* Cyan glow when selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: "inset 0 0 20px rgba(47,164,215,0.08)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
