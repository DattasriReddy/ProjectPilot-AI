import React from "react";

interface Option {
  label: string;
  value: string;
}

interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
}

export default function Select({
  label,
  options,
  error,
  helperText,
  placeholder = "Select an option",
  className = "",
  id,
  required,
  disabled,
  ...props
}: SelectProps) {
  const selectId =
    id ?? `select-${label?.toLowerCase().replace(/\s+/g, "-") ?? "field"}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
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

      <select
        id={selectId}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${selectId}-error`
            : helperText
            ? `${selectId}-helper`
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
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p
          id={`${selectId}-error`}
          className="mt-2 text-sm text-red-600"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${selectId}-helper`}
          className="mt-2 text-sm text-slate-500"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}