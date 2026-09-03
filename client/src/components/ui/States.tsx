import React from 'react';
import { Loader2, Inbox, AlertOctagon } from 'lucide-react';
import Button from './Button';

// 1. Loading State
export const LoadingState: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading workspace data...',
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center gap-3 animate-enter ${className}`}>
    <Loader2 className="h-8 w-8 text-primary animate-spin" />
    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {message}
    </span>
  </div>
);

// 2. Empty State
export const EmptyState: React.FC<{
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  title = 'No Records Found',
  description,
  actionLabel,
  onAction,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-2xl bg-card/20 max-w-md mx-auto gap-4 animate-enter ${className}`}>
    <div className="p-3 bg-secondary rounded-xl text-muted-foreground border border-border">
      <Inbox className="h-6 w-6" />
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="font-display font-bold text-base text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed px-4">{description}</p>
    </div>
    {actionLabel && onAction && (
      <Button size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

// 3. Error State
export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  message = 'An unexpected connection error occurred.',
  onRetry,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center border border-rose-500/10 rounded-2xl bg-rose-950/5 max-w-md mx-auto gap-4 animate-enter ${className}`}>
    <div className="p-3 bg-rose-950/20 text-rose-400 border border-rose-500/20 rounded-xl">
      <AlertOctagon className="h-6 w-6" />
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="font-display font-bold text-base text-rose-400">Failed to Load Content</h3>
      <p className="text-xs text-muted-foreground leading-relaxed px-4">{message}</p>
    </div>
    {onRetry && (
      <Button size="sm" variant="destructive" onClick={onRetry}>
        Retry Loading
      </Button>
    )}
  </div>
);
