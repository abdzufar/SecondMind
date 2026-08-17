import type { WireTodo } from "@/lib/types";
import { MOCK_MINDMAP } from "@/lib/mock/mindmap";

export const MOCK_TODOS: WireTodo[] = [
  {
    _id: "todo-1",
    mindmapId: MOCK_MINDMAP._id,
    taskText: "Baca ringkasan riset kompetitor",
    dueDate: "2026-07-15",
    isCompleted: true,
  },
  {
    _id: "todo-2",
    mindmapId: MOCK_MINDMAP._id,
    taskText: "Susun kalender konten Q1",
    dueDate: "2026-07-22",
    isCompleted: false,
  },
  {
    _id: "todo-3",
    mindmapId: MOCK_MINDMAP._id,
    taskText: "Riset kata kunci SEO utama",
    dueDate: "2026-07-29",
    isCompleted: false,
  },
];
