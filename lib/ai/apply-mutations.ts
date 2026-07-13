import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import type { ReplanPlan } from "./schemas";

const DAY = 86_400_000;
const dueFrom = (days?: number | null) =>
  days == null ? null : new Date(Date.now() + days * DAY);

// Json columns reject Date objects — serialise to plain JSON (Dates -> ISO strings).
const snap = (v: unknown) => JSON.parse(JSON.stringify(v));

const tasksInProject = (tx: any, projectId: string) =>
  tx.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { order: "asc" }],
    include: { assignee: true },
  });

// Apply a validated plan atomically. Every change writes an AiAction row
// carrying its before/after snapshot and reasoning, all sharing one batchId.
export async function applyPlan(projectId: string, plan: ReplanPlan) {
  const batchId = randomUUID();

  return prisma.$transaction(async (tx) => {
    const agg = await tx.task.aggregate({
      where: { projectId },
      _max: { order: true },
    });
    let nextOrder = (agg._max.order ?? 0) + 1;

    for (const m of plan.mutations) {
      if (m.action === "create") {
        const task = await tx.task.create({
          data: {
            projectId,
            title: m.title!,
            detail: m.detail ?? null,
            status: m.status ?? "todo",
            priority: m.priority ?? "medium",
            dueDate: dueFrom(m.dueInDays),
            order: nextOrder++,
          },
        });
        await tx.aiAction.create({
          data: {
            projectId,
            batchId,
            type: "create_task",
            targetId: task.id,
            before: undefined,
            after: snap(task),
            reasoning: m.reasoning,
          },
        });
      } else if (m.action === "update") {
        const before = await tx.task.findUnique({ where: { id: m.taskId! } });
        const data: any = {};
        if (m.title != null) data.title = m.title;
        if (m.detail != null) data.detail = m.detail;
        if (m.priority != null) data.priority = m.priority;
        if (m.dueInDays != null) data.dueDate = dueFrom(m.dueInDays);
        const after = await tx.task.update({ where: { id: m.taskId! }, data });
        await tx.aiAction.create({
          data: {
            projectId,
            batchId,
            type: "update_task",
            targetId: m.taskId!,
            before: snap(before),
            after: snap(after),
            reasoning: m.reasoning,
          },
        });
      } else if (m.action === "move") {
        const before = await tx.task.findUnique({ where: { id: m.taskId! } });
        const after = await tx.task.update({
          where: { id: m.taskId! },
          data: { status: m.toStatus!, order: nextOrder++ },
        });
        await tx.aiAction.create({
          data: {
            projectId,
            batchId,
            type: "move_task",
            targetId: m.taskId!,
            before: snap(before),
            after: snap(after),
            reasoning: m.reasoning,
          },
        });
      } else if (m.action === "flag") {
        await tx.aiAction.create({
          data: {
            projectId,
            batchId,
            type: "flag_risk",
            targetId: m.taskId ?? undefined,
            before: undefined,
            after: { note: m.note, severity: m.severity ?? "medium" } as any,
            reasoning: m.reasoning,
          },
        });
      }
    }

    const tasks = await tasksInProject(tx, projectId);
    const actions = await tx.aiAction.findMany({
      where: { projectId, batchId },
      orderBy: { createdAt: "asc" },
    });
    return { batchId, actions, tasks };
  });
}

// Undo = replay a batch backwards, restoring each `before` snapshot. Reverse
// chronological order means the earliest state wins if one task was touched
// more than once in the same batch.
export async function undoBatch(projectId: string, batchId: string) {
  return prisma.$transaction(async (tx) => {
    const actions = await tx.aiAction.findMany({
      where: { projectId, batchId, reverted: false },
      orderBy: { createdAt: "desc" },
    });

    for (const a of actions) {
      if (a.type === "create_task" && a.targetId) {
        await tx.task.deleteMany({ where: { id: a.targetId } });
      } else if (
        (a.type === "update_task" || a.type === "move_task") &&
        a.before &&
        a.targetId
      ) {
        const b = a.before as any;
        await tx.task.update({
          where: { id: a.targetId },
          data: {
            title: b.title,
            detail: b.detail,
            status: b.status,
            priority: b.priority,
            dueDate: b.dueDate ? new Date(b.dueDate) : null,
            order: b.order,
          },
        });
      }
      // flag_risk writes no task state, so there is nothing to undo.
    }

    await tx.aiAction.updateMany({
      where: { projectId, batchId },
      data: { reverted: true },
    });

    const tasks = await tasksInProject(tx, projectId);
    return { tasks };
  });
}
