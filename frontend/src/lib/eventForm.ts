import type { EventDetail, EventRequest } from '../api/types';
import type { MessageKey } from '../i18n/messages';
import { fromLocalInput, toLocalInput } from './format';

export interface EventFormState {
  title: string;
  description: string;
  category: number;
  start: string;
  end: string;
  venueName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price: string;
  capacity: string;
  imageUrl: string;
}

/** Field -> message key (client validation) or raw text (server validation). */
export type EventFormErrors = Partial<Record<keyof EventFormState, { key: MessageKey } | { text: string }>>;

export function emptyEventForm(now: Date = new Date()): EventFormState {
  const start = new Date(now);
  start.setDate(start.getDate() + 7);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start.getTime() + 3 * 3600_000);
  return {
    title: '',
    description: '',
    category: 0,
    start: toLocalInput(start.toISOString()),
    end: toLocalInput(end.toISOString()),
    venueName: '',
    address: '',
    latitude: null,
    longitude: null,
    price: '',
    capacity: '',
    imageUrl: '',
  };
}

export function eventToForm(e: EventDetail): EventFormState {
  return {
    title: e.title,
    description: e.description,
    category: e.category,
    start: toLocalInput(e.startUtc),
    end: toLocalInput(e.endUtc),
    venueName: e.venueName,
    address: e.address,
    latitude: e.latitude,
    longitude: e.longitude,
    price: e.price === null ? '' : String(e.price),
    capacity: e.capacity === null ? '' : String(e.capacity),
    imageUrl: e.imageUrl ?? '',
  };
}

/** Mirrors Create/UpdateEventRequestValidator in the backend. */
export function validateEventForm(f: EventFormState, isEdit: boolean, now: number = Date.now()): EventFormErrors {
  const e: EventFormErrors = {};
  const err = (key: MessageKey) => ({ key });

  if (!f.title.trim()) e.title = err('form.err.titleRequired');
  else if (f.title.length > 200) e.title = err('form.err.max200');
  if (!f.description.trim()) e.description = err('form.err.descriptionRequired');
  else if (f.description.length > 4000) e.description = err('form.err.max4000');
  if (!f.venueName.trim()) e.venueName = err('form.err.venueRequired');
  else if (f.venueName.length > 200) e.venueName = err('form.err.max200');
  if (!f.address.trim()) e.address = err('form.err.addressRequired');
  if (!f.start) e.start = err('form.err.startRequired');
  else if (!isEdit && new Date(f.start).getTime() <= now) e.start = err('form.err.startPast');
  if (!f.end) e.end = err('form.err.endRequired');
  else if (f.start && new Date(f.end) <= new Date(f.start)) e.end = err('form.err.endBeforeStart');
  if (f.price !== '' && (Number.isNaN(Number(f.price)) || Number(f.price) < 0)) e.price = err('form.err.price');
  if (f.capacity !== '' && (!Number.isInteger(Number(f.capacity)) || Number(f.capacity) <= 0))
    e.capacity = err('form.err.capacity');
  if (f.imageUrl.length > 1000) e.imageUrl = err('form.err.max1000');
  return e;
}

export function eventFormToRequest(f: EventFormState): EventRequest {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    category: f.category,
    startUtc: fromLocalInput(f.start),
    endUtc: fromLocalInput(f.end),
    venueName: f.venueName.trim(),
    address: f.address.trim(),
    latitude: f.latitude,
    longitude: f.longitude,
    price: f.price === '' ? null : Number(f.price),
    capacity: f.capacity === '' ? null : Number(f.capacity),
    imageUrl: f.imageUrl.trim() || null,
  };
}

/** Map API field names (StartUtc, EndUtc…) back onto form fields. */
export function serverErrorsToForm(fieldErrors: Record<string, string[]>): EventFormErrors {
  const out: EventFormErrors = {};
  for (const [k, v] of Object.entries(fieldErrors)) {
    const key = k === 'startUtc' ? 'start' : k === 'endUtc' ? 'end' : k;
    out[key as keyof EventFormState] = { text: v.join(' ') };
  }
  return out;
}
