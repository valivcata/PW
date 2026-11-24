// Locale-aware formatting helpers. All take the Intl locale explicitly so they stay pure and testable.

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const time = (locale: string, d: Date) =>
  new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);

const longDate = (locale: string, d: Date) =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

/** "Thu, 26 Nov · 21:00" */
export function formatShortDate(iso: string, locale: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  return `${date} · ${time(locale, d)}`;
}

/** Long, human range shown on the detail page. */
export function formatRange(startIso: string, endIso: string, locale: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (sameDay(s, e)) return `${longDate(locale, s)}, ${time(locale, s)} – ${time(locale, e)}`;
  return `${longDate(locale, s)}, ${time(locale, s)} – ${longDate(locale, e)}, ${time(locale, e)}`;
}

/**
 * Price in RON, `freeLabel` for free events, null when the price is unknown.
 * Pass `isFree` to treat an empty price as free (local events, see lib/eventFilters#isFree).
 */
export function formatPrice(price: number | null, locale: string, freeLabel: string, isFree = price === 0) {
  if (isFree) return freeLabel;
  if (price === null || price === undefined) return null;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'RON', maximumFractionDigits: 2 }).format(price);
}

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO (UTC) -> value for <input type="datetime-local"> in the browser's local time. */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) -> ISO UTC string for the API. */
export function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

/** Local Date -> value for <input type="date">. */
export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** <input type="date"> value -> ISO UTC at local start/end of that day. */
export function dateInputToIso(value: string, endOfDay = false) {
  const [y, m, d] = value.split('-').map(Number);
  const date = endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d, 0, 0, 0);
  return date.toISOString();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
