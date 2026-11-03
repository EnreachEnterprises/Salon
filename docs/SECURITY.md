# Security

The app holds customer phone numbers, purchase history and staff pay. Treat all
three as sensitive.

## Secrets

Every secret is an environment variable read server-side only. Never in the
mobile bundle, never in a log, never in a commit.

| Secret | Used by |
| --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | API / migrations |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` | API |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | API |
| `RESEND_API_KEY` | API |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | API |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | API |

The mobile app may hold only the Clerk publishable key and the API base URL.
`.env*` is gitignored except `.env.example`. Rotate any key that has ever been
pasted into a chat, a screenshot or a build log.

## Authorization

Three checks on every server entry point, in this order:

1. **Authenticated** — valid Clerk JWT, not expired, not for another
   environment.
2. **Tenant** — the caller is an active member of the salon being touched. The
   salon is derived from the session, never from the request body.
3. **Role** — the role permits the action, and a staff member may only touch
   their own rows. A staff id from the client is a hint, never a grant.

The UI hiding a button is not authorization. Assume every endpoint is called by
curl.

Postgres RLS is the second wall (see `DATABASE.md`). It is a backstop, not a
substitute: an API bug plus a permissive policy equals a leak.

## Input

- Every external input — form, route param, webhook body, query string — is
  validated with a zod schema from `@salon/shared` before it reaches a service.
- Never trust a client-supplied price, discount, commission rate, `salon_id`,
  `staff_id`, `business_date` or invoice number. Recompute from the database.
- Never interpolate SQL. Drizzle parameters, or `sql` template values — never
  string concatenation.
- Escape anything rendered from a customer name or note.

## Webhooks

- Verify the signature against the **raw** body before parsing.
- Be idempotent on the provider event id, so a retried delivery cannot
  double-apply.
- Return 2xx fast; do slow work after enqueuing.
- Razorpay: never mark a payment captured from a client callback. Only from a
  verified webhook or an explicit capture call.

## PII

- `booking_requests.raw_payload` holds WhatsApp webhook bodies. Purge after 30
  days by cron.
- Phone numbers are stored as E.164 digits without the plus, and displayed
  masked (`98••••••23`) everywhere except the customer's own detail screen.
- Logs carry ids, never phone numbers, emails, names or raw payloads.
- A deletion request removes the customer's notes and PII, keeps the financial
  rows required for accounting, and writes to `audit_log`.

## Rate limits

Per IP and per session: auth endpoints, booking creation, booking-request
creation, invoice creation, notification sends, and any export. Return `429`
with the stable code `rate_limited`. Booking creation and slot confirmation are
also protected by the partial unique index, not only by the check.

## Audit

`audit_log` records who changed what, when: price changes, discounts over a
threshold, refunds, staff deactivation, role changes, and manual notification
sends. Append-only.

## Reporting a problem

Security issues go to the owner directly, not into a public issue. If a secret
leaks: rotate first, then investigate, then write down what happened.
