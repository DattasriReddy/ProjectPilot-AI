"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { PriorityBadge } from "@/components/ui/badge";

export function TaskCard({
  task,
  highlighted,
}: {
  task: Task;
  highlighted?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue =
    task.dueDate && new Date(task.dueDate).getTime() < Date.now();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        group
        cursor-grab
        rounded-2xl
        border
        border-white/10
        bg-slate-900/70
        backdrop-blur-xl
        p-4
        transition-all
        duration-300

        shadow-[0_8px_24px_rgba(0,0,0,.35)]

        hover:-translate-y-1
        hover:border-cyan-400/40
        hover:shadow-[0_0_30px_rgba(34,211,238,.18)]

        active:cursor-grabbing

        ${
          highlighted
            ? "ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,.25)]"
            : ""
        }
      `}
    >
      {/* Title + Priority */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-6 text-white group-hover:text-cyan-300 transition-colors">
          {task.title}
        </h4>

        <PriorityBadge priority={task.priority} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
        <span className="text-slate-400">
          👤 {task.assignee?.name ?? "Unassigned"}
        </span>

        {task.dueDate && (
          <span
            className={
              overdue
                ? "rounded-full bg-red-500/20 px-2 py-1 font-medium text-red-300"
                : "rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300"
            }
          >
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}