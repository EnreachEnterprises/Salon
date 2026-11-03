# Roadmap

Three blocks, about 39.5 dev-days, roughly 8 weeks. Each block ends in something
that can be shown, not a status report.

## Block 1 — front end, 12 days

Built against seeded data and a thin mock layer. Ends in a distributable mock
build: internal Android APK via EAS plus a TestFlight build, installed on a real
phone.

| Phase | Days | Scope | Exit |
| --- | --- | --- | --- |
| P0 | 1.5 | monorepo, schema, shared logic, theme, seed | typecheck + tests green, schema generated |
| P1 | 1.5 | navigation, login shell, role routing, design primitives | 11 routes exist and navigate by role |
| P2 | 2 | customer: slot booking, live queue, reminder | a customer can book and watch a token |
| P3 | 2.5 | reception: aaj ki bookings, walk-in, billing | a walk-in can be billed end to end |
| P4 | 1.5 | staff: aaj ke customers, 6-month history | a stylist sees only their own rows |
| P5 | 2 | owner: roz ki kamai, staff commission, dashboard | numbers match the seeded bills |
| P6 | 1 | polish, empty/loading/error states, mock build | APK + TestFlight link |

## Block 2 — backend, 25 days

| Phase | Days | Scope |
| --- | --- | --- |
| B1 | 3 | Hono skeleton, Clerk verification, tenancy, RLS applied |
| B2 | 2.5 | provisioning, services, staff, shifts |
| B3 | 5 | bookings, availability, booking requests, queue |
| B4 | 3 | billing, invoice numbers, Razorpay, receipts |
| B5 | 4 | notifications: Resend, WhatsApp adapter, outbox, templates |
| B6 | 3 | reports: `report_summary`, owner dashboard, exports |
| B7 | 2.5 | WhatsApp booking flow, webhooks, crons (reminders, weekly, monthly) |
| B8 | 2 | hardening: rate limits, audit log, error states, load check |

## Block 3 — release, 2.5 days

Store listings, screenshots, privacy policy, Play Console and App Store review
submission, production keys, observability, rollback plan.

## Start in week 1, because they are calendar-bound

These are not dev tasks and they do not wait for code:

- Apple Developer enrolment ($99) — needed for TestFlight at day 12.
- Meta business verification, WhatsApp number, 10 template approvals (2–10 days).
- Razorpay KYC.
- Resend domain verification.
- Play Console account ($25).
- Neon project and Clerk application.

## Explicitly after v1

Multiple branches, packages and wallet, attendance, inventory, GST filing,
missed-call auto-linking (needs Exotel/Twilio), autonomous WhatsApp
confirmation, AI parsing of free-text messages, a web dashboard, and
materialised reporting views.
