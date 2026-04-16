"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

import TableNode from "./TableNode";
import { ERDSchema, Table, TableNodeData } from "@/lib/types";

const NODE_W = 250;
const NODE_H = 40 + 32 * 5; // header + avg 5 cols
const nodeTypes = { tableNode: TableNode };

function layout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 50 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const p = g.node(n.id);
    return { ...n, position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 } };
  });
}

export default function ERDCanvas({ schema }: { schema: ERDSchema }) {
  const { nodes, edges } = useMemo(() => {
    const rawNodes: Node[] = schema.tables.map((t: Table) => ({
      id: t.name, type: "tableNode", position: { x: 0, y: 0 },
      data: { table: t } as TableNodeData,
    }));

    const rawEdges: Edge[] = schema.relationships.map((r, i) => ({
      id: `e${i}`,
      source: r.from_table,
      target: r.to_table,
      label: r.label,
      type: "smoothstep",
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#2fa4d7", width: 16, height: 16 },
      style: { stroke: "#2fa4d7", strokeWidth: 2 },
      labelStyle: { fill: "#3e2c23", fontFamily: "monospace", fontSize: 10 },
      labelBgStyle: { fill: "rgba(245,233,216,0.9)", stroke: "rgba(62,44,35,0.1)", strokeWidth: 1, rx: 4 },
      labelBgPadding: [4, 6] as [number, number],
    }));

    return { nodes: layout(rawNodes, rawEdges), edges: rawEdges };
  }, [schema]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.25}
      maxZoom={2.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={28} size={1.4} color="rgba(62,44,35,0.11)" />
      <Controls showInteractive={false} style={{ bottom: 16, left: 16, top: "auto" }} />
      <MiniMap
        nodeColor={() => "#2fa4d7"}
        maskColor="rgba(245,233,216,0.85)"
        style={{ bottom: 16, right: 16 }}
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
