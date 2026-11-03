/**
 * Seed for local development and for the demo build.
 *
 * Creates one complete salon — Raju Hair Studio — with four stylists, four
 * services, forty customers and ninety days of paid bills, so every screen has
 * something real to show: the queue, a customer's six-month history, the owner's
 * monthly report and per-stylist commission.
 *
 * Rules this file obeys on purpose:
 *   - money is integer paise, never a float
 *   - commission is computed with the same `@salon/shared` helpers the API will
 *     use, so the seed cannot disagree with the product about a number
 *   - a discount is allocated pro-rata to the lines it applies to, so commission
 *     is never paid on money the salon did not collect
 *   - the PRNG is fixed, so two runs against two empty databases produce the
 *     same numbers and a screenshot is reproducible
 *
 * Run from the repo root: `npm run db:seed`.
 * It refuses to run twice (checks the salon slug) and does nothing else.
 */

import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { allocateDiscountProRata, commissionPaise as commissionForLine } from '@salon/shared';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema/index.js';

const SALON_SLUG = 'raju-hair-studio';
const SEED = 20261103;

/** Small deterministic PRNG — same seed, same salon, every time. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;
const between = (min: number, max: number): number => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number): boolean => rand() < p;

/** Business dates are Asia/Kolkata dates, independent of where this runs. */
const IST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function businessDateDaysAgo(days: number): string {
  return IST_DATE.format(new Date(Date.now() - days * 86_400_000));
}

