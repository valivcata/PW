import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { EventsPage } from './EventsPage';
import { jsonResponse, renderWithProviders } from '../test/render';
import type { EventSummary } from '../api/types';
import { GUEST_EVENT_LIMIT } from '../lib/config';

const events: EventSummary[] = Array.from({ length: 12 }, (_, i) => ({
  id: `e${i}`,
  title: `Event number ${i}`,
  category: i % 10,
  startUtc: new Date(Date.UTC(2026, 11, 1 + i, 18)).toISOString(),
  endUtc: new Date(Date.UTC(2026, 11, 1 + i, 21)).toISOString(),
  venueName: 'Venue',
  imageUrl: null,
  price: 10,
  goingCount: 0,
  externalSource: null,
}));

function mockEventsApi() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
    jsonResponse({ items: events, total: events.length, page: 1, pageSize: 12 }),
  );
}

function signIn() {
  localStorage.setItem(
    'gatherly.auth',
    JSON.stringify({
      token: 't',
      expiresAtUtc: new Date(Date.now() + 3600_000).toISOString(),
      user: { id: 'u1', email: 'a@b.co', displayName: 'A', bio: null, avatarUrl: null },
    }),
  );
}

describe('EventsPage', () => {
  it(`shows only ${GUEST_EVENT_LIMIT} events and a sign-in prompt to visitors`, async () => {
    mockEventsApi();
    renderWithProviders(<EventsPage />);

    expect(await screen.findByText('Event number 0')).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/events/'));
    expect(links).toHaveLength(GUEST_EVENT_LIMIT);
    expect(screen.getByText("There's more happening")).toBeInTheDocument();
    expect(screen.getByText(/see all 12 events/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('shows every event and no prompt when signed in', async () => {
    signIn();
    mockEventsApi();
    renderWithProviders(<EventsPage />);

    expect(await screen.findByText('Event number 11')).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('/events/'));
    expect(links).toHaveLength(12);
    expect(screen.queryByText("There's more happening")).not.toBeInTheDocument();
  });
});
