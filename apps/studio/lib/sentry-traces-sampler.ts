import type { BrowserOptions } from '@sentry/react'

// TEMPORARY (FE-3828): perf-relevant routes are sampled higher while we collect the dashboard
// performance baseline (FE-3824). To revert once the baseline is captured, delete this file and set
// `tracesSampleRate: 0.02` in `buildSentryClientOptions` (lib/sentry-client-options.ts) in place of
// `tracesSampler`. To only dial the boost down, lower `PERF_ROUTE_TRACES_SAMPLE_RATE`.

/** Rate for every transaction that isn't a perf-relevant route. This was the flat rate before FE-3828. */
export const DEFAULT_TRACES_SAMPLE_RATE = 0.02

/** Rate for perf-relevant routes: 10x the default, enough for per-surface numbers. */
export const PERF_ROUTE_TRACES_SAMPLE_RATE = 0.2

// Matches the TanStack route ID (`/project/$ref/editor`) the router tracing integration uses as the
// transaction name, and the resolved path (`/project/abc/editor`) it falls back to before a route matches.
const PERF_ROUTE_PATTERN = /^\/project\/[^/]+(\/(editor|sql|auth|database)(\/|$)|\/?$)/

export function isPerfRoute(transactionName: string): boolean {
  return PERF_ROUTE_PATTERN.test(transactionName)
}

/**
 * Samples perf-relevant routes at `PERF_ROUTE_TRACES_SAMPLE_RATE` and everything else at
 * `DEFAULT_TRACES_SAMPLE_RATE`. A sampling decision made upstream (for example a propagated
 * `sentry-trace` header) is honored, and the chosen rate is recorded on the trace.
 */
export const studioTracesSampler: NonNullable<BrowserOptions['tracesSampler']> = ({
  name,
  inheritOrSampleWith,
}) => {
  return inheritOrSampleWith(
    isPerfRoute(name) ? PERF_ROUTE_TRACES_SAMPLE_RATE : DEFAULT_TRACES_SAMPLE_RATE
  )
}
