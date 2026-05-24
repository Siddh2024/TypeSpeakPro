import { useCallback, useMemo, useState } from 'react';
import type { AsyncErrorMetadata, AsyncState, AsyncStatus } from '@/types/async';
import { isAsyncBusy } from '@/types/async';

export const useAsyncState = <T = unknown>(initialStatus: AsyncStatus = 'idle') => {
  const [state, setState] = useState<AsyncState<T>>({
    status: initialStatus,
    error: null,
    updatedAt: Date.now(),
  });

  const setStatus = useCallback((status: AsyncStatus) => {
    setState(prev => ({ ...prev, status, updatedAt: Date.now() }));
  }, []);

  const setData = useCallback((data: T, status: AsyncStatus = 'success') => {
    setState({ status, data, error: null, updatedAt: Date.now() });
  }, []);

  const setError = useCallback((error: AsyncErrorMetadata, retryable = error.retryable ?? true) => {
    setState(prev => ({
      ...prev,
      status: retryable ? 'retryable-error' : 'error',
      error: { ...error, retryable },
      updatedAt: Date.now(),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', error: null, updatedAt: Date.now() });
  }, []);

  return useMemo(
    () => ({
      state,
      status: state.status,
      data: state.data,
      error: state.error,
      isBusy: isAsyncBusy(state.status),
      setStatus,
      setData,
      setError,
      reset,
    }),
    [reset, setData, setError, setStatus, state]
  );
};
