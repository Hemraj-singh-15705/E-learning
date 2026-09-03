import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950 border-emerald-500 text-emerald-100',
            error: 'bg-rose-950 border-rose-500 text-rose-100',
            info: 'bg-indigo-950 border-indigo-500 text-indigo-100',
            warning: 'bg-amber-950 border-amber-500 text-amber-100'
          };

          const icons = {
            success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />,
            info: <Info className="h-5 w-5 text-indigo-400 shrink-0" />,
            warning: <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
          };

          return (
            <div
              key={toast.id}
              className={`flex items-start justify-between gap-3 p-4 rounded-xl border pointer-events-auto animate-enter ${typeStyles[toast.type]} shadow-premium`}
            >
              <div className="flex gap-2.5">
                {icons[toast.type]}
                <p className="text-sm font-medium leading-5">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
