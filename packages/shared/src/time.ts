/**
 * The salon's business day is stored explicitly as a `date` column
 * (bookings.business_date, invoices.business_date). That keeps reporting cheap
 * and unambiguous: an 11:45pm bill belongs to the day it was rung up, in the
 * salon's own timezone, not to whatever timezone a phone happens to be in.
 */

export const SALON_TIMEZONE = 'Asia/Kolkata';

/** YYYY-MM-DD for "now" in the salon's timezone. */
export function todayISO(timeZone: string = SALON_TIMEZONE, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthRange(iso: string): { from: string; to: string } {
  const [y, m] = iso.split('-').map(Number) as [number, number];
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from, to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}` };
}

export function eachDayBetween(fromISO: string, toISO: string): string[] {
  const days: string[] = [];
  let cursor = fromISO;
  // Guard against a reversed or runaway range (max 400 days).
  for (let guard = 0; guard < 400 && cursor <= toISO; guard += 1) {
    days.push(cursor);
    cursor = addDaysISO(cursor, 1);
  }
  return days;
}

/** "18:30" -> "6:30 PM" */
export function formatClock(time: string): string {
  const [hRaw, mRaw] = time.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;

  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "2026-11-03" -> "Tue, 3 Nov" */
export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number) as [number, number];
  const [eh, em] = end.split(':').map(Number) as [number, number];
  return eh * 60 + em - (sh * 60 + sm);
}
