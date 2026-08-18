import { Handle, Position, type NodeProps, useStore } from "@xyflow/react";
import type { MindmapNode } from "@/lib/types";

function BiHandle({ id, position }: { id: string; position: Position }) {
  const connectionNodeId = useStore((s) => s.connectionNodeId);
  const isDragging = connectionNodeId !== null;

  return (
    <>
      <Handle type="target" position={position} id={`${id}-target`} style={{ zIndex: isDragging ? 10 : 0 }} />
      <Handle type="source" position={position} id={`${id}-source`} style={{ zIndex: isDragging ? 0 : 10 }} />
    </>
  );
}

export function MindmapBranchNode({ data, selected }: NodeProps<MindmapNode>) {
  return (
    <div className={`xf-branch${data.isActive ? " is-active" : ""}${selected ? " is-selected" : ""}`}>
      <BiHandle position={Position.Left} id="left" />
      <BiHandle position={Position.Right} id="right" />
      {data.label}
    </div>
  );
}
