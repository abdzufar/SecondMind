"use client";

import { useState } from "react";
import { createTodo, generateTodos, getTodos, updateTodo } from "@/lib/api";
import type { WireTodo } from "@/lib/types";
import { useCanvasStore } from "@/store/canvasStore";

type TodoPanelProps = {
  mindmapId: string;
  mindmapCreatedAt: string;
  selectedNodeLabel?: string;
};

type Status = "loading" | "ready" | "error";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function dateToOffsetDays(pickedDate: string, mindmapCreatedAt: string): number {
  const picked = new Date(pickedDate).getTime();
  const created = new Date(mindmapCreatedAt).getTime();
  return Math.round((picked - created) / MS_PER_DAY);
}

export function TodoPanel({ mindmapId, mindmapCreatedAt, selectedNodeLabel }: TodoPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const todos = useCanvasStore((s) => s.todos);
  const status = useCanvasStore((s) => s.todosStatus);
  const setTodos = useCanvasStore((s) => s.setTodos);
  const addTodo = useCanvasStore((s) => s.addTodo);
  const updateTodoInStore = useCanvasStore((s) => s.updateTodoInStore);
  const isOnline = useCanvasStore((s) => s.isOnline);

  const [taskText, setTaskText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleToggle(todo: WireTodo) {
    if (!isOnline) return;
    const nextCompleted = !todo.isCompleted;
    updateTodoInStore(todo._id, { isCompleted: nextCompleted });
    updateTodo(todo._id, { isCompleted: nextCompleted }).catch(() => {
      updateTodoInStore(todo._id, { isCompleted: todo.isCompleted });
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOnline) {
      setFormError("Mode offline — nambah to-do butuh koneksi internet.");
      return;
    }
    if (!taskText.trim()) {
      setFormError("Isi dulu nama tasknya.");
      return;
    }
    if (!dueDate) {
      setFormError("Pilih due date dulu.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    createTodo({
      mindmapId,
      taskText: taskText.trim(),
      timeOffsetDays: dateToOffsetDays(dueDate, mindmapCreatedAt),
    })
      .then((created) => {
        addTodo(created);
        setTaskText("");
        setDueDate("");
      })
      .catch(() => setFormError("Gagal menambah task. Coba lagi."))
      .finally(() => setIsSubmitting(false));
  }

  const roadmapSteps = nodes.filter((n) => n.type === "roadmap-step");
  const existingLabels = new Set(todos.map((t) => t.taskText));
  const autogenCandidates = roadmapSteps.filter((n) => !existingLabels.has(n.data.label));

  async function handleAutoGenerate() {
    if (autogenCandidates.length === 0 || !isOnline) return;

    setIsAutoGenerating(true);
    setFormError(null);

    // Server yang generate (nentuin taskText+description dari branch yang
    // terhubung + skip duplikat) — respons cuma { generatedCount }, jadi
    // refetch getTodos() abis itu buat nyinkronin store sama hasil aslinya.
    try {
      await generateTodos(mindmapId);
      const refreshed = await getTodos(mindmapId);
      setTodos(refreshed);
    } catch {
      setFormError("Gagal generate to-do. Coba lagi.");
    } finally {
      setIsAutoGenerating(false);
    }
  }

  const sorted = [...todos].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const now = new Date();
  const overdueItems = sorted.filter((t) => new Date(t.dueDate) < now);
  const upcomingItems = sorted.filter((t) => new Date(t.dueDate) >= now);

  function renderTodoItem(todo: WireTodo) {
    return (
      <li key={todo._id} className={`todo-item${todo.isCompleted ? " is-done" : ""}`}>
        <input
          type="checkbox"
          checked={todo.isCompleted}
          onChange={() => handleToggle(todo)}
          disabled={!isOnline}
          className="todo-checkbox"
          aria-label={`Tandai "${todo.taskText}" selesai`}
        />
        <div className="todo-item-body">
          <span className="todo-item-text">{todo.taskText}</span>
          {todo.description && <span className="todo-item-description">{todo.description}</span>}
          <span className="todo-item-due">{formatDueDate(todo.dueDate)}</span>
        </div>
      </li>
    );
  }

  return (
    <div className="drawer-body todo-panel">
      {status === "ready" && roadmapSteps.length > 0 && (
        <button
          type="button"
          className="expand-btn"
          onClick={handleAutoGenerate}
          disabled={isAutoGenerating || autogenCandidates.length === 0 || !isOnline}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6h11" />
            <path d="M9 12h11" />
            <path d="M9 18h11" />
            <path d="m3 6 1 1 2-2" />
            <path d="m3 12 1 1 2-2" />
            <path d="m3 18 1 1 2-2" />
          </svg>
          {isAutoGenerating
            ? "Membuat…"
            : autogenCandidates.length === 0
              ? "Semua langkah roadmap udah punya to-do"
              : `Auto-generate ${autogenCandidates.length} to-do dari roadmap`}
        </button>
      )}

      {selectedNodeLabel && (
        <button type="button" className="todo-quickadd" onClick={() => setTaskText(selectedNodeLabel)}>
          + Tambah dari node &quot;{selectedNodeLabel}&quot;
        </button>
      )}

      {status === "loading" && <p className="drawer-empty">Memuat to-do…</p>}
      {status === "error" && <p className="drawer-empty">Gagal memuat to-do.</p>}
      {status === "ready" && sorted.length === 0 && (
        <p className="drawer-empty">Belum ada to-do buat mindmap ini.</p>
      )}

      {status === "ready" && sorted.length > 0 && (
        <ul className="todo-list">
          {overdueItems.length > 0 && (
            <li className="todo-divider" aria-hidden="true">
              <span>Sudah lewat tenggat</span>
            </li>
          )}
          {overdueItems.map(renderTodoItem)}
          {overdueItems.length > 0 && upcomingItems.length > 0 && (
            <li className="todo-divider" aria-hidden="true">
              <span>Akan datang</span>
            </li>
          )}
          {upcomingItems.map(renderTodoItem)}
        </ul>
      )}

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task baru…"
          value={taskText}
          onChange={(e) => {
            setTaskText(e.target.value);
            if (formError) setFormError(null);
          }}
          className="todo-form-text"
          aria-label="Nama task"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            if (formError) setFormError(null);
          }}
          className="todo-form-date"
          aria-label="Due date"
        />
        <button type="submit" className="todo-form-submit" disabled={isSubmitting || !isOnline}>
          {isSubmitting ? "Menambah…" : "Tambah"}
        </button>
      </form>
      {formError && <p className="todo-form-error">{formError}</p>}
    </div>
  );
}
