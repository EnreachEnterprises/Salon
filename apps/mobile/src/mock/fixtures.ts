import { addDaysISO, rupeesToPaise, todayISO, type Paise } from '@salon/shared';

/**
 * Mock data for the UI block.
 *
 * Everything here is replaced by the API at B1: `GET /today`, `GET /queue`,
 * `POST /invoices`, and so on. The shapes deliberately mirror the Postgres
 * column names (businessDate, commissionBps, amountPaise) so swapping the
 * source is a data-layer change, not a screen rewrite.
 *
 * Generation is deterministic: a fixed seed plus the current business day.
 * Two runs on the same day produce byte-identical numbers, so screenshots and
 * Maestro flows stay stable.
 */

export interface Salon {
  id: string;
  name: string;
  branch: string;
  phone: string;
  gstin: string;
  timezone: string;
  openTime: string;
  closeTime: string;
}

export type StaffKind = 'stylist' | 'barber' | 'beautician';

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  kind: StaffKind;
  /** Basis points. 800 = 8%. Integer, never a float percentage. */
  commissionBps: number;
  /** 0 = Sunday. The salon is open; the person is not. */
  weeklyOff: number;
  shift: { start: string; end: string };
}

export type ServiceCategory = 'Hair' | 'Beard' | 'Skin' | 'Spa';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMin: number;
  pricePaise: Paise;
  /** Which staff kinds can deliver it. Drives slot availability. */
  kinds: readonly StaffKind[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  firstVisitISO: string;
  notes?: string;
}

export type BookingSource = 'app' | 'whatsapp' | 'call' | 'walkin' | 'staff';

export type BookingStatus =
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface BookingServiceLine {
  serviceId: string;
  pricePaise: Paise;
}

export interface Booking {
  id: string;
  businessDate: string;
  startTime: string;
  customerId: string;
  staffId: string;
  services: BookingServiceLine[];
  source: BookingSource;
  status: BookingStatus;
}

export type PaymentMethod = 'cash' | 'upi' | 'card';

export interface InvoiceItem {
  id: string;
  serviceId: string;
  /** Stylist attribution lives on the line, not the invoice. */
  staffId: string;
  serviceName: string;
  amountPaise: Paise;
}

export interface Invoice {
  id: string;
  businessDate: string;
  createdAtClock: string;
  customerId: string;
  /** Counter person who rang it up. Commission uses `items[].staffId`. */
  billedByStaffId: string;
  items: InvoiceItem[];
  discountPaise: Paise;
  totalPaise: Paise;
  paidPaise: Paise;
  refundedPaise: Paise;
  method: PaymentMethod;
}

export interface QueueEntry {
  id: string;
  token: number;
  customerId?: string;
  name: string;
  staffId?: string;
  serviceIds: string[];
  joinedAtClock: string;
  status: 'waiting' | 'in_service' | 'done' | 'left';
  estimatedWaitMin: number;
}

export type RequestChannel = 'whatsapp' | 'call';

/** A request is not a booking. A human confirms it, one tap. */
export interface BookingRequest {
  id: string;
  channel: RequestChannel;
  customerName: string;
  phone: string;
  serviceIds: string[];
  preferredClock: string;
  requestedAtClock: string;
  note?: string;
}

export interface Reminder {
  id: string;
  kind: 'booking' | 'revisit' | 'report';
  channel: 'email' | 'whatsapp' | 'both';
  dueISO: string;
  dueClock?: string;
  message: string;
  status: 'scheduled' | 'sent';
}

export interface NotificationPrefs {
  emailAddress: string;
  whatsappNumber: string;
  email: boolean;
  whatsapp: boolean;
  marketingOptIn: boolean;
}

export interface MockData {
  salon: Salon;
  staff: StaffMember[];
  services: Service[];
  customers: Customer[];
  bookings: Booking[];
  bookingRequests: BookingRequest[];
  queue: QueueEntry[];
  invoices: Invoice[];
  reminders: Reminder[];
  notificationPrefs: NotificationPrefs;
  today: string;
}

/* ------------------------------------------------------------------ *
 * Deterministic randomness
 * ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(pool: readonly T[], rnd: () => number): T {
  const item = pool[Math.floor(rnd() * pool.length)];
  if (item === undefined) throw new Error('pick() called on an empty pool');
  return item;
}

function intBetween(rnd: () => number, min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}

function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/* ------------------------------------------------------------------ *
 * The salon
 * ------------------------------------------------------------------ */

