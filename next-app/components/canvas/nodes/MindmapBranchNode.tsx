import { Handle, Position, type NodeProps, useStore as useXyStore } from "@xyflow/react";
import { useCanvasStore } from "@/store/canvasStore";
import type { MindmapNode } from "@/lib/types";

function BiHandle({ id, position }: { id: string; position: Position }) {
  const connectionNodeId = useXyStore((s) => s.connectionNodeId);
  const isDragging = connectionNodeId !== null;

  return (
    <>
      <Handle type="target" position={position} id={`${id}-target`} style={{ zIndex: isDragging ? 10 : 0 }} />
      <Handle type="source" position={position} id={`${id}-source`} style={{ zIndex: isDragging ? 0 : 10 }} />
    </>
  );
}

export function MindmapBranchNode({ data, selected }: NodeProps<MindmapNode>) {
  const hasPendingTasks = useCanvasStore((s) => 
    s.todos.some((t) => !t.isCompleted && t.taskText === data.label)
  );

  return (
    <div className={`xf-branch${data.isActive ? " is-active" : ""}${selected ? " is-selected" : ""}${hasPendingTasks ? " has-pending-tasks" : ""}`}>
      <BiHandle position={Position.Left} id="left" />
      <BiHandle position={Position.Right} id="right" />
      {hasPendingTasks && <span className="xf-pending-dot" aria-label="Ada tugas belum selesai" />}
      {data.label}
    </div>
  );
}
