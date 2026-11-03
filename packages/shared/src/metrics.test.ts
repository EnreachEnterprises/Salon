import { describe, expect, it } from 'vitest';

import { allocateDiscountProRata, commissionPaise, utilizationPct, averageTicketPaise, visitType } from './metrics.js';

const sum = (record: Record<string, number>) =>
  Object.values(record).reduce((total, value) => total + value, 0);

describe('allocateDiscountProRata', () => {
  it('allocates proportionally and never loses a paisa', () => {
    const lines = [
      { id: 'haircut', amountPaise: 20000 },
      { id: 'beard', amountPaise: 10000 },
      { id: 'facial', amountPaise: 80000 },
    ];

    const allocation = allocateDiscountProRata(lines, 11000);

    expect(sum(allocation)).toBe(11000);
    // 200/1100 of the discount, rounded down, remainder handed to largest fraction
    expect(allocation.haircut).toBe(2000);
    expect(allocation.beard).toBe(1000);
    expect(allocation.facial).toBe(8000);
  });

  it('handles a discount that does not divide evenly', () => {
    const lines = [
      { id: 'a', amountPaise: 33333 },
      { id: 'b', amountPaise: 33333 },
      { id: 'c', amountPaise: 33334 },
    ];

    const allocation = allocateDiscountProRata(lines, 1000);

    expect(sum(allocation)).toBe(1000);
    expect(Math.max(...Object.values(allocation)) - Math.min(...Object.values(allocation))).toBeLessThanOrEqual(1);
  });

  it('caps the discount at the bill total', () => {
    const lines = [
      { id: 'a', amountPaise: 5000 },
      { id: 'b', amountPaise: 5000 },
    ];

    const allocation = allocateDiscountProRata(lines, 999999);

    expect(sum(allocation)).toBe(10000);
  });

  it('returns zeros for a zero or negative discount', () => {
    const lines = [{ id: 'a', amountPaise: 5000 }];

    expect(allocateDiscountProRata(lines, 0)).toEqual({ a: 0 });
    expect(allocateDiscountProRata(lines, -500)).toEqual({ a: 0 });
  });

  it('returns zeros when the bill has no value', () => {
    expect(allocateDiscountProRata([{ id: 'a', amountPaise: 0 }], 1000)).toEqual({ a: 0 });
  });

  it('is deterministic for identical inputs', () => {
    const lines = [
      { id: 'b', amountPaise: 10000 },
      { id: 'a', amountPaise: 10000 },
    ];

    const first = allocateDiscountProRata(lines, 3);
    const second = allocateDiscountProRata(lines, 3);

    expect(first).toEqual(second);
    expect(sum(first)).toBe(3);
  });
});

describe('commissionPaise', () => {
  it('converts basis points to paise', () => {
    // 5% of ₹500 = ₹25
    expect(commissionPaise(50000, 500)).toBe(2500);
  });

  it('rounds to the nearest paise', () => {
    // 5% of ₹333.33 = ₹16.6665 -> ₹16.67
    expect(commissionPaise(33333, 500)).toBe(1667);
  });

  it('treats zero or negative inputs as no commission', () => {
    expect(commissionPaise(0, 500)).toBe(0);
    expect(commissionPaise(50000, 0)).toBe(0);
    expect(commissionPaise(-100, 500)).toBe(0);
  });
});

describe('utilizationPct', () => {
  it('returns null when there is no schedule', () => {
    expect(utilizationPct(300, 0)).toBeNull();
  });

  it('computes a percentage of scheduled minutes', () => {
    expect(utilizationPct(300, 600)).toBe(50);
  });

  it('can exceed 100 when staff work past their shift', () => {
    expect(utilizationPct(660, 600)).toBe(110);
  });
});

describe('averageTicketPaise', () => {
  it('divides revenue by customers', () => {
    expect(averageTicketPaise(100000, 4)).toBe(25000);
  });

  it('returns zero with no customers', () => {
    expect(averageTicketPaise(100000, 0)).toBe(0);
  });
});

describe('visitType', () => {
  it('marks a first visit as new', () => {
    expect(visitType(0)).toBe('new');
  });

  it('marks anyone with a prior visit as returning', () => {
    expect(visitType(1)).toBe('returning');
  });
});
