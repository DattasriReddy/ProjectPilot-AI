import Navbar from "@/components/Navbar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRisk } from "@/lib/ai/risk";
import { RiskBadge } from "@/components/ai/RiskBadge";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { tasks: true, risk: true },
    orderBy: { createdAt: "desc" },
  });

  for (const p of projects) await computeRisk(p.id);

  const withRisk = await prisma.project.findMany({
    where: { id: { in: projects.map((p) => p.id) } },
    include: { tasks: { orderBy: { createdAt: "desc" } }, risk: true },
    orderBy: { createdAt: "desc" },
  });

  // Recent AI actions across all projects
  const recentActions = await prisma.aiAction.findMany({
    where: { projectId: { in: projects.map((p) => p.id) }, reverted: false },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { project: { select: { id: true, name: true } } },
  });

  // Stats
  const totalTasks = withRisk.reduce((n, p) => n + p.tasks.length, 0);
  const openTasks  = withRisk.reduce((n, p) => n + p.tasks.filter((t) => t.status !== "done").length, 0);
  const doneTasks  = totalTasks - openTasks;
  const atRisk     = withRisk.filter((p) => p.risk && p.risk.level !== "low").length;
  const overdue    = withRisk.reduce((n, p) => n + p.tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "done"
  ).length, 0);
  const completionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const actionTypeLabel: Record<string, string> = {
    create_task: "Created task",
    update_task: "Updated task",
    move_task:   "Moved task",
    flag_risk:   "Flagged risk",
  };

  const quickLinks = [
    { href: "/analytics", label: "Analytics", icon: "📊", desc: "Charts & completion trends" },
    { href: "/risk",      label: "Risk Dashboard", icon: "⚠️",  desc: "Project health scores" },
    { href: "/calendar",  label: "Calendar", icon: "📅", desc: "Deadlines & due dates" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-8 py-10">

        <DashboardHeader />

        {/* KPI stats */}
        <section className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Projects",  value: withRisk.length, sub: "active workspaces",  color: "from-cyan-400 to-blue-500" },
            { label: "Open Tasks",      value: openTasks,       sub: `${overdue} overdue`, color: overdue > 0 ? "from-red-400 to-red-600" : "from-slate-400 to-slate-600" },
            { label: "Projects at Risk",value: atRisk,          sub: "need attention",     color: atRisk > 0 ? "from-amber-400 to-orange-500" : "from-emerald-400 to-teal-500" },
            { label: "Completion",      value: `${completionPct}%`, sub: `${doneTasks} of ${totalTasks} done`, color: "from-emerald-400 to-teal-500" },
          ].map((c) => (
            <div key={c.label} className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/20">
              <p className="text-xs uppercase tracking-widest text-slate-400">{c.label}</p>
              <p className={`mt-3 bg-gradient-to-r ${c.color} bg-clip-text text-4xl font-bold text-transparent`}>{c.value}</p>
              <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((q) => (
            <Link key={q.href} href={q.href} className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 px-5 py-4 transition hover:border-cyan-400/30 hover:bg-cyan-500/5">
              <span className="text-2xl">{q.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-cyan-300">{q.label}</p>
                <p className="text-xs text-slate-500">{q.desc}</p>
              </div>
              <span className="ml-auto text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-400">→</span>
            </Link>
          ))}
        </section>

        {/* Projects + Activity 2-col layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* Project list */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-white">Active Projects</h2>
            <div className="space-y-4">
              {withRisk.map((p) => {
                const done = p.tasks.filter((t) => t.status === "done").length;
                const pct  = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0;
                const tasksDue = p.tasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() + 3 * 86_400_000 && t.status !== "done").length;

                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="group block rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,.12)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="truncate text-lg font-semibold text-white transition group-hover:text-cyan-300">
                            {p.name}
                          </h3>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize
                            ${p.priority === "high" ? "bg-red-500/20 text-red-300"
                            : p.priority === "medium" ? "bg-amber-400/20 text-amber-300"
                            : "bg-emerald-400/20 text-emerald-300"}`}
                          >
                            {p.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                          {done}/{p.tasks.length} tasks completed
                          {tasksDue > 0 && <span className="ml-2 text-amber-400">· {tasksDue} due soon</span>}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-cyan-400">{pct}% complete</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <RiskBadge risk={p.risk ? { score: p.risk.score, level: p.risk.level, factors: p.risk.factors as any } : null} />
                        <span className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {withRisk.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-14 text-center">
                  <p className="text-3xl">🚀</p>
                  <p className="mt-4 text-lg font-semibold text-white">No projects yet</p>
                  <p className="mt-2 text-slate-400">Create your first project to get started.</p>
                </div>
              )}
            </div>
          </section>

          {/* AI Activity feed */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-white">AI Activity</h2>
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-xl">
              {recentActions.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-3xl">🧠</p>
                  <p className="mt-3 text-sm text-slate-400">No AI actions yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Open a project and use ⌘K to start replanning.</p>
                </div>
              )}
              <div className="space-y-1">
                {recentActions.map((a) => (
                  <Link key={a.id} href={`/projects/${a.project.id}`}>
                    <div className="group flex items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs">
                        🤖
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-300 group-hover:text-white">
                          {actionTypeLabel[a.type] ?? a.type}
                        </p>
                        <p className="truncate text-xs text-slate-500">{a.project.name}</p>
                        <p className="mt-0.5 truncate text-xs italic text-slate-600">{a.reasoning}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-600">
                        {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>

      </main>
    </>
  );
}
