import {
  addDaysISO,
  allocateDiscountProRata,
  averageTicketPaise,
  commissionPaise,
  eachDayBetween,
  monthRange,
  percent,
  utilizationPct,
  type Paise,
} from '@salon/shared';

import {
  mock,
  type Booking,
  type Customer,
  type Invoice,
  type Service,
  type StaffKind,
  type StaffMember,
} from './fixtures';

/**
 * Derived data for the screens.
 *
 * Screens read from here, never from `mock` directly, and never compute money
 * themselves. When the API lands, these functions keep their signatures and
 * their bodies become fetches — the screens do not change.
 *
 * Every number is produced with a `@salon/shared` helper, so the mock dashboard
 * and the real Postgres report cannot drift apart.
 */

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

const staffIndex = new Map(mock.staff.map((member) => [member.id, member]));
const serviceIndex = new Map(mock.services.map((service) => [service.id, service]));
const customerIndex = new Map(mock.customers.map((customer) => [customer.id, customer]));

export function getStaff(id: string | undefined): StaffMember | undefined {
  return id ? staffIndex.get(id) : undefined;
}

export function getService(id: string | undefined): Service | undefined {
  return id ? serviceIndex.get(id) : undefined;
}

export function getCustomer(id: string | undefined): Customer | undefined {
  return id ? customerIndex.get(id) : undefined;
}

export function staffName(id: string | undefined): string {
  return getStaff(id)?.name ?? 'Unassigned';
}

export function serviceName(id: string | undefined): string {
  return getService(id)?.name ?? 'Service';
}

export function customerName(id: string | undefined): string {
  return getCustomer(id)?.name ?? 'Walk-in';
}

/** "Haircut (Women) + Blow Dry" */
export function serviceNames(serviceIds: readonly string[]): string {
  return serviceIds.map((id) => serviceName(id)).join(' + ');
}

/** "AS" — two letters at most, so the avatar circle never overflows. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

export function staffForKind(kind: StaffKind): StaffMember[] {
  return mock.staff.filter((member) => member.kind === kind);
}

/* ------------------------------------------------------------------ *
 * Bookings\n * ------------------------------------------------------------------ */

export function bookingDurationMin(booking: Booking): number {
  return booking.services.reduce(
    (sum, line) => sum + (getService(line.serviceId)?.durationMin ?? 0),
    0,
  );
}

export function bookingServiceIds(booking: Booking): string[] {
  return booking.services.map((line) => line.serviceId);
}

