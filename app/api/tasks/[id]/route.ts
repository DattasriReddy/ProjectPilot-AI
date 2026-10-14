import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";

type Ctx = { params: { id: string } };

// Handles field edits AND the drag-and-drop status/order change from the board.
export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const b = await req.json();
  if (b.status && !TASK_STATUSES.includes(b.status)) return bad("invalid status");
  if (b.priority && !PRIORITIES.includes(b.priority)) return bad("invalid priority");

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      title: b.title ?? undefined,
      detail: b.detail ?? undefined,
      status: b.status ?? undefined,
      priority: b.priority ?? undefined,
      order: typeof b.order === "number" ? b.order : undefined,
      assigneeId: b.assigneeId === undefined ? undefined : b.assigneeId,
      dueDate: b.dueDate === undefined ? undefined : b.dueDate ? new Date(b.dueDate) : null,
    },
    include: { assignee: true },
  });
  return ok({ task });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  await prisma.task.delete({ where: { id: params.id } });
  return ok({ deleted: true });
});