/** A timestamp that belongs on that business day, near closing time in IST. */
function istTimestamp(businessDate: string, time = '14:30:00'): Date {
  return new Date(`${businessDate}T${time}+05:30`);
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  console.error(
    'DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.\n' +
      'Copy packages/db/.env.example to packages/db/.env and fill it in.',
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
const db = drizzle(pool, { schema });

const customers = [
  'Aarav Deshmukh',
  'Isha Kulkarni',
  'Rohan Jadhav',
  'Sneha Patil',
  'Vikram Shinde',
  'Priya Nair',
  'Aditya Joshi',
  'Meera Kelkar',
  'Sahil Gaikwad',
  'Ananya Rao',
  'Karan Mehta',
  'Pooja Bhosale',
  'Nikhil Pawar',
  'Ritika Shah',
  'Amit Chavan',
  'Tanvi Deshpande',
  'Siddharth Kale',
  'Neha Salunkhe',
  'Yash Thorat',
  'Shreya Mane',
  'Omkar Kadam',
  'Divya Iyer',
  'Harsh Vardhan',
  'Kavya Menon',
  'Pranav Gokhale',
  'Aarti More',
  'Varun Naik',
  'Simran Kaur',
  'Akash Sathe',
  'Bhavna Rane',
  'Devendra Patil',
  'Ruchi Agarwal',
  'Manish Tiwari',
  'Sonal Wagh',
  'Tejas Bhide',
  'Ira Sinha',
  'Nitin Sawant',
  'Payal Jain',
  'Gaurav Kulkarni',
  'Ayesha Khan',
] as const;

const serviceSeed = [
  { name: 'Haircut', durationMinutes: 30, pricePaise: 20_000, category: 'Hair', sortOrder: 1 },
  { name: 'Beard Trim', durationMinutes: 15, pricePaise: 10_000, category: 'Beard & Shave', sortOrder: 2 },
  { name: 'Hair Colour', durationMinutes: 60, pricePaise: 60_000, category: 'Colour', sortOrder: 3 },
  { name: 'Facial', durationMinutes: 45, pricePaise: 80_000, category: 'Skin', sortOrder: 4 },
] as const;

const staffSeed = [
  { displayName: 'Raju Patil', commissionBps: 3000, colorToken: 'brass', sortOrder: 1 },
  { displayName: 'Sameer Shaikh', commissionBps: 2500, colorToken: 'terracotta', sortOrder: 2 },
  { displayName: 'Imran Qureshi', commissionBps: 2500, colorToken: 'ink', sortOrder: 3 },
  { displayName: 'Pooja Sawant', commissionBps: 2000, colorToken: 'success', sortOrder: 4 },
] as const;

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main(): Promise<void> {
  const existing = await db.select({ id: schema.salons.id }).from(schema.salons).limit(1);
  if (existing.length > 0) {
    console.log(
      `Database already has a salon — refusing to seed twice. Drop the data or point at a fresh database.`,
    );
    return;
  }

  const now = new Date();
  const today = businessDateDaysAgo(0);

  await db.transaction(async (tx) => {
    // ---------------------------------------------------------------- salon
    const [salon] = await tx
      .insert(schema.salons)
      .values({
        name: 'Raju Hair Studio',
        slug: SALON_SLUG,
        timezone: 'Asia/Kolkata',
        phone: '9820011223',
        email: 'hello@rajuhairstudio.in',
        addressLine1: 'Shop 4, Ganesh Plaza',
        addressLine2: 'Karve Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        whatsappNumber: '9820011223',
        onboardingCompletedAt: now,
      })
      .returning({ id: schema.salons.id });

    if (!salon) throw new Error('salon insert returned nothing');

    const salonId = salon.id;

    const [branch] = await tx
      .insert(schema.branches)
      .values({
        salonId,
        name: 'Main',
        phone: '9820011223',
        addressLine1: 'Shop 4, Ganesh Plaza',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        isPrimary: true,
      })
      .returning({ id: schema.branches.id });

    if (!branch) throw new Error('branch insert returned nothing');

    const branchId = branch.id;

    // ------------------------------------------------------------- people
    const people = [
      { fullName: 'Raju Patil', phone: '9820011223', email: 'raju@rajuhairstudio.in', role: 'owner' },
      { fullName: 'Neha Kulkarni', phone: '9820011224', email: 'neha@rajuhairstudio.in', role: 'reception' },
      { fullName: 'Sameer Shaikh', phone: '9820011225', email: 'sameer@rajuhairstudio.in', role: 'staff' },
      { fullName: 'Imran Qureshi', phone: '9820011226', email: 'imran@rajuhairstudio.in', role: 'staff' },
      { fullName: 'Pooja Sawant', phone: '9820011227', email: 'pooja@rajuhairstudio.in', role: 'staff' },
    ] as const;

    // Same reason as staff and customers: people are paired to ids by
    // construction, never by the order a multi-row `returning` comes back in.
    const profileRows = people.map((person) => ({ id: randomUUID(), ...person }));

    await tx.insert(schema.profiles).values(
      profileRows.map((person, index) => ({
        id: person.id,
        clerkUserId: `seed_${SALON_SLUG}_${index + 1}`,
        fullName: person.fullName,
        phone: person.phone,
        email: person.email,
      })),
    );

    const memberRows = people.map((person) => ({ id: randomUUID(), ...person }));

    await tx.insert(schema.salonMembers).values(
      memberRows.map((member, index) => ({
        id: member.id,
        salonId,
        profileId: profileRows[index]!.id,
        role: member.role,
        status: 'active' as const,
        joinedAt: now,
      })),
    );

    await tx.insert(schema.notificationPrefs).values(
      profileRows.map((profile) => ({
        salonId,
        profileId: profile.id,
        emailEnabled: true,
        whatsappEnabled: true,
        // Marketing is consent, not a default. The owner turns it on for
        // customers who ask; staff mail is transactional only.
        marketingOptIn: false,
      })),
    );

    const ownerMember = memberRows[0]!;

    // Ids are generated here so a stylist keeps its row no matter what order a
    // multi-row `returning` comes back in — commission depends on the pairing.
    const staffRows = staffSeed.map((member) => ({
      id: randomUUID(),
      displayName: member.displayName,
      commissionBps: member.commissionBps,
    }));

    await tx.insert(schema.staff).values(
      staffSeed.map((s, index) => ({
        id: staffRows[index]!.id,
        salonId,
        // Only the owner and the three stylists have logins; reception is
        // a member of the salon but performs no services.
        memberId: index === 0 ? ownerMember.id : memberRows[index + 1]?.id ?? null,
        displayName: s.displayName,
        phone: people[index]!.phone,
        colorToken: s.colorToken,
        commissionBps: s.commissionBps,
        defaultServiceMinutes: 30,
        sortOrder: s.sortOrder,
      })),
    );

    // ------------------------------------------------------------- catalog
    const categoryNames = [...new Set(serviceSeed.map((s) => s.category))];
    const categoryRows = await tx
      .insert(schema.serviceCategories)
      .values(
        categoryNames.map((name, index) => ({ salonId, name, sortOrder: index + 1 })),
      )
      .returning({ id: schema.serviceCategories.id, name: schema.serviceCategories.name });

    const categoryIdByName = new Map(categoryRows.map((c) => [c.name, c.id]));

    const serviceRows = await tx
      .insert(schema.services)
      .values(
        serviceSeed.map((s) => ({
          salonId,
          categoryId: categoryIdByName.get(s.category) ?? null,
          name: s.name,
          durationMinutes: s.durationMinutes,
          pricePaise: s.pricePaise,
          sortOrder: s.sortOrder,
        })),
      )
      .returning({
        id: schema.services.id,
        name: schema.services.name,
        durationMinutes: schema.services.durationMinutes,
        pricePaise: schema.services.pricePaise,
      });

    const serviceById = new Map(serviceRows.map((s) => [s.id, s]));

    // ----------------------------------------------------------- customers
    // Ids generated here as well: the queue and the 90-day history both look
    // customers up by index, and a returning row order would be a silent bug.
    const customerRows = customers.map((fullName) => ({ id: randomUUID(), fullName }));

    await tx.insert(schema.customers).values(
      customers.map((fullName, index) => ({
        id: customerRows[index]!.id,
        salonId,
        fullName,
        // 9800000001 … 9800000040, unique, E.164 digits without the plus.
        phone: `98000000${String(index + 1).padStart(2, '0')}`,
        email: null,
        totalVisits: 0,
      })),
    );

    // -------------------------------------------------------------- shifts
    // 90 days of 10:00–20:00 with a 30-minute break. One stylist gets a day off
    // each day, rotating, so utilization has a realistic denominator.
    const shiftValues = [] as (typeof schema.staffShifts.$inferInsert)[];
    for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
      const businessDate = businessDateDaysAgo(dayOffset);
      const dayOff = (89 - dayOffset) % staffRows.length;
      staffRows.forEach((member, index) => {
        shiftValues.push({
          salonId,
          staffId: member.id,
          businessDate,
          startsAt: '10:00:00',
          endsAt: '20:00:00',
          breakMinutes: 30,
          isDayOff: index === dayOff,
        });
      });
    }
    for (const batch of chunk(shiftValues, 400)) {
      await tx.insert(schema.staffShifts).values(batch);
    }

    // --------------------------------------------- bookings, bills, payments
    //
    // Slots are generated on a 30-minute grid and a stylist takes at most one
    // booking per slot, which keeps the `(staff, date, start_time)` unique index
    // satisfied without any retry logic.
    const bookingServiceValues = [] as (typeof schema.bookingServices.$inferInsert)[];
    const invoiceItemValues = [] as (typeof schema.invoiceItems.$inferInsert)[];
    const paymentValues = [] as (typeof schema.payments.$inferInsert)[];

    // Per-line data needs the parent ids, so build in memory first and insert
    // in dependency order afterwards.
    type PendingInvoice = {
      // Ids are always present on these two because they are generated in this
      // file; the child rows depend on that being a fact, not an option.
      booking: Omit<typeof schema.bookings.$inferInsert, 'id'> & { id: string };
      services: Omit<typeof schema.bookingServices.$inferInsert, 'bookingId'>[];
      invoice: Omit<typeof schema.invoices.$inferInsert, 'id'> & { id: string };
      items: Omit<typeof schema.invoiceItems.$inferInsert, 'invoiceId'>[];
      payment: Omit<typeof schema.payments.$inferInsert, 'invoiceId'>;
    };

    const pending: PendingInvoice[] = [];
    let invoiceSequence = 0;

    // A customer's first visit should be their earliest bill, so keep track.
    const firstVisit = new Map<string, string>();
    const lastVisit = new Map<string, string>();
    const visitCount = new Map<string, number>();

    for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
      const businessDate = businessDateDaysAgo(dayOffset);
      let invoiceSequenceForDay = 0;

      // 10:00 → 19:30, one candidate slot every 30 minutes.
      for (let slot = 0; slot < 20; slot += 1) {
        if (!chance(dayOffset === 0 ? 0.35 : 0.58)) continue;

        const member = staffRows[(slot + dayOffset) % staffRows.length]!;
        const startMinutes = 10 * 60 + slot * 30;
        const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(
          startMinutes % 60,
        ).padStart(2, '0')}:00`;

        // Pick 1–3 services, mostly one.
        const serviceCount = chance(0.15) ? 3 : chance(0.4) ? 2 : 1;
        const chosen = new Set<string>();
        while (chosen.size < serviceCount) {
          chosen.add(pick(serviceRows).id);
        }
        const pickedServices = [...chosen].map((id) => serviceById.get(id)!);

        const totalMinutes = pickedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
        const endMinutes = startMinutes + Math.max(totalMinutes, 30);
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(
          endMinutes % 60,
        ).padStart(2, '0')}:00`;

        const customer = pick(customerRows);
        const customerKey = customer.id;

        // 12% of visits get a discount, most commonly a loyal-customer 10%.
        const discountOnSubtotal = chance(0.12) ? between(5, 15) : 0;
        const subtotal = pickedServices.reduce((sum, s) => sum + s.pricePaise, 0);
        const discount = Math.round((subtotal * discountOnSubtotal) / 100);

        const lines = pickedServices.map((s, index) => ({
          id: String(index),
          amountPaise: s.pricePaise,
        }));
        const discountByLine = allocateDiscountProRata(lines, discount);

        const itemRows = pickedServices.map((s, index) => {
          const lineDiscount = discountByLine[String(index)] ?? 0;
          const lineTotal = s.pricePaise - lineDiscount;
          return {
            salonId,
            serviceId: s.id,
            nameSnapshot: s.name,
            staffId: member.id,
            quantity: 1,
            unitPricePaise: s.pricePaise,
            lineDiscountPaise: lineDiscount,
            lineTotalPaise: lineTotal,
            durationMinutes: s.durationMinutes,
            commissionBps: member.commissionBps,
            commissionPaise: commissionForLine(lineTotal, member.commissionBps),
            sortOrder: index,
          } satisfies Omit<typeof schema.invoiceItems.$inferInsert, 'invoiceId'>;
        });

        const invoiceNumber = `INV-${String(invoiceSequence + 1).padStart(5, '0')}`;
        invoiceSequence += 1;
        invoiceSequenceForDay += 1;

        const bookedAt = istTimestamp(businessDate, '04:00:00');
        const finishedAt = istTimestamp(businessDate, '14:30:00');

        const booking = {
          id: randomUUID(),
          salonId,
          branchId,
          customerId: customer.id,
          staffId: member.id,
          businessDate,
          startTime,
          endTime,
          status: 'completed' as const,
          source: pick(['app', 'whatsapp', 'call', 'walkin', 'staff'] as const),
          createdByMemberId: ownerMember.id,
          confirmedAt: bookedAt,
          startedAt: bookedAt,
          completedAt: finishedAt,
          createdAt: bookedAt,
          updatedAt: finishedAt,
        } satisfies typeof schema.bookings.$inferInsert;

        const bookingServiceRows = pickedServices.map((s, index) => ({
          salonId,
          nameSnapshot: s.name,
          serviceId: s.id,
          durationMinutesSnapshot: s.durationMinutes,
          pricePaiseSnapshot: s.pricePaise,
          sortOrder: index,
        }));

        const invoice = {
          id: randomUUID(),
          salonId,
          branchId,
          customerId: customer.id,
          businessDate,
          invoiceNumber,
          subtotalPaise: subtotal,
          discountPaise: discount,
          taxPaise: 0,
          totalPaise: subtotal - discount,
          paidPaise: subtotal - discount,
          refundedPaise: 0,
          status: 'paid' as const,
          createdByMemberId: memberRows[1]!.id,
          issuedAt: finishedAt,
          createdAt: finishedAt,
          updatedAt: finishedAt,
        };

        const payment = {
          salonId,
          amountPaise: subtotal - discount,
          method: pick(['cash', 'upi', 'card'] as const),
          status: 'captured' as const,
          capturedAt: finishedAt,
          createdAt: finishedAt,
          updatedAt: finishedAt,
        };

        pending.push({
          booking,
          services: bookingServiceRows,
          invoice,
          items: itemRows,
          payment,
        });

        const isFirst = !firstVisit.has(customerKey);
        if (isFirst) firstVisit.set(customerKey, businessDate);
        lastVisit.set(customerKey, businessDate);
        visitCount.set(customerKey, (visitCount.get(customerKey) ?? 0) + 1);

        // Keep the day realistic: ~8–14 bills, not 20.
        if (invoiceSequenceForDay >= 14) break;
      }
    }

    // Insert in dependency order. Bookings and invoices carry an id generated
    // here, so the child rows can point at the parent without relying on the
    // order of a multi-row `returning` — which Postgres does not promise.
    for (const batch of chunk(pending, 300)) {
      await tx.insert(schema.bookings).values(batch.map((p) => p.booking));
      for (const parent of batch) {
        for (const service of parent.services) {
          bookingServiceValues.push({ ...service, bookingId: parent.booking.id });
        }
      }
    }

    for (const batch of chunk(bookingServiceValues, 400)) {
      await tx.insert(schema.bookingServices).values(batch);
    }

    for (const batch of chunk(pending, 300)) {
      await tx
        .insert(schema.invoices)
        .values(
          batch.map((p) => ({
            ...p.invoice,
            // The bill is opened from "aaj ki bookings", so the link matters.
            bookingId: p.booking.id,
          })),
        );

      for (const parent of batch) {
        for (const item of parent.items) {
          invoiceItemValues.push({ ...item, invoiceId: parent.invoice.id });
        }
        paymentValues.push({ ...parent.payment, invoiceId: parent.invoice.id });
      }
    }

    for (const batch of chunk(invoiceItemValues, 400)) {
      await tx.insert(schema.invoiceItems).values(batch);
    }
    for (const batch of chunk(paymentValues, 400)) {
      await tx.insert(schema.payments).values(batch);
    }

    // Customer rollups: first visit, last visit, total visits. The app reads
    // these on the customer history screen, and they must match the bills.
    for (const [customerId, count] of visitCount) {
      await tx
        .update(schema.customers)
        .set({
          firstVisitDate: firstVisit.get(customerId) ?? null,
          lastVisitDate: lastVisit.get(customerId) ?? null,
          totalVisits: count,
        })
        .where(eq(schema.customers.id, customerId));
    }

    // ------------------------------------------------------------ live queue
    // Five people in the shop right now, two of them already in the chair.
    const queueSeed = [
      { customerIndex: 0, status: 'in_service' as const, staffIndex: 0, token: 1 },
      { customerIndex: 3, status: 'in_service' as const, staffIndex: 1, token: 2 },
      { customerIndex: 7, status: 'waiting' as const, staffIndex: 2, token: 3 },
      { customerIndex: 11, status: 'waiting' as const, staffIndex: 0, token: 4 },
      { customerIndex: 15, status: 'waiting' as const, staffIndex: null, token: 5 },
    ];

    await tx.insert(schema.queueEntries).values(
      queueSeed.map((entry, index) => ({
        salonId,
        branchId,
        businessDate: today,
        customerId: customerRows[entry.customerIndex]!.id,
        customerName: customers[entry.customerIndex]!,
        staffId: entry.staffIndex === null ? null : staffRows[entry.staffIndex]!.id,
        token: entry.token,
        position: index,
        status: entry.status,
        joinedAt: istTimestamp(today, '10:00:00'),
        startedAt: entry.status === 'in_service' ? istTimestamp(today, '10:05:00') : null,
      })),
    );

    await tx
      .update(schema.salons)
      .set({ lastInvoiceSequence: invoiceSequence })
      .where(eq(schema.salons.id, salonId));
  });

  const counts = await db.execute(
    `select
       (select count(*) from bookings)       as bookings,
       (select count(*) from invoices)       as invoices,
       (select count(*) from invoice_items)  as items,
       (select count(*) from customers)      as customers`,
  );
  console.log('seeded', counts.rows[0]);
  console.log(`salon: ${SALON_SLUG}`);
}

main()
  .catch((error) => {
    console.error('seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
