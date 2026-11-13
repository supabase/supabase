// Sentry server-side configuration, used by `instrument.server.mjs` (imported
// first by `server.ts`).
import type { init } from '@sentry/tanstackstart-react'

import { applyStudioErrorPolicy } from '@/lib/errors/sentry-event-policy'

// `@sentry/core`'s `Options` isn't a direct dependency, and the SDK doesn't re-export it.
type SentryServerOptions = Parameters<typeof init>[0]

export interface SentryServerOptionsOverrides {
  /**
   * Release identifier (the commit SHA). The build runs no Sentry bundler plugin to inject one.
   */
  release?: string
}

export function buildSentryServerOptions({
  release,
}: SentryServerOptionsOverrides = {}): SentryServerOptions {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    ...(process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT && {
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    }),
    // Conditional spread so the key is absent, not `undefined`; see `release` above.
    ...(release && { release }),
    debug: false,
    tracesSampleRate: 0.02,
    // Integrations (e.g. the Vercel AI SDK tool-call capture) report thrown errors directly, without
    // going through `reportStudioError`, so Studio's privacy rules are applied here too.
    beforeSend(event, hint) {
      return applyStudioErrorPolicy(event, hint.originalException)
    },
    ignoreErrors: [
      'ResizeObserver',
      'Failed to load Stripe.js',
      // Next.js internals, not actual errors (harmless on TanStack)
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
  }
}
