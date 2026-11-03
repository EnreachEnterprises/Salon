import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { createdAt, id } from './_shared.js';
import { salons } from './identity.js';

/**
 * Who did what, to which row, and what it looked like before and after.
 *
 * Required for the things money and trust depend on: a cancelled booking, a
 * voided bill, a changed commission rate, a removed staff member. `before` and
 * `after` are jsonb snapshots of only the changed fields — never the whole row,
 * so customer phone numbers are not copied into a second table.
 *
 * Rows are append-only. Nothing in the app updates or deletes here.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    salonId: uuid('salon_id').references(() => salons.id, { onDelete: 'cascade' }),

    /** Null for system actions (cron, webhook) where no human acted. */
    actorProfileId: uuid('actor_profile_id'),
    actorRole: text('actor_role'),
    /** 'api' | 'cron' | 'webhook' | 'system' */
    actorType: text('actor_type').notNull().default('api'),

    /** 'booking.cancel', 'invoice.void', 'staff.update', … */
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id'),

    before: jsonb('before'),
    after: jsonb('after'),
    /** Request id, so one user action spread over rows can be traced as a unit. */
    requestId: text('request_id'),

    createdAt: createdAt(),
  },
  (t) => [
    index('audit_log_salon_created_idx').on(t.salonId, t.createdAt),
    index('audit_log_entity_idx').on(t.entityType, t.entityId),
  ],
);
