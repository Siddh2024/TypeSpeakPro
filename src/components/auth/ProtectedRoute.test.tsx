import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  value: {
    isAuthenticated: false,
    isLoading: true,
    authError: null,
    retryAuth: vi.fn(),
    openLoginModal: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authState.value,
}));

describe('ProtectedRoute', () => {
  it('shows auth loading UI instead of rendering null', () => {
    authState.value = {
      ...authState.value,
      isLoading: true,
      isAuthenticated: false,
      authError: null,
    };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Restoring your session');
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });
});