export const salon: Salon = {
  id: 'sal_mehra',
  name: 'Mehra Hair Studio',
  branch: 'Bandra West',
  phone: '+91 22 4000 1122',
  gstin: '27AABCM1234D1Z5',
  timezone: 'Asia/Kolkata',
  openTime: '10:00',
  closeTime: '20:00',
};

export const staff: StaffMember[] = [
  {
    id: 'stf_imran',
    name: 'Imran Sheikh',
    title: 'Senior stylist',
    kind: 'stylist',
    commissionBps: 800,
    weeklyOff: 1,
    shift: { start: '10:00', end: '19:30' },
  },
  {
    id: 'stf_ayesha',
    name: 'Ayesha Khan',
    title: 'Stylist',
    kind: 'stylist',
    commissionBps: 700,
    weeklyOff: 2,
    shift: { start: '10:30', end: '19:00' },
  },
  {
    id: 'stf_vikram',
    name: 'Vikram Rao',
    title: 'Barber',
    kind: 'barber',
    commissionBps: 600,
    weeklyOff: 3,
    shift: { start: '10:00', end: '20:00' },
  },
  {
    id: 'stf_sana',
    name: 'Sana Qureshi',
    title: 'Beautician',
    kind: 'beautician',
    commissionBps: 750,
    weeklyOff: 4,
    shift: { start: '11:00', end: '19:00' },
  },
];

export const services: Service[] = [
  {
    id: 'svc_haircut_men',
    name: 'Haircut (Men)',
    category: 'Hair',
    durationMin: 30,
    pricePaise: rupeesToPaise(350),
    kinds: ['barber', 'stylist'],
  },
  {
    id: 'svc_haircut_women',
    name: 'Haircut (Women)',
    category: 'Hair',
    durationMin: 45,
    pricePaise: rupeesToPaise(650),
    kinds: ['stylist'],
  },
  {
    id: 'svc_beard',
    name: 'Beard Trim',
    category: 'Beard',
    durationMin: 15,
    pricePaise: rupeesToPaise(150),
    kinds: ['barber', 'stylist'],
  },
  {
    id: 'svc_shave',
    name: 'Clean Shave',
    category: 'Beard',
    durationMin: 15,
    pricePaise: rupeesToPaise(120),
    kinds: ['barber'],
  },
  {
    id: 'svc_blowdry',
    name: 'Blow Dry',
    category: 'Hair',
    durationMin: 30,
    pricePaise: rupeesToPaise(450),
    kinds: ['stylist'],
  },
  {
    id: 'svc_colour',
    name: 'Root Colour',
    category: 'Hair',
    durationMin: 90,
    pricePaise: rupeesToPaise(1800),
    kinds: ['stylist'],
  },
  {
    id: 'svc_facial',
    name: 'Facial',
    category: 'Skin',
    durationMin: 60,
    pricePaise: rupeesToPaise(1200),
    kinds: ['beautician'],
  },
  {
    id: 'svc_cleanup',
    name: 'Clean-up',
    category: 'Skin',
    durationMin: 30,
    pricePaise: rupeesToPaise(800),
    kinds: ['beautician'],
  },
  {
    id: 'svc_headmassage',
    name: 'Head Massage',
    category: 'Spa',
    durationMin: 20,
    pricePaise: rupeesToPaise(300),
    kinds: ['barber', 'stylist', 'beautician'],
  },
];

const serviceById = new Map(services.map((service) => [service.id, service]));

function servicePrice(id: string): Paise {
  const service = serviceById.get(id);
  if (!service) throw new Error(`Unknown service in fixture: ${id}`);
  return service.pricePaise;
}

function serviceName(id: string): string {
  const service = serviceById.get(id);
  if (!service) throw new Error(`Unknown service in fixture: ${id}`);
  return service.name;
}

/* ------------------------------------------------------------------ *
 * Customers
 * ------------------------------------------------------------------ */

