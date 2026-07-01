import React from 'react';

export const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`w-full rounded-xl border border-border bg-background px-3 py-2 outline-none ring-0 ${className}`.trim()} {...props} />;
});
