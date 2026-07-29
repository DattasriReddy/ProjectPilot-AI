"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
};

export function EditProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name,        setName]        = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [priority,    setPriority]    = useState(project.priority);
  const [status,      setStatus]      = useState(project.status);
  const [deadline,    setDeadline]    = useState(
    project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : ""
  );
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        deadline: deadline || null,
      });
      onClose();
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteProject(project.id);
      router.push("/dashboard");
    } catch (e: any) {
      alert(e.message);
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Edit Project</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white">✕</button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="done">Done</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/60 [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/8 px-6 py-5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete Project"}
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
