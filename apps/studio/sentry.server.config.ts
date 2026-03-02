// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  }),
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable performance monitoring
  tracesSampleRate: 0.001, // Capture 0.1% of transactions for performance monitoring
  ignoreErrors: [
    'ResizeObserver',
    'Failed to load Stripe.js',
    // Next.js internals — not actual errors
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
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
