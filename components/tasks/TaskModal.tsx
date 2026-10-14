"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { TASK_STATUSES, PRIORITIES, STATUS_LABELS } from "@/lib/constants";

type Member = { id: string; name: string };
type Comment = { id: string; body: string; authorName: string; createdAt: string };

interface Props {
  task?: Task | null;          // null = create mode
  projectId: string;
  members: Member[];
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskModal({ task, projectId, members, onClose, onSave, onDelete }: Props) {
  const isCreate = !task;

  const [title,      setTitle]      = useState(task?.title ?? "");
  const [detail,     setDetail]     = useState(task?.detail ?? "");
  const [status,     setStatus]     = useState(task?.status ?? "todo");
  const [priority,   setPriority]   = useState(task?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? "");
  const [dueDate,    setDueDate]    = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [commentBody, setCommentBody] = useState("");
  const [comments,   setComments]   = useState<Comment[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [tab,        setTab]        = useState<"details" | "comments">("details");

  // Load comments when editing
  useEffect(() => {
    if (!task) return;
    api.getComments(task.id)
      .then((r) => setComments(r.comments))
      .catch(() => {});
  }, [task]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isCreate) {
        const r = await api.createTask({
          projectId,
          title: title.trim(),
          detail: detail.trim() || undefined,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || null,
        });
        onSave(r.task);
      } else {
        const r = await api.patchTask(task!.id, {
          title: title.trim(),
          detail: detail.trim() || undefined,
          status,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        });
        onSave(r.task);
      }
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await api.deleteTask(task.id);
      onDelete(task.id);
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleComment() {
    if (!task || !commentBody.trim()) return;
    try {
      const r = await api.addComment(task.id, commentBody.trim());
      setComments((prev) => [...prev, r.comment]);
      setCommentBody("");
    } catch (e: any) {
      alert(e.message);
    }
  }

  const priorityColor: Record<string, string> = {
    high:   "text-red-300   bg-red-500/15   border-red-500/30",
    medium: "text-amber-300 bg-amber-400/15 border-amber-400/30",
    low:    "text-emerald-300 bg-emerald-400/15 border-emerald-400/30",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-7 py-5">
          <h2 className="text-lg font-bold text-white">
            {isCreate ? "Create Task" : "Edit Task"}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreate && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        {/* Tab bar — only show for existing tasks */}
        {!isCreate && (
          <div className="flex border-b border-white/8 px-7">
            {(["details", "comments"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium capitalize transition ${
                  tab === t
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t}
                {t === "comments" && comments.length > 0 && (
                  <span className="ml-2 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-300">
                    {comments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-[65vh] overflow-y-auto px-7 py-6 pp-scroll">
          {/* DETAILS TAB */}
          {(isCreate || tab === "details") && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Title *
                </label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="What needs to be done?"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Detail */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Add more context…"
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              {/* Status + Priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition ${
                          priority === p
                            ? priorityColor[p]
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assignee + Due Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMMENTS TAB */}
          {!isCreate && tab === "comments" && (
            <div className="space-y-4">
              {comments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
                  No comments yet. Be the first to add context.
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
                      {c.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-white">{c.authorName}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{c.body}</p>
                </div>
              ))}

              {/* Comment input */}
              <div className="flex gap-3">
                <textarea
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentBody.trim()}
                  className="self-end rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-40"
                >
                  Post
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/8 px-7 py-5">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
          >
            Cancel
          </button>
          {(isCreate || tab === "details") && (
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : isCreate ? "Create Task" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
