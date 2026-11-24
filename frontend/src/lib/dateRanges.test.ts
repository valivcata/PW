import { describe, expect, it } from 'vitest';
import { activeQuickRange, quickRange } from './dateRanges';

// 2026-11-24 is a Tuesday.
const tuesday = new Date(2026, 10, 24, 15, 0);
const saturday = new Date(2026, 10, 28, 10, 0);
const sunday = new Date(2026, 10, 29, 10, 0);

describe('quickRange', () => {
  it('today is a single day', () => {
    expect(quickRange('today', tuesday)).toEqual({ from: '2026-11-24', to: '2026-11-24' });
  });

  it('weekend on a weekday is the coming Saturday and Sunday', () => {
    expect(quickRange('weekend', tuesday)).toEqual({ from: '2026-11-28', to: '2026-11-29' });
  });

  it('weekend on Saturday starts today', () => {
    expect(quickRange('weekend', saturday)).toEqual({ from: '2026-11-28', to: '2026-11-29' });
  });

  it('weekend on Sunday is just today', () => {
    expect(quickRange('weekend', sunday)).toEqual({ from: '2026-11-29', to: '2026-11-29' });
  });

  it('week runs from today to Sunday', () => {
    expect(quickRange('week', tuesday)).toEqual({ from: '2026-11-24', to: '2026-11-29' });
    expect(quickRange('week', sunday)).toEqual({ from: '2026-11-29', to: '2026-11-29' });
  });

  it('crosses month boundaries', () => {
    expect(quickRange('week', new Date(2026, 11, 30))).toEqual({ from: '2026-12-30', to: '2027-01-03' });
  });
});

describe('activeQuickRange', () => {
  it('recognizes the matching quick filter', () => {
    expect(activeQuickRange('2026-11-28', '2026-11-29', tuesday)).toBe('weekend');
    expect(activeQuickRange('2026-11-24', '2026-11-24', tuesday)).toBe('today');
  });

  it('returns null for custom or empty ranges', () => {
    expect(activeQuickRange('2026-11-25', '2026-11-27', tuesday)).toBeNull();
    expect(activeQuickRange('', '', tuesday)).toBeNull();
  });
});
