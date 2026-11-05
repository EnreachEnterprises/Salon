/**
 * Single entry point for mock data during the UI block.
 *
 * Screens import from `@/mock` and nothing else. At B1 this barrel keeps its
 * exports and swaps the bodies for API calls, so route files do not change.
 */
export * from './fixtures';
export * from './labels';
export * from './selectors';
