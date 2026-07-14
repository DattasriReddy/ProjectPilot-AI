import React from "react";

interface DatePickerProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export default function DatePicker({
  label,
  error,
  helperText,
  className = "",
  id,
  required,
  disabled,
  ...props
}: DatePickerProps) {
  const inputId =
    id ?? `date-${label?.toLowerCase().replace(/\s+/g, "-") ?? "field"}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
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

      <input
        id={inputId}
        type="date"
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
            ? `${inputId}-helper`
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
          id={`${inputId}-error`}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-helper`}
          className="mt-2 text-sm text-slate-500"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}