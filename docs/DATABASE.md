# Database

Neon Postgres. Drizzle ORM for the schema and drizzle-kit for migrations; the
schema is the source of truth and migrations are generated from it.

- Pooled URL (`DATABASE_URL`) for the API at runtime, through
  `@neondatabase/serverless` HTTP (`drizzle-orm/neon-http`).
- Unpooled URL (`DATABASE_URL_UNPOOLED`) for `migrate.ts` and `seed.ts`, which
  use a `pg` Pool because DDL, transactions and `SET LOCAL` need a real session.

Runtime database code never imports `pg`.

## Tables (22)

| Group | Tables |
| --- | --- |
| identity | `salons`, `branches`, `profiles`, `salon_members`, `staff`, `staff_shifts` |
| catalog | `service_categories`, `services` |
| customers | `customers`, `customer_notes` |
| booking | `bookings`, `booking_services`, `booking_requests` |
| queue | `queue_entries` |
| billing | `invoices`, `invoice_items`, `payments` |
| notify | `notifications`, `notification_prefs`, `notification_outbox`, `reminders` |
| audit | `audit_log` |

Files live in `packages/db/src/schema/`, one per group, with a barrel in
`src/index.ts`.

## Invariants

1. **Money is integer paise.** Every amount column is `integer` or `bigint`,
   never `numeric`.
2. **One live booking per staff per slot.** Enforced by a partial unique index:
   `bookings_staff_slot_uq` on `(staff_id, starts_at)` where `status not in
   ('cancelled','no_show')`. Cancelling frees the slot.
3. **One payment per Razorpay payment id.** Partial unique index on
   `razorpay_payment_id where razorpay_payment_id is not null`, so a retried
   webhook cannot double-credit an invoice.
4. **History is snapshotted.** Price, duration and commission rate are copied
   onto `booking_services` and `invoice_items`. Changing a service price
   tomorrow must not rewrite yesterday's bill or commission.
5. **Business date is a column**, not a timezone conversion: `business_date` on
   `bookings`, `invoices`, `queue_entries`.
6. **Invoice numbers are per salon and gapless**, driven by
   `salons.last_invoice_sequence` in the same transaction that inserts the
   invoice.
7. **`booking_requests` is not a booking.** A WhatsApp or call request needs
   human confirmation before it takes a slot. `raw_payload` holds the webhook
   body and is purged after 30 days (PII).
8. **`notification_prefs.marketing_opt_in` defaults false.** WhatsApp marketing
   needs recorded consent.
9. **`profiles.id` is an internal uuid.** `clerk_user_id` is the unique text
   link to Clerk; every internal foreign key stays uuid.

## Row-level security

Design: `packages/db/sql/rls.sql`. Applied at B1, not at P0.

- Helpers in schema `app`: `current_salon_id()`, `current_profile_id()`,
  `current_role()`, `current_staff_id()`, reading transaction-local settings.
- `ENABLE` **and** `FORCE` RLS on every tenant table.
- One salon-scoped **permissive** policy per table.
- Staff narrowing is a **restrictive** policy per table. Restrictive policies
  AND with permissive ones. Adding a second permissive staff policy would OR and
  widen access — never do it.
- `customers` staff narrowing is booking-based (`preferred_staff_id`, or the
  customer has a booking with this staff) because walk-ins also create booking
  rows. This avoids a multi-hop policy that recurses.

## Migrations

```
npm run db:generate   # drizzle-kit generate from schema
npm run db:migrate    # applies to DATABASE_URL_UNPOOLED
npm run db:seed       # deterministic demo salon; refuses if a salon exists
```

Rules:
- Never edit an applied migration. Change the schema and generate a new one.
- `drizzle.config.ts` falls back to a placeholder URL so `generate` works
  offline. It never connects.
- Seed data is deterministic: fixed PRNG, money via `@salon/shared`, ids
  generated on the client so child rows never depend on `returning` order.

## Reporting

One `report_summary(salon_id, from, to, granularity, staff_id?)` function backs
both the owner dashboard and the staff history, so the two cannot disagree.
Plain indexed views only; no materialised views until a salon exceeds roughly
500 customers a day.
