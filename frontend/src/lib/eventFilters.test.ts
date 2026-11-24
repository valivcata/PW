import { describe, expect, it } from 'vitest';
import type { EventSummary } from '../api/types';
import { applyClientFilters, isFree, isSortKey, splitByTime } from './eventFilters';

const ev = (
  id: string,
  start: string,
  price: number | null,
  going = 0,
  end = start,
  externalSource: string | null = null,
): EventSummary => ({
  id,
  title: id,
  category: 0,
  startUtc: start,
  endUtc: end,
  venueName: 'v',
  imageUrl: null,
  price,
  goingCount: going,
  externalSource,
});

const items = [
  ev('c', '2026-12-03T10:00:00Z', 50, 1),
  ev('a', '2026-12-01T10:00:00Z', 0, 5),
  ev('d', '2026-12-04T10:00:00Z', null, 5), // local, no price -> free
  ev('b', '2026-12-02T10:00:00Z', 0, 2),
  ev('tm', '2026-12-01T12:00:00Z', null, 0, '2026-12-01T12:00:00Z', 'Ticketmaster'), // imported, unknown price
];

const ids = (list: EventSummary[]) => list.map((e) => e.id);

describe('isFree', () => {
  it('treats 0 as free, and an empty price as free only for local events', () => {
    expect(isFree({ price: 0, externalSource: 'Ticketmaster' })).toBe(true);
    expect(isFree({ price: null, externalSource: null })).toBe(true);
    expect(isFree({ price: null, externalSource: 'Ticketmaster' })).toBe(false);
    expect(isFree({ price: 10, externalSource: null })).toBe(false);
  });
});

describe('applyClientFilters', () => {
  it('sorts by date by default', () => {
    expect(ids(applyClientFilters(items, { freeOnly: false, sort: 'date' }))).toEqual(['a', 'tm', 'b', 'c', 'd']);
  });

  it('keeps only free events when freeOnly', () => {
    expect(ids(applyClientFilters(items, { freeOnly: true, sort: 'date' }))).toEqual(['a', 'b', 'd']);
  });

  it('sorts by price: free first, unknown last, date as tie-breaker', () => {
    expect(ids(applyClientFilters(items, { freeOnly: false, sort: 'price' }))).toEqual(['a', 'b', 'd', 'c', 'tm']);
  });

  it('sorts by popularity with date as tie-breaker', () => {
    expect(ids(applyClientFilters(items, { freeOnly: false, sort: 'popular' }))).toEqual(['a', 'd', 'b', 'c', 'tm']);
  });

  it('does not mutate the input', () => {
    const copy = [...items];
    applyClientFilters(items, { freeOnly: false, sort: 'price' });
    expect(items).toEqual(copy);
  });
});

describe('isSortKey', () => {
  it('accepts known keys only', () => {
    expect(isSortKey('price')).toBe(true);
    expect(isSortKey('nope')).toBe(false);
    expect(isSortKey(null)).toBe(false);
  });
});

describe('splitByTime', () => {
  it('splits on end time and orders past events most recent first', () => {
    const now = new Date('2026-12-02T12:00:00Z').getTime();
    const list = [
      ev('old', '2026-11-01T10:00:00Z', null, 0, '2026-11-01T12:00:00Z'),
      ev('recent', '2026-12-01T10:00:00Z', null, 0, '2026-12-01T12:00:00Z'),
      ev('ongoing', '2026-12-02T10:00:00Z', null, 0, '2026-12-02T18:00:00Z'),
      ev('next', '2026-12-05T10:00:00Z', null, 0, '2026-12-05T12:00:00Z'),
    ];
    const { upcoming, past } = splitByTime(list, now);
    expect(ids(upcoming)).toEqual(['ongoing', 'next']);
    expect(ids(past)).toEqual(['recent', 'old']);
  });
});
