import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAY = 86_400_000;
const days = (n: number) => new Date(Date.now() + n * DAY);

async function main() {
  // Clean slate for repeatable demos.
  await prisma.aiAction.deleteMany();
  await prisma.riskSnapshot.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const demo = await prisma.user.create({
    data: { email: "demo@projectpilot.ai", name: "Alex Rivera" },
  });
  const sam = await prisma.user.create({
    data: { email: "sam@projectpilot.ai", name: "Sam Okafor" },
  });
  const priya = await prisma.user.create({
    data: { email: "priya@projectpilot.ai", name: "Priya Nair" },
  });

  const project = await prisma.project.create({
    data: {
      name: "Mobile App Launch",
      description: "Ship v1 of the companion app to the App Store.",
      priority: "high",
      deadline: days(10),
      ownerId: demo.id,
      members: {
        create: [
          { userId: demo.id, role: "owner" },
          { userId: sam.id, role: "member" },
          { userId: priya.id, role: "member" },
        ],
      },
    },
  });

  // A deliberately imperfect board: something overdue, something blocked, a
  // high-priority item not started — so risk scoring and the replanner both
  // have real material to work with.
  const rows: Array<[string, string, string, string | null, number | null]> = [
    // title, status, priority, assigneeId, dueInDays (null = none)
    ["Finalise onboarding screens", "done", "medium", priya.id, -6],
    ["Set up CI/CD pipeline", "done", "high", sam.id, -3],
    ["Build auth flow", "in_progress", "high", sam.id, 1],
    ["Push notification service", "in_progress", "medium", demo.id, -1], // overdue
    ["App Store listing + assets", "todo", "high", null, 4], // high, unassigned, not started
    ["Beta feedback triage", "review", "medium", priya.id, 2],
    ["Payment integration", "todo", "high", demo.id, 6],
    ["Accessibility audit", "todo", "low", null, 9],
  ];

  let order = 1;
  const created: Record<string, string> = {};
  for (const [title, status, priority, assigneeId, due] of rows) {
    const t = await prisma.task.create({
      data: {
        projectId: project.id,
        title,
        status,
        priority,
        assigneeId: assigneeId ?? undefined,
        dueDate: due == null ? null : days(due),
        order: order++,
      },
    });
    created[title] = t.id;
  }

  // Payment integration is blocked by auth flow.
  await prisma.task.update({
    where: { id: created["Payment integration"] },
    data: { blockedById: created["Build auth flow"] },
  });

  console.log("Seeded demo user (demo@projectpilot.ai) and project:", project.name);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
