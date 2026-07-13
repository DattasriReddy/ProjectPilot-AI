import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";

export const POST = handle(async (req: Request) => {
  await requireUser();
  const b = await req.json();
  if (!b.projectId || !b.title) return bad("projectId and title are required");
  if (b.status && !TASK_STATUSES.includes(b.status)) return bad("invalid status");
  if (b.priority && !PRIORITIES.includes(b.priority)) return bad("invalid priority");

  const agg = await prisma.task.aggregate({
    where: { projectId: b.projectId },
    _max: { order: true },
  });
  const task = await prisma.task.create({
    data: {
      projectId: b.projectId,
      title: b.title,
      detail: b.detail ?? null,
      status: b.status ?? "todo",
      priority: b.priority ?? "medium",
      assigneeId: b.assigneeId ?? null,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      order: (agg._max.order ?? 0) + 1,
    },
    include: { assignee: true },
  });
  return ok({ task }, 201);
});
