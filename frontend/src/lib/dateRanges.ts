import { toDateInput } from './format';

export type QuickRange = 'today' | 'weekend' | 'week';

export const QUICK_RANGES: QuickRange[] = ['today', 'weekend', 'week'];

/**
 * Date-input values (YYYY-MM-DD, local time) for a quick filter.
 * - today:   today
 * - weekend: the coming Saturday–Sunday (or the rest of it, if it's already the weekend)
 * - week:    today through the coming Sunday
 */
export function quickRange(kind: QuickRange, now: Date = new Date()): { from: string; to: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay(); // 0 = Sunday … 6 = Saturday
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const daysToSunday = (7 - day) % 7;

  switch (kind) {
    case 'today':
      return { from: toDateInput(today), to: toDateInput(today) };
    case 'weekend': {
      const sunday = addDays(today, daysToSunday);
      const saturday = day === 0 ? today : addDays(sunday, -1);
      const start = day === 6 || day === 0 ? today : saturday;
      return { from: toDateInput(start), to: toDateInput(sunday) };
    }
    case 'week':
      return { from: toDateInput(today), to: toDateInput(addDays(today, daysToSunday)) };
  }
}

/** Which quick filter (if any) the current from/to values correspond to. */
export function activeQuickRange(from: string, to: string, now: Date = new Date()): QuickRange | null {
  if (!from || !to) return null;
  return QUICK_RANGES.find((k) => {
    const r = quickRange(k, now);
    return r.from === from && r.to === to;
  }) ?? null;
}
