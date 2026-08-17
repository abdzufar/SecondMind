import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindmapNode } from "@/lib/types";

export function RoadmapStepNode({ data, selected }: NodeProps<MindmapNode>) {
  const isComplete = data.isCompleted;

  return (
    <div className={`xf-step${selected ? " is-selected" : ""}${isComplete ? " is-complete" : ""}`}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <span className="xf-step-num">
        {isComplete ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          data.num
        )}
      </span>
      <span className="xf-step-body">
        <span className="xf-step-time">{data.timeMark}</span>
        <span className="xf-step-label">{data.label}</span>
      </span>
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
}
