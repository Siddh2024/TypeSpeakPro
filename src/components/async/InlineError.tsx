import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AsyncErrorMetadata } from '@/types/async';

interface InlineErrorProps {
  error: AsyncErrorMetadata | string | null | undefined;
  onRetry?: () => void;
  className?: string;
}

const normalizeError = (error: InlineErrorProps['error']): AsyncErrorMetadata | null => {
  if (!error) return null;
  if (typeof error === 'string') return { title: 'Something went wrong', message: error, retryable: true };
  return error;
};

export const InlineError = React.memo(({ error, onRetry, className }: InlineErrorProps) => {
  const normalized = normalizeError(error);
  if (!normalized) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{normalized.title}</p>
          <p className="mt-1 text-destructive/90">{normalized.message}</p>
          {normalized.recoveryHint && (
            <p className="mt-1 text-destructive/80">{normalized.recoveryHint}</p>
          )}
        </div>
        {onRetry && normalized.retryable !== false && (
          <Button type="button" size="sm" variant="outline" onClick={onRetry} className="shrink-0">
            <RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
});

InlineError.displayName = 'InlineError';
