import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { createdAt, id, updatedAt } from './_shared.js';
import { salons } from './identity.js';

/** Grouping only. Nobody bills a category; they bill a service. */
export const serviceCategories = pgTable(
  'service_categories',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('service_categories_salon_name_uq').on(t.salonId, t.name)],
);

/**
 * Price and duration live here, and both are snapshotted onto every booking line
 * and invoice line. Raising a price must never rewrite yesterday's bills.
 *
 * `durationMinutes` is what utilization math uses, so it has to be honest.
 */
export const services = pgTable(
  'services',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => serviceCategories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(30),
    pricePaise: integer('price_paise').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('services_salon_active_idx').on(t.salonId, t.isActive),
    index('services_category_idx').on(t.categoryId),
  ],
);

export const serviceCategoryRelations = relations(serviceCategories, ({ one, many }) => ({
  salon: one(salons, { fields: [serviceCategories.salonId], references: [salons.id] }),
  services: many(services),
}));

export const serviceRelations = relations(services, ({ one }) => ({
  salon: one(salons, { fields: [services.salonId], references: [salons.id] }),
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
}));
