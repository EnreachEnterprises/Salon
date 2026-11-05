# Runbook

What to run, what breaks, and what to do about it.

## Local setup

```bash
npm install                      # always from the repo root, never from apps/mobile
cp packages/db/.env.example packages/db/.env
# fill DATABASE_URL and DATABASE_URL_UNPOOLED

npm run db:migrate               # applies migrations to the unpooled URL
npm run db:seed                  # deterministic demo salon; refuses if one exists

npm run mobile                   # Expo dev server
npm run android                  # Android
npm run ios                      # iOS (macOS only)
```

Tests and checks:

```bash
npm run typecheck                # every workspace
npm test                         # vitest in packages/shared
npm run db:generate              # after any schema change
```

## Known local snags

| Symptom | Cause / fix |
| --- | --- |
| `npm error Cannot read properties of null (reading 'location')` | you ran `npm install` inside `apps/mobile`. Delete its `node_modules`, install from the root. |
| `Missing script: "db:generate"` | run it from the repo root, or `npm run generate -w @salon/db`. |
| `npm install-scripts approve` prompt | npm 11 blocks install scripts; approve `esbuild`, then reinstall. |
| `tsc` failure followed by a `NativeCommandError` block | the PowerShell noise is after the real error. Read the `tsc` lines above it. |
| `TS5101` on `baseUrl` | `baseUrl` is intentionally removed; `paths` are relative to the tsconfig. |
| `db:seed` exits with "salon already exists" | by design. Drop the database or use a fresh branch. |

## Migrations

1. Change the schema in `packages/db/src/schema/`.
2. `npm run db:generate` — review the SQL it wrote.
3. Run it against a Neon **branch** first, never straight to production.
4. `npm run db:migrate`.
5. Never edit an applied migration.

Rollback is a Neon instant restore to a timestamp, or a forward-only fix. Choose
one before running anything destructive, not after.

## Neon

- Compute autosuspends when idle; the first request after a pause is slow.
  Health checks should tolerate one cold second.
- Pooled URL for the API, unpooled for migrations. Using the pooled URL for DDL
  will eventually fail in a confusing way.
- A branch is a full copy of data and schema; use it for every risky migration
  and for load tests.

## Deploy

- API: Vercel, `main` is production, pull requests get previews with their own
  environment. Secrets live in Vercel, not in the repo.
- Mobile: EAS build. Internal APK for testers, TestFlight for iOS. A store
  release needs its own build, not an internal one promoted.

  ```
  cd apps/mobile
  npx eas build -p android --profile preview    # installable APK
  npx eas build -p ios --profile preview        # TestFlight, needs Apple account
  npx eas build -p android --profile production # store build
  ```

  `preview` produces an APK and skips the store. iOS has no committed `ios/`
  folder; EAS generates it on a macOS runner from `app.json`.
- Crons (Vercel): reminder sweep, weekly summary, monthly report, payload purge.
  A cron that fails silently is worse than no cron — every run writes a row.

## Incidents

**Payments failing.** Check Razorpay status first, then the webhook secret, then
the `payments` table for stuck `pending` rows. Never mark paid by hand from a
client callback; reconcile from the verified webhook or the dashboard.

**WhatsApp sends failing.** Check template status in Meta Business Manager, then
the access token, then the rate limit. Failed sends fall back to email and are
visible in `notifications`. Do not resend marketing in a loop.

**Queue not updating.** It polls every 5 seconds while focused. Check network,
then `/v1/queue`, then the database. There is no socket to reconnect.

**Wrong number on a report.** Do not patch the screen. Check
`packages/shared/src/metrics.ts` and the `report_summary` query — the two must
agree, and every screen must use them. A number that disagrees is a bug in one
of those two places, not three.

**Data leak suspicion.** Rotate the affected secret first. Then read
`audit_log`, then the API logs by `requestId`. RLS is a backstop; check whether
the setting was actually applied in the transaction before assuming it held.

## What to check before calling something done

- `npm run typecheck` and `npm test` pass.
- New UI works at 375px wide, in dark mode, with 200% text.
- Loading, empty, error and data states all exist.
- Money is integer paise, and a discount still sums to the whole.
- Docs updated if a table, route, component or decision changed.
