import React from 'react';

export function Button({ children, className = '', variant = 'default', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-colors';
  const styles = variant === 'outline'
    ? 'border-border bg-background text-foreground hover:bg-muted'
    : 'border-transparent bg-primary text-primary-foreground hover:opacity-90';

  return (
    <button className={`${base} ${styles} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
