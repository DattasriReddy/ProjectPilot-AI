import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRisk } from "@/lib/ai/risk";
import { ProjectWorkspace } from "@/components/ProjectWorkspace";
import type { ProjectFull } from "@/lib/types";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await computeRisk(params.id);
  const p = await prisma.project.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      tasks: { include: { assignee: true }, orderBy: [{ status: "asc" }, { order: "asc" }] },
      risk: true,
    },
  });

  // Serialise to plain JSON-safe shapes for the client component.
  const project: ProjectFull = {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    priority: p.priority,
    deadline: p.deadline?.toISOString() ?? null,
    risk: p.risk
      ? { score: p.risk.score, level: p.risk.level, factors: p.risk.factors as any }
      : null,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      detail: t.detail,
      status: t.status,
      priority: t.priority,
      order: t.order,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
      blockedById: t.blockedById,
    })),
  };

  return (
    <>
    <Navbar />
    <ProjectWorkspace project={project} />
  </>
  );
}
