import { describe, expect, it } from 'vitest';
import { buildIcs, escapeIcsText, googleCalendarUrl, toIcsDate } from './calendar';

const event = {
  id: 'abc-123',
  title: 'Jazz Night, live; at Vineri 15',
  description: 'Line one\nLine two',
  startUtc: '2026-11-27T20:00:00Z',
  endUtc: '2026-11-27T23:30:00Z',
  venueName: 'Vineri 15',
  address: 'Strada Emanoil Ungureanu 15, Timisoara',
};

describe('toIcsDate', () => {
  it('formats as UTC basic format', () => {
    expect(toIcsDate('2026-11-27T20:00:00Z')).toBe('20261127T200000Z');
    expect(toIcsDate('2026-11-27T20:00:00.123Z')).toBe('20261127T200000Z');
  });
});

describe('escapeIcsText', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('buildIcs', () => {
  const ics = buildIcs(event, 'http://localhost:3000/events/abc-123', new Date('2026-11-24T10:00:00Z'));

  it('produces a single VEVENT with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });

  it('includes times, escaped summary and location', () => {
    expect(ics).toContain('UID:abc-123@gatherly');
    expect(ics).toContain('DTSTART:20261127T200000Z');
    expect(ics).toContain('DTEND:20261127T233000Z');
    expect(ics).toContain('SUMMARY:Jazz Night\\, live\\; at Vineri 15');
    expect(ics).toContain('LOCATION:Vineri 15\\, Strada Emanoil Ungureanu 15\\, Timisoara');
  });

  it('folds lines longer than 75 characters', () => {
    const long = buildIcs({ ...event, description: 'x'.repeat(200) }, 'http://x');
    for (const line of long.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
  });
});

describe('googleCalendarUrl', () => {
  it('builds a Google Calendar template link', () => {
    const url = new URL(googleCalendarUrl(event, 'http://localhost:3000/events/abc-123'));
    expect(url.hostname).toBe('calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(event.title);
    expect(url.searchParams.get('dates')).toBe('20261127T200000Z/20261127T233000Z');
    expect(url.searchParams.get('location')).toContain('Vineri 15');
  });
});
