// Server-side Sentry init for the TanStack Start runtime.
//
// Mirrors sentry.server.config.ts (the Next.js server init) but uses the
// unified `@sentry/tanstackstart-react` SDK. It is the first import of
// server.ts (the Start server entry Nitro bundles), so it runs before the
// route tree evaluates on every target: Vercel injects env vars into
// process.env, and self-hosted / e2e go through scripts/start.mjs, which loads
// the .env cascade before booting the server.
//
// Reads process.env at call time (unlike NEXT_PUBLIC_* which the client bundle
// inlines at build time), so it must run after env loading on self-hosted.

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
