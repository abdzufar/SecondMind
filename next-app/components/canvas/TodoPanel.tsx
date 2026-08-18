"use client";

import { useEffect, useState } from "react";
import { createTodo, getTodos, updateTodo } from "@/lib/api";
import type { WireTodo } from "@/lib/types";

type TodoPanelProps = {
  mindmapId: string;
  selectedNodeLabel?: string;
};

type Status = "loading" | "ready" | "error";

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function TodoPanel({ mindmapId, selectedNodeLabel }: TodoPanelProps) {
  const [todos, setTodos] = useState<WireTodo[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [taskText, setTaskText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getTodos(mindmapId)
      .then((loaded) => {
        setTodos(loaded);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [mindmapId]);

  function handleToggle(todo: WireTodo) {
    const nextCompleted = !todo.isCompleted;
    setTodos((prev) => prev.map((t) => (t._id === todo._id ? { ...t, isCompleted: nextCompleted } : t)));
    updateTodo(todo._id, { isCompleted: nextCompleted }).catch(() => {
      setTodos((prev) => prev.map((t) => (t._id === todo._id ? { ...t, isCompleted: todo.isCompleted } : t)));
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskText.trim() || !dueDate) return;

    setIsSubmitting(true);
    setFormError(null);
    createTodo({ mindmapId, taskText: taskText.trim(), dueDate })
      .then((created) => {
        setTodos((prev) => [...prev, created]);
        setTaskText("");
        setDueDate("");
      })
      .catch(() => setFormError("Gagal menambah task. Coba lagi."))
      .finally(() => setIsSubmitting(false));
  }

  const sorted = [...todos].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="drawer-body todo-panel">
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
          {sorted.map((todo) => (
            <li key={todo._id} className={`todo-item${todo.isCompleted ? " is-done" : ""}`}>
              <input
                type="checkbox"
                checked={todo.isCompleted}
                onChange={() => handleToggle(todo)}
                className="todo-checkbox"
                aria-label={`Tandai "${todo.taskText}" selesai`}
              />
              <div className="todo-item-body">
                <span className="todo-item-text">{todo.taskText}</span>
                <span className="todo-item-due">{formatDueDate(todo.dueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Task baru…"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          className="todo-form-text"
          aria-label="Nama task"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="todo-form-date"
          aria-label="Due date"
        />
        <button type="submit" className="todo-form-submit" disabled={isSubmitting}>
          {isSubmitting ? "Menambah…" : "Tambah"}
        </button>
      </form>
      {formError && <p className="todo-form-error">{formError}</p>}
    </div>
  );
}
