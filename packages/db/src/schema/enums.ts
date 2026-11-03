import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Every enum lives here so the database, the API and the app agree on the exact
 * spelling of a value. Adding a value later means a new migration — that is the
 * point. See docs/DATA_MODEL.md.
 */

/** Role inside a salon. `owner` is the only role that may see commission. */
export const memberRole = pgEnum('member_role', ['owner', 'manager', 'reception', 'staff']);

/** Account state on the membership, not on the profile. */
export const memberStatus = pgEnum('member_status', ['invited', 'active', 'suspended']);

/**
 * Where a booking came from. `staff` means a stylist entered it after a direct
 * phone call, so the app reflects reality without reception doing it twice.
 */
export const bookingSource = pgEnum('booking_source', ['app', 'whatsapp', 'call', 'walkin', 'staff']);

export const bookingStatus = pgEnum('booking_status', [
  'booked',
  'confirmed',
  'in_service',
  'completed',
  'cancelled',
  'no_show',
]);

/** A WhatsApp or call request that reception must confirm in one tap. */
export const bookingRequestChannel = pgEnum('booking_request_channel', [
  'whatsapp',
  'call',
  'manual',
]);

export const bookingRequestStatus = pgEnum('booking_request_status', [
  'pending',
  'confirmed',
  'declined',
  'expired',
]);

export const queueStatus = pgEnum('queue_status', [
  'waiting',
  'in_service',
  'done',
  'skipped',
  'cancelled',
]);

export const invoiceStatus = pgEnum('invoice_status', [
  'draft',
  'issued',
  'partially_paid',
  'paid',
  'void',
]);

export const paymentMethod = pgEnum('payment_method', ['cash', 'upi', 'card', 'razorpay', 'other']);

export const paymentStatus = pgEnum('payment_status', [
  'pending',
  'captured',
  'failed',
  'refunded',
]);

export const notificationChannel = pgEnum('notification_channel', ['email', 'whatsapp', 'push']);

/**
 * WhatsApp pricing hinges on this split: utility is cheap, marketing is 3-5x.
 * A reminder after 30 days is a marketing message by Meta's definition, even
 * though it feels transactional to the salon.
 */
export const notificationCategory = pgEnum('notification_category', [
  'booking_request',
  'booking_confirmed',
  'booking_changed',
  'queue_turn',
  'receipt',
  'commission',
  'reminder',
  'weekly_report',
  'monthly_report',
  'system',
]);

export const notificationStatus = pgEnum('notification_status', [
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'skipped',
]);

export const outboxStatus = pgEnum('outbox_status', [
  'pending',
  'processing',
  'sent',
  'failed',
  'dead',
]);

export const reminderKind = pgEnum('reminder_kind', [
  'day_before',
  'same_day',
  'thirty_day',
  'follow_up',
]);

export const reminderStatus = pgEnum('reminder_status', [
  'scheduled',
  'sent',
  'cancelled',
  'skipped',
]);