const CUSTOMER_SEED: ReadonlyArray<readonly [name: string, phone: string]> = [
  ['Ananya Sharma', '+91 98200 41120'],
  ['Rakesh Pawar', '+91 98201 33210'],
  ['Meera Joshi', '+91 99300 71245'],
  ['Salim Khan', '+91 98670 22318'],
  ['Divya Rane', '+91 98202 55019'],
  ['Farhan Ali', '+91 90040 66127'],
  ['Priya Nair', '+91 98330 90112'],
  ['Nikhil Desai', '+91 98675 44008'],
  ['Zoya Merchant', '+91 98211 77390'],
  ['Arjun Patil', '+91 99205 33418'],
  ['Sneha Iyer', '+91 98195 66021'],
  ['Karan Bhatia', '+91 98704 12766'],
  ['Fatima Shaikh', '+91 98209 88134'],
  ['Vivek Menon', '+91 90045 21908'],
  ['Ritu Agarwal', '+91 98338 41250'],
  ['Aman Verma', '+91 98678 90233'],
  ['Tanya D’Souza', '+91 98212 33071'],
  ['Sohail Ansari', '+91 99206 11845'],
  ['Nandini Rao', '+91 98196 77402'],
  ['Rahul Shetty', '+91 98705 66319'],
  ['Ishita Bose', '+91 98210 44527'],
  ['Yash Thakur', '+91 90046 77193'],
  ['Aarti Kulkarni', '+91 98339 22640'],
  ['Dev Malhotra', '+91 98679 55871'],
];

function buildCustomers(today: string): Customer[] {
  return CUSTOMER_SEED.map(([name, phone], index) => {
    const firstVisitISO = addDaysISO(today, -(18 + ((index * 37) % 372)));
    const customer: Customer = {
      id: index === 0 ? 'cus_ananya' : `cus_${String(index).padStart(2, '0')}`,
      name,
      phone,
      firstVisitISO,
    };

    if (index === 0) customer.notes = 'Prefers Imran. Sensitive scalp, no ammonia colour.';
    if (index === 3) customer.notes = 'Walks in most Fridays after 7pm.';
    if (index === 8) customer.notes = 'Books colour every 6 weeks.';

    return customer;
  });
}

/* ------------------------------------------------------------------ *
 * Today's bookings
 * ------------------------------------------------------------------ */

type BookingSeed = readonly [
  startTime: string,
  customerIndex: number,
  staffId: string,
  serviceIds: readonly string[],
  source: BookingSource,
  status: BookingStatus,
];

/**
 * Authored rather than random: the reception screen, the staff screen and the
 * customer queue all describe the same afternoon, and a random draw would make
 * that story incoherent ("3 people waiting" with nobody in the queue).
 */
const TODAY_BOOKING_SEEDS: readonly BookingSeed[] = [
  ['10:00', 2, 'stf_vikram', ['svc_haircut_men'], 'walkin', 'completed'],
  ['10:30', 1, 'stf_imran', ['svc_haircut_men', 'svc_beard'], 'app', 'completed'],
  ['10:45', 3, 'stf_ayesha', ['svc_haircut_women'], 'whatsapp', 'completed'],
  ['11:15', 4, 'stf_sana', ['svc_facial'], 'app', 'completed'],
  ['11:30', 5, 'stf_vikram', ['svc_haircut_men', 'svc_shave'], 'call', 'completed'],
  ['12:00', 6, 'stf_imran', ['svc_haircut_men'], 'walkin', 'completed'],
  ['12:15', 7, 'stf_ayesha', ['svc_blowdry'], 'app', 'completed'],
  ['12:45', 8, 'stf_sana', ['svc_cleanup'], 'whatsapp', 'completed'],
  ['13:00', 9, 'stf_vikram', ['svc_haircut_men', 'svc_beard'], 'walkin', 'completed'],
  ['13:30', 10, 'stf_imran', ['svc_haircut_men', 'svc_headmassage'], 'staff', 'completed'],
  ['14:00', 11, 'stf_ayesha', ['svc_haircut_women', 'svc_blowdry'], 'app', 'completed'],
  ['14:30', 12, 'stf_sana', ['svc_facial'], 'app', 'in_service'],
  ['15:00', 0, 'stf_imran', ['svc_haircut_women', 'svc_blowdry'], 'app', 'checked_in'],
  ['15:15', 13, 'stf_vikram', ['svc_haircut_men'], 'whatsapp', 'confirmed'],
  ['16:00', 14, 'stf_ayesha', ['svc_colour'], 'app', 'confirmed'],
  ['16:30', 15, 'stf_sana', ['svc_cleanup'], 'whatsapp', 'confirmed'],
  ['17:00', 16, 'stf_imran', ['svc_haircut_men', 'svc_beard'], 'call', 'confirmed'],
  ['17:30', 17, 'stf_vikram', ['svc_haircut_men'], 'app', 'confirmed'],
  ['18:00', 18, 'stf_ayesha', ['svc_haircut_women'], 'app', 'confirmed'],
  ['18:30', 19, 'stf_sana', ['svc_facial'], 'walkin', 'confirmed'],
  ['19:00', 20, 'stf_imran', ['svc_haircut_men'], 'app', 'confirmed'],
];

