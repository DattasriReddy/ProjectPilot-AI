"use client";

export function UndoToast({
  summary,
  onUndo,
  onDismiss,
}: {
  summary: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="
        fixed
        bottom-6
        left-1/2
        z-50
        flex
        -translate-x-1/2
        items-center
        gap-4

        rounded-2xl

        border
        border-white/10

        bg-[#0F172A]/80

        px-6
        py-4

        text-white

        backdrop-blur-2xl

        shadow-[0_0_40px_rgba(59,130,246,0.25)]

        transition-all
        duration-300
      "
    >
      {/* Success Icon */}
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center

          rounded-full

          bg-gradient-to-r
          from-cyan-400
          via-blue-500
          to-purple-500

          text-lg
          font-bold
        "
      >
        ✓
      </div>

      {/* Message */}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">
          AI Plan Applied
        </span>

        <span className="max-w-md truncate text-sm text-slate-300">
          {summary}
        </span>
      </div>

      {/* Undo Button */}
      <button
        onClick={onUndo}
        className="
          ml-4

          rounded-xl

          bg-gradient-to-r
          from-cyan-500
          via-blue-500
          to-purple-500

          px-4
          py-2

          text-sm
          font-semibold
          text-white

          transition-all
          duration-300

          hover:scale-105
          hover:shadow-lg
          hover:shadow-cyan-500/40
        "
      >
        Undo
      </button>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        className="
          rounded-full

          p-2

          text-slate-400

          transition-all
          duration-300

          hover:bg-white/10
          hover:text-white
        "
      >
        ✕
      </button>
    </div>
  );
}