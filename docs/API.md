# API

Hono on Vercel, TypeScript, one deployment, routes under `/v1`. Added at B1;
this document is the contract the mobile app codes against.

## Conventions

- JSON in, JSON out. Body limit 100 KB except file upload endpoints.
- Every request carries `Authorization: Bearer <clerk-jwt>`. The API verifies
  the JWT and resolves `profile -> salon_member -> role`. No endpoint trusts a
  `salon_id` or `profile_id` from the body.
- Every response is one of:

```json
{ "data": { }, "requestId": "req_..." }
{ "error": { "code": "slot_taken", "message": "That slot was just taken.", "details": {} }, "requestId": "req_..." }
```

- `code` is a stable snake_case string the app can branch on. `message` is
  human-readable and safe to show. Never leak SQL, stack traces or provider
  text.
- Status codes: 200 ok, 201 created, 400 validation, 401 unauthenticated,
  403 forbidden (role/tenant), 404 not found, 409 conflict (slot taken, invoice
  already paid), 422 business rule, 429 rate limited, 500 unexpected.
- All mutations are idempotent where a phone can retry: clients send an
  idempotency key on billing and payment endpoints.
- Dates are `YYYY-MM-DD`; timestamps are ISO-8601 UTC strings. Money is integer
  paise on the wire, and the field name always ends in `Paise`.

## Endpoints

### Session and provisioning

| Method | Path | Role |
| --- | --- | --- |
| GET | `/v1/me` | any |
| POST | `/v1/onboarding/salon` | new owner |
| GET | `/v1/salon` | owner, reception |
| PATCH | `/v1/salon` | owner |
| GET/POST | `/v1/services` | owner |
| PATCH/DELETE | `/v1/services/:id` | owner |
| GET/POST | `/v1/staff` | owner |
| PATCH | `/v1/staff/:id` | owner |
| GET/PUT | `/v1/staff/:id/shifts` | owner |

### Customers and bookings

| Method | Path | Role |
| --- | --- | --- |
| GET | `/v1/customers?query=` | reception, staff |
| GET | `/v1/customers/:id` | reception, staff (own only) |
| GET | `/v1/customers/:id/history` | staff (own only), owner |
| POST | `/v1/customers` | reception, staff |
| GET | `/v1/availability?staffId&date` | any |
| GET | `/v1/bookings?date=` | reception, staff (own only) |
| POST | `/v1/bookings` | customer, reception, staff |
| PATCH | `/v1/bookings/:id` | owner, reception, owning staff |
| POST | `/v1/bookings/:id/arrive` | reception, owning staff |
| GET/POST | `/v1/booking-requests` | reception, owner |
| POST | `/v1/booking-requests/:id/confirm` | reception |
| POST | `/v1/booking-requests/:id/reject` | reception |

A booking request is never auto-confirmed. Confirming re-checks the slot under
the same partial unique index; if it is gone, return `409 slot_taken`.

### Queue

| Method | Path | Role |
| --- | --- | --- |
| GET | `/v1/queue?date=today` | any (customer sees only own token) |
| POST | `/v1/queue` | reception, staff |
| PATCH | `/v1/queue/:id` | reception, assigned staff |
| POST | `/v1/queue/:id/call` | assigned staff |
| POST | `/v1/queue/:id/complete` | assigned staff |

### Billing

| Method | Path | Role |
| --- | --- | --- |
| POST | `/v1/invoices` | reception |
| GET | `/v1/invoices/:id` | reception, owner |
| POST | `/v1/invoices/:id/payments` | reception |
| POST | `/v1/invoices/:id/refunds` | owner |
| GET | `/v1/invoices/:id/receipt.pdf` | reception, owner |

Invoice creation takes the lines, the discount and the payment intent in one
call and runs in one transaction: allocate discount pro-rata, compute commission
per line, take the next invoice number, insert, then hand off to Razorpay or
record cash.

### Reports

| Method | Path | Role |
| --- | --- | --- |
| GET | `/v1/reports/summary?from&to&granularity` | owner |
| GET | `/v1/reports/today` | owner, reception (revenue and mix only) |
| GET | `/v1/reports/me?from&to` | staff (own only) |
| GET | `/v1/reports/export?format=pdf\|csv` | owner |
| GET | `/v1/commissions?month=` | owner |

`/v1/reports/today` for reception returns revenue and service mix **only** —
no commission, no staff performance, no history.

### Notifications

| Method | Path | Role |
| --- | --- | --- |
| GET/PUT | `/v1/notification-prefs` | any (own) |
| POST | `/v1/notifications/test` | owner |

### Webhooks (unauthenticated, signature-verified)

| Method | Path |
| --- | --- |
| POST | `/v1/webhooks/clerk` |
| POST | `/v1/webhooks/razorpay` |
| GET/POST | `/v1/webhooks/whatsapp` |

Webhooks verify their signature against the raw body **before** parsing, are
idempotent on the provider event id, and always return 2xx quickly after
enqueuing work. WhatsApp `GET` performs the hub verification handshake.

## Errors the app must handle by name

`slot_taken`, `booking_request_expired`, `invoice_already_paid`,
`payment_not_captured`, `role_forbidden`, `tenant_mismatch`,
`validation_failed`, `rate_limited`, `provider_unavailable`.

Everything else shows a generic "Something went wrong. Try again." with the
`requestId` for support.
