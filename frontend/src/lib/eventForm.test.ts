import { describe, expect, it } from 'vitest';
import type { EventDetail } from '../api/types';
import {
  emptyEventForm,
  eventFormToRequest,
  eventToForm,
  serverErrorsToForm,
  validateEventForm,
  type EventFormState,
} from './eventForm';

const now = new Date(2026, 10, 24, 12, 0);

const valid = (): EventFormState => ({
  ...emptyEventForm(now),
  title: 'Board games',
  description: 'Bring friends',
  venueName: 'Bereta',
  address: 'Str. X 1',
});

describe('validateEventForm', () => {
  it('accepts a complete form', () => {
    expect(validateEventForm(valid(), false, now.getTime())).toEqual({});
  });

  it('requires title, description, venue and address', () => {
    const errs = validateEventForm({ ...valid(), title: ' ', description: '', venueName: '', address: '' }, false, now.getTime());
    expect(errs.title).toEqual({ key: 'form.err.titleRequired' });
    expect(errs.description).toEqual({ key: 'form.err.descriptionRequired' });
    expect(errs.venueName).toEqual({ key: 'form.err.venueRequired' });
    expect(errs.address).toEqual({ key: 'form.err.addressRequired' });
  });

  it('enforces max lengths like the backend', () => {
    const errs = validateEventForm({ ...valid(), title: 'x'.repeat(201), description: 'x'.repeat(4001) }, false, now.getTime());
    expect(errs.title).toEqual({ key: 'form.err.max200' });
    expect(errs.description).toEqual({ key: 'form.err.max4000' });
  });

  it('requires the end after the start', () => {
    const f = valid();
    expect(validateEventForm({ ...f, end: f.start }, false, now.getTime()).end).toEqual({ key: 'form.err.endBeforeStart' });
  });

  it('requires a future start only when creating', () => {
    const past = { ...valid(), start: '2026-11-01T10:00', end: '2026-11-01T12:00' };
    expect(validateEventForm(past, false, now.getTime()).start).toEqual({ key: 'form.err.startPast' });
    expect(validateEventForm(past, true, now.getTime()).start).toBeUndefined();
  });

  it('validates price and capacity', () => {
    const errs = validateEventForm({ ...valid(), price: '-1', capacity: '2.5' }, false, now.getTime());
    expect(errs.price).toEqual({ key: 'form.err.price' });
    expect(errs.capacity).toEqual({ key: 'form.err.capacity' });
    expect(validateEventForm({ ...valid(), price: '0', capacity: '10' }, false, now.getTime())).toEqual({});
  });
});

describe('eventFormToRequest', () => {
  it('trims text, converts numbers and empty strings to null', () => {
    const req = eventFormToRequest({ ...valid(), title: '  Board games  ', price: '', capacity: '25', imageUrl: ' ' });
    expect(req.title).toBe('Board games');
    expect(req.price).toBeNull();
    expect(req.capacity).toBe(25);
    expect(req.imageUrl).toBeNull();
    expect(req.startUtc.endsWith('Z')).toBe(true);
  });
});

describe('eventToForm', () => {
  it('maps an event back into form values', () => {
    const e = {
      id: '1',
      title: 'T',
      description: 'D',
      category: 3,
      startUtc: '2026-12-01T18:00:00Z',
      endUtc: '2026-12-01T20:00:00Z',
      venueName: 'V',
      address: 'A',
      latitude: 45.7,
      longitude: 21.2,
      price: 0,
      capacity: null,
      imageUrl: null,
    } as EventDetail;
    const f = eventToForm(e);
    expect(f.price).toBe('0');
    expect(f.capacity).toBe('');
    expect(f.imageUrl).toBe('');
    expect(eventFormToRequest(f).startUtc).toBe('2026-12-01T18:00:00.000Z');
  });
});

describe('serverErrorsToForm', () => {
  it('maps API field names onto form fields', () => {
    expect(serverErrorsToForm({ startUtc: ['Too early'], title: ['Bad', 'Worse'] })).toEqual({
      start: { text: 'Too early' },
      title: { text: 'Bad Worse' },
    });
  });
});
