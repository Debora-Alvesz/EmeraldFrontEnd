import React from "react";

export function Badge({ children, className = "", variant = "default", ...props }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  const styles =
    variant === "outline"
      ? "border border-border bg-background text-foreground"
      : "bg-muted text-muted-foreground";

  return (
    <span className={`${base} ${styles} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
