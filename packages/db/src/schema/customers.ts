import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { createdAt, id, updatedAt } from './_shared.js';
import { salons, salonMembers, staff } from './identity.js';

/**
 * A customer belongs to exactly one salon in v1. The same person visiting two
 * salons is two rows — there is no cross-tenant customer graph, by design.
 *
 * Phone is the identity: WhatsApp and a direct call both key off it, so
 * (salon_id, phone) is unique. Stored as E.164 digits without the plus.
 */
export const customers = pgTable(
  'customers',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    /** Last stylist who served them, so reception can default sensibly. */
    preferredStaffId: uuid('preferred_staff_id').references(() => staff.id, {
      onDelete: 'set null',
    }),
    /** Set on the first completed visit. Drives new vs returning. */
    firstVisitDate: date('first_visit_date', { mode: 'string' }),
    lastVisitDate: date('last_visit_date', { mode: 'string' }),
    totalVisits: integer('total_visits').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('customers_salon_phone_uq').on(t.salonId, t.phone),
    index('customers_salon_name_idx').on(t.salonId, t.fullName),
  ],
);

/**
 * Free-text notes a stylist leaves about a customer — "likes a 3 on the sides,
 * sensitive scalp". Visible to salon staff only, never to the customer.
 */
export const customerNotes = pgTable(
  'customer_notes',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    authorMemberId: uuid('author_member_id').references(() => salonMembers.id, {
      onDelete: 'set null',
    }),
    body: text('body').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('customer_notes_customer_idx').on(t.customerId)],
);

export const customerRelations = relations(customers, ({ one, many }) => ({
  salon: one(salons, { fields: [customers.salonId], references: [salons.id] }),
  preferredStaff: one(staff, { fields: [customers.preferredStaffId], references: [staff.id] }),
  notes: many(customerNotes),
}));

export const customerNoteRelations = relations(customerNotes, ({ one }) => ({
  customer: one(customers, { fields: [customerNotes.customerId], references: [customers.id] }),
  author: one(salonMembers, {
    fields: [customerNotes.authorMemberId],
    references: [salonMembers.id],
  }),
}));
