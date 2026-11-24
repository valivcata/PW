import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { EventCard } from './EventCard';
import { renderWithProviders } from '../test/render';
import type { EventSummary } from '../api/types';

const event: EventSummary = {
  id: 'e1',
  title: 'Street Food Festival',
  category: 1,
  startUtc: '2026-11-30T12:00:00Z',
  endUtc: '2026-11-30T20:00:00Z',
  venueName: 'Piata Victoriei',
  imageUrl: null,
  price: 0,
  goingCount: 3,
  externalSource: 'Ticketmaster',
};

describe('EventCard', () => {
  it('shows the key details and links to the event', () => {
    renderWithProviders(<EventCard event={event} />);
    expect(screen.getByText('Street Food Festival')).toBeInTheDocument();
    expect(screen.getByText('Piata Victoriei')).toBeInTheDocument();
    expect(screen.getByText('Food · Ticketmaster')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('3 going')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/events/e1');
    // Poster date block: day number + short month.
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/^nov$/i)).toBeInTheDocument();
  });

  it('shows local events without a price as free', () => {
    renderWithProviders(<EventCard event={{ ...event, price: null, externalSource: null }} />, { lang: 'ro' });
    expect(screen.getByText('Gratuit')).toBeInTheDocument();
  });

  it('translates labels and hides unknown prices of imported events', () => {
    renderWithProviders(<EventCard event={{ ...event, price: null }} />, { lang: 'ro' });
    expect(screen.getByText('Mâncare · Ticketmaster')).toBeInTheDocument();
    expect(screen.getByText('3 participă')).toBeInTheDocument();
    expect(screen.queryByText('Gratuit')).not.toBeInTheDocument();
  });
});
