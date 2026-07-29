"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { PriorityBadge } from "@/components/ui/badge";

export function TaskCard({
  task,
  highlighted,
  onClick,
}: {
  task: Task;
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const overdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== "done";
  const dueSoon = !overdue && task.dueDate && (new Date(task.dueDate).getTime() - Date.now()) < 3 * 86_400_000 && task.status !== "done";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group cursor-grab rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-4 transition-all duration-300
        shadow-[0_8px_24px_rgba(0,0,0,.35)]
        hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,.18)]
        active:cursor-grabbing
        ${highlighted ? "ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,.25)]" : ""}
        ${task.blockedById ? "border-l-2 border-l-red-500/60" : ""}
      `}
    >
      {/* Blocked indicator */}
      {task.blockedById && (
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-red-400">
          <span>⛔</span> Blocked
        </div>
      )}

      {/* Title + Priority */}
      <div
        className="mb-3 flex items-start justify-between gap-3"

      >
        <h4
          className="text-sm font-semibold leading-6 text-white group-hover:text-cyan-300 transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        >
          {task.title}
        </h4>
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between border-t border-white/5 pt-3 text-xs"
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <span className="text-slate-400">
          {task.assignee?.name
            ? <span className="flex items-center gap-1">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[9px] font-bold text-white">
                  {task.assignee.name.charAt(0)}
                </span>
                {task.assignee.name}
              </span>
            : <span className="text-slate-600">Unassigned</span>
          }
        </span>
        {task.dueDate && (
          <span className={`rounded-full px-2 py-1 font-medium
            ${overdue  ? "bg-red-500/20 text-red-300"
            : dueSoon  ? "bg-amber-400/20 text-amber-300"
            : "bg-cyan-500/10 text-cyan-400"}`}
          >
            {overdue ? "⚠ " : ""}
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}
