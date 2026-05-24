import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineError, LoadingState, SaveIndicator } from '@/components/async';

describe('async primitives', () => {
  it('announces loading visibility', () => {
    render(<LoadingState title="Restoring your session" description="Checking auth" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Restoring your session')).toBeInTheDocument();
  });

  it('supports keyboard-safe retry flows', async () => {
    const onRetry = vi.fn();
    render(<InlineError error={{ title: 'Failed', message: 'Retry this', retryable: true }} onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('announces save failures', () => {
    render(<SaveIndicator status="retryable-error" />);

    expect(screen.getByRole('status')).toHaveTextContent('Save failed');
  });
});
