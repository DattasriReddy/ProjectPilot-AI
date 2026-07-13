"use client";
import type { Plan } from "@/lib/types";

const VERB: Record<string, string> = {
  create: "Create",
  update: "Update",
  move: "Move",
  flag: "Flag risk",
};

// Renders the proposed plan. Each row shows WHAT changes and WHY — the
// explainability that turns "the AI did something" into "the AI did X because Y".
export function ReasoningPanel({
  plan,
  applying,
  onApply,
  onDiscard,
}: {
  plan: Plan;
  applying: boolean;
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h2 className="mb-2 text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
  AI Execution Plan
</h2>
      <p className="mb-4 text-base font-semibold text-white">
  {plan.summary}
</p>
      <ul className="mb-4 max-h-64 space-y-2 overflow-y-auto pp-scroll">
        {plan.mutations.map((m, i) => (
          <li
            key={i}
            className="
  rounded-2xl
  border
  border-white/10
  bg-white/5
  backdrop-blur-xl
  p-4
  text-sm
  transition-all
  duration-300
  hover:border-cyan-400/40
  hover:bg-white/10
"
          >
            <div className="mb-0.5 flex items-center gap-2">
              <span
  className="
  rounded-full
  bg-gradient-to-r
  from-cyan-400
  via-blue-500
  to-purple-500
  px-3
  py-1
  text-xs
  font-semibold
  text-white
"
>
                {VERB[m.action]}
              </span>
              <span className="font-semibold text-white">
                {m.title ?? m.note ?? m.toStatus ?? m.taskId}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
  {m.reasoning}
</p>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          onClick={onApply}
          disabled={applying}
          className="
rounded-xl
bg-gradient-to-r
from-cyan-500
via-blue-500
to-purple-500
px-6
py-3
text-sm
font-semibold
text-white
shadow-lg
transition-all
duration-300
hover:scale-105
hover:shadow-cyan-500/40
disabled:opacity-50
"
        >
          {applying ? "Applying…" : `Apply ${plan.mutations.length} change(s)`}
        </button>
        <button
          onClick={onDiscard}
          disabled={applying}
          className="
rounded-xl
border
border-white/10
bg-white/5
px-6
py-3
text-sm
font-medium
text-slate-300
backdrop-blur-xl
transition-all
duration-300
hover:bg-white/10
hover:border-purple-400/40
"
        >
          Discard
        </button>
      </div>
    </div>
  );
}