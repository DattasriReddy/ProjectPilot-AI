import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    include: { tasks: true, risk: true },
    orderBy: { createdAt: "desc" },
  });

  const totalTasks = projects.reduce((n, p) => n + p.tasks.length, 0);
  const doneTasks  = projects.reduce((n, p) => n + p.tasks.filter((t) => t.status === "done").length, 0);
  const openTasks  = totalTasks - doneTasks;

  // Task distribution by status across all projects
  const statusCounts = {
    todo:        projects.reduce((n, p) => n + p.tasks.filter((t) => t.status === "todo").length, 0),
    in_progress: projects.reduce((n, p) => n + p.tasks.filter((t) => t.status === "in_progress").length, 0),
    review:      projects.reduce((n, p) => n + p.tasks.filter((t) => t.status === "review").length, 0),
    done:        doneTasks,
  };

  // Priority distribution
  const priorityCounts = {
    high:   projects.reduce((n, p) => n + p.tasks.filter((t) => t.priority === "high").length, 0),
    medium: projects.reduce((n, p) => n + p.tasks.filter((t) => t.priority === "medium").length, 0),
    low:    projects.reduce((n, p) => n + p.tasks.filter((t) => t.priority === "low").length, 0),
  };

  // Per-project completion data for bar chart
  const projectBars = projects.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 18) + "…" : p.name,
    pct: p.tasks.length ? Math.round((p.tasks.filter((t) => t.status === "done").length / p.tasks.length) * 100) : 0,
    total: p.tasks.length,
    risk: p.risk?.level ?? "low",
  }));

  const riskColor: Record<string, string> = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

  // Donut helpers
  function donutSegments(data: { label: string; value: number; color: string }[]) {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let offset = 0;
    const r = 56; const circ = 2 * Math.PI * r;
    return data.map((d) => {
      const pct = d.value / total;
      const dash = pct * circ;
      const seg = { ...d, dash, gap: circ - dash, offset: offset * circ };
      offset += pct;
      return seg;
    });
  }

  const statusData = [
    { label: "To do",       value: statusCounts.todo,        color: "#64748b" },
    { label: "In progress", value: statusCounts.in_progress, color: "#38bdf8" },
    { label: "Review",      value: statusCounts.review,      color: "#fbbf24" },
    { label: "Done",        value: statusCounts.done,        color: "#34d399" },
  ];
  const priorityData = [
    { label: "High",   value: priorityCounts.high,   color: "#f87171" },
    { label: "Medium", value: priorityCounts.medium, color: "#fbbf24" },
    { label: "Low",    value: priorityCounts.low,    color: "#34d399" },
  ];

  const statusSegs   = donutSegments(statusData);
  const prioritySegs = donutSegments(priorityData);

  const r = 56; const circ = 2 * Math.PI * r;
  const completionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Analytics</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Project Insights</h1>
          <p className="mt-2 text-slate-400">Live metrics across all your projects.</p>
        </div>

        {/* KPI cards */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Projects",   value: projects.length,  color: "text-cyan-300" },
            { label: "Total Tasks",      value: totalTasks,       color: "text-white" },
            { label: "Completed Tasks",  value: doneTasks,        color: "text-emerald-300" },
            { label: "Completion Rate",  value: `${completionPct}%`, color: "text-cyan-300" },
          ].map((c) => (
            <div key={c.label} className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-widest text-slate-400">{c.label}</p>
              <p className={`mt-3 text-4xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mb-10 grid gap-6 lg:grid-cols-3">

          {/* Status donut */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold text-white">Task Status Distribution</h3>
            <svg viewBox="0 0 140 140" className="mx-auto w-40">
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              {statusSegs.map((s, i) => (
                <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset + circ * 0.25}
                  transform="rotate(-90 70 70)"
                />
              ))}
              <text x="70" y="66" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{completionPct}%</text>
              <text x="70" y="82" textAnchor="middle" fill="#94a3b8" fontSize="9">done</text>
            </svg>
            <div className="mt-4 space-y-2">
              {statusData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-400">{d.label}</span>
                  </div>
                  <span className="font-semibold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority donut */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold text-white">Priority Distribution</h3>
            <svg viewBox="0 0 140 140" className="mx-auto w-40">
              <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
              {prioritySegs.map((s, i) => (
                <circle key={i} cx="70" cy="70" r={r} fill="none" stroke={s.color} strokeWidth="16"
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset + circ * 0.25}
                  transform="rotate(-90 70 70)"
                />
              ))}
              <text x="70" y="66" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{totalTasks}</text>
              <text x="70" y="82" textAnchor="middle" fill="#94a3b8" fontSize="9">tasks</text>
            </svg>
            <div className="mt-4 space-y-2">
              {priorityData.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-400">{d.label}</span>
                  </div>
                  <span className="font-semibold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Open vs Done */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-sm font-semibold text-white">Open vs Completed</h3>
            <div className="flex items-end justify-center gap-8 pt-4">
              {[{ label: "Open", value: openTasks, color: "#38bdf8", max: totalTasks },
                { label: "Done", value: doneTasks, color: "#34d399", max: totalTasks }].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-2">
                  <span className="text-2xl font-bold text-white">{b.value}</span>
                  <div className="relative h-32 w-12 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="absolute bottom-0 w-full rounded-full transition-all duration-700"
                      style={{ height: `${totalTasks ? (b.value / totalTasks) * 100 : 0}%`, background: b.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-project bar chart */}
        {projectBars.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
            <h3 className="mb-6 text-sm font-semibold text-white">Project Completion</h3>
            <div className="space-y-4">
              {projectBars.map((p, i) => (
                <div key={i}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">{p.total} tasks</span>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: riskColor[p.risk] }} />
                      <span className="font-semibold text-white">{p.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p.pct}%`, background: `linear-gradient(90deg, #22d3ee, #3b82f6)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 py-20 text-center">
            <p className="text-slate-400">No project data yet.</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-cyan-400 underline">Back to dashboard</Link>
          </div>
        )}
      </main>
    </>
  );
}
