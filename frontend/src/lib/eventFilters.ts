import type { EventSummary } from '../api/types';

export type SortKey = 'date' | 'price' | 'popular';
export const SORT_KEYS: SortKey[] = ['date', 'price', 'popular'];

export function isSortKey(v: string | null): v is SortKey {
  return !!v && (SORT_KEYS as string[]).includes(v);
}

/**
 * Whether an event costs nothing. Local events use an empty price for free (as the seed data does);
 * for imported events (Ticketmaster…) an empty price means "unknown", so only an explicit 0 counts.
 */
export function isFree(e: Pick<EventSummary, 'price' | 'externalSource'>) {
  return e.price === 0 || (e.price === null && !e.externalSource);
}

/** Price used for sorting: free = 0, unknown = last. */
function sortablePrice(e: EventSummary) {
  if (isFree(e)) return 0;
  return e.price ?? Number.POSITIVE_INFINITY;
}

/**
 * Client-side filtering/sorting for options the API doesn't support.
 * - freeOnly keeps free events (see isFree).
 * - price sorts cheapest first, unknown prices last; popular sorts by going count.
 * Ties keep chronological order.
 */
export function applyClientFilters(items: EventSummary[], opts: { freeOnly: boolean; sort: SortKey }) {
  let result = opts.freeOnly ? items.filter(isFree) : [...items];
  const byDate = (a: EventSummary, b: EventSummary) => a.startUtc.localeCompare(b.startUtc);

  if (opts.sort === 'price') {
    result = result.sort((a, b) => {
      const pa = sortablePrice(a);
      const pb = sortablePrice(b);
      return pa === pb ? byDate(a, b) : pa - pb;
    });
  } else if (opts.sort === 'popular') {
    result = result.sort((a, b) => b.goingCount - a.goingCount || byDate(a, b));
  } else {
    result = result.sort(byDate);
  }
  return result;
}

/** Split into events that haven't ended yet (soonest first) and ones that have (most recent first). */
export function splitByTime(items: EventSummary[], now: number = Date.now()) {
  const upcoming: EventSummary[] = [];
  const past: EventSummary[] = [];
  for (const e of items) (new Date(e.endUtc).getTime() >= now ? upcoming : past).push(e);
  upcoming.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  past.sort((a, b) => b.startUtc.localeCompare(a.startUtc));
  return { upcoming, past };
}
