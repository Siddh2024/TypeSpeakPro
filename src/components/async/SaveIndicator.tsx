import React from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AsyncStatus } from '@/types/async';

interface SaveIndicatorProps {
  status: AsyncStatus;
  label?: string;
  className?: string;
}

export const SaveIndicator = React.memo(({ status, label, className }: SaveIndicatorProps) => {
  if (status === 'idle') return null;

  const isSaving = status === 'saving' || status === 'pending' || status === 'loading';
  const isError = status === 'error' || status === 'retryable-error';
  const text = label ?? (isSaving ? 'Saving...' : isError ? 'Save failed' : 'Saved');

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isSaving}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        isSaving && 'border-primary/20 bg-primary/10 text-primary',
        status === 'success' && 'border-green-500/20 bg-green-500/10 text-green-400',
        isError && 'border-destructive/20 bg-destructive/10 text-destructive',
        className
      )}
    >
      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isError ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {text}
    </div>
  );
});

SaveIndicator.displayName = 'SaveIndicator';
