import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as schema from './schema/index.js';

/**
 * The database handle used by the API and by scripts.
 *
 * Two different drivers on purpose:
 *   - this one (Neon HTTP) for request/response work, because it is stateless
 *     and works on serverless runtimes
 *   - `pg` inside migrate.ts and seed.ts, because those need a real session
 *     (transactions, DDL, `SET LOCAL`)
 *
 * `DATABASE_URL` must be the **pooled** Neon URL. Migrations use
 * `DATABASE_URL_UNPOOLED`.
 */
export type Database = NeonHttpDatabase<typeof schema>;

export function createDb(url: string | undefined = process.env.DATABASE_URL): Database {
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy packages/db/.env.example to packages/db/.env and fill it in.',
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

let cached: Database | null = null;

/** Single shared handle per process. Throws on first use if DATABASE_URL is absent. */
export function getDb(): Database {
  if (!cached) cached = createDb();
  return cached;
}

/**
 * Runs `fn` inside a transaction whose session carries the salon id, so the RLS
 * policies in `sql/rls.sql` can enforce tenancy as a second wall even if an API
 * query forgets a `where salon_id = …`. See docs/ARCHITECTURE.md.
 *
 * Not wired to the HTTP driver yet — the HTTP driver cannot hold a session, so
 * this is used from the `pg`-based path in B1 when the API lands.
 */
export const RLS_SALON_SETTING = 'app.salon_id';
