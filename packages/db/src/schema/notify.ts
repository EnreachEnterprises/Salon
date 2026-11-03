import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { createdAt, id, nullableTs, updatedAt } from './_shared.js';
import { bookings } from './booking.js';
import { customers } from './customers.js';
import { profiles, salons } from './identity.js';
import {
  notificationCategory,
  notificationChannel,
  notificationStatus,
  outboxStatus,
  reminderKind,
  reminderStatus,
} from './enums.js';

/**
 * Every message the product sends, on every channel, logged as a row.
 *
 * This is not an audit table — it is the notification history the owner can look
 * at when a customer says "mujhe message nahi aaya". It is also how WhatsApp
 * spend is tracked: `cost_inr_paise` per send, because Meta bills per template.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: id(),
    salonId: uuid('salon_id').references(() => salons.id, { onDelete: 'cascade' }),
    /** Null for a customer-facing message, which has no app profile. */
    recipientProfileId: uuid('recipient_profile_id').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    recipientCustomerId: uuid('recipient_customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),

    recipientPhone: text('recipient_phone'),
    recipientEmail: text('recipient_email'),

    channel: notificationChannel('channel').notNull(),
    /** Utility vs marketing is decided here — it changes the WhatsApp price. */
    category: notificationCategory('category').notNull(),
    templateKey: text('template_key').notNull(),

    /** Loose polymorphic pointer: ('booking', <uuid>), ('invoice', <uuid>), … */
    relatedType: text('related_type'),
    relatedId: uuid('related_id'),

    status: notificationStatus('status').notNull().default('queued'),
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    costInrPaise: integer('cost_inr_paise').notNull().default(0),

    scheduledFor: nullableTs('scheduled_for'),
    sentAt: nullableTs('sent_at'),
    createdAt: createdAt(),
  },
  (t) => [
    index('notifications_salon_created_idx').on(t.salonId, t.createdAt),
    index('notifications_status_idx').on(t.status, t.scheduledFor),
    index('notifications_related_idx').on(t.relatedType, t.relatedId),
  ],
);

/**
 * Per-person channel choice. Every role — owner, reception, stylist — gets both
 * email and WhatsApp by default, so nobody silently misses their queue turn.
 *
 * `marketing_opt_in` starts **false** and must be actively turned on during
 * onboarding: WhatsApp treats a "you haven't visited in 30 days" nudge as
 * marketing, which legally needs consent, and costs 3-5x a utility message.
 */
export const notificationPrefs = pgTable(
  'notification_prefs',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    emailEnabled: boolean('email_enabled').notNull().default(true),
    whatsappEnabled: boolean('whatsapp_enabled').notNull().default(true),
    marketingOptIn: boolean('marketing_opt_in').notNull().default(false),

    /** Quiet hours are salon-local wall clock, e.g. 21:30 → 09:00. */
    quietHoursStart: time('quiet_hours_start', { precision: 0 }),
    quietHoursEnd: time('quiet_hours_end', { precision: 0 }),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('notification_prefs_salon_profile_uq').on(t.salonId, t.profileId)],
);

/**
 * Transactional outbox. Nothing is sent inline from a request: the request writes
 * an outbox row, a cron worker drains it and retries with backoff. A WhatsApp
 * outage must never fail a booking or a bill.
 */
export const notificationOutbox = pgTable(
  'notification_outbox',
  {
    id: id(),
    salonId: uuid('salon_id').references(() => salons.id, { onDelete: 'cascade' }),
    notificationId: uuid('notification_id').references(() => notifications.id, {
      onDelete: 'cascade',
    }),

    channel: notificationChannel('channel').notNull(),
    category: notificationCategory('category').notNull(),
    templateKey: text('template_key').notNull(),
    /** Rendered variables for the template — no HTML, no provider payloads. */
    payload: jsonb('payload').notNull().default({}),

    status: outboxStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(5),
    nextAttemptAt: nullableTs('next_attempt_at'),
    lastError: text('last_error'),
    lockedAt: nullableTs('locked_at'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('notification_outbox_status_next_idx').on(t.status, t.nextAttemptAt),
    index('notification_outbox_salon_idx').on(t.salonId, t.createdAt),
  ],
);

/**
 * A scheduled nudge tied to a customer's last visit. Kept separate from outbox
 * because it is business state ("this customer is due"), not delivery state.
 */
export const reminders = pgTable(
  'reminders',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    /** Set for an appointment reminder; null for a win-back nudge. */
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),

    kind: reminderKind('kind').notNull(),
    dueAt: nullableTs('due_at').notNull(),
    status: reminderStatus('status').notNull().default('scheduled'),

    sentNotificationId: uuid('sent_notification_id').references(() => notifications.id, {
      onDelete: 'set null',
    }),
    skippedReason: text('skipped_reason'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('reminders_salon_due_idx').on(t.salonId, t.dueAt, t.status),
    index('reminders_customer_idx').on(t.customerId, t.kind),
  ],
);

export const notificationRelations = relations(notifications, ({ one }) => ({
  salon: one(salons, { fields: [notifications.salonId], references: [salons.id] }),
  recipientProfile: one(profiles, {
    fields: [notifications.recipientProfileId],
    references: [profiles.id],
  }),
  recipientCustomer: one(customers, {
    fields: [notifications.recipientCustomerId],
    references: [customers.id],
  }),
}));

export const notificationPrefRelations = relations(notificationPrefs, ({ one }) => ({
  salon: one(salons, { fields: [notificationPrefs.salonId], references: [salons.id] }),
  profile: one(profiles, { fields: [notificationPrefs.profileId], references: [profiles.id] }),
}));

export const notificationOutboxRelations = relations(notificationOutbox, ({ one }) => ({
  salon: one(salons, { fields: [notificationOutbox.salonId], references: [salons.id] }),
  notification: one(notifications, {
    fields: [notificationOutbox.notificationId],
    references: [notifications.id],
  }),
}));

export const reminderRelations = relations(reminders, ({ one }) => ({
  salon: one(salons, { fields: [reminders.salonId], references: [salons.id] }),
  customer: one(customers, { fields: [reminders.customerId], references: [customers.id] }),
  booking: one(bookings, { fields: [reminders.bookingId], references: [bookings.id] }),
}));
