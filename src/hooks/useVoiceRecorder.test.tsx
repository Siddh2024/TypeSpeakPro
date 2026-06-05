import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecorder } from './useVoiceRecorder';

describe('useVoiceRecorder', () => {
  it('surfaces microphone denied state', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
      configurable: true,
    });
    vi.stubGlobal('MediaRecorder', class {
      static isTypeSupported = vi.fn(() => true);
    });

    const { result } = renderHook(() => useVoiceRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.error?.title).toBe('Microphone access failed');
    expect(result.current.status).toBe('retryable-error');
  });

  it('prevents duplicate starts while microphone permission is pending', async () => {
    let resolveStream: (stream: MediaStream) => void = () => {};
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(resolve => {
      resolveStream = resolve;
    }));

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    vi.stubGlobal('MediaRecorder', class {
      static isTypeSupported = vi.fn(() => true);
      state = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn(() => this.onstop?.());
    });

    const { result } = renderHook(() => useVoiceRecorder());

    act(() => {
      void result.current.startRecording();
      void result.current.startRecording();
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveStream({
        getTracks: () => [{ stop: vi.fn() }],
      } as unknown as MediaStream);
      await Promise.resolve();
    });
  });
});
