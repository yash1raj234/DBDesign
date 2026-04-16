"use client";

import { useState } from "react";

interface SchemaPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function SchemaPromptInput({
  value,
  onChange,
  disabled = false,
}: SchemaPromptInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      {/* Label */}
      <label
        className="block font-mono text-xs font-bold tracking-[0.2em] text-brown/60 mb-2 uppercase"
        htmlFor="schema-prompt"
      >
        Schema Prompt
      </label>

      {/* Input wrapper — 3D shadow box */}
      <div
        className={`
          relative w-full rounded-xl border-2
          transition-all duration-200 cubic-bezier(0.34,1.56,0.64,1)
          ${focused
            ? "border-orange shadow-[6px_6px_0_#e76f2e] -translate-x-0.5 -translate-y-0.5"
            : "border-brown shadow-ag-lg"
          }
        `}
      >
        {/* Top accent bar */}
        <div
          className={`
            absolute top-0 left-0 right-0 h-1 rounded-t-[10px]
            transition-all duration-300
            ${focused ? "bg-orange" : "bg-brown/20"}
          `}
        />

        <textarea
          id="schema-prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={4}
          placeholder="Describe your database (e.g. 'An e-commerce store with users, orders, and products')"
          className={`
            w-full pt-4 pb-4 px-5
            bg-cream text-brown text-base
            font-sans placeholder:text-brown/35
            rounded-xl resize-none
            outline-none border-none
            transition-opacity duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />

        {/* Character hint */}
        <div className="absolute bottom-3 right-4 font-mono text-[10px] text-brown/30 select-none">
          {value.length} chars
        </div>
      </div>

      {/* Hint text */}
      <p className="mt-2 text-xs text-brown/50 font-sans">
        Be descriptive — include table names, relations, and any special requirements.
      </p>
    </div>
  );
}
