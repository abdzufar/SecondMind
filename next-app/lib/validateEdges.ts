export function validateEdges(nodes: { id: string; [key: string]: unknown }[], edges: { id: string; source: string; target: string; [key: string]: unknown }[]) {
  if (!nodes || !edges) return [];
  
  // Create a fast lookup set for valid node IDs
  const validNodeIds = new Set(nodes.map(node => node.id));
  
  // Filter out any edge that connects to a non-existent source or target
  return edges.filter(edge => validNodeIds.has(edge.source) && validNodeIds.has(edge.target));
}
