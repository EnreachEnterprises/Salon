import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

/**
 * Applies `migrations/*.sql` in order, in one transaction, then exits.
 *
 * Uses the **unpooled** URL: Neon's pooler is for many short queries, not for
 * holding a DDL transaction. `npm run db:migrate` from the repo root.
 */
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
  console.error(
    'DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set.\n' +
      'Copy packages/db/.env.example to packages/db/.env and fill it in.',
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });

try {
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('migrations applied');
} catch (error) {
  console.error('migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
