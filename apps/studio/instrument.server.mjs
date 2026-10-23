// Server-side Sentry init for the TanStack Start runtime. Mirrors
// sentry.server.config.ts (Next) with the `@sentry/tanstackstart-react` SDK.
// server.ts imports it first so it runs before the route tree evaluates.
//
// Reads process.env at call time (NEXT_PUBLIC_* are inlined at build time
// instead), so env files must be loaded before the server boots self-hosted.

import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }),
  debug: false,

  // Tie server events to the deploy for source-map resolution.
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // Enable performance monitoring
  tracesSampleRate: 0.02,
  ignoreErrors: [
    'ResizeObserver',
    'Failed to load Stripe.js',
    // Network / infrastructure
    /504 Gateway Time-out/,
    'Network request failed',
    'Failed to fetch',
    'AbortError',
    // Code-split loading failures
    'ChunkLoadError',
    /Loading chunk [\d]+ failed/,
    // React hydration mismatches caused by extensions modifying DOM before hydration
    /text content does not match/i,
    /There was an error while hydrating/i,
  ],
})