/** Today's book, in clock order, excluding cancellations and no-shows. */
export function todayBookings(): Booking[] {
  return [...mock.bookings]
    .filter((booking) => booking.status !== 'cancelled' && booking.status !== 'no_show')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function bookingsForStaff(staffId: string): Booking[] {
  return todayBookings().filter((booking) => booking.staffId === staffId);
}

export function todaysInvoiceFor(booking: Booking): Invoice | undefined {
  return mock.invoices.find((invoice) => invoice.id === `inv_${booking.id}`);
}

/* ------------------------------------------------------------------ *
 * Invoice line revenue (discount applied pro-rata)\n * ------------------------------------------------------------------ */

/**
 * The revenue a line actually earned, after its share of the bill discount,
 * keyed by item id. Commission and service mix both read from this so a
 * discounted bill never inflates either.
 */
function lineRevenue(invoice: Invoice): Map<string, Paise> {
  const allocation = allocateDiscountProRata(
    invoice.items.map((item) => ({ id: item.id, amountPaise: item.amountPaise })),
    invoice.discountPaise,
  );

  const revenue = new Map<string, Paise>();
  for (const item of invoice.items) {
    const discount = allocation[item.id] ?? 0;
    revenue.set(item.id, Math.max(0, item.amountPaise - discount));
  }
  return revenue;
}

export function invoicesOn(dateISO: string): Invoice[] {
  return mock.invoices.filter((invoice) => invoice.businessDate === dateISO);
}

export function invoicesBetween(fromISO: string, toISO: string): Invoice[] {
  return mock.invoices.filter(
    (invoice) => invoice.businessDate >= fromISO && invoice.businessDate <= toISO,
  );
}

/* ------------------------------------------------------------------ *
 * Summaries\n * ------------------------------------------------------------------ */

export interface DaySummary {
  dateISO: string;
  revenuePaise: Paise;
  refundsPaise: Paise;
  discountPaise: Paise;
  /** One row per invoice item: Haircut + Beard is 2 services, 1 customer. */
  services: number;
  /** One per completed bill. */
  customers: number;
  averageTicketPaise: Paise;
}

function summarise(dateISO: string, invoices: readonly Invoice[]): DaySummary {
  let revenuePaise = 0;
  let refundsPaise = 0;
  let discountPaise = 0;
  let services = 0;

  for (const invoice of invoices) {
    revenuePaise += invoice.paidPaise;
    refundsPaise += invoice.refundedPaise;
    discountPaise += invoice.discountPaise;
    services += invoice.items.length;
  }

  return {
    dateISO,
    revenuePaise,
    refundsPaise,
    discountPaise,
    services,
    customers: invoices.length,
    averageTicketPaise: averageTicketPaise(revenuePaise, invoices.length),
  };
}

export function daySummary(dateISO: string = mock.today): DaySummary {
  return summarise(dateISO, invoicesOn(dateISO));
}

export interface RevenuePoint {
  dateISO: string;
  revenuePaise: Paise;
  services: number;
}

/** The last `days` business days, oldest first — chart order. */
export function revenueSeries(days: number): RevenuePoint[] {
  const fromISO = addDaysISO(mock.today, -(days - 1));
  const dates = eachDayBetween(fromISO, mock.today);
  const byDate = new Map<string, RevenuePoint>(
    dates.map((dateISO) => [dateISO, { dateISO, revenuePaise: 0, services: 0 }]),
  );

  for (const invoice of invoicesBetween(fromISO, mock.today)) {
    const point = byDate.get(invoice.businessDate);
    if (!point) continue;
    point.revenuePaise += invoice.paidPaise;
    point.services += invoice.items.length;
  }

  return dates.map((dateISO) => byDate.get(dateISO)).filter((point): point is RevenuePoint => !!point);
}

export interface DayTotals {
  revenuePaise: Paise;
  services: number;
  customers: number;
  commissionPaise: Paise;
}

/** Month to date, used by the owner's headline tiles. */
export function monthToDateTotals(): DayTotals {
  const { from } = monthRange(mock.today);
  const invoices = invoicesBetween(from, mock.today);

  let revenuePaise = 0;
  let services = 0;
  let commissionTotal = 0;

  for (const invoice of invoices) {
    revenuePaise += invoice.paidPaise;
    services += invoice.items.length;
    const revenue = lineRevenue(invoice);
    for (const item of invoice.items) {
      const member = getStaff(item.staffId);
      if (!member) continue;
      commissionTotal += commissionPaise(revenue.get(item.id) ?? 0, member.commissionBps);
    }
  }

  return { revenuePaise, services, customers: invoices.length, commissionPaise: commissionTotal };
}

/* ------------------------------------------------------------------ *
 * Staff performance\n * ------------------------------------------------------------------ */

export interface StaffPerformanceRow {
  staff: StaffMember;
  services: number;
  customers: number;
  revenuePaise: Paise;
  commissionPaise: Paise;
  /** Share of the salon's revenue in the period, one decimal. */
  sharePct: number;
}

export function staffPerformance(fromISO: string, toISO: string): StaffPerformanceRow[] {
  const invoices = invoicesBetween(fromISO, toISO);
  const rows = new Map<string, StaffPerformanceRow>(
    mock.staff.map((staff) => [
      staff.id,
      {
        staff,
        services: 0,
        customers: 0,
        revenuePaise: 0,
        commissionPaise: 0,
        sharePct: 0,
      },
    ]),
  );

  for (const invoice of invoices) {
    const revenue = lineRevenue(invoice);
    const seen = new Set<string>();

    for (const item of invoice.items) {
      const row = rows.get(item.staffId);
      if (!row) continue;

      const lineTotal = revenue.get(item.id) ?? 0;
      row.services += 1;
      row.revenuePaise += lineTotal;
      row.commissionPaise += commissionPaise(lineTotal, row.staff.commissionBps);
      seen.add(item.staffId);
    }

    for (const staffId of seen) {
      const row = rows.get(staffId);
      if (row) row.customers += 1;
    }
  }

  const total = [...rows.values()].reduce((sum, row) => sum + row.revenuePaise, 0);
  for (const row of rows.values()) {
    row.sharePct = Math.round(percent(row.revenuePaise, total) * 10) / 10;
  }

  return [...rows.values()].sort((a, b) => b.revenuePaise - a.revenuePaise);
}

export interface StaffTodaySummary {
  scheduled: number;
  completed: number;
  servicesDone: number;
  servicesUpcoming: number;
  revenuePaise: Paise;
  commissionPaise: Paise;
}

/** What the stylist sees on their own screen. Their rows only. */
export function staffTodaySummary(staffId: string): StaffTodaySummary {
  const bookings = bookingsForStaff(staffId);
  const completed = bookings.filter((booking) => booking.status === 'completed');
  const upcoming = bookings.filter((booking) => booking.status !== 'completed');

  const revenue = lineRevenueTotalForStaff(invoicesOn(mock.today), staffId);

  return {
    scheduled: bookings.length,
    completed: completed.length,
    servicesDone: completed.reduce((sum, booking) => sum + booking.services.length, 0),
    servicesUpcoming: upcoming.reduce((sum, booking) => sum + booking.services.length, 0),
    revenuePaise: revenue.revenuePaise,
    commissionPaise: revenue.commissionPaise,
  };
}

function lineRevenueTotalForStaff(
  invoices: readonly Invoice[],
  staffId: string,
): { revenuePaise: Paise; commissionPaise: Paise } {
  const member = getStaff(staffId);
  let revenuePaise = 0;
  let commissionTotal = 0;

  for (const invoice of invoices) {
    const revenue = lineRevenue(invoice);
    for (const item of invoice.items) {
      if (item.staffId !== staffId) continue;
      const lineTotal = revenue.get(item.id) ?? 0;
      revenuePaise += lineTotal;
      commissionTotal += commissionPaise(lineTotal, member?.commissionBps ?? 0);
    }
  }

  return { revenuePaise, commissionPaise: commissionTotal };
}

export function staffTotals(fromISO: string, toISO: string, staffId: string): DayTotals {
  const invoices = invoicesBetween(fromISO, toISO);
  const revenue = lineRevenueTotalForStaff(invoices, staffId);

  let services = 0;
  let customers = 0;
  for (const invoice of invoices) {
    const own = invoice.items.filter((item) => item.staffId === staffId);
    if (own.length === 0) continue;
    services += own.length;
    customers += 1;
  }

  return { ...revenue, services, customers };
}

export interface MonthPoint {
  monthKey: string;
  label: string;
  services: number;
  customers: number;
  revenuePaise: Paise;
  commissionPaise: Paise;
}

function monthKeysBack(todayISO: string, count: number): string[] {
  const [year, month] = todayISO.split('-').map(Number) as [number, number];
  const keys: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const total = year * 12 + (month - 1) - offset;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
  }

  return keys;
}

function monthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number) as [number, number];
  return new Intl.DateTimeFormat('en-IN', { month: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/** Six months by default — the stylist's history requirement. */
export function staffMonthlySeries(staffId: string, months: number = 6): MonthPoint[] {
  const keys = monthKeysBack(mock.today, months);
  const rows = new Map<string, MonthPoint>(
    keys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: monthLabel(monthKey),
        services: 0,
        customers: 0,
        revenuePaise: 0,
        commissionPaise: 0,
      },
    ]),
  );

  const member = getStaff(staffId);

  for (const invoice of mock.invoices) {
    const monthKey = invoice.businessDate.slice(0, 7);
    const row = rows.get(monthKey);
    if (!row) continue;

    const own = invoice.items.filter((item) => item.staffId === staffId);
    if (own.length === 0) continue;

    const revenue = lineRevenue(invoice);
    row.customers += 1;
    row.services += own.length;

    for (const item of own) {
      const lineTotal = revenue.get(item.id) ?? 0;
      row.revenuePaise += lineTotal;
      row.commissionPaise += commissionPaise(lineTotal, member?.commissionBps ?? 0);
    }
  }

  return keys.map((key) => rows.get(key)).filter((row): row is MonthPoint => !!row);
}

/** The salon's own six-month report — every stylist, every service. */
export function salonMonthlySeries(months: number = 6): MonthPoint[] {
  const keys = monthKeysBack(mock.today, months);
  const rows = new Map<string, MonthPoint>(
    keys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        label: monthLabel(monthKey),
        services: 0,
        customers: 0,
        revenuePaise: 0,
        commissionPaise: 0,
      },
    ]),
  );

  for (const invoice of mock.invoices) {
    const monthKey = invoice.businessDate.slice(0, 7);
    const row = rows.get(monthKey);
    if (!row) continue;

    const revenue = lineRevenue(invoice);
    row.customers += 1;
    row.services += invoice.items.length;
    row.revenuePaise += invoice.paidPaise;

    for (const item of invoice.items) {
      const lineTotal = revenue.get(item.id) ?? 0;
      row.commissionPaise += commissionPaise(lineTotal, getStaff(item.staffId)?.commissionBps ?? 0);
    }
  }

  return keys.map((key) => rows.get(key)).filter((row): row is MonthPoint => !!row);
}

