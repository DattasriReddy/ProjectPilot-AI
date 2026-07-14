import React from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-md
        ${className}
      `}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-slate-900">
                {title}
              </h3>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="ml-4 flex items-center">
              {actions}
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {children}
      </div>
    </div>
  );
}