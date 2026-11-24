import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage, RegisterPage } from './AuthPages';
import { jsonResponse, renderWithProviders } from '../test/render';
import { validateRegister } from '../lib/registerForm';

const authResponse = {
  accessToken: 'token-123',
  expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
  user: { id: 'u1', email: 'organizer@gatherly.dev', displayName: 'Gatherly Timisoara', bio: null, avatarUrl: null },
};

describe('LoginPage', () => {
  it('signs in, stores the session and goes to the requested page', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(authResponse));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login', routes: { '/': <p>Home page</p> } });

    await user.type(screen.getByLabelText(/email/i), 'organizer@gatherly.dev');
    await user.type(screen.getByLabelText(/^password/i), 'Gatherly123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Home page')).toBeInTheDocument();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('/api/auth/login');
    expect(JSON.parse(init!.body as string)).toEqual({ email: 'organizer@gatherly.dev', password: 'Gatherly123' });
    expect(JSON.parse(localStorage.getItem('gatherly.auth')!).token).toBe('token-123');
  });

  it('shows the API error on bad credentials', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ error: 'Invalid email or password.' }, 401));
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'a@b.co');
    await user.type(screen.getByLabelText(/^password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(localStorage.getItem('gatherly.auth')).toBeNull();
  });

  it('is translated to Romanian', () => {
    renderWithProviders(<LoginPage />, { route: '/login', lang: 'ro' });
    expect(screen.getByRole('button', { name: 'Autentifică-te' })).toBeInTheDocument();
    expect(screen.getByLabelText(/parolă/i)).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  it('validates fields before calling the API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('Tell us your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email.')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('registers with valid data', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(authResponse));
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register', routes: { '/': <p>Home page</p> } });

    await user.type(screen.getByLabelText(/display name/i), 'Diana');
    await user.type(screen.getByLabelText(/email/i), 'diana@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Secret123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Secret123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce());
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/api/auth/register');
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });
});

describe('validateRegister', () => {
  it('passes valid input', () => {
    expect(validateRegister({ displayName: 'A', email: 'a@b.co', password: 'Secret123', confirm: 'Secret123' })).toEqual({});
  });
});
