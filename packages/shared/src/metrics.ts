import type { Paise } from './money.js';

/**
 * Metric rules that every screen must obey. See docs/METRICS.md.
 * These are pure functions on purpose: the mobile app, the API layer and the
 * SQL views must never disagree about a number.
 */

export interface DiscountLine {
  id: string;
  amountPaise: Paise;
}

/**
 * Pro-rata discount allocation using the largest-remainder method, so the
 * allocated paise always sum to exactly `discountPaise` with no drift.
 *
 * Used for commission: a ₹100 discount on a ₹380 bill must reduce each service
 * line proportionally so commission cannot be gamed by discounting.
 */
export function allocateDiscountProRata(
  lines: readonly DiscountLine[],
  discountPaise: Paise,
): Record<string, Paise> {
  const result: Record<string, Paise> = {};
  for (const line of lines) result[line.id] = 0;

  if (!Number.isInteger(discountPaise) || discountPaise <= 0) return result;

  const total = lines.reduce((sum, line) => sum + Math.max(0, line.amountPaise), 0);
  if (total <= 0) return result;

  const discount = Math.min(discountPaise, total);

  const shares = lines.map((line) => {
    const exact = (discount * Math.max(0, line.amountPaise)) / total;
    const floored = Math.floor(exact);
    return { id: line.id, amountPaise: line.amountPaise, floored, fraction: exact - floored };
  });

  let allocated = shares.reduce((sum, share) => sum + share.floored, 0);
  for (const share of shares) result[share.id] = share.floored;

  // Hand out the remaining paise to the largest fractional parts, deterministically.
  const order = [...shares].sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction;
    if (b.amountPaise !== a.amountPaise) return b.amountPaise - a.amountPaise;
    return a.id.localeCompare(b.id);
  });

  let index = 0;
  while (allocated < discount && order.length > 0) {
    const target = order[index % order.length]!;
    result[target.id] = (result[target.id] ?? 0) + 1;
    allocated += 1;
    index += 1;
  }

  return result;
}

/**
 * Commission is stored in basis points (500 bps = 5%) to keep it integral.
 * Rounds half-up to the nearest paise.
 */
export function commissionPaise(lineTotalAfterDiscountPaise: Paise, commissionBps: number): Paise {
  if (lineTotalAfterDiscountPaise <= 0 || commissionBps <= 0) return 0;
  return Math.round((lineTotalAfterDiscountPaise * commissionBps) / 10_000);
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return (part / whole) * 100;
}

/**
 * Utilization = delivered service minutes / scheduled staff minutes.
 * Returns null when there is no schedule, so the UI can say "no shift data"
 * instead of showing a misleading 0%.
 */
export function utilizationPct(
  serviceMinutes: number,
  scheduledMinutes: number,
): number | null {
  if (scheduledMinutes <= 0) return null;
  const raw = (serviceMinutes / scheduledMinutes) * 100;
  // One decimal is all the UI shows, and rounding here keeps 110 rather than
  // 110.00000000000001 out of the data layer.
  return Math.round(raw * 10) / 10;
}

export function averageTicketPaise(revenuePaise: Paise, customerCount: number): Paise {
  if (customerCount <= 0) return 0;
  return Math.round(revenuePaise / customerCount);
}

/**
 * A "service" is one invoice_item row (Haircut + Beard = 2 services, 1 customer).
 * A "customer" is one completed booking.
 */
export function serviceCount(invoiceItems: readonly unknown[]): number {
  return invoiceItems.length;
}

export type CustomerVisitType = 'new' | 'returning';

/** New = this is the customer's first ever completed visit. */
export function visitType(priorCompletedVisits: number): CustomerVisitType {
  return priorCompletedVisits > 0 ? 'returning' : 'new';
}

export function roundToRupee(paise: Paise): Paise {
  return Math.round(paise / 100) * 100;
}
