import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'destructive';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = ''
}) => {
  const variants = {
    info: 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400',
    success: 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-950/20 border-amber-500/20 text-amber-400',
    destructive: 'bg-rose-950/20 border-rose-500/20 text-rose-400'
  };

  const icons = {
    info: <Info className="h-5 w-5 text-indigo-400 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
  };

  return (
    <div className={`flex gap-3 p-4 rounded-xl border animate-enter ${variants[variant]} ${className}`}>
      {icons[variant]}
      <div className="flex flex-col gap-0.5">
        {title && <span className="font-semibold text-sm leading-5">{title}</span>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
