import type { EventDetail } from '../api/types';

type CalendarEvent = Pick<EventDetail, 'id' | 'title' | 'description' | 'startUtc' | 'endUtc' | 'venueName' | 'address'>;

/** 2026-11-26T19:00:00Z -> 20261126T190000Z */
export function toIcsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape text per RFC 5545 (backslash, semicolon, comma, newline). */
export function escapeIcsText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold lines longer than 75 octets as required by RFC 5545. */
function fold(line: string) {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function buildIcs(event: CalendarEvent, url: string, now: Date = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatherly//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@gatherly`,
    `DTSTAMP:${toIcsDate(now.toISOString())}`,
    `DTSTART:${toIcsDate(event.startUtc)}`,
    `DTEND:${toIcsDate(event.endUtc)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(`${event.description}\n\n${url}`)}`,
    `LOCATION:${escapeIcsText(`${event.venueName}, ${event.address}`)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event: CalendarEvent, url: string) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toIcsDate(event.startUtc)}/${toIcsDate(event.endUtc)}`,
    details: `${event.description}\n\n${url}`,
    location: `${event.venueName}, ${event.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(event: CalendarEvent, url: string) {
  const blob = new Blob([buildIcs(event, url)], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${event.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
