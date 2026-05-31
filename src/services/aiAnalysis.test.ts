import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('aiAnalysis', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns fallback writing analysis when the AI request fails', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-key');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ error: { message: 'server down' } }),
    }));

    const { analyzeWriting } = await import('./aiAnalysis');

    await expect(analyzeWriting('This is enough text.', 'Topic')).resolves.toEqual({
      grammar_score: 5,
      vocabulary_score: 5,
      tone_score: 5,
      overall_score: 5,
      feedback: 'Error connecting to AI service. Using basic fallback analysis.',
      corrections: [],
      better_version: 'This is enough text.',
    });
  });
});
