import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { EventGrid } from './EventGrid';
import { renderWithProviders } from '../test/render';
import { fourUpGridSize } from '../lib/grid';

describe('EventGrid', () => {
  it('shows 8 card-shaped placeholders while loading', () => {
    const { container } = renderWithProviders(<EventGrid events={undefined} isLoading empty={null} />);
    expect(container.querySelectorAll('.MuiCard-root')).toHaveLength(8);
    // Same 190px image area as a real EventCard, so nothing jumps when data arrives.
    expect(container.querySelector('.MuiSkeleton-rectangular')).toHaveStyle({ height: '190px' });
  });

  it('shows 4 placeholders in the four-up layout', () => {
    const { container } = renderWithProviders(
      <EventGrid events={undefined} isLoading empty={null} gridSize={fourUpGridSize} />,
    );
    expect(container.querySelectorAll('.MuiCard-root')).toHaveLength(4);
  });

  it('renders the empty state when there are no events', () => {
    renderWithProviders(<EventGrid events={[]} isLoading={false} empty={<p>Nothing here</p>} />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
