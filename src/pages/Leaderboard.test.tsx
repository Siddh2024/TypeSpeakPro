import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Leaderboard from './Leaderboard';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/components/Navbar', () => ({ default: () => <nav /> }));
vi.mock('@/components/UserAvatar', () => ({ default: () => <div /> }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: null, error: new Error('network down') }),
        }),
      }),
    }),
  },
}));

describe('Leaderboard', () => {
  it('renders retry UI when fetch fails', async () => {
    render(
      <MemoryRouter>
        <Leaderboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Leaderboard could not load')).toBeInTheDocument();
    });
  });
});
