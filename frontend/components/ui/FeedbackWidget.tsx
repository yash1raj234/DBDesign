"use client";

import { useState } from "react";

const REACTIONS = [
  { emoji: "👍", label: "Solid schema", key: "like" },
  { emoji: "❤️", label: "Love it!",    key: "love" },
  { emoji: "🚀", label: "Ship it!",    key: "ship" },
  { emoji: "🤔", label: "Needs work",  key: "think" },
];

export default function FeedbackWidget() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [open, setOpen]     = useState(false);

  function handleSelect(key: string) {
    setSelected(key);
    setTimeout(() => setSubmitted(true), 400);
  }

  function handleReset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Popup panel */}
      {open && (
        <div
          className="bg-cream border-2 border-brown/20 rounded-2xl p-4 shadow-float
                     transition-all duration-300 animate-fade-up"
          style={{ minWidth: "200px" }}
        >
          {submitted ? (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">{REACTIONS.find((r) => r.key === selected)?.emoji}</div>
              <p className="font-mono text-xs font-bold text-brown/60">Thanks for rating!</p>
              <button
                onClick={handleReset}
                className="mt-2 text-[10px] text-cyan underline font-mono"
              >
                Rate again
              </button>
            </div>
          ) : (
            <>
              <p className="font-mono text-[10px] font-bold tracking-widest uppercase text-brown/40 mb-3">
                Rate this schema
              </p>
              <div className="flex gap-2">
                {REACTIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleSelect(r.key)}
                    title={r.label}
                    className={`
                      w-10 h-10 rounded-xl text-xl
                      transition-all duration-200
                      flex items-center justify-center
                      border-2
                      ${selected === r.key
                        ? "border-cyan bg-cyan/10 scale-110 shadow-ag-cyan"
                        : "border-brown/15 bg-cream hover:border-brown/30 hover:scale-105 hover:-translate-y-1"
                      }
                    `}
                    aria-label={r.label}
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-orange text-cream text-xl
                   border-2 border-brown/20 shadow-ag-md
                   flex items-center justify-center
                   hover:-translate-y-1 hover:shadow-ag-lg
                   active:translate-y-0 active:shadow-ag-sm
                   transition-all duration-200 animate-pulse-orange"
        title="Rate this schema"
        aria-label="Open feedback widget"
        aria-expanded={open}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
