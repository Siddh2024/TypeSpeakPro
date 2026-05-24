import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePendingAction } from './usePendingAction';

describe('usePendingAction', () => {
  it('prevents double submit while pending', async () => {
    let resolveAction: (value: string) => void = () => {};
    const action = vi.fn(() => new Promise<string>(resolve => {
      resolveAction = resolve;
    }));

    const { result } = renderHook(() => usePendingAction(action, { status: 'saving' }));

    act(() => {
      result.current.run();
      result.current.run();
    });

    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveAction('done');
      await Promise.resolve();
    });

    expect(result.current.status).toBe('success');
  });
});