/* ------------------------------------------------------------------ *
 * Service mix
 * ------------------------------------------------------------------ */

export interface ServiceMixRow {
  serviceId: string;
  name: string;
  count: number;
  revenuePaise: Paise;
  sharePct: number;
}

export function serviceMix(fromISO: string, toISO: string): ServiceMixRow[] {
  const rows = new Map<string, ServiceMixRow>();

  for (const invoice of invoicesBetween(fromISO, toISO)) {
    const revenue = lineRevenue(invoice);
    for (const item of invoice.items) {
      const existing = rows.get(item.serviceId) ?? {
        serviceId: item.serviceId,
        name: item.serviceName,
        count: 0,
        revenuePaise: 0,
        sharePct: 0,
      };
      existing.count += 1;
      existing.revenuePaise += revenue.get(item.id) ?? 0;
      rows.set(item.serviceId, existing);
    }
  }

  const total = [...rows.values()].reduce((sum, row) => sum + row.count, 0);
  const list = [...rows.values()].sort((a, b) => b.count - a.count);
  for (const row of list) row.sharePct = Math.round(percent(row.count, total) * 10) / 10;

  return list;
}

/* ------------------------------------------------------------------ *
 * Customers\n * ------------------------------------------------------------------ */

export interface CustomerVisit {
  invoice: Invoice;
  staffName: string;
  services: string;
  amountPaise: Paise;
}

export interface CustomerHistoryResult {
  customer: Customer;
  visits: CustomerVisit[];
  totalVisits: number;
  totalSpentPaise: Paise;
  averageTicketPaise: Paise;
  lastVisitISO: string | null;
  favouriteStaff: string | null;
  favouriteService: string | null;
  byService: { name: string; count: number }[];
}

