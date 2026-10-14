import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeRisk } from "@/lib/ai/risk";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function RiskPage() {
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
    include: { tasks: true, risk: true },
    orderBy: { createdAt: "desc" },
  });

  const levelColor: Record<string, { badge: string; bar: string; glow: string }> = {
    high:   { badge: "border-red-500/30 bg-red-500/10 text-red-300",     bar: "#ef4444", glow: "shadow-red-500/20" },
    medium: { badge: "border-amber-400/30 bg-amber-400/10 text-amber-300", bar: "#f59e0b", glow: "shadow-amber-500/20" },
    low:    { badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300", bar: "#10b981", glow: "shadow-emerald-500/20" },
  };

  const high   = withRisk.filter((p) => p.risk?.level === "high").length;
  const medium = withRisk.filter((p) => p.risk?.level === "medium").length;
  const low    = withRisk.filter((p) => p.risk?.level === "low").length;
  const avgScore = withRisk.length
    ? Math.round(withRisk.reduce((s, p) => s + (p.risk?.score ?? 0), 0) / withRisk.length)
    : 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Risk</p>
          <h1 className="mt-2 text-4xl font-bold text-white">Project Health</h1>
          <p className="mt-2 text-slate-400">Deterministic risk scores computed from overdue tasks, blockers, and deadline proximity.</p>
        </div>

        {/* Summary KPIs */}
        <div className="mb-10 grid gap-5 sm:grid-cols-4">
          {[
            { label: "Avg Risk Score", value: avgScore, color: avgScore >= 60 ? "text-red-300" : avgScore >= 30 ? "text-amber-300" : "text-emerald-300" },
            { label: "High Risk",      value: high,     color: "text-red-300" },
            { label: "Medium Risk",    value: medium,   color: "text-amber-300" },
            { label: "Low Risk",       value: low,      color: "text-emerald-300" },
          ].map((c) => (
            <div key={c.label} className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-widest text-slate-400">{c.label}</p>
              <p className={`mt-3 text-4xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Per-project risk cards */}
        <div className="space-y-5">
          {withRisk.map((p) => {
            const risk    = p.risk;
            const level   = risk?.level ?? "low";
            const score   = risk?.score ?? 0;
            const factors = (risk?.factors ?? []) as { label: string; weight: number }[];
            const tc      = levelColor[level];
            const openT   = p.tasks.filter((t) => t.status !== "done").length;
            const overdue = p.tasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== "done").length;

            return (
              <div key={p.id} className="rounded-3xl border border-white/10 bg-slate-900/50 p-7 backdrop-blur-xl">
                {/* Card header */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Link href={`/projects/${p.id}`} className="text-xl font-bold text-white hover:text-cyan-300 transition">
                      {p.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{p.tasks.length} tasks</span>
                      <span>·</span>
                      <span>{openT} open</span>
                      {overdue > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-red-400">⚠ {overdue} overdue</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold shadow-lg ${tc.badge} ${tc.glow}`}>
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-current" />
                    Risk {score} · <span className="capitalize">{level}</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mb-5 h-2.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: tc.bar }}
                  />
                </div>

                {/* Risk factors */}
                {factors.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contributing Factors</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {factors.map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm">
                          <span className="text-slate-300">{f.label}</span>
                          {f.weight > 0 && (
                            <span className="ml-3 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">+{f.weight}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zero risk */}
                {factors.length === 1 && factors[0].weight === 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-300">
                    <span>✓</span> Project is on track — no risk factors detected.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {withRisk.length === 0 && (
          <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center">
            <p className="text-slate-400">No projects to analyse yet.</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-cyan-400 underline">Back to dashboard</Link>
          </div>
        )}
      </main>
    </>
  );
}
