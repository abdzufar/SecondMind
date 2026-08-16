import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindmapNode } from "@/lib/types";

export function RoadmapStepNode({ data, selected }: NodeProps<MindmapNode>) {
  return (
    <div className={`xf-step${selected ? " is-selected" : ""}`}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <span className="xf-step-num">{data.num}</span>
      <span className="xf-step-body">
        <span className="xf-step-time">{data.timeMark}</span>
        <span className="xf-step-label">{data.label}</span>
      </span>
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}
