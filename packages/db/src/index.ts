/**
 * Public entry point of @salon/db.
 *
 * Nothing here should ever be imported by the mobile app — the app talks to the
 * API, never to Postgres. A connection string in a shipped binary is a data
 * breach with extra steps.
 */

export * from './schema/index.js';
export { createDb, getDb, RLS_SALON_SETTING, type Database } from './client.js';
