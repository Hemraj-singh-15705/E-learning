import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const Dropdown: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownTrigger: React.FC<{ children: React.ReactElement<any> }> = ({ children }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within Dropdown');
  
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      if (children.props && typeof children.props.onClick === 'function') {
        children.props.onClick(e);
      }
      context.setIsOpen(!context.isOpen);
    }
  });
};

export const DropdownMenu: React.FC<{ children: React.ReactNode; align?: 'left' | 'right'; className?: string }> = ({
  children,
  align = 'right',
  className = ''
}) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenu must be used within Dropdown');
  if (!context.isOpen) return null;

  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right'
  };

  return (
    <div
      className={`absolute mt-2 w-56 rounded-xl border border-border bg-card p-1 shadow-premium z-50 animate-enter focus:outline-none ${alignments[align]} ${className}`}
    >
      {children}
    </div>
  );
};

export const DropdownItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownItem must be used within Dropdown');

  const handleClick = () => {
    if (onClick) onClick();
    context.setIsOpen(false);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all text-left ${className}`}
    >
      {children}
    </button>
  );
};

export default Dropdown;
