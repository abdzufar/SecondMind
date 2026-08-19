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
      edgeHandles.set(edge.id, { sourceHandle: "bottom-source", targetHandle: "top-target" });
    }
  });

  // Pass 2: cabang tiap step di-fan manual ke kiri/kanan, gantian per step
  // (bukan per cabang) — samain sama hero illustration di app/page.tsx.
  const stepsByY = [...steps].sort((a, b) => positions.get(a.id)!.y - positions.get(b.id)!.y);
  const placedNodes = new Set<string>();
  stepsByY.forEach((step) => placedNodes.add(step.id));

  stepsByY.forEach((step, stepIndex) => {
    const stepPos = positions.get(step.id)!;
    const side = stepIndex % 2 === 0 ? "left" : "right";

    let currentLevelIds = [step.id];
    let levelIndex = 1;

    while (currentLevelIds.length > 0) {
      const nextLevelIds: string[] = [];
      const branchEdgesAtLevel = edges.filter(
        (edge) => currentLevelIds.includes(edge.source) && branchesById.has(edge.target) && !placedNodes.has(edge.target)
      );

      if (branchEdgesAtLevel.length === 0) break;

      const totalHeight = branchEdgesAtLevel.length * BRANCH_HEIGHT + (branchEdgesAtLevel.length - 1) * BRANCH_GAP;
      const stepCenterY = stepPos.y + STEP_HEIGHT / 2;
      const startY = stepCenterY - totalHeight / 2;

      const branchX = side === "left"
        ? stepPos.x - (SPINE_TO_BRANCH_GAP + BRANCH_WIDTH) * levelIndex
        : stepPos.x + STEP_WIDTH + SPINE_TO_BRANCH_GAP + (SPINE_TO_BRANCH_GAP + BRANCH_WIDTH) * (levelIndex - 1);

      branchEdgesAtLevel.forEach((edge, branchIndex) => {
        positions.set(edge.target, { x: branchX, y: startY + branchIndex * (BRANCH_HEIGHT + BRANCH_GAP) });
        placedNodes.add(edge.target);
        nextLevelIds.push(edge.target);

        edgeHandles.set(edge.id, {
          sourceHandle: side + "-source",
          targetHandle: (side === "left" ? "right" : "left") + "-target",
        });
      });

      currentLevelIds = nextLevelIds;
      levelIndex++;
    }
  });

  // Pass 3: Floating branches (completely disconnected from steps)
  const unplacedBranches = nodes.filter((node) => node.type === "mindmap-branch" && !placedNodes.has(node.id));
  if (unplacedBranches.length > 0) {
    let maxY = 0;
    positions.forEach((p) => {
      if (p.y > maxY) maxY = p.y;
    });

    unplacedBranches.forEach((node, i) => {
      positions.set(node.id, { x: 0, y: maxY + 150 + i * (BRANCH_HEIGHT + BRANCH_GAP) });
    });
  }

  const layoutedNodes = nodes.map((node) => {
    const fallback = { x: 0, y: 0 };
    return { ...node, position: positions.get(node.id) ?? fallback };
  });

  const layoutedEdges = edges.map((edge) => {
    const layoutHandles = edgeHandles.get(edge.id);
    return {
      sourceHandle: "right-source",
      targetHandle: "left-target",
      ...edge,
      ...layoutHandles,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// Hapus satu node (manual node edit — §9 M5 CLAUDE.md). Kalau yang dihapus roadmap-step,
// cabang-cabangnya ikut kehapus (biar gak jadi node nyantol tanpa induk) dan spine-nya
// disambung ulang (step sebelum <-> step sesudah) biar rantai roadmap-nya gak putus.
// Nomor urut step di-hitung ulang dari sisa node yang ada.
export function removeNodeCascade(nodes: MindmapNode[], edges: MindmapEdge[], idToDelete: string) {
  const nodeToDelete = nodes.find((node) => node.id === idToDelete);
  if (!nodeToDelete) return { nodes, edges };

  const idsToRemove = new Set([idToDelete]);

  if (nodeToDelete.type === "roadmap-step") {
    edges
      .filter((edge) => edge.source === idToDelete)
      .map((edge) => edge.target)
      .filter((targetId) => nodes.find((node) => node.id === targetId)?.type === "mindmap-branch")
      .forEach((branchId) => idsToRemove.add(branchId));
  }

  const isStep = (id: string) => nodes.find((node) => node.id === id)?.type === "roadmap-step";
  const incomingStepEdge = edges.find((edge) => edge.target === idToDelete && isStep(edge.source));
  const outgoingStepEdge = edges.find((edge) => edge.source === idToDelete && isStep(edge.target));

  const remainingNodes = nodes.filter((node) => !idsToRemove.has(node.id));
  let remainingEdges = edges.filter((edge) => !idsToRemove.has(edge.source) && !idsToRemove.has(edge.target));

  if (incomingStepEdge && outgoingStepEdge) {
    remainingEdges = [
      ...remainingEdges,
      {
        id: `${incomingStepEdge.source}-${outgoingStepEdge.target}`,
        source: incomingStepEdge.source,
        target: outgoingStepEdge.target,
      },
    ];
  }

  let stepCount = 0;
  const renumberedNodes = remainingNodes.map((node) =>
    node.type === "roadmap-step"
      ? { ...node, data: { ...node.data, num: String(++stepCount).padStart(2, "0") } }
      : node
  );

  return getLayoutedElements(renumberedNodes, remainingEdges);
}

// BFS dari semua roadmap-step lewat edge (source -> target) buat nemuin cabang
// mana yang beneran masih kejangkau dari rantai roadmap — dipisah dari sekadar
// "punya edge apa nggak" karena cabang nested (§9 M5 CLAUDE.md) bisa masih
// terhubung ke induknya sendiri padahal induknya udah kepencar dari step.
function getReachableBranchIds(nodes: MindmapNode[], edges: MindmapEdge[]): Set<string> {
  const nodeTypeById = new Map(nodes.map((node) => [node.id, node.type]));
  const reachable = new Set<string>();
  let frontier = nodes.filter((node) => node.type === "roadmap-step").map((node) => node.id);

  while (frontier.length > 0) {
    const next: string[] = [];
    edges.forEach((edge) => {
      if (!frontier.includes(edge.source)) return;
      if (nodeTypeById.get(edge.target) !== "mindmap-branch" || reachable.has(edge.target)) return;
      reachable.add(edge.target);
      next.push(edge.target);
    });
    frontier = next;
  }

  return reachable;
}

// Cabang yang gak lagi kejangkau dari roadmap-step manapun (mis. wire
// penghubungnya dihapus manual lewat drag-wire delete — §9 M5 CLAUDE.md)
// dihapus otomatis, bareng sub-cabang di bawahnya yang ikut kepencar — biar
// gak nyangkut sebagai node nyantol yang bakal jatuh ke posisi fallback jauh
// di bawah pas layout ulang (Pass 3 di atas). roadmap-step sengaja gak kena
// logic ini — kehilangan koneksi di step resikonya lebih besar, tetap harus
// lewat tombol delete node eksplisit yang ada dialog konfirmasinya.
export function pruneOrphanedBranches(nodes: MindmapNode[], edges: MindmapEdge[]) {
  const reachable = getReachableBranchIds(nodes, edges);
  const orphanIds = new Set(
    nodes.filter((node) => node.type === "mindmap-branch" && !reachable.has(node.id)).map((node) => node.id)
  );

  if (orphanIds.size === 0) return { nodes, edges };

  const remainingNodes = nodes.filter((node) => !orphanIds.has(node.id));
  const remainingEdges = edges.filter((edge) => !orphanIds.has(edge.source) && !orphanIds.has(edge.target));

  return getLayoutedElements(remainingNodes, remainingEdges);
}
