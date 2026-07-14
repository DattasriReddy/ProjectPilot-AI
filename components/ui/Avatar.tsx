import React, { useState } from "react";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function Avatar({
  src,
  alt = "Avatar",
  initials,
  fallback = "?",
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const displayText = initials || fallback;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        inline-flex
        items-center
        justify-center
        overflow-hidden
        rounded-full
        bg-indigo-100
        text-indigo-700
        font-semibold
        select-none
        shadow-sm
        border
        border-slate-200
        ${className}
      `}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{displayText}</span>
      )}
    </div>
  );
}