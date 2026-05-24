import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  title?: string;
  description?: string;
  fullPage?: boolean;
  className?: string;
}

export const LoadingState = React.memo(({
  title = 'Loading',
  description = 'Please wait while we get things ready.',
  fullPage = false,
  className,
}: LoadingStateProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className={cn(
      'flex flex-col items-center justify-center text-center',
      fullPage ? 'min-h-screen bg-background px-6 text-foreground' : 'min-h-[220px] p-6',
      className
    )}
  >
    <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    <p className="font-medium">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
  </div>
));

LoadingState.displayName = 'LoadingState';
