import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useRetryableAction } from './useRetryableAction';

describe('useRetryableAction', () => {
  it('coalesces duplicate runs while a request is in flight', async () => {
    let resolveAction: (value: string) => void = () => {};
    const action = vi.fn(() => new Promise<string>(resolve => {
      resolveAction = resolve;
    }));

    const { result } = renderHook(() => useRetryableAction(action, {
      errorTitle: 'Failed',
      errorMessage: 'Try again.',
    }));

    act(() => {
      result.current.run();
      result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction('done');
      await Promise.resolve();
    });

    expect(result.current.data).toBe('done');
  });
});
