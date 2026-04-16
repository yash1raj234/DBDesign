"use client";

interface GhostLoaderProps {
  visible: boolean;
  message?: string;
}

export default function GhostLoader({
  visible,
  message = "Generating your schema…",
}: GhostLoaderProps) {
  if (!visible) return null;

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(245,233,216,0.88)", backdropFilter: "blur(8px)" }}
      role="status"
      aria-label="Loading"
    >
      {/* Ghost SVG */}
      <div className="relative flex flex-col items-center select-none">
        {/* Ghost body — animated bob */}
        <div className="animate-[ghost-bob_2s_ease-in-out_infinite]">
          <svg
            width="80"
            height="100"
            viewBox="0 0 80 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <path
              d="M40 5 C18 5 8 22 8 40 L8 80 L18 72 L28 80 L40 72 L52 80 L62 72 L72 80 L72 40 C72 22 62 5 40 5Z"
              fill="#2fa4d7"
              opacity="0.92"
            />
            {/* Eyes */}
            <ellipse cx="29" cy="42" rx="7" ry="8" fill="#f5e9d8" />
            <ellipse cx="51" cy="42" rx="7" ry="8" fill="#f5e9d8" />
            <circle cx="31" cy="44" r="4" fill="#3e2c23" />
            <circle cx="53" cy="44" r="4" fill="#3e2c23" />
            {/* Eye shine */}
            <circle cx="33" cy="42" r="1.5" fill="white" />
            <circle cx="55" cy="42" r="1.5" fill="white" />
          </svg>
        </div>

        {/* Shadow under ghost */}
        <div
          className="w-16 h-3 rounded-full mt-1"
          style={{
            background: "rgba(47,164,215,0.2)",
            animation: "ghost-shadow 2s ease-in-out infinite",
          }}
        />

        {/* Floating dots (loading indicator) */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-cyan"
              style={{
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Message */}
        <p
          className="mt-5 font-mono text-sm font-bold text-brown/70 tracking-wide text-center"
        >
          {message}
        </p>
        <p className="mt-1 text-xs text-brown/40 font-sans">
          Analyzing your prompt & building tables…
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-10px); }
        }
        @keyframes ghost-shadow {
          0%, 100% { transform: scaleX(1); opacity: 0.3; }
          50%       { transform: scaleX(0.6); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
