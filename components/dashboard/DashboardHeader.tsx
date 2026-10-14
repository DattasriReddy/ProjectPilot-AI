"use client";

import { useState } from "react";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

export default function DashboardHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="mb-12 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            ProjectPilot
          </p>

          <h1 className="mt-3 text-5xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Manage projects, monitor risks and let AI help plan your work.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-900 transition hover:scale-105 hover:bg-cyan-400"
        >
          + New Project
        </button>
      </section>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}