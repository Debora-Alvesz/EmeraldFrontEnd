import React from "react";

export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-4 sm:items-center"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

export function SheetContent({ children, className = "", ...props }) {
  return (
    <div
      className={`w-full rounded-3xl border border-border bg-card text-card-foreground shadow-xl ${className}`.trim()}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ children, className = "", ...props }) {
  return (
    <div className={`space-y-2 border-b border-border p-6 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function SheetTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`text-lg font-semibold ${className}`.trim()} {...props}>
      {children}
    </h2>
  );
}

export function SheetDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}
