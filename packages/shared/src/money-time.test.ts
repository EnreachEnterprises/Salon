import { describe, expect, it } from 'vitest';

import { formatPaise, formatPaiseCompact, rupeesToPaise, paiseToRupees } from './money.js';
import { addDaysISO, eachDayBetween, formatClock, formatDayLabel, minutesBetween, monthRange } from './time.js';

describe('money', () => {
  it('converts rupees to paise without float drift', () => {
    expect(rupeesToPaise(199.99)).toBe(19999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
    expect(paiseToRupees(19999)).toBe(199.99);
  });

  it('groups digits the Indian way', () => {
    expect(formatPaise(50000)).toBe('₹500.00');
    expect(formatPaise(123450)).toBe('₹1,234.50');
    expect(formatPaise(12345678)).toBe('₹1,23,456.78');
    expect(formatPaise(10000000)).toBe('₹1,00,000.00');
  });

  it('handles negatives and options', () => {
    expect(formatPaise(-50000)).toBe('-₹500.00');
    expect(formatPaise(123450, { paise: false })).toBe('₹1,234');
    expect(formatPaise(123450, { symbol: false })).toBe('1,234.50');
  });

  it('compacts large amounts for dashboard tiles', () => {
    expect(formatPaiseCompact(5000000)).toBe('₹50.0k');
    expect(formatPaiseCompact(12340000)).toBe('₹1.23L');
    expect(formatPaiseCompact(98765432)).toBe('₹9.88L');
    expect(formatPaiseCompact(250000000)).toBe('₹25.00L');
    expect(formatPaiseCompact(1250000000)).toBe('₹1.25Cr');
    expect(formatPaiseCompact(45000)).toBe('₹450');
  });
});

describe('time', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDaysISO('2026-11-03', 1)).toBe('2026-11-04');
    expect(addDaysISO('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('builds a month range including leap years', () => {
    expect(monthRange('2026-02-15')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(monthRange('2028-02-15')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(monthRange('2026-12-01')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('enumerates every day in a range, inclusive', () => {
    const days = eachDayBetween('2026-11-01', '2026-11-05');
    expect(days).toHaveLength(5);
    expect(days[0]).toBe('2026-11-01');
    expect(days[4]).toBe('2026-11-05');
  });

  it('returns nothing for a reversed range', () => {
    expect(eachDayBetween('2026-11-05', '2026-11-01')).toEqual([]);
  });

  it('formats 24-hour clock into 12-hour labels', () => {
    expect(formatClock('18:30')).toBe('6:30 PM');
    expect(formatClock('00:05')).toBe('12:05 AM');
    expect(formatClock('12:00')).toBe('12:00 PM');
    expect(formatClock('09:00')).toBe('9:00 AM');
  });

  it('counts minutes between two clock times', () => {
    expect(minutesBetween('10:00', '12:30')).toBe(150);
    expect(minutesBetween('18:00', '18:45')).toBe(45);
  });

  it('labels a day for the UI', () => {
    expect(formatDayLabel('2026-11-03')).toBe('Tue, 3 Nov');
  });
});
