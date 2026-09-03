import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeValue: string;
  setActiveValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}> = ({ defaultValue, children, className = '' }) => {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className={`flex flex-col gap-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex border-b border-border gap-1.5 p-1 bg-secondary/30 rounded-xl max-w-fit ${className}`}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeValue === value;

  return (
    <button
      onClick={() => context.setActiveValue(value)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 uppercase tracking-wider select-none ${
        isActive
          ? 'bg-primary text-primary-foreground shadow-premium font-bold'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeValue !== value) return null;

  return <div className={`animate-enter ${className}`}>{children}</div>;
};

export default Tabs;
