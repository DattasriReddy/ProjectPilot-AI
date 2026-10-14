import { prisma } from "@/lib/db";
import type { BoardSnapshot } from "./schemas";

// Assemble the compact board view we send to the model (step 2 of the loop).
export async function buildBoardSnapshot(projectId: string): Promise<BoardSnapshot> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { tasks: { include: { assignee: true } } },
  });

  return {
    projectName: project.name,
    today: new Date().toISOString().slice(0, 10),
    tasks: project.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee?.name ?? null,
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null,
      blockedById: t.blockedById ?? null,
    })),
  };
}
