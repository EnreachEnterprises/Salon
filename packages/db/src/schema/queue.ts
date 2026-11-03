import { relations } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { createdAt, id, nullableTs, updatedAt } from './_shared.js';
import { bookings } from './booking.js';
import { customers } from './customers.js';
import { branches, salons, staff } from './identity.js';
import { queueStatus } from './enums.js';

/**
 * The live queue: who is in the shop right now, in order, and with whom.
 *
 * A queue entry can be born from a booking (customer arrived for their slot) or
 * from nowhere at all (a walk-in). That is why `booking_id` is nullable and
 * `customer_id` is nullable too — a walk-in may give only a first name.
 *
 * `token` is what the customer hears when they ask "kitna time lagega?".
 * It is unique per salon per day, so the number on the screen never repeats.
 */
export const queueEntries = pgTable(
  'queue_entries',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'restrict' }),
    businessDate: date('business_date', { mode: 'string' }).notNull(),

    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    /** Denormalised so a walk-in with no customer row still shows a name. */
    customerName: text('customer_name').notNull(),
    customerPhone: text('customer_phone'),

    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),

    token: integer('token').notNull(),
    /** Manual ordering inside the waiting list; lower goes first. */
    position: integer('position').notNull().default(0),
    status: queueStatus('status').notNull().default('waiting'),

    estimatedWaitMinutes: integer('estimated_wait_minutes'),
    joinedAt: nullableTs('joined_at'),
    startedAt: nullableTs('started_at'),
    finishedAt: nullableTs('finished_at'),
    /** Set when a customer is skipped and the queue moves on without them. */
    skippedReason: text('skipped_reason'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('queue_entries_salon_date_token_uq').on(t.salonId, t.businessDate, t.token),
    index('queue_entries_salon_date_status_idx').on(t.salonId, t.businessDate, t.status),
    index('queue_entries_staff_date_idx').on(t.staffId, t.businessDate),
    index('queue_entries_booking_idx').on(t.bookingId),
  ],
);

export const queueEntryRelations = relations(queueEntries, ({ one }) => ({
  salon: one(salons, { fields: [queueEntries.salonId], references: [salons.id] }),
  branch: one(branches, { fields: [queueEntries.branchId], references: [branches.id] }),
  customer: one(customers, { fields: [queueEntries.customerId], references: [customers.id] }),
  staff: one(staff, { fields: [queueEntries.staffId], references: [staff.id] }),
  booking: one(bookings, { fields: [queueEntries.bookingId], references: [bookings.id] }),
}));
