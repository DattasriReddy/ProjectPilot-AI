const PRIORITY: Record<string, string> = {
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

export function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const cls =
    PRIORITY[priority] ??
    `
      border border-white/10
      bg-white/5
      text-slate-300
    `;

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-semibold
        uppercase
        tracking-wide
        backdrop-blur-xl
        transition-all
        duration-300
        hover:scale-105
        ${cls}
      `}
    >
      {priority}
    </span>
  );
}