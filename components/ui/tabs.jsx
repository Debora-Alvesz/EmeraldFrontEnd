import React, { createContext, useContext } from 'react';

const TabsContext = createContext({ value: '', setValue: () => {} });

export function Tabs({ value, onValueChange, children, className = '' }) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, children, className = '' }) {
  const { value: activeValue, setValue } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      className={`${className} ${isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`.trim()}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children }) {
  const { value: activeValue } = useContext(TabsContext);
  return activeValue === value ? <div>{children}</div> : null;
}
