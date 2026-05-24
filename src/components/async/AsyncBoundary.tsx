import React from 'react';
import type { AsyncState } from '@/types/async';
import { LoadingState } from './LoadingState';
import { RetryPanel } from './RetryPanel';

interface AsyncBoundaryProps {
  state: Pick<AsyncState, 'status' | 'error'>;
  children: React.ReactNode;
  loadingTitle?: string;
  loadingDescription?: string;
  onRetry?: () => void;
  fallback?: React.ReactNode;
}

export const AsyncBoundary = React.memo(({
  state,
  children,
  loadingTitle,
  loadingDescription,
  onRetry,
  fallback,
}: AsyncBoundaryProps) => {
  if (state.status === 'loading' || state.status === 'pending') {
    return fallback ?? <LoadingState title={loadingTitle} description={loadingDescription} />;
  }

  if ((state.status === 'error' || state.status === 'retryable-error') && state.error) {
    return <RetryPanel error={state.error} onRetry={onRetry} />;
  }

  return <>{children}</>;
});

AsyncBoundary.displayName = 'AsyncBoundary';
