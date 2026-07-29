"use client";

import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { Column } from "./Column";

export function Board({
  tasks,
  highlightedIds,
  onMove,
  onTaskClick,
  onAddTask,
}: {
  tasks: Task[];
  highlightedIds: Set<string>;
  onMove: (taskId: string, toStatus: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    const toStatus = e.over?.id as TaskStatus | undefined;
    if (!toStatus || !TASK_STATUSES.includes(toStatus)) return;
    const current = tasks.find((t) => t.id === taskId);
    if (current && current.status !== toStatus) onMove(taskId, toStatus);
  }
  console.log({
  onTaskClick,
  onAddTask,
});

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="pp-scroll flex gap-4 overflow-x-auto pb-6">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            highlightedIds={highlightedIds}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            tasks={tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order)}
          />
        ))}
      </div>
    </DndContext>
  );
}
