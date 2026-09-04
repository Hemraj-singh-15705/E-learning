import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Top Floating Toast container */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 max-w-lg w-[92vw] pointer-events-none transition-all">
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.2)]',
            error: 'bg-rose-950/90 border-rose-500/40 text-rose-100 shadow-[0_10px_30px_rgba(244,63,94,0.25)]',
            info: 'bg-indigo-950/90 border-indigo-500/40 text-indigo-100 shadow-[0_10px_30px_rgba(99,102,241,0.2)]',
            warning: 'bg-amber-950/90 border-amber-500/40 text-amber-100 shadow-[0_10px_30px_rgba(245,158,11,0.2)]'
          };

          const icons = {
            success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
            error: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />,
            info: <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          };

          return (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl pointer-events-auto transition-all animate-bounce-in w-full ${typeStyles[toast.type]}`}
              style={{
                animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {icons[toast.type]}
                <p className="text-sm font-medium tracking-wide leading-snug m-0 text-left select-none break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all shrink-0 border-0 bg-transparent cursor-pointer flex items-center justify-center"
                title="Dismiss"
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

export default ToastProvider;
