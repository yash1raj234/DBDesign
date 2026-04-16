"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { TableNodeData } from "@/lib/types";

/* Type → color mapping */
const TYPE_COLORS: Record<string, string> = {
  UUID:        "#2fa4d7",
  VARCHAR:     "#e76f2e",
  TEXT:        "#e76f2e",
  INTEGER:     "#5a9e6f",
  BIGINT:      "#5a9e6f",
  DECIMAL:     "#9b6eb0",
  NUMERIC:     "#9b6eb0",
  BOOLEAN:     "#c9913a",
  TIMESTAMPTZ: "#7b6ca8",
  TIMESTAMP:   "#7b6ca8",
  DATE:        "#7b6ca8",
  ENUM:        "#c06040",
  JSONB:       "#3a8c8c",
  JSON:        "#3a8c8c",
};
const getColor = (t: string) => TYPE_COLORS[t] ?? "#3e2c23";

function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  const { table } = data;
  return (
    <div style={{
      background: "#f5e9d8",
      border: `2px solid ${selected ? "#2fa4d7" : "rgba(62,44,35,0.18)"}`,
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: selected
        ? "0 0 0 3px rgba(47,164,215,0.2), 4px 4px 0 #2fa4d7"
        : "4px 4px 0 rgba(62,44,35,0.22), 0 8px 24px rgba(62,44,35,0.08)",
      minWidth: "220px",
      maxWidth: "270px",
      fontFamily: "var(--font-space-mono, monospace)",
      transition: "box-shadow 0.2s, border-color 0.2s",
    }}>
      {/* Handles */}
      <Handle type="target" position={Position.Left}
        style={{ background: "#2fa4d7", border: "2px solid #f5e9d8", width: 9, height: 9 }} />

      {/* Header */}
      <div style={{
        background: "#3e2c23",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}>
        <span style={{ fontSize: "11px", color: "rgba(245,233,216,0.4)" }}>⊞</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#f5e9d8", flex: 1 }}>{table.name}</span>
        <span style={{ fontSize: "9px", color: "rgba(245,233,216,0.3)" }}>{table.columns.length}c</span>
      </div>

      {/* Columns */}
      <div>
        {table.columns.map((col, i) => (
          <div key={col.name} style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderBottom: i < table.columns.length - 1 ? "1px solid rgba(62,44,35,0.05)" : "none",
            background: i % 2 === 0 ? "transparent" : "rgba(62,44,35,0.018)",
          }}>
            {/* PK/FK indicator */}
            <span style={{ width: "14px", textAlign: "center", fontSize: "10px", flexShrink: 0 }}>
              {col.is_primary_key ? "🔑" : ""}
            </span>
            <span style={{
              flex: 1, fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              color: col.is_primary_key ? "#3e2c23" : "rgba(62,44,35,0.72)",
              fontWeight: col.is_primary_key ? 700 : 400,
            }}>{col.name}</span>
            <span style={{
              flexShrink: 0,
              fontSize: "9px", fontWeight: 700,
              padding: "2px 6px", borderRadius: "5px",
              background: `${getColor(col.data_type)}15`,
              color: getColor(col.data_type),
              border: `1px solid ${getColor(col.data_type)}28`,
            }}>{col.data_type}</span>
            {col.is_nullable && (
              <span style={{ fontSize: "9px", color: "rgba(62,44,35,0.28)", flexShrink: 0 }}>?</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {table.indexes.length > 0 && (
        <div style={{
          padding: "5px 14px",
          borderTop: "1px solid rgba(62,44,35,0.06)",
          background: "rgba(62,44,35,0.018)",
          fontSize: "9px", color: "rgba(62,44,35,0.35)",
          display: "flex", gap: "8px",
        }}>
          <span>{table.indexes.length} index{table.indexes.length !== 1 ? "es" : ""}</span>
          <span>·</span>
          <span>{table.foreign_keys.length} fk{table.foreign_keys.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      <Handle type="source" position={Position.Right}
        style={{ background: "#e76f2e", border: "2px solid #f5e9d8", width: 9, height: 9 }} />
    </div>
  );
}

export default memo(TableNode);
