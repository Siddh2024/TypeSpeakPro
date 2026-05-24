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
});
