import React from "react";

export function Dialog({ open, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      {children}
    </div>
  );
}

export function DialogContent({ children, className = "", ...props }) {
  return (
    <div className={`w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`space-y-2 border-b border-border px-6 py-5 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`text-xl font-semibold ${className}`.trim()} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`.trim()} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className = "", ...props }) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
