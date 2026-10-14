import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: {
      tasks: {
        where: { dueDate: { not: null } },
        orderBy: { dueDate: "asc" },
        include: { assignee: true },
      },
    },
  });

  // Collect all events (tasks with due dates + project deadlines)
  type CalEvent = { date: Date; label: string; type: "task" | "deadline"; priority: string; projectId: string; projectName: string; };
  const events: CalEvent[] = [];

  for (const p of projects) {
    if (p.deadline) {
      events.push({ date: p.deadline, label: `🏁 ${p.name} deadline`, type: "deadline", priority: p.priority, projectId: p.id, projectName: p.name });
    }
    for (const t of p.tasks) {
      if (t.dueDate) {
        events.push({ date: t.dueDate, label: t.title, type: "task", priority: t.priority, projectId: p.id, projectName: p.name });
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = events.filter((e) => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d < today;
});

  const upcoming = events.filter((e) => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d >= today;
});

  // Build a 5-week grid for the current month
  const year  = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0 = Sun
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const d = i - startPad;
    cells.push(d >= 0 && d < lastDay.getDate() ? new Date(year, month, d + 1) : null);
  }

  const eventsByDate = (date: Date) => {
    const key = date.toDateString();
    return events.filter((e) => e.date.toDateString() === key);
  };

  const priorityDot: Record<string, string> = { high: "bg-red-400", medium: "bg-amber-400", low: "bg-emerald-400" };

  const MONTH = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Calendar</p>
          <h1 className="mt-2 text-4xl font-bold text-white">{MONTH}</h1>
          <p className="mt-2 text-slate-400">Task due dates and project deadlines across all workspaces.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Calendar grid */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
            {/* Day headers */}
            <div className="mb-3 grid grid-cols-7 gap-1 text-center">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                <div key={d} className="text-xs font-semibold uppercase tracking-wider text-slate-500">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, i) => {
                if (!date) return <div key={i} />;
                const dayEvents = eventsByDate(date);
                const isToday   = date.toDateString() === now.toDateString();
                const cellDate = new Date(date);
                cellDate.setHours(0, 0, 0, 0);

                const isPast = cellDate < today;
                return (
                  <div
                    key={i}
                    className={`min-h-[64px] rounded-2xl p-2 transition ${
                      isToday  ? "border border-cyan-400/50 bg-cyan-500/10"
                      : isPast ? "opacity-40"
                      : "hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${isToday ? "text-cyan-300" : "text-slate-400"}`}>
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e, j) => (
                        <Link key={j} href={`/projects/${e.projectId}`}>
                          <div className={`flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] leading-tight
                            ${e.type === "deadline" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/10 text-cyan-300"}
                          `}>
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[e.priority]}`} />
                            <span className="truncate">{e.label}</span>
                          </div>
                        </Link>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block px-1 text-[10px] text-slate-500">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar — upcoming + overdue */}
          <div className="space-y-6">
            {overdue.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-300">
                  <span>⚠</span> Overdue ({overdue.length})
                </h3>
                <div className="space-y-2">
                  {overdue.slice(0, 6).map((e, i) => (
                    <Link key={i} href={`/projects/${e.projectId}`}>
                      <div className="rounded-xl border border-red-500/15 bg-red-500/10 p-3 transition hover:bg-red-500/20">
                        <p className="text-sm font-medium text-white">{e.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {e.projectName} · {e.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-semibold text-white">Upcoming ({upcoming.length})</h3>
              {upcoming.length === 0 && (
                <p className="text-sm text-slate-500">Nothing coming up — great shape!</p>
              )}
              <div className="space-y-2">
                {upcoming.slice(0, 10).map((e, i) => {
                  const daysAway = Math.ceil((e.date.getTime() - now.getTime()) / 86_400_000);
                  return (
                    <Link key={i} href={`/projects/${e.projectId}`}>
                      <div className="rounded-xl border border-white/8 bg-white/5 p-3 transition hover:bg-white/10">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white">{e.label}</p>
                          <span className="shrink-0 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                            {daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `${daysAway}d`}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{e.projectName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
