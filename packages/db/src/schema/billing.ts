import { relations, sql } from 'drizzle-orm';
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
import { services } from './catalog.js';
import { customers } from './customers.js';
import { branches, salons, salonMembers, staff } from './identity.js';
import { invoiceStatus, paymentMethod, paymentStatus } from './enums.js';

/**
 * The bill. Money is integer paise everywhere — no `numeric`, no floats, no
 * rounding drift between the screen and the report.
 *
 * `business_date` is copied onto the invoice rather than read off `created_at`,
 * because a 12:30am bill belongs to the night before.
 *
 * `invoice_number` is per salon and gapless, driven by
 * `salons.last_invoice_sequence` inside the same transaction that inserts here.
 */
export const invoices = pgTable(
  'invoices',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'restrict' }),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),

    businessDate: date('business_date', { mode: 'string' }).notNull(),
    invoiceNumber: text('invoice_number').notNull(),

    subtotalPaise: integer('subtotal_paise').notNull().default(0),
    discountPaise: integer('discount_paise').notNull().default(0),
    taxPaise: integer('tax_paise').notNull().default(0),
    totalPaise: integer('total_paise').notNull().default(0),
    paidPaise: integer('paid_paise').notNull().default(0),
    refundedPaise: integer('refunded_paise').notNull().default(0),

    status: invoiceStatus('status').notNull().default('issued'),
    notes: text('notes'),

    createdByMemberId: uuid('created_by_member_id').references(() => salonMembers.id, {
      onDelete: 'set null',
    }),
    issuedAt: nullableTs('issued_at'),
    voidedAt: nullableTs('voided_at'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('invoices_salon_number_uq').on(t.salonId, t.invoiceNumber),
    index('invoices_salon_date_idx').on(t.salonId, t.businessDate),
    index('invoices_customer_date_idx').on(t.customerId, t.businessDate),
    index('invoices_status_idx').on(t.salonId, t.status),
  ],
);

/**
 * One line per service performed. This table is the single source of truth for
 * the three numbers the whole product argues about:
 *
 *   - "services" count = number of rows here (haircut + beard = 2 services)
 *   - stylist performance = `staff_id` (the performer, not the booked stylist)
 *   - commission = `commission_paise`, computed at issue time from the
 *     post-discount line total, so discounting cannot inflate commission
 *
 * Name, price, duration and rate are all snapshotted. Changing a price or a
 * commission rate tomorrow must not change yesterday's payroll.
 */
export const invoiceItems = pgTable(
  'invoice_items',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),

    serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
    nameSnapshot: text('name_snapshot').notNull(),

    /** Who actually did it. Null only for a manual line nobody is credited for. */
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),

    quantity: integer('quantity').notNull().default(1),
    unitPricePaise: integer('unit_price_paise').notNull(),
    /** Share of the invoice discount allocated to this line, largest-remainder. */
    lineDiscountPaise: integer('line_discount_paise').notNull().default(0),
    lineTotalPaise: integer('line_total_paise').notNull(),

    durationMinutes: integer('duration_minutes').notNull().default(0),
    commissionBps: integer('commission_bps').notNull().default(0),
    commissionPaise: integer('commission_paise').notNull().default(0),

    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('invoice_items_invoice_idx').on(t.invoiceId),
    index('invoice_items_salon_staff_idx').on(t.salonId, t.staffId),
    index('invoice_items_salon_service_idx').on(t.salonId, t.serviceId),
  ],
);

/**
 * Money actually received. An invoice can have several payments (part cash, part
 * UPI) and a refund is a row with a negative amount and `status = refunded` — so
 * revenue is always `sum(payments.amount_paise)` and never inferred.
 */
export const payments = pgTable(
  'payments',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),

    amountPaise: integer('amount_paise').notNull(),
    method: paymentMethod('method').notNull().default('cash'),
    status: paymentStatus('status').notNull().default('captured'),

    /** Razorpay identifiers, null for cash and UPI-scan payments. */
    razorpayOrderId: text('razorpay_order_id'),
    razorpayPaymentId: text('razorpay_payment_id'),
    reference: text('reference'),

    capturedAt: nullableTs('captured_at'),
    refundedAt: nullableTs('refunded_at'),
    failureReason: text('failure_reason'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('payments_invoice_idx').on(t.invoiceId),
    index('payments_salon_created_idx').on(t.salonId, t.createdAt),
    /** A Razorpay payment can only ever be recorded once. Cash rows skip it. */
    uniqueIndex('payments_razorpay_payment_uq')
      .on(t.razorpayPaymentId)
      .where(sql`${t.razorpayPaymentId} is not null`),
  ],
);

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  salon: one(salons, { fields: [invoices.salonId], references: [salons.id] }),
  branch: one(branches, { fields: [invoices.branchId], references: [branches.id] }),
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceItems.invoiceId], references: [invoices.id] }),
  service: one(services, { fields: [invoiceItems.serviceId], references: [services.id] }),
  staff: one(staff, { fields: [invoiceItems.staffId], references: [staff.id] }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  salon: one(salons, { fields: [payments.salonId], references: [salons.id] }),
}));
