import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  time,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { createdAt, id, nullableTs, updatedAt } from './_shared.js';
import { memberRole, memberStatus } from './enums.js';

/**
 * Tenancy root. One row per salon. A salon is the isolation boundary: a query
 * without a salon_id is a bug, and Postgres RLS enforces the same rule.
 */
export const salons = pgTable(
  'salons',
  {
    id: id(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    timezone: text('timezone').notNull().default('Asia/Kolkata'),
    currency: text('currency').notNull().default('INR'),

    phone: text('phone'),
    email: text('email'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),

    /** GST is off by default; the columns exist so enabling it is not a migration. */
    gstin: text('gstin'),
    gstEnabled: boolean('gst_enabled').notNull().default(false),
    gstRateBps: integer('gst_rate_bps').notNull().default(1800),

    logoKey: text('logo_key'),
    whatsappNumber: text('whatsapp_number'),

    /** Null until the onboarding wizard finishes. Gates the whole app. */
    onboardingCompletedAt: nullableTs('onboarding_completed_at'),

    /** Invoice numbers are per-salon and gapless; this is the counter. */
    lastInvoiceSequence: integer('last_invoice_sequence').notNull().default(0),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('salons_slug_uq').on(t.slug)],
);

export const branches = pgTable(
  'branches',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Main'),
    phone: text('phone'),
    addressLine1: text('address_line1'),
    city: text('city'),
    state: text('state'),
    pincode: text('pincode'),
    isPrimary: boolean('is_primary').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('branches_salon_name_uq').on(t.salonId, t.name)],
);

/**
 * A person, independent of any salon. `clerk_user_id` is the only link to the
 * auth provider; roles and tenancy live in `salon_members`, never in Clerk orgs.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: id(),
    clerkUserId: text('clerk_user_id').notNull(),
    fullName: text('full_name'),
    /** E.164 without the plus, matching WhatsApp's own identifier format. */
    phone: text('phone'),
    email: text('email'),
    avatarKey: text('avatar_key'),
    locale: text('locale').notNull().default('en-IN'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('profiles_clerk_user_uq').on(t.clerkUserId),
    index('profiles_phone_idx').on(t.phone),
    index('profiles_email_idx').on(t.email),
  ],
);

/** Which salons a profile belongs to, and as what. Authoritative for permission. */
export const salonMembers = pgTable(
  'salon_members',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: memberRole('role').notNull().default('staff'),
    status: memberStatus('status').notNull().default('active'),
    invitedByMemberId: uuid('invited_by_member_id'),
    joinedAt: nullableTs('joined_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('salon_members_salon_profile_uq').on(t.salonId, t.profileId),
    index('salon_members_profile_idx').on(t.profileId),
    index('salon_members_salon_role_idx').on(t.salonId, t.role),
  ],
);

/**
 * A bookable person who performs services — the stylist/barber.
 *
 * `member_id` is nullable on purpose: v1 allows a staff row with no login (a
 * part-timer reception books for), but only staff with a member row can open
 * the staff screens. Commission is basis points, never a percentage float.
 */
export const staff = pgTable(
  'staff',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    memberId: uuid('member_id').references(() => salonMembers.id, { onDelete: 'set null' }),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    /** Chip token used in the queue so a stylist is recognisable at a glance. */
    colorToken: text('color_token').notNull().default('brass'),
    commissionBps: integer('commission_bps').notNull().default(0),
    defaultServiceMinutes: integer('default_service_minutes').notNull().default(30),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('staff_salon_active_idx').on(t.salonId, t.isActive),
    uniqueIndex('staff_salon_member_uq')
      .on(t.salonId, t.memberId)
      .where(sql`${t.memberId} is not null`),
  ],
);

/**
 * Required for utilization to mean anything. Without a shift row the API returns
 * `null` utilization rather than a misleading 0%.
 */
export const staffShifts = pgTable(
  'staff_shifts',
  {
    id: id(),
    salonId: uuid('salon_id')
      .notNull()
      .references(() => salons.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => staff.id, { onDelete: 'cascade' }),
    businessDate: date('business_date', { mode: 'string' }).notNull(),
    /** '10:00:00' — precision 0 keeps it to the minute. */
    startsAt: time('starts_at', { precision: 0 }).notNull(),
    endsAt: time('ends_at', { precision: 0 }).notNull(),
    breakMinutes: integer('break_minutes').notNull().default(0),
    isDayOff: boolean('is_day_off').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('staff_shifts_staff_date_uq').on(t.staffId, t.businessDate),
    index('staff_shifts_salon_date_idx').on(t.salonId, t.businessDate),
  ],
);

export const salonRelations = relations(salons, ({ many }) => ({
  branches: many(branches),
  members: many(salonMembers),
  staff: many(staff),
  shifts: many(staffShifts),
}));

export const salonMemberRelations = relations(salonMembers, ({ one }) => ({
  salon: one(salons, { fields: [salonMembers.salonId], references: [salons.id] }),
  profile: one(profiles, { fields: [salonMembers.profileId], references: [profiles.id] }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  salon: one(salons, { fields: [staff.salonId], references: [salons.id] }),
  member: one(salonMembers, { fields: [staff.memberId], references: [salonMembers.id] }),
  shifts: many(staffShifts),
}));

export const staffShiftRelations = relations(staffShifts, ({ one }) => ({
  staff: one(staff, { fields: [staffShifts.staffId], references: [staff.id] }),
  salon: one(salons, { fields: [staffShifts.salonId], references: [salons.id] }),
}));
