"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const TABS = [
  { key: "sql",       label: "SQL",       lang: "sql"  },
  { key: "prisma",    label: "Prisma",    lang: "sql"  },
  { key: "dbml",      label: "DBML",      lang: "sql"  },
  { key: "migration", label: "Migration", lang: "sql"  },
] as const;

type Key = (typeof TABS)[number]["key"];

export default function CodePanel({ sql, prisma, dbml, migration }: {
  sql:string; prisma:string; dbml:string; migration:string;
}) {
  const [tab,    setTab]    = useState<Key>("sql");
  const [copied, setCopied] = useState(false);

  const content: Record<Key, string> = { sql, prisma, dbml, migration };

  function copy() {
    navigator.clipboard.writeText(content[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", borderRadius: "14px", overflow: "hidden", border: "1.5px solid rgba(62,44,35,0.12)", background: "#1a1210" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", alignItems: "center",
        background: "#241810",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "8px 10px",
        gap: "2px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: "2px", flex: 1 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: tab === t.key ? "#2fa4d7" : "transparent",
                color: tab === t.key ? "#f5e9d8" : "rgba(245,233,216,0.35)",
                fontFamily: "var(--font-space-mono, monospace)",
                fontWeight: 700, fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Copy button */}
        <button
          onClick={copy}
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            border: "none",
            background: copied ? "rgba(90,158,111,0.2)" : "rgba(255,255,255,0.05)",
            color: copied ? "#5a9e6f" : "rgba(245,233,216,0.4)",
            fontFamily: "var(--font-space-mono, monospace)",
            fontWeight: 700, fontSize: "11px",
            cursor: "pointer",
            transition: "all 0.12s",
            display: "flex", alignItems: "center", gap: "5px",
            whiteSpace: "nowrap" as const,
          }}
        >
          {copied ? "✓ Copied" : "⎘ Copy"}
        </button>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          language="sql"
          value={content[tab]}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: '"Space Mono", "Cascadia Code", ui-monospace, monospace',
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "line",
            scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
          }}
        />
      </div>
    </div>
  );
}
