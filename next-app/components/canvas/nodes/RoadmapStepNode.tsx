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

export function RoadmapStepNode({ data, selected }: NodeProps<MindmapNode>) {
  const isComplete = data.isCompleted;

  return (
    <div className={`xf-step${selected ? " is-selected" : ""}${isComplete ? " is-complete" : ""}`}>
      <BiHandle position={Position.Top} id="top" />
      <BiHandle position={Position.Left} id="left" />
      <BiHandle position={Position.Right} id="right" />
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
      <BiHandle position={Position.Bottom} id="bottom" />
    </div>
  );
}
