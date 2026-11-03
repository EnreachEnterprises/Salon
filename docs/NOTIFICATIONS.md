# Notifications

Every user — owner, reception, stylist, customer — can be reached on **email and
WhatsApp**. Both channels are on by default; `notification_prefs` decides per
person, and marketing needs recorded consent.

## Channels

| Channel | Provider | Notes |
| --- | --- | --- |
| Email | Resend | React Email templates, sent only from the API |
| WhatsApp | Meta WhatsApp Cloud API (direct) | behind a provider adapter in `notify/` |

WhatsApp goes through an adapter, not scattered `fetch` calls, so the provider
can be swapped without touching a single caller.

## Categories and cost

WhatsApp charges by category. This split is a budget decision, not a detail.

| Event | WhatsApp category | Email |
| --- | --- | --- |
| Booking confirmed / rescheduled / cancelled | utility | yes |
| Queue token, "you're next", "your turn" | utility | optional |
| Receipt after payment | utility | yes (PDF attached) |
| Daily commission summary to a stylist | utility | yes |
| 30-day "we miss you" reminder | **marketing** (3–5× cost) | yes |
| Weekly summary to owner | **marketing** | yes |
| Monthly report to owner | utility | yes (PDF attached) |
| Login / security notice | utility | yes |

Every send records its estimated cost in `notifications.cost_inr_paise`. The
budget target is ₹300–800 per salon per month; the monthly report shows the
actual figure so it can be checked against the target.

## Rules

1. Sending happens only from the API, never from the mobile app.
2. One event, two channels, one `notifications` row per attempt — so "did the
   customer actually get it?" is answerable.
3. Delivery is at-least-once from an outbox; the provider message id is unique,
   so a retry does not double-send.
4. A failed WhatsApp send does not fail the booking. Email stands in, and the
   failure is visible on the notification record.
5. Marketing is opt-in. `marketing_opt_in` defaults false; only a recorded
   customer action sets it true.
6. Templates are pre-approved by Meta. Template name and language are part of
   the code, and a template edit is a release, not a settings change.
7. No PII in logs. No phone number in a URL.

## Templates (v1)

`booking_confirmed`, `booking_reminder_30d`, `queue_token`, `queue_next`,
`receipt_paid`, `payment_failed`, `commission_daily`, `weekly_summary`,
`monthly_report`, `login_code`.

Each exists in email (React Email) and WhatsApp (approved template) form, with
the same facts in the same order, so a customer reading both is not confused.

## Testing

- `POST /v1/notifications/test` (owner only) sends both channels to the caller
  and returns each provider's result.
- Staging uses a test WhatsApp number and a Resend test domain.
- Never test against a real customer's phone number.

## Failure handling

| Failure | Behaviour |
| --- | --- |
| Resend 5xx | retry with backoff, up to 3 attempts, then mark failed |
| WhatsApp template rejected | log, alert owner, fall back to email |
| WhatsApp rate limited | queue, retry after the provider's window |
| Invalid phone number | mark failed permanently, surface in settings |
| Provider outage | outbox holds; nothing is lost; screen shows "not yet sent" |

## Setup checklist (week 1, blocking)

1. Meta business verification (2–10 days).
2. WhatsApp business number purchased and connected.
3. Ten templates submitted and approved.
4. Resend domain verified (SPF, DKIM, DMARC).
5. Email sender identity and reply-to set.
