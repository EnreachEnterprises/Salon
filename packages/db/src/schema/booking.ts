import { relations, sql } from 'drizzle-orm';
import {
  date,
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
import { services } from './catalog.js';
import { customers } from './customers.js';
import { branches, salons, salonMembers, staff } from './identity.js';
import {
  bookingRequestChannel,
  bookingRequestStatus,
  bookingSource,
  bookingStatus,
} from './enums.js';

/**
 * One appointment, on one business date, at one clock time, performed by one
 * stylist. Multiple services on the appointment are child rows.
 *
 * `business_date` is stored explicitly rather than derived from `created_at`:
 * a 1am bill belongs to the night before's takings, and a `date` column makes
 * every report timezone-proof.
 */
export const bookings = pgTable(
  'bookings',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    /** The stylist who will perform it. Attribution on the bill can differ. */
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'restrict' }),

    businessDate: date('business_date', { mode: 'string' }).notNull(),
    startTime: time('start_time', { precision: 0 }).notNull(),
    endTime: time('end_time', { precision: 0 }).notNull(),

    status: bookingStatus('status').notNull().default('booked'),
    source: bookingSource('source').notNull().default('app'),
    notes: text('notes'),

    createdByMemberId: uuid('created_by_member_id').references(() => salonMembers.id, {
      onDelete: 'set null',
    }),

    confirmedAt: nullableTs('confirmed_at'),
    startedAt: nullableTs('started_at'),
    completedAt: nullableTs('completed_at'),
    cancelledAt: nullableTs('cancelled_at'),
    cancelReason: text('cancel_reason'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('bookings_salon_date_staff_idx').on(t.salonId, t.businessDate, t.staffId),
    index('bookings_customer_idx').on(t.customerId, t.businessDate),
    index('bookings_salon_status_idx').on(t.salonId, t.status),
    /**
     * A stylist cannot be in two places at 18:30. Cancelled and no-show rows are
     * excluded so a freed slot can be rebooked. Overlaps of *differing* start
     * times are still caught in the API against end_time.
     */
    uniqueIndex('bookings_staff_slot_uq')
      .on(t.staffId, t.businessDate, t.startTime)
      .where(sql`${t.status} not in ('cancelled', 'no_show')`),
  ],
);

/**
 * The services on an appointment. Name, price and duration are snapshotted so a
 * later price change does not rewrite history.
 */
export const bookingServices = pgTable(
  'booking_services',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
    nameSnapshot: text('name_snapshot').notNull(),
    durationMinutesSnapshot: integer('duration_minutes_snapshot').notNull(),
    pricePaiseSnapshot: integer('price_paise_snapshot').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('booking_services_booking_idx').on(t.bookingId)],
);

/**
 * A request that arrived from outside the app — a WhatsApp button flow, a missed
 * call, or reception quoting someone at the desk. It is deliberately NOT a
 * booking: nothing is confirmed until a human taps confirm, so a bot can never
 * take a slot away from a real customer.
 */
export const bookingRequests = pgTable(
  'booking_requests',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'restrict' }),
    /** Null when the number is not a known customer yet. */
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    requestedName: text('requested_name'),
    requestedPhone: text('requested_phone').notNull(),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    requestedDate: date('requested_date', { mode: 'string' }),
    requestedTime: time('requested_time', { precision: 0 }),
    serviceIds: uuid('service_ids').array().notNull().default(sql`'{}'::uuid[]`),

    channel: bookingRequestChannel('channel').notNull().default('whatsapp'),
    status: bookingRequestStatus('status').notNull().default('pending'),

    confirmedBookingId: uuid('confirmed_booking_id').references(() => bookings.id, {
      onDelete: 'set null',
    }),
    handledByMemberId: uuid('handled_by_member_id').references(() => salonMembers.id, {
      onDelete: 'set null',
    }),
    declineReason: text('decline_reason'),

    /** Raw webhook body, kept 30 days for support then purged. Contains PII. */
    rawPayload: jsonb('raw_payload'),

    createdAt: createdAt(),
    expiresAt: nullableTs('expires_at'),
    resolvedAt: nullableTs('resolved_at'),
  },
  (t) => [
    index('booking_requests_salon_status_idx').on(t.salonId, t.status, t.createdAt),
    index('booking_requests_phone_idx').on(t.salonId, t.requestedPhone),
  ],
);

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  salon: one(salons, { fields: [bookings.salonId], references: [salons.id] }),
  branch: one(branches, { fields: [bookings.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
  staff: one(staff, { fields: [bookings.staffId], references: [staff.id] }),
  services: many(bookingServices),
}));

export const bookingServiceRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, { fields: [bookingServices.bookingId], references: [bookings.id] }),
  service: one(services, { fields: [bookingServices.serviceId], references: [services.id] }),
}));

export const bookingRequestRelations = relations(bookingRequests, ({ one }) => ({
  salon: one(salons, { fields: [bookingRequests.salonId], references: [salons.id] }),
  customer: one(customers, {
    fields: [bookingRequests.customerId],
    references: [customers.id],
  }),
  staff: one(staff, { fields: [bookingRequests.staffId], references: [staff.id] }),
  confirmedBooking: one(bookings, {
    fields: [bookingRequests.confirmedBookingId],
    references: [bookings.id],
  }),
}));
