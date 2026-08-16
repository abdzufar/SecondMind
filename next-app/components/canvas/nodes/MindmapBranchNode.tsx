import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindmapNode } from "@/lib/types";

export function MindmapBranchNode({ data, selected }: NodeProps<MindmapNode>) {
  return (
    <div className={`xf-branch${data.isActive ? " is-active" : ""}${selected ? " is-selected" : ""}`}>
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      {data.label}
    </div>
  );
}
