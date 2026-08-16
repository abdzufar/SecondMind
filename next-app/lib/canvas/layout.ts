import dagre from "@dagrejs/dagre";
import type { MindmapEdge, MindmapNode } from "@/lib/types";

const STEP_WIDTH = 220;
const STEP_HEIGHT = 60;
const BRANCH_WIDTH = 190;
const BRANCH_HEIGHT = 60;
const BRANCH_GAP = 16;
const SPINE_TO_BRANCH_GAP = 140;

type Point = { x: number; y: number };

export function getLayoutedElements(nodes: MindmapNode[], edges: MindmapEdge[]) {
  const steps = nodes.filter((node) => node.type === "roadmap-step");
  const branchesById = new Map(nodes.filter((node) => node.type === "mindmap-branch").map((node) => [node.id, node]));

  // Pass 1: dagre TB cuma buat urutan & jarak vertikal antar-step (spine).
  const spineGraph = new dagre.graphlib.Graph();
  spineGraph.setDefaultEdgeLabel(() => ({}));
  spineGraph.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 90 });
  steps.forEach((step) => spineGraph.setNode(step.id, { width: STEP_WIDTH, height: STEP_HEIGHT }));
  edges
    .filter((edge) => steps.some((s) => s.id === edge.source) && steps.some((s) => s.id === edge.target))
    .forEach((edge) => spineGraph.setEdge(edge.source, edge.target));
  dagre.layout(spineGraph);

  const positions = new Map<string, Point>();
  steps.forEach((step) => {
    const { x, y } = spineGraph.node(step.id);
    positions.set(step.id, { x: x - STEP_WIDTH / 2, y: y - STEP_HEIGHT / 2 });
  });

  // Handle mana yang dipakai tiap edge — tanpa ini smoothstep bakal keluar
  // masuk dari sisi yang salah begitu spine jadi vertikal.
  const stepIds = new Set(steps.map((step) => step.id));
  const edgeHandles = new Map<string, { sourceHandle: string; targetHandle: string }>();

  edges.forEach((edge) => {
    if (stepIds.has(edge.source) && stepIds.has(edge.target)) {
      edgeHandles.set(edge.id, { sourceHandle: "bottom", targetHandle: "top" });
    }
  });

  // Pass 2: cabang tiap step di-fan manual ke kiri/kanan, gantian per step
  // (bukan per cabang) — samain sama hero illustration di app/page.tsx.
  const stepsByY = [...steps].sort((a, b) => positions.get(a.id)!.y - positions.get(b.id)!.y);

  stepsByY.forEach((step, stepIndex) => {
    const stepPos = positions.get(step.id)!;
    const branchEdges = edges.filter((edge) => edge.source === step.id && branchesById.has(edge.target));
    if (branchEdges.length === 0) return;

    const side = stepIndex % 2 === 0 ? "left" : "right";
    const branchX = side === "left" ? stepPos.x - SPINE_TO_BRANCH_GAP - BRANCH_WIDTH : stepPos.x + STEP_WIDTH + SPINE_TO_BRANCH_GAP;

    const stepCenterY = stepPos.y + STEP_HEIGHT / 2;
    const totalHeight = branchEdges.length * BRANCH_HEIGHT + (branchEdges.length - 1) * BRANCH_GAP;
    const startY = stepCenterY - totalHeight / 2;

    branchEdges.forEach((edge, branchIndex) => {
      positions.set(edge.target, { x: branchX, y: startY + branchIndex * (BRANCH_HEIGHT + BRANCH_GAP) });
      edgeHandles.set(edge.id, { sourceHandle: side, targetHandle: side === "left" ? "right" : "left" });
    });
  });

  const layoutedNodes = nodes.map((node) => {
    const fallback = { x: 0, y: 0 };
    return { ...node, position: positions.get(node.id) ?? fallback };
  });

  const layoutedEdges = edges.map((edge) => ({ ...edge, ...edgeHandles.get(edge.id) }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
