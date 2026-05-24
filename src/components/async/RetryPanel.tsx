import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AsyncErrorMetadata } from '@/types/async';

interface RetryPanelProps {
  error: AsyncErrorMetadata;
  onRetry?: () => void;
  className?: string;
}

export const RetryPanel = React.memo(({ error, onRetry, className }: RetryPanelProps) => (
  <div
    role="alert"
    aria-live="assertive"
    className={cn(
      'flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-destructive/25 bg-card p-8 text-center shadow-sm',
      className
    )}
  >
    <AlertTriangle className="mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
    <h2 className="text-xl font-semibold text-foreground">{error.title}</h2>
    <p className="mt-2 max-w-md text-sm text-muted-foreground">{error.message}</p>
    {error.recoveryHint && <p className="mt-2 max-w-md text-xs text-muted-foreground">{error.recoveryHint}</p>}
    {onRetry && error.retryable !== false && (
      <Button type="button" onClick={onRetry} className="mt-6">
        <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
        Try Again
      </Button>
    )}
  </div>
));

RetryPanel.displayName = 'RetryPanel';
