import { prisma } from "@/lib/db";

// Deterministic project health — no LLM. Fast, explainable, demoable.
// Each factor contributes points; the total is clamped to 0..100.
export type RiskFactor = { label: string; weight: number };

export async function computeRisk(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { tasks: true },
  });

  const now = Date.now();
  const soon = now + 3 * 86_400_000; // within 3 days
  const factors: RiskFactor[] = [];
  let score = 0;

  const open = project.tasks.filter((t) => t.status !== "done");
  const overdue = open.filter((t) => t.dueDate && t.dueDate.getTime() < now);
  const dueSoon = open.filter(
    (t) => t.dueDate && t.dueDate.getTime() >= now && t.dueDate.getTime() < soon
  );
  const blocked = open.filter((t) => t.blockedById);
  const highNotStarted = project.tasks.filter(
    (t) => t.priority === "high" && t.status === "todo"
  );

  if (overdue.length) {
    const w = Math.min(40, overdue.length * 15);
    score += w;
    factors.push({ label: `${overdue.length} overdue task(s)`, weight: w });
  }
  if (dueSoon.length) {
    const w = Math.min(20, dueSoon.length * 8);
    score += w;
    factors.push({ label: `${dueSoon.length} due within 3 days`, weight: w });
  }
  if (blocked.length) {
    const w = Math.min(25, blocked.length * 12);
    score += w;
    factors.push({ label: `${blocked.length} blocked task(s)`, weight: w });
  }
  if (highNotStarted.length) {
    const w = Math.min(20, highNotStarted.length * 10);
    score += w;
    factors.push({ label: `${highNotStarted.length} high-priority not started`, weight: w });
  }
  if (project.deadline && project.deadline.getTime() < soon && open.length > 0) {
    score += 15;
    factors.push({ label: "Project deadline near with open work", weight: 15 });
  }

  score = Math.min(100, score);
  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  if (!factors.length) factors.push({ label: "On track", weight: 0 });

  const snapshot = await prisma.riskSnapshot.upsert({
    where: { projectId },
    create: { projectId, score, level, factors: factors as any },
    update: { score, level, factors: factors as any, computedAt: new Date() },
  });

  return snapshot;
}
