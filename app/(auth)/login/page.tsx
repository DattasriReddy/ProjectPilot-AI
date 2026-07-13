"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setLoading(true);
    setError(null);

    try {
      await api.demoLogin();
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">

      {/* Background Glow */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-10 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,.45)]">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-bold text-white shadow-[0_0_35px_rgba(34,211,238,.45)]">
          🚀
        </div>

        <h1 className="mt-8 text-center text-4xl font-bold text-white">
          ProjectPilot AI
        </h1>

        <p className="mt-4 text-center text-slate-400">
          Your intelligent project planning workspace.
        </p>

        <p className="mt-2 text-center text-sm text-slate-500">
          Plan • Prioritize • Replan • Execute
        </p>

        <button
          onClick={enter}
          disabled={loading}
          className="group mt-10 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 px-5 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_35px_rgba(34,211,238,.35)] disabled:opacity-50"
        >
          {loading ? (
            "Launching Workspace..."
          ) : (
            <span className="flex items-center justify-center gap-2">
              ✨ Launch AI Workspace
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          )}
        </button>

        {error && (
          <p className="mt-5 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-10 border-t border-white/10 pt-5 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Crafted By
          </p>

          <p className="mt-3 text-base font-semibold text-white">
            Dattasri Reddy <span className="mx-2 text-cyan-400">✦</span> Gunjan Jangir
          </p>
        </div>

      </div>

    </main>
  );
}