export function customerHistory(customerId: string): CustomerHistoryResult | null {
  const customer = getCustomer(customerId);
  if (!customer) return null;

  const invoices = mock.invoices
    .filter((invoice) => invoice.customerId === customerId)
    .sort((a, b) =>
      a.businessDate === b.businessDate
        ? b.createdAtClock.localeCompare(a.createdAtClock)
        : b.businessDate.localeCompare(a.businessDate),
    );

  const visits: CustomerVisit[] = invoices.map((invoice) => ({
    invoice,
    staffName: staffName(invoice.items[0]?.staffId),
    services: invoice.items.map((item) => item.serviceName).join(' + '),
    amountPaise: invoice.paidPaise,
  }));

  const spent = invoices.reduce((sum, invoice) => sum + invoice.paidPaise, 0);

  const staffCounts = new Map<string, number>();
  const serviceCounts = new Map<string, number>();

  for (const invoice of invoices) {
    for (const item of invoice.items) {
      staffCounts.set(item.staffId, (staffCounts.get(item.staffId) ?? 0) + 1);
      serviceCounts.set(item.serviceName, (serviceCounts.get(item.serviceName) ?? 0) + 1);
    }
  }

  const topKey = (counts: Map<string, number>): string | null => {
    let best: string | null = null;
    let bestCount = -1;
    for (const [key, count] of counts) {
      if (count > bestCount) {
        best = key;
        bestCount = count;
      }
    }
    return best;
  };

  const topStaffId = topKey(staffCounts);
  const topServiceName = topKey(serviceCounts);

  return {
    customer,
    visits,
    totalVisits: invoices.length,
    totalSpentPaise: spent,
    averageTicketPaise: averageTicketPaise(spent, invoices.length),
    lastVisitISO: invoices[0]?.businessDate ?? null,
    favouriteStaff: topStaffId ? staffName(topStaffId) : null,
    favouriteService: topServiceName,
    byService: [...serviceCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

/** Everyone who has ever paid, most recent first — the staff customer list. */
export function recentCustomers(limit: number = 12): {
  customer: Customer;
  lastVisitISO: string;
  visits: number;
}[] {
  const rows = new Map<string, { customer: Customer; lastVisitISO: string; visits: number }>();

  for (const invoice of mock.invoices) {
    const customer = getCustomer(invoice.customerId);
    if (!customer) continue;

    const existing = rows.get(customer.id);
    if (!existing) {
      rows.set(customer.id, {
        customer,
        lastVisitISO: invoice.businessDate,
        visits: 1,
      });
      continue;
    }

    existing.visits += 1;
    if (invoice.businessDate > existing.lastVisitISO) existing.lastVisitISO = invoice.businessDate;
  }

  return [...rows.values()]
    .sort((a, b) => b.lastVisitISO.localeCompare(a.lastVisitISO))
    .slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Queue\n * ------------------------------------------------------------------ */

export interface QueueStats {
  waiting: number;
  inService: number;
  done: number;
  averageWaitMin: number;
  longestWaitMin: number;
  nextToken: number;
}

export function queueStats(): QueueStats {
  const waiting = mock.queue.filter((entry) => entry.status === 'waiting');
  const waits = waiting.map((entry) => entry.estimatedWaitMin);
  const totalWait = waits.reduce((sum, minutes) => sum + minutes, 0);
  const maxToken = mock.queue.reduce((max, entry) => Math.max(max, entry.token), 0);

  return {
    waiting: waiting.length,
    inService: mock.queue.filter((entry) => entry.status === 'in_service').length,
    done: mock.queue.filter((entry) => entry.status === 'done').length,
    averageWaitMin: waits.length > 0 ? Math.round(totalWait / waits.length) : 0,
    longestWaitMin: waits.length > 0 ? Math.max(...waits) : 0,
    nextToken: maxToken + 1,
  };
}

export interface QueuePosition {
  entry: (typeof mock.queue)[number];
  ahead: number;
  estimatedWaitMin: number;
}

/** Where the logged-in customer sits right now, or null if not in the queue. */
export function queuePositionFor(customerId: string): QueuePosition | null {
  const entry = mock.queue.find(
    (row) =>
      row.customerId === customerId && (row.status === 'waiting' || row.status === 'in_service'),
  );
  if (!entry) return null;

  const ahead = mock.queue.filter(
    (row) => row.status === 'waiting' && row.token < entry.token,
  ).length;

  return { entry, ahead, estimatedWaitMin: entry.estimatedWaitMin };
}

/* ------------------------------------------------------------------ *
 * Booking slots\n * ------------------------------------------------------------------ */

export interface SlotOption {
  clock: string;
  available: boolean;
}

const SLOT_STEP_MIN = 30;

function overlaps(startA: string, minutesA: number, startB: string, minutesB: number): boolean {
  const toMinutes = (clock: string): number => {
    const [h, m] = clock.split(':').map(Number) as [number, number];
    return h * 60 + m;
  };
  const aStart = toMinutes(startA);
  const bStart = toMinutes(startB);
  return aStart < bStart + minutesB && bStart < aStart + minutesA;
}

/**
 * Free half-hour starts for one person on one day. Only reads existing
 * bookings — the API version will also read `staff_shifts` and the salon's
 * opening hours.
 */
export function availableSlots(staffId: string, dateISO: string = mock.today): SlotOption[] {
  const member = getStaff(staffId);
  if (!member) return [];

  const bookings =
    dateISO === mock.today
      ? bookingsForStaff(staffId)
      : mock.bookings.filter(
          (booking) => booking.staffId === staffId && booking.businessDate === dateISO,
        );

  const toMinutes = (clock: string): number => {
    const [h, m] = clock.split(':').map(Number) as [number, number];
    return h * 60 + m;
  };

  const start = toMinutes(member.shift.start);
  const end = toMinutes(member.shift.end);
  const slots: SlotOption[] = [];

  for (let minute = start; minute + SLOT_STEP_MIN <= end; minute += SLOT_STEP_MIN) {
    const clock = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    const taken = bookings.some((booking) =>
      overlaps(clock, SLOT_STEP_MIN, booking.startTime, bookingDurationMin(booking)),
    );
    slots.push({ clock, available: !taken });
  }

  return slots;
}

/** The first few free slots across all staff who can do the service. */
export function nextOpenSlots(serviceId: string, limit: number = 4): SlotOption[] {
  const service = getService(serviceId);
  if (!service) return [];

  const candidates = mock.staff.filter((member) => service.kinds.includes(member.kind));
  const seen = new Set<string>();
  const options: SlotOption[] = [];

  for (const member of candidates) {
    for (const slot of availableSlots(member.id)) {
      if (!slot.available || seen.has(slot.clock)) continue;
      seen.add(slot.clock);
      options.push(slot);
    }
  }

  return options.sort((a, b) => a.clock.localeCompare(b.clock)).slice(0, limit);
}

/* ------------------------------------------------------------------ *
 * Requests, utilisation\n * ------------------------------------------------------------------ */

export function pendingRequestCount(): number {
  return mock.bookingRequests.length;
}

/** Today's delivered minutes ÷ today's scheduled minutes, for one person. */
export function staffUtilizationPct(staffId: string): number | null {
  const member = getStaff(staffId);
  if (!member) return null;

  const [startH, startM] = member.shift.start.split(':').map(Number) as [number, number];
  const [endH, endM] = member.shift.end.split(':').map(Number) as [number, number];
  const scheduledMinutes = endH * 60 + endM - (startH * 60 + startM);

  const delivered = bookingsForStaff(staffId)
    .filter((booking) => booking.status === 'completed' || booking.status === 'in_service')
    .reduce((sum, booking) => sum + bookingDurationMin(booking), 0);

  return utilizationPct(delivered, scheduledMinutes);
}
