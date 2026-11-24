import { describe, expect, it } from 'vitest';
import { dateInputToIso, formatPrice, fromLocalInput, initials, toDateInput, toLocalInput } from './format';

describe('formatPrice', () => {
  it('returns null when the price is unknown', () => {
    expect(formatPrice(null, 'en-GB', 'Free')).toBeNull();
  });

  it('uses the free label for 0', () => {
    expect(formatPrice(0, 'ro-RO', 'Gratuit')).toBe('Gratuit');
  });

  it('formats RON amounts', () => {
    expect(formatPrice(30, 'ro-RO', 'Gratuit')).toMatch(/30,00\sRON/);
  });
});

describe('local date inputs', () => {
  it('round-trips datetime-local values through ISO', () => {
    const local = '2026-12-01T19:30';
    expect(toLocalInput(fromLocalInput(local))).toBe(local);
  });

  it('formats a Date for <input type="date">', () => {
    expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('converts a date input to the start and end of that local day', () => {
    const start = new Date(dateInputToIso('2026-11-26'));
    const end = new Date(dateInputToIso('2026-11-26', true));
    expect([start.getHours(), start.getMinutes()]).toEqual([0, 0]);
    expect([end.getHours(), end.getMinutes(), end.getSeconds()]).toEqual([23, 59, 59]);
    expect(start.getDate()).toBe(26);
    expect(end.getDate()).toBe(26);
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('gatherly timisoara events')).toBe('GT');
    expect(initials('  Diana  ')).toBe('D');
  });
});
