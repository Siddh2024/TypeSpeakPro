import { useCallback, useRef } from 'react';
import type { AsyncStatus } from '@/types/async';
import { logAsyncError, toUserSafeError } from '@/types/async';
import { useAsyncState } from './useAsyncState';

interface RetryableActionOptions<TResult> {
  loadingStatus?: AsyncStatus;
  successStatus?: AsyncStatus;
  errorTitle: string;
  errorMessage: string;
  scope?: string;
  onSuccess?: (result: TResult) => void;
}

export const useRetryableAction = <TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: RetryableActionOptions<TResult>
) => {
  const async = useAsyncState<TResult>();
  const lastArgsRef = useRef<TArgs | null>(null);
  const inFlightRef = useRef(false);

  const run = useCallback(async (...args: TArgs) => {
    if (inFlightRef.current) return undefined;

    lastArgsRef.current = args;
    inFlightRef.current = true;
    async.setStatus(options.loadingStatus ?? 'loading');

    try {
      const result = await action(...args);
      async.setData(result, options.successStatus ?? 'success');
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      logAsyncError(options.scope ?? 'retryable-action', error);
      async.setError(toUserSafeError(error, {
        title: options.errorTitle,
        message: options.errorMessage,
      }));
      return undefined;
    } finally {
      inFlightRef.current = false;
    }
  }, [action, async, options]);

  const retry = useCallback(() => {
    if (!lastArgsRef.current) return undefined;
    return run(...lastArgsRef.current);
  }, [run]);

  return { ...async, run, retry, canRetry: Boolean(lastArgsRef.current), isPending: async.isBusy };
};
