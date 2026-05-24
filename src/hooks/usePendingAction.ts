import { useCallback, useRef } from 'react';
import type { AsyncStatus } from '@/types/async';
import { toUserSafeError, logAsyncError } from '@/types/async';
import { useAsyncState } from './useAsyncState';

interface PendingActionOptions {
  status?: AsyncStatus;
  successStatus?: AsyncStatus;
  errorTitle?: string;
  errorMessage?: string;
  scope?: string;
}

export const usePendingAction = <TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: PendingActionOptions = {}
) => {
  const async = useAsyncState<TResult>();
  const inFlightRef = useRef(false);

  const run = useCallback(async (...args: TArgs) => {
    if (inFlightRef.current) return undefined;

    inFlightRef.current = true;
    async.setStatus(options.status ?? 'pending');

    try {
      const result = await action(...args);
      async.setData(result, options.successStatus ?? 'success');
      return result;
    } catch (error) {
      logAsyncError(options.scope ?? 'pending-action', error);
      async.setError(
        toUserSafeError(error, {
          title: options.errorTitle ?? 'Action failed',
          message: options.errorMessage ?? 'Something went wrong. Please try again.',
        })
      );
      return undefined;
    } finally {
      inFlightRef.current = false;
    }
  }, [action, async, options.errorMessage, options.errorTitle, options.scope, options.status, options.successStatus]);

  return { ...async, run, isPending: async.isBusy };
};
