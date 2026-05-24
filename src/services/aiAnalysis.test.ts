import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('aiAnalysis', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('surfaces AI request failure', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    }));

    const { analyzeWriting } = await import('./aiAnalysis');

    await expect(analyzeWriting('This is enough text.', 'Topic')).rejects.toThrow('AI_ANALYSIS_UNAVAILABLE');
  });
});
