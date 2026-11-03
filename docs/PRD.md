# PRD — Salon

Salon is a mobile app (Android + iOS) for a single-location hair salon. It answers
four questions, every day, for four different people:

| Who | Question they open the app with |
| --- | --- |
| Customer | "Can I get a slot at 6pm?" / "How long is the wait?" |
| Reception | "Who is next, and what do I bill them?" |
| Stylist | "How many haircuts did I do today, and this month?" |
| Owner | "What did we earn, and who earned it?" |

Everything in v1 serves one of those four questions. If a feature does not, it is
out of scope.

## Roles

| Role | Sees | Cannot see |
| --- | --- | --- |
| Customer | slots, live queue position, their own reminders | anything else |
| Reception | today's bookings, walk-in entry, billing, today's revenue and service mix | commission, staff performance, monthly history |
| Staff | own queue, own customers, own 6-month history, own daily counts | other stylists' rows, salon totals |
| Owner | everything, plus the performance dashboard | — |

All roles receive notifications on **both** email and WhatsApp (see
`NOTIFICATIONS.md`). Customers opt in to marketing separately.

## Screens (exactly 11)

Tabs, sheets and drill-downs inside a screen are allowed. A twelfth top-level
screen is not.

| # | Screen | Role |
| --- | --- | --- |
| 1 | Slot Booking | customer |
| 2 | Live Queue | customer |
| 3 | Reminder | customer |
| 4 | Aaj ki Bookings | reception |
| 5 | Walk-in Entry | reception |
| 6 | Billing | reception |
| 7 | Aaj ke Customers | staff |
| 8 | Customer History (6 months) | staff |
| 9 | Roz ki Kamai | owner |
| 10 | Staff Commission | owner |
| 11 | Login | everyone |

## Jobs to be done

1. **Book** a slot in under 30 seconds, by app, WhatsApp, or a phone call to a
   stylist. A WhatsApp or call booking becomes a *pending request*; reception
   confirms it in one tap. The app never confirms a slot on its own.
2. **Queue** walk-ins and arrivals, with a token the customer can understand.
3. **Record** every service performed, against a customer, a stylist and a price.
4. **Bill** in one screen: services, discount, payment method, receipt sent to
   email and WhatsApp.
5. **Report** revenue, services per day, services per stylist, and monthly detail.

## Metric definitions (binding)

These definitions are implemented once in `packages/shared/src/metrics.ts` and
must be reused, never re-derived, on any screen or report.

- **Revenue** — completed invoices whose payment is captured, minus refunds.
  Money is integer paise everywhere.
- **Services count** — rows in `invoice_items`. A haircut plus a beard trim is
  **2 services for 1 customer**.
- **Stylist attribution** — `invoice_items.staff_id` (who performed it), not
  `bookings.staff_id` (who it was booked with).
- **Commission base** — line total after the invoice discount is allocated
  pro-rata across lines (largest-remainder, so the parts sum to the whole).
- **Utilisation** — service minutes divided by scheduled staff hours from
  `staff_shifts`; `null` when there is no shift data, never 0.
- **New vs returning** — a customer is new on their first-ever completed visit,
  returning on any visit after that.

Owner and staff numbers must come from the same `report_summary` query so they
can never disagree.

## Out of scope for v1

Multiple branches (the column exists, the UI does not), packages/prepaid
bundles, wallet, attendance, inventory, GST filing (a GSTIN field exists; GST is
off by default), missed-call auto-linking, autonomous WhatsApp booking
confirmation, AI parsing of free-text WhatsApp messages, and web dashboards.

## Definition of done for the mock milestone

A signed internal Android APK (EAS) and a TestFlight build that run the full
front-end flow against seeded local data, installed on a real phone.
