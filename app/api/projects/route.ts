import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ok, handle } from "@/lib/http";

export const GET = handle(async () => {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { _count: { select: { tasks: true } }, risk: true },
    orderBy: { createdAt: "desc" },
  });
  return ok({ projects });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      priority: body.priority ?? "medium",
      deadline: body.deadline ? new Date(body.deadline) : null,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });
  return ok({ project }, 201);
});
