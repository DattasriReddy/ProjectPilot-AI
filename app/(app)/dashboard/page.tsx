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
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      tasks: true,
      risk: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  for (const p of projects) {
    await computeRisk(p.id);
  }

  const withRisk = await prisma.project.findMany({
    where: {
      id: {
        in: projects.map((p) => p.id),
      },
    },
    include: {
      tasks: true,
      risk: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const openTasks = withRisk.reduce(
    (n, p) => n + p.tasks.filter((t) => t.status !== "done").length,
    0
  );

  const atRisk = withRisk.filter(
    (p) => p.risk && p.risk.level !== "low"
  ).length;

  const cards = [
    {
      label: "Projects",
      value: withRisk.length,
    },
    {
      label: "Open Tasks",
      value: openTasks,
    },
    {
      label: "Projects At Risk",
      value: atRisk,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-8 py-10">

      {/* Header */}

      <section className="mb-12">

        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
          ProjectPilot
        </p>

        <h1 className="mt-3 text-5xl font-bold text-white">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent">
            {user.name}
          </span>
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          Here's the current state of your projects. Stay ahead of deadlines,
          blockers and risks with AI-assisted planning.
        </p>

      </section>

      {/* Stats */}

      <section className="grid gap-6 md:grid-cols-3">

        {cards.map((c) => (

          <div
            key={c.label}
            className="rounded-3xl border border-white/10 bg-slate-900/50 p-7 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-[0_0_35px_rgba(34,211,238,.15)]"
          >

            <p className="text-sm uppercase tracking-widest text-slate-400">
              {c.label}
            </p>

            <h2 className="mt-4 text-5xl font-bold text-white">
              {c.value}
            </h2>

          </div>

        ))}

      </section>

      {/* Projects */}

      <section className="mt-14">

        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Active Projects
          </h2>

          <p className="mt-1 text-slate-400">
            Select a workspace to continue.
          </p>

        </div>

        <div className="space-y-5">

          {withRisk.map((p) => {

            const done = p.tasks.filter(
              (t) => t.status === "done"
            ).length;

            const pct = p.tasks.length
              ? Math.round((done / p.tasks.length) * 100)
              : 0;

            return (

              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group block rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,.15)]"
              >

                <div className="flex items-center justify-between">

                  <div className="flex-1">

                    <h3 className="text-2xl font-semibold text-white transition group-hover:text-cyan-300">
                      {p.name}
                    </h3>

                    <p className="mt-2 text-slate-400">
                      {done} of {p.tasks.length} tasks completed
                    </p>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{
                          width: `${pct}%`,
                        }}
                      />

                    </div>

                    <p className="mt-2 text-xs text-cyan-300">
                      {pct}% Complete
                    </p>

                  </div>

                  <div className="ml-8 flex items-center gap-5">

                    <RiskBadge
                      risk={
                        p.risk
                          ? {
                              score: p.risk.score,
                              level: p.risk.level,
                              factors: p.risk.factors as any,
                            }
                          : null
                      }
                    />

                    <div className="text-2xl text-slate-500 transition-all duration-300 group-hover:translate-x-2 group-hover:text-cyan-300">
                      →
                    </div>

                  </div>

                </div>

              </Link>

            );
          })}

          {!withRisk.length && (

            <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center backdrop-blur-xl">

              <p className="text-slate-300">
                No projects yet.
              </p>

              <p className="mt-3 text-slate-500">
                Run{" "}
                <code className="rounded bg-slate-800 px-2 py-1">
                  npm run db:seed
                </code>{" "}
                to load the demo project.
              </p>

            </div>

          )}

        </div>

      </section>

    </main>
  );
}