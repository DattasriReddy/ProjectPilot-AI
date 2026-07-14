import React from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "ghost";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: `
    bg-indigo-600
    text-white
    hover:bg-indigo-700
    focus:ring-indigo-500
    shadow-sm
  `,

  secondary: `
    bg-slate-100
    text-slate-900
    hover:bg-slate-200
    focus:ring-slate-400
  `,

  outline: `
    border
    border-slate-300
    bg-white
    text-slate-700
    hover:bg-slate-50
    focus:ring-slate-400
  `,

  danger: `
    bg-red-600
    text-white
    hover:bg-red-700
    focus:ring-red-500
  `,

  ghost: `
    bg-transparent
    text-slate-700
    hover:bg-slate-100
    focus:ring-slate-400
  `,
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2

        rounded-xl
        px-4
        py-2.5

        text-sm
        font-medium

        transition-all
        duration-200

        focus:outline-none
        focus:ring-2
        focus:ring-offset-2

        disabled:opacity-60
        disabled:cursor-not-allowed

        active:scale-[0.98]

        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.25"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}

      {children}
    </button>
  );
}