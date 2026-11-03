import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

/**
 * `drizzle-kit generate` only reads the schema — it does not connect — but the
 * config still wants a URL, so a local placeholder is used when none is set.
 * `db:migrate` and `db:seed` do connect, and read the same env file.
 */
const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  'postgres://placeholder:placeholder@localhost:5432/salon';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
