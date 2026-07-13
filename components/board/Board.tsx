"use client";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { Task } from "@/lib/types";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { Column } from "./Column";

// Presentational + drag handling. State lives in the parent workspace so the
// AI and the board mutate the same source of truth.
export function Board({
  tasks,
  highlightedIds,
  onMove,
}: {
  tasks: Task[];
  highlightedIds: Set<string>;
  onMove: (taskId: string, toStatus: TaskStatus) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(e: DragEndEvent) {
    const taskId = String(e.active.id);
    const toStatus = e.over?.id as TaskStatus | undefined;
    if (!toStatus || !TASK_STATUSES.includes(toStatus)) return;
    const current = tasks.find((t) => t.id === taskId);
    if (current && current.status !== toStatus) onMove(taskId, toStatus);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="pp-scroll flex gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            highlightedIds={highlightedIds}
            tasks={tasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.order - b.order)}
          />
        ))}
      </div>
    </DndContext>
  );
}
