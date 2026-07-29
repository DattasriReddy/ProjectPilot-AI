"use client";

import { useState } from "react";
import type { ProjectFull, Task, Plan, Risk } from "@/lib/types";
import type { TaskStatus } from "@/lib/constants";
import { api } from "@/lib/api";
import { Board } from "@/components/board/Board";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { UndoToast } from "@/components/ai/UndoToast";
import { RiskBadge } from "@/components/ai/RiskBadge";
import { TaskModal } from "@/components/tasks/TaskModal";
import { EditProjectModal } from "@/components/projects/EditProjectModal";

type Member = { id: string; name: string };

export function ProjectWorkspace({
  project,
  members,
}: {
  project: ProjectFull;
  members: Member[];
}) {
  const [tasks,          setTasks]          = useState<Task[]>(project.tasks);
  const [risk,           setRisk]           = useState<Risk>(project.risk);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [lastBatch,      setLastBatch]      = useState<{ id: string; summary: string } | null>(null);

  // Task modal state
  const [taskModalTask,   setTaskModalTask]   = useState<Task | null | undefined>(undefined); // undefined = closed
  const [taskModalStatus, setTaskModalStatus] = useState<TaskStatus>("todo");

  // Edit project modal
  const [editProject, setEditProject] = useState(false);

  // ── Drag and drop ─────────────────────────────────────────────────────────
  async function handleMove(taskId: string, toStatus: TaskStatus) {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => t.id === taskId ? { ...t, status: toStatus } : t));
    try {
      await api.patchTask(taskId, { status: toStatus });
    } catch {
      setTasks(prev);
    }
  }

  // ── AI apply / undo ───────────────────────────────────────────────────────
  async function handleApply(plan: Plan) {
    const res = await api.apply(project.id, plan);
    setTasks(res.tasks);
    setRisk(res.risk);
    const touched = new Set<string>((res.actions as any[]).map((a: any) => a.targetId).filter(Boolean));
    setHighlightedIds(touched);
    setLastBatch({ id: res.batchId, summary: plan.summary });
    setTimeout(() => setHighlightedIds(new Set()), 2500);
  }

  async function handleUndo() {
    if (!lastBatch) return;
    const res = await api.undo(project.id, lastBatch.id);
    setTasks(res.tasks);
    setRisk(res.risk);
    setLastBatch(null);
    setHighlightedIds(new Set());
  }

  // ── Task CRUD callbacks ───────────────────────────────────────────────────
  function openCreate(status: TaskStatus) {
    setTaskModalStatus(status);
    setTaskModalTask(null); // null = create mode
  }

  function openEdit(task: Task) {
    setTaskModalTask(task);
  }

  function handleTaskSaved(saved: Task) {
    setTasks((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      return exists
        ? prev.map((t) => t.id === saved.id ? { ...saved } : t)
        : [...prev, { ...saved, status: taskModalStatus }];
    });
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const done = tasks.filter((t) => t.status === "done").length;
  const pct  = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const deadlineStr = project.deadline
    ? new Date(project.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">

      {/* ─── Project Header ─────────────────────────────────────────────── */}
      <div className="relative z-50 mb-6 overflow-visible rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">

          {/* Left */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Project</p>
              <button
                onClick={() => setEditProject(true)}
                className="rounded-lg px-2 py-1 text-xs text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
              >
                Edit ✏
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-white">{project.name}</h1>
              <RiskBadge risk={risk} />
            </div>

            {project.description && (
              <p className="mt-3 max-w-3xl text-gray-300">{project.description}</p>
            )}

            {/* Meta pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize
                ${project.priority === "high"   ? "border-red-500/30 bg-red-500/10 text-red-300"
                : project.priority === "medium" ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}`}
              >
                {project.priority} priority
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 capitalize">
                {project.status.replace("_", " ")}
              </span>
              {deadlineStr && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                  📅 {deadlineStr}
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-300">📋 {done} of {tasks.length} tasks completed</span>
                <span className="font-semibold text-cyan-300">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right — AI Copilot */}
          <div className="w-full lg:w-[430px]">
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold text-white">🧠 AI Project Copilot</h2>
              <p className="mt-1 text-sm text-gray-400">Describe a situation and let AI reorganize your board.</p>
              <div className="mt-4">
                <CommandBar projectId={project.id} onApply={handleApply} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Kanban Board ───────────────────────────────────────────────── */}
      <Board
        tasks={tasks}
        highlightedIds={highlightedIds}
        onMove={handleMove}
        onTaskClick={openEdit}
        onAddTask={openCreate}
      />

      {/* ─── Undo Toast ─────────────────────────────────────────────────── */}
      {lastBatch && (
        <UndoToast
          summary={lastBatch.summary}
          onUndo={handleUndo}
          onDismiss={() => setLastBatch(null)}
        />
      )}

      {/* ─── Task Modal ─────────────────────────────────────────────────── */}
      {taskModalTask !== undefined && (
        <TaskModal
          task={taskModalTask}
          projectId={project.id}
          members={members}
          onClose={() => setTaskModalTask(undefined)}
          onSave={handleTaskSaved}
          onDelete={handleTaskDeleted}
        />
      )}

      {/* ─── Edit Project Modal ──────────────────────────────────────────── */}
      {editProject && (
        <EditProjectModal
          project={project}
          onClose={() => setEditProject(false)}
        />
      )}
    </div>
  );
}
