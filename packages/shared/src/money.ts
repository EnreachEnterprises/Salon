/**
 * Money is always integer paise. Never floats.
 * 1 rupee = 100 paise. ₹1,234.50 => 123450.
 */

export type Paise = number;

export const PAISE_PER_RUPEE = 100;

export function rupeesToPaise(rupees: number): Paise {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: Paise): number {
  return paise / PAISE_PER_RUPEE;
}

/**
 * Indian digit grouping: 12,34,567.50
 */
function groupIndian(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

export function formatPaise(paise: Paise, opts: { symbol?: boolean; paise?: boolean } = {}): string {
  const { symbol = true, paise: showPaise = true } = opts;
  const negative = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const whole = Math.floor(abs / PAISE_PER_RUPEE).toString();
  const frac = abs % PAISE_PER_RUPEE;

  const body = showPaise
    ? `${groupIndian(whole)}.${frac.toString().padStart(2, '0')}`
    : groupIndian(whole);

  return `${negative ? '-' : ''}${symbol ? '₹' : ''}${body}`;
}

/** Compact form for dashboard tiles: ₹1.2L, ₹18.4k */
export function formatPaiseCompact(paise: Paise): string {
  const rupees = Math.abs(paiseToRupees(paise));
  const sign = paise < 0 ? '-' : '';

  if (rupees >= 10_000_000) return `${sign}₹${(rupees / 10_000_000).toFixed(2)}Cr`;
  if (rupees >= 100_000) return `${sign}₹${(rupees / 100_000).toFixed(2)}L`;
  if (rupees >= 1_000) return `${sign}₹${(rupees / 1_000).toFixed(1)}k`;
  return `${sign}₹${Math.round(rupees)}`;
}
