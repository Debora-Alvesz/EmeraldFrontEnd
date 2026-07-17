import React, { createContext, useContext, useState } from "react";

const SelectContext = createContext({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "", ...props }) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      className={`flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-left ${className}`.trim()}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder = "" }) {
  const { value } = useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}

export function SelectContent({ children, className = "", ...props }) {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={`absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = "", ...props }) {
  const { onValueChange, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${className}`.trim()}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
