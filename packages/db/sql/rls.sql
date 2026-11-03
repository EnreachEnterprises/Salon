-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- This file is *not* part of the drizzle migration. It is applied once the API
-- exists (block B1), because RLS without a session that sets `app.*` is inert —
-- it would only lock the seed and migration scripts out of their own tables.
--
-- The API is the first wall: every handler checks the caller's membership.
-- This file is the second wall: even a handler that forgets `where salon_id = …`
-- cannot read another salon's rows.
--
-- The API must, inside the request transaction, run:
--
--   select set_config('app.salon_id',    '<uuid>', true);
--   select set_config('app.profile_id',  '<uuid>', true);
--   select set_config('app.role',        'owner|manager|reception|staff', true);
--   select set_config('app.staff_id',    '<uuid>', true);  -- staff only
--
-- `set_config(..., true)` is transaction-local, which is why these run per
-- request on a pooled connection and cannot leak into the next request.
--
-- Rules encoded below:
--   * every tenant table: rows are visible only inside the current salon
--   * `staff` role: additionally narrowed to their own bookings, bills and
--     customers, so a stylist cannot read a colleague's earnings
--   * owner / manager / reception: whole salon (the API still hides commission
--     and monthly history from reception — RLS is coarse, the API is precise)
--   * no session settings: nothing is visible (default deny)
-- ---------------------------------------------------------------------------

create schema if not exists app;

/** Current salon, or null when the request did not set one. */
create or replace function app.current_salon_id() returns uuid
  language sql stable parallel safe
as $$
  select nullif(current_setting('app.salon_id', true), '')::uuid
$$;

/** Current caller's profile, used only to read one's own profile row. */
create or replace function app.current_profile_id() returns uuid
  language sql stable parallel safe
as $$
  select nullif(current_setting('app.profile_id', true), '')::uuid
$$;

/** owner | manager | reception | staff, or null when unset (deny). */
create or replace function app.current_role() returns text
  language sql stable parallel safe
as $$
  select nullif(current_setting('app.role', true), '')
$$;

/** The caller's `staff.id` when they are a stylist, else null. */
create or replace function app.current_staff_id() returns uuid
  language sql stable parallel safe
as $$
  select nullif(current_setting('app.staff_id', true), '')::uuid
$$;

-- ---------------------------------------------------------------------------
-- Tenant-scoped tables: `salon_id = current salon` is the whole rule.
--
-- `force row level security` matters: the API connects as the table owner and
-- an owner normally bypasses RLS. Forcing it means the policy applies to the
-- owner too, so a compromised connection string cannot skip the wall.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tenant_tables text[] := array[
    'branches',
    'salon_members',
    'staff',
    'staff_shifts',
    'service_categories',
    'services',
    'customer_notes',
    'booking_requests',
    'bookings',
    'booking_services',
    'queue_entries',
    'invoices',
    'invoice_items',
    'customers',
    'payments',
    'notifications',
    'notification_prefs',
    'notification_outbox',
    'reminders',
    'audit_log'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format('drop policy if exists %I on %I', t || '_salon_scope', t);
    execute format(
      'create policy %I on %I as permissive for all
         using (salon_id = app.current_salon_id())
         with check (salon_id = app.current_salon_id())',
      t || '_salon_scope', t
    );
  end loop;
end $$;

-- `salons` is keyed by `id`, not `salon_id`.
alter table salons enable row level security;
alter table salons force row level security;
drop policy if exists salons_scope on salons;
create policy salons_scope on salons as permissive for all
  using (id = app.current_salon_id())
  with check (id = app.current_salon_id());

-- `profiles` is global (one person, many salons). Visible only if they are a
-- member of the current salon, or it is the caller's own row.
alter table profiles enable row level security;
alter table profiles force row level security;
drop policy if exists profiles_scope on profiles;
create policy profiles_scope on profiles as permissive for all
  using (
    id = app.current_profile_id()
    or exists (
      select 1 from salon_members m
      where m.profile_id = profiles.id
        and m.salon_id = app.current_salon_id()
    )
  )
  with check (id = app.current_profile_id());

-- ---------------------------------------------------------------------------
-- Staff narrowing.
--
-- These are RESTRICTIVE policies: Postgres ANDs them with the permissive salon
-- policy above, so they can only ever take access away, never add it. Adding a
-- second permissive policy would widen access instead — a classic RLS bug.
--
-- Each policy has its own transaction-local guard (`current_role()`), so it
-- applies to nobody except a caller whose role is literally 'staff'.
-- ---------------------------------------------------------------------------

-- Own appointments only.
drop policy if exists bookings_staff_self on bookings;
create policy bookings_staff_self on bookings as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  )
  with check (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  );

-- Services on those appointments (indirect: the parent booking decides).
drop policy if exists booking_services_staff_self on booking_services;
create policy booking_services_staff_self on booking_services as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from bookings b
      where b.id = booking_services.booking_id
        and b.staff_id = app.current_staff_id()
    )
  )
  with check (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from bookings b
      where b.id = booking_services.booking_id
        and b.staff_id = app.current_staff_id()
    )
  );

-- Own place in the queue only.
drop policy if exists queue_entries_staff_self on queue_entries;
create policy queue_entries_staff_self on queue_entries as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  )
  with check (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  );

-- Own bill lines only. This is the table commissions are summed from, so it is
-- the most important one to narrow.
drop policy if exists invoice_items_staff_self on invoice_items;
create policy invoice_items_staff_self on invoice_items as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  )
  with check (
    app.current_role() is distinct from 'staff'
    or staff_id = app.current_staff_id()
  );

-- A bill is visible when at least one of its lines is the caller's.
drop policy if exists invoices_staff_self on invoices;
create policy invoices_staff_self on invoices as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from invoice_items ii
      where ii.invoice_id = invoices.id
        and ii.staff_id = app.current_staff_id()
    )
  )
  with check (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from invoice_items ii
      where ii.invoice_id = invoices.id
        and ii.staff_id = app.current_staff_id()
    )
  );

-- Payments follow their bill.
drop policy if exists payments_staff_self on payments;
create policy payments_staff_self on payments as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from invoices i
      where i.id = payments.invoice_id
        and exists (
          select 1 from invoice_items ii
          where ii.invoice_id = i.id
            and ii.staff_id = app.current_staff_id()
        )
    )
  )
  with check (
    app.current_role() is distinct from 'staff'
    or exists (
      select 1 from invoices i
      where i.id = payments.invoice_id
        and exists (
          select 1 from invoice_items ii
          where ii.invoice_id = i.id
            and ii.staff_id = app.current_staff_id()
        )
    )
  );

-- A customer is visible to a stylist only if they have served them (or are
-- their preferred stylist). Walk-ins get a booking row, so this also covers
-- walk-ins; a phone number typed by reception with no visit stays private.
drop policy if exists customers_staff_self on customers;
create policy customers_staff_self on customers as restrictive for all
  using (
    app.current_role() is distinct from 'staff'
    or preferred_staff_id = app.current_staff_id()
    or exists (
      select 1 from bookings b
      where b.customer_id = customers.id
        and b.staff_id = app.current_staff_id()
    )
  )
  with check (
    app.current_role() is distinct from 'staff'
    or preferred_staff_id = app.current_staff_id()
    or exists (
      select 1 from bookings b
      where b.customer_id = customers.id
        and b.staff_id = app.current_staff_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Verify after applying:
--
--   select tablename, rowsecurity, forcerowsecurity
--   from pg_tables where schemaname = 'public' and rowsecurity = false;
--
-- should return no tenant table.
-- ---------------------------------------------------------------------------
