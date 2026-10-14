"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { ReasoningPanel } from "@/components/ai/ReasoningPanel";

const EXAMPLES = [
  "We're 3 days behind — cut scope and reprioritise",
  "Break the launch into tasks and set due dates",
  "Move everything blocked into review and flag the risks",
];

// Cmd-K surface: one place to talk to the project. Propose -> review -> apply.
export function CommandBar({
  projectId,
  onApply,
}: {
  projectId: string;
  onApply: (plan: Plan) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setPlan(null);
      setError(null);
      setCommand("");
    }
  }, [open]);

  async function propose() {
    if (!command.trim()) return;

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const { plan } = await api.replan(projectId, command.trim());
      setPlan(plan);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!plan) return;

    setApplying(true);

    try {
      await onApply(plan);
      setOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-500 hover:bg-slate-800"
      >
        <span>Ask the AI to replan…</span>

        <kbd className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => !applying && setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && propose()}
                placeholder="Tell the project what changed…"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />

              <button
                onClick={propose}
                disabled={loading}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {loading ? "Thinking…" : "Plan"}
              </button>
            </div>

            {!plan && !loading && (
              <div className="mt-4 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setCommand(ex)}
                    className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-[12px] text-slate-300 transition hover:bg-slate-700"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

            {plan && (
              <div className="mt-4">
                <ReasoningPanel
                  plan={plan}
                  applying={applying}
                  onApply={apply}
                  onDiscard={() => setPlan(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}