"use client";

import type { Risk } from "@/lib/types";

const TONE: Record<string, string> = {
  high: `
    border border-red-500/30
    bg-red-500/15
    text-red-300
    shadow-lg shadow-red-500/20
  `,

  medium: `
    border border-amber-400/30
    bg-amber-400/15
    text-amber-300
    shadow-lg shadow-amber-400/20
  `,

  low: `
    border border-emerald-400/30
    bg-emerald-400/15
    text-emerald-300
    shadow-lg shadow-emerald-400/20
  `,
};

export function RiskBadge({ risk }: { risk: Risk }) {
  if (!risk) return null;

  return (
    <div
      className={`
        group
        relative
        z-50
        inline-flex
        items-center
        gap-2
        rounded-full
        px-4
        py-2
        text-xs
        font-semibold
        backdrop-blur-xl
        transition-all
        duration-300
        hover:scale-105
        ${TONE[risk.level]}
      `}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />

      <span>
        Risk {risk.score} •{" "}
        <span className="capitalize">{risk.level}</span>
      </span>

      <div
        className="
          pointer-events-none
          absolute
          left-0
          top-full
          z-[9999]
          mt-3
          hidden
          w-72
          rounded-2xl
          border
          border-white/10
          bg-[#111827]/95
          p-4
          text-sm
          text-slate-300
          backdrop-blur-2xl
          shadow-2xl
          group-hover:block
          group-hover:animate-in
        "
      >
        <h3 className="mb-3 text-sm font-bold text-white">
          Risk Factors
        </h3>

        <div className="space-y-2">
          {risk.factors.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
            >
              <span>{f.label}</span>

              <span className="font-semibold text-cyan-300">
                +{f.weight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}