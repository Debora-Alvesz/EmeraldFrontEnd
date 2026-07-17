import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`rounded-3xl border border-border bg-card text-card-foreground shadow-sm ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`text-lg font-semibold ${className}`.trim()} {...props}>
      {children}
    </h3>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
