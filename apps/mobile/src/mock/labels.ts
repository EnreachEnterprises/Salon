import type { BadgeTone } from '@/ui';

import type {
  BookingSource,
  BookingStatus,
  PaymentMethod,
  Reminder,
  RequestChannel,
} from './fixtures';

/**
 * Display strings for the enums that cross screens.
 *
 * Screens never switch on a raw enum value to decide a word or a colour: the
 * same booking source must read "Walk-in" on the reception list and on the
 * billing composer. The API keeps the enum, this file owns the translation.
 */

export const SOURCE_LABEL: Record<BookingSource, string> = {
  app: 'App',
  whatsapp: 'WhatsApp',
  call: 'Call',
  walkin: 'Walk-in',
  staff: 'Staff',
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  checked_in: 'Waiting',
  in_service: 'In chair',
  completed: 'Done',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

export const CHANNEL_LABEL: Record<RequestChannel, string> = {
  whatsapp: 'WhatsApp',
  call: 'Phone call',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
};

export const REMINDER_KIND_LABEL: Record<Reminder['kind'], string> = {
  booking: 'Booking',
  revisit: 'Come back',
  report: 'Report',
};

export const REMINDER_CHANNEL_LABEL: Record<Reminder['channel'], string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  both: 'Email + WhatsApp',
};

/**
 * Status is never colour alone — every badge carries a word as well (see
 * docs/DESIGN_SYSTEM.md). The tone is the second signal, not the only one.
 */
export function statusTone(status: BookingStatus): BadgeTone {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_service':
      return 'accent';
    case 'checked_in':
      return 'info';
    case 'cancelled':
    case 'no_show':
      return 'danger';
    case 'confirmed':
    default:
      return 'neutral';
  }
}

export function sourceTone(source: BookingSource): BadgeTone {
  switch (source) {
    case 'whatsapp':
      return 'success';
    case 'call':
      return 'warning';
    case 'walkin':
      return 'accent';
    case 'staff':
      return 'info';
    case 'app':
    default:
      return 'neutral';
  }
}

/** "Email + WhatsApp" / "Email only" / "Off" — the reminder prefs summary. */
export function deliveryLabel(email: boolean, whatsapp: boolean): string {
  if (email && whatsapp) return 'Email + WhatsApp';
  if (email) return 'Email only';
  if (whatsapp) return 'WhatsApp only';
  return 'Off';
}
