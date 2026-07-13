"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { STATUS_LABELS, type TaskStatus } from "@/lib/constants";
import { TaskCard } from "./TaskCard";

export function Column({
  status,
  tasks,
  highlightedIds,
}: {
  status: TaskStatus;
  tasks: Task[];
  highlightedIds: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-80 shrink-0 flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold tracking-wide text-slate-100">
          {STATUS_LABELS[status]}
        </h3>

        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
          {tasks.length}
        </span>
      </div>

      {/* Glass Column */}
      <div
        ref={setNodeRef}
        className={`
          pp-scroll
          flex
          min-h-[68vh]
          flex-col
          gap-3
          rounded-3xl
          border
          p-3
          backdrop-blur-xl
          transition-all
          duration-300

          ${
            isOver
              ? `
                border-cyan-400/60
                bg-cyan-500/10
                shadow-[0_0_30px_rgba(34,211,238,.18)]
              `
              : `
                border-white/10
                bg-slate-900/40
                shadow-[0_10px_40px_rgba(0,0,0,.35)]
              `
          }
        `}
      >
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            highlighted={highlightedIds.has(t.id)}
          />
        ))}
      </div>
    </div>
  );
}