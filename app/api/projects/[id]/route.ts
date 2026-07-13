import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, handle } from "@/lib/http";

type Ctx = { params: { id: string } };

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      tasks: { include: { assignee: true }, orderBy: [{ status: "asc" }, { order: "asc" }] },
      members: { include: { user: true } },
      risk: true,
    },
  });
  return ok({ project });
});

export const PATCH = handle(async (req: Request, { params }: Ctx) => {
  await requireUser();
  const b = await req.json();
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: b.name ?? undefined,
      description: b.description ?? undefined,
      status: b.status ?? undefined,
      priority: b.priority ?? undefined,
      deadline: b.deadline ? new Date(b.deadline) : undefined,
    },
  });
  return ok({ project });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  await requireUser();
  await prisma.project.delete({ where: { id: params.id } });
  return ok({ deleted: true });
});