function buildBookings(today: string, customers: Customer[]): Booking[] {
  return TODAY_BOOKING_SEEDS.map(([startTime, customerIndex, staffId, serviceIds, source, status], index) => {
    const customer = customers[customerIndex];
    if (!customer) throw new Error(`Booking seed references missing customer ${customerIndex}`);

    return {
      id: `bkg_today_${String(index).padStart(2, '0')}`,
      businessDate: today,
      startTime,
      customerId: customer.id,
      staffId,
      services: serviceIds.map((serviceId) => ({
        serviceId,
        pricePaise: servicePrice(serviceId),
      })),
      source,
      status,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Invoices
 * ------------------------------------------------------------------ */

const METHOD_MIX: readonly PaymentMethod[] = [
  'upi',
  'upi',
  'upi',
  'cash',
  'cash',
  'card',
  'upi',
  'upi',
  'cash',
  'card',
];

function invoiceFromBooking(booking: Booking, discountPaise: Paise, method: PaymentMethod): Invoice {
  const items: InvoiceItem[] = booking.services.map((line, index) => ({
    id: `${booking.id}_l${index}`,
    serviceId: line.serviceId,
    staffId: booking.staffId,
    serviceName: serviceName(line.serviceId),
    amountPaise: line.pricePaise,
  }));

  const gross = items.reduce((sum, item) => sum + item.amountPaise, 0);

  return {
    id: `inv_${booking.id}`,
    businessDate: booking.businessDate,
    createdAtClock: booking.startTime,
    customerId: booking.customerId,
    billedByStaffId: 'stf_imran',
    items,
    discountPaise,
    totalPaise: gross - discountPaise,
    paidPaise: gross - discountPaise,
    refundedPaise: 0,
    method,
  };
}

/**
 * Ninety days of trading. Weekends are busier, Monday is quiet — if the owner's
 * chart is flat, it lies about how a salon actually trades.
 */
function buildHistoryInvoices(
  today: string,
  allCustomers: Customer[],
): Invoice[] {
  const rnd = mulberry32(20261103);
  const invoices: Invoice[] = [];
  const regulars = allCustomers.slice(0, 12);

  for (let daysAgo = 90; daysAgo >= 1; daysAgo -= 1) {
    const businessDate = addDaysISO(today, -daysAgo);
    const weekday = weekdayOf(businessDate);

    const base = weekday === 0 ? 18 : weekday === 6 ? 20 : weekday === 5 ? 15 : weekday === 1 ? 9 : 12;
    const count = Math.max(4, base + intBetween(rnd, -2, 2));

    for (let i = 0; i < count; i += 1) {
      const customer = rnd() < 0.65 ? pick(regulars, rnd) : pick(allCustomers, rnd);
      const member = pick(staff, rnd);
      const eligible = services.filter((service) => service.kinds.includes(member.kind));
      const lineCount = intBetween(rnd, 1, 3);

      const lines: InvoiceItem[] = [];
      for (let line = 0; line < lineCount; line += 1) {
        const service = pick(eligible, rnd);
        if (lines.some((existing) => existing.serviceId === service.id)) continue;
        lines.push({
          id: `inv_h${daysAgo}_${i}_l${line}`,
          serviceId: service.id,
          staffId: member.id,
          serviceName: service.name,
          amountPaise: service.pricePaise,
        });
      }

      const gross = lines.reduce((sum, line) => sum + line.amountPaise, 0);
      const discountPaise = rnd() < 0.18 ? (rnd() < 0.5 ? rupeesToPaise(50) : rupeesToPaise(100)) : 0;
      const totalPaise = Math.max(0, gross - discountPaise);
      const refundedPaise = rnd() < 0.015 ? Math.min(totalPaise, rupeesToPaise(150)) : 0;

      const hour = intBetween(rnd, 10, 19);
      const minute = pick([0, 15, 30, 45], rnd);

      invoices.push({
        id: `inv_h${daysAgo}_${i}`,
        businessDate,
        createdAtClock: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        customerId: customer.id,
        billedByStaffId: 'stf_imran',
        items: lines,
        discountPaise,
        totalPaise,
        paidPaise: totalPaise - refundedPaise,
        refundedPaise,
        method: pick(METHOD_MIX, rnd),
      });
    }
  }

  return invoices;
}

/* ------------------------------------------------------------------ *
 * Queue, requests, reminders
 * ------------------------------------------------------------------ */

function buildQueue(): QueueEntry[] {
  return [
    {
      id: 'que_12',
      token: 12,
      name: 'Rakesh Pawar',
      customerId: 'cus_01',
      staffId: 'stf_vikram',
      serviceIds: ['svc_haircut_men'],
      joinedAtClock: '13:52',
      status: 'in_service',
      estimatedWaitMin: 0,
    },
    {
      id: 'que_13',
      token: 13,
      name: 'Meera Joshi',
      customerId: 'cus_02',
      staffId: 'stf_sana',
      serviceIds: ['svc_facial'],
      joinedAtClock: '14:10',
      status: 'waiting',
      estimatedWaitMin: 12,
    },
    {
      id: 'que_14',
      token: 14,
      name: 'Ananya Sharma',
      customerId: 'cus_ananya',
      staffId: 'stf_imran',
      serviceIds: ['svc_haircut_women', 'svc_blowdry'],
      joinedAtClock: '14:35',
      status: 'waiting',
      estimatedWaitMin: 18,
    },
    {
      id: 'que_15',
      token: 15,
      name: 'Salim Khan',
      customerId: 'cus_03',
      serviceIds: ['svc_haircut_men'],
      joinedAtClock: '14:41',
      status: 'waiting',
      estimatedWaitMin: 24,
    },
    {
      id: 'que_16',
      token: 16,
      name: 'Divya Rane',
      customerId: 'cus_04',
      staffId: 'stf_sana',
      serviceIds: ['svc_cleanup'],
      joinedAtClock: '14:48',
      status: 'waiting',
      estimatedWaitMin: 31,
    },
    {
      id: 'que_17',
      token: 17,
      name: 'Farhan Ali',
      customerId: 'cus_05',
      staffId: 'stf_vikram',
      serviceIds: ['svc_haircut_men', 'svc_beard'],
      joinedAtClock: '14:55',
      status: 'waiting',
      estimatedWaitMin: 36,
    },
  ];
}

const bookingRequests: BookingRequest[] = [
  {
    id: 'req_01',
    channel: 'whatsapp',
    customerName: 'Sneha Iyer',
    phone: '+91 98195 66021',
    serviceIds: ['svc_haircut_women'],
    preferredClock: '17:15',
    requestedAtClock: '13:04',
    note: 'Asked for Ayesha if she is free.',
  },
  {
    id: 'req_02',
    channel: 'call',
    customerName: 'Karan Bhatia',
    phone: '+91 98704 12766',
    serviceIds: ['svc_haircut_men', 'svc_beard'],
    preferredClock: '18:15',
    requestedAtClock: '14:22',
  },
];

function buildReminders(today: string): Reminder[] {
  return [
    {
      id: 'rem_today',
      kind: 'booking',
      channel: 'both',
      dueISO: today,
      dueClock: '15:00',
      message: 'Haircut + Blow Dry with Imran at 3:00 PM today. Reply CANCEL to free the slot.',
      status: 'sent',
    },
    {
      id: 'rem_revisit',
      kind: 'revisit',
      channel: 'both',
      dueISO: addDaysISO(today, 26),
      message: 'It has been a month since your last haircut. Want the same slot with Imran?',
      status: 'scheduled',
    },
    {
      id: 'rem_report',
      kind: 'report',
      channel: 'email',
      dueISO: addDaysISO(today, 1),
      message: 'Your visit summary for this month, sent on the 1st.',
      status: 'scheduled',
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

function build(): MockData {
  const today = todayISO();
  const customers = buildCustomers(today);
  const bookings = buildBookings(today, customers);

  const todayInvoices = bookings
    .filter((booking) => booking.status === 'completed')
    .map((booking, index) =>
      invoiceFromBooking(
        booking,
        // One discounted bill per day, so pro-rata commission allocation is
        // exercised in the UI and not only in unit tests.
        index === 8 ? rupeesToPaise(100) : 0,
        METHOD_MIX[index % METHOD_MIX.length] ?? 'upi',
      ),
    );

  const invoices = [...buildHistoryInvoices(today, customers), ...todayInvoices];

  return {
    salon,
    staff,
    services,
    customers,
    bookings,
    bookingRequests,
    queue: buildQueue(),
    invoices,
    reminders: buildReminders(today),
    notificationPrefs: {
      emailAddress: 'ananya.s@example.com',
      whatsappNumber: '+91 98200 41120',
      email: true,
      whatsapp: true,
      marketingOptIn: true,
    },
    today,
  };
}

/**
 * Built once per process. `selectors.ts` derives every screen number from this
 * object, so the queue screen and the revenue screen cannot disagree.
 */
export const mock: MockData = build();
