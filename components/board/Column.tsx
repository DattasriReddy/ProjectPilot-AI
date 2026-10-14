"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { TaskCard } from "./TaskCard";

export function Column({
  status,
  tasks,
  highlightedIds,
  onTaskClick,
  onAddTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  highlightedIds: Set<string>;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const statusAccent: Record<TaskStatus, string> = {
    todo:        "text-slate-400",
    in_progress: "text-blue-300",
    review:      "text-amber-300",
    done:        "text-emerald-300",
  };

  const statusDot: Record<TaskStatus, string> = {
    todo:        "bg-slate-500",
    in_progress: "bg-blue-400",
    review:      "bg-amber-400",
    done:        "bg-emerald-400",
  };

  return (
    <div className="flex w-80 shrink-0 flex-col">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusDot[status]}`} />
          <h3 className={`text-sm font-semibold tracking-wide ${statusAccent[status]}`}>
            {STATUS_LABELS[status]}
          </h3>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          title="Add task"
          className="rounded-lg p-1 text-slate-500 transition hover:bg-white/10 hover:text-cyan-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`pp-scroll flex min-h-[68vh] flex-col gap-3 rounded-3xl border p-3 backdrop-blur-xl transition-all duration-300
          ${isOver
            ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,.18)]"
            : "border-white/10 bg-slate-900/40 shadow-[0_10px_40px_rgba(0,0,0,.35)]"
          }`}
      >
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            highlighted={highlightedIds.has(t.id)}
            onClick={() => onTaskClick(t)}
          />
        ))}

        {/* Inline add button at the bottom */}
        <button
          onClick={() => onAddTask(status)}
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
        >
          <span className="text-lg leading-none">+</span> Add task
        </button>
      </div>
    </div>
  );
}
