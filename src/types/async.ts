export type AsyncStatus =
  | 'idle'
  | 'loading'
  | 'pending'
  | 'recording'
  | 'evaluating'
  | 'saving'
  | 'success'
  | 'error'
  | 'retryable-error';

export interface AsyncErrorMetadata {
  title: string;
  message: string;
  code?: string;
  cause?: unknown;
  retryable?: boolean;
  recoveryHint?: string;
}

export interface AsyncState<T = unknown> {
  status: AsyncStatus;
  data?: T;
  error?: AsyncErrorMetadata | null;
  updatedAt?: number;
}

export const isAsyncBusy = (status: AsyncStatus) =>
  status === 'loading' ||
  status === 'pending' ||
  status === 'recording' ||
  status === 'evaluating' ||
  status === 'saving';

export const createAsyncError = (
  title: string,
  message: string,
  options: Partial<Omit<AsyncErrorMetadata, 'title' | 'message'>> = {}
): AsyncErrorMetadata => ({
  title,
  message,
  retryable: true,
  ...options,
});

export const toUserSafeError = (
  error: unknown,
  fallback: Pick<AsyncErrorMetadata, 'title' | 'message'>,
  options: Partial<Omit<AsyncErrorMetadata, 'title' | 'message' | 'cause'>> = {}
): AsyncErrorMetadata => {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  return createAsyncError(
    isOffline ? 'Connection unavailable' : fallback.title,
    isOffline
      ? 'You appear to be offline. Check your connection and try again.'
      : fallback.message,
    {
      cause: error,
      code: error instanceof DOMException ? error.name : undefined,
      recoveryHint: isOffline ? 'Reconnect to the internet before retrying.' : options.recoveryHint,
      ...options,
    }
  );
};

export const logAsyncError = (scope: string, error: unknown) => {
  if (import.meta.env.DEV) {
    console.error(`[${scope}]`, error);
  }
};
