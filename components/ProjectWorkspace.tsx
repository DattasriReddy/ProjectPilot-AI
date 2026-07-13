"use client";

import { useState } from "react";
import type { ProjectFull, Task, Plan, Risk } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";
import { api } from "@/lib/api";
import { Board } from "@/components/board/Board";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { UndoToast } from "@/components/ai/UndoToast";
import { RiskBadge } from "@/components/ai/RiskBadge";

export function ProjectWorkspace({ project }: { project: ProjectFull }) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [risk, setRisk] = useState<Risk>(project.risk);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [lastBatch, setLastBatch] = useState<{ id: string; summary: string } | null>(null);

  async function handleMove(taskId: string, toStatus: TaskStatus) {
    const prev = tasks;

    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId
          ? { ...t, status: toStatus }
          : t
      )
    );

    try {
      await api.patchTask(taskId, { status: toStatus });
    } catch {
      setTasks(prev);
    }
  }

  async function handleApply(plan: Plan) {
    const res = await api.apply(project.id, plan);

    setTasks(res.tasks);
    setRisk(res.risk);

    const touched = new Set<string>(
      (res.actions as any[])
        .map((a) => a.targetId)
        .filter(Boolean)
    );

    setHighlightedIds(touched);

    setLastBatch({
      id: res.batchId,
      summary: plan.summary,
    });

    setTimeout(() => {
      setHighlightedIds(new Set());
    }, 2500);
  }

  async function handleUndo() {
    if (!lastBatch) return;

    const res = await api.undo(project.id, lastBatch.id);

    setTasks(res.tasks);
    setRisk(res.risk);
    setLastBatch(null);
    setHighlightedIds(new Set());
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const pct = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">

      {/* ================= HEADER ================= */}

      <div className="relative z-50 mb-6 overflow-visible rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

          {/* Left Side */}

          <div className="flex-1">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Project
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">

              <h1 className="text-4xl font-bold tracking-tight text-white">
                {project.name}
              </h1>

              <RiskBadge risk={risk} />

            </div>

            {project.description && (
              <p className="mt-3 max-w-3xl text-gray-300">
                {project.description}
              </p>
            )}

            {/* Progress */}

            <div className="mt-6">

              <div className="mb-2 flex items-center justify-between text-sm">

                <span className="text-gray-300">
                  📋 {done} of {tasks.length} tasks completed
                </span>

                <span className="font-semibold text-cyan-300">
                  {pct}%
                </span>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />

              </div>

            </div>

          </div>

          {/* Right Side */}

          <div className="w-full lg:w-[430px]">

            <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/50 p-5">

              <div className="mb-3">

                <h2 className="text-lg font-semibold text-white">
                  🧠 AI Project Copilot
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Describe a project situation and let AI reorganize your board.
                </p>

              </div>

              <CommandBar
                projectId={project.id}
                onApply={handleApply}
              />

            </div>

          </div>

        </div>

      </div>

      {/* ================= BOARD ================= */}

      <Board
        tasks={tasks}
        highlightedIds={highlightedIds}
        onMove={handleMove}
      />

      {/* ================= UNDO ================= */}

      {lastBatch && (
        <UndoToast
          summary={lastBatch.summary}
          onUndo={handleUndo}
          onDismiss={() => setLastBatch(null)}
        />
      )}

    </div>
  );
}