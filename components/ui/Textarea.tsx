import React from "react";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export default function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  required,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId =
    id ?? `textarea-${label?.toLowerCase().replace(/\s+/g, "-") ?? "field"}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${textareaId}-error`
            : helperText
            ? `${textareaId}-helper`
            : undefined
        }
        className={`
          w-full
          rounded-xl
          border
          bg-white
          px-4
          py-2.5
          text-sm
          text-slate-900
          shadow-sm
          transition-all
          duration-200
          resize-y
          placeholder:text-slate-400
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500
          ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 focus:border-indigo-500"
          }
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-500
          ${className}
        `}
        {...props}
      />

      {error ? (
        <p
          id={`${textareaId}-error`}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${textareaId}-helper`}
          className="mt-2 text-sm text-slate-500"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}