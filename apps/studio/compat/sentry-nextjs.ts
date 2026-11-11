/**
 * TanStack-build replacement for `@sentry/nextjs`.
 *
 * `@sentry/nextjs`'s client entry imports `next/dist/shared/lib/constants`,
 * which evaluates `...(process?.features?.typescript ? ['next.config.mts'] : [])`
 * at module scope. Optional chaining does NOT guard an undeclared `process`
 * identifier in the browser, so any built chunk containing it throws
 * `ReferenceError: process is not defined` at load time (observed on the
 * table editor route). The Vite dev server shims `process`, so the crash
 * only surfaces in the production/test build.
 *
 * vite.config.ts aliases `@sentry/nextjs` to this module for the TanStack
 * build only — app source keeps importing `@sentry/nextjs`, and the Next
 * build (`build:next`) is untouched.
 *
 * `@sentry/nextjs` re-exports `@sentry/react` (same version, 10.x) and adds
 * Next-specific helpers on top. Everything Studio uses at runtime —
 * `captureException`, `captureMessage`, `startSpan`, `withScope`, `setTag`,
 * `setUser`, `init`, and the `Event` / `Breadcrumb` / `StackFrame` types —
 * exists in `@sentry/react`, so re-export the lot.
 */
import { captureException } from '@sentry/react'

// eslint-disable-next-line barrel-files/avoid-re-export-all -- compat shim: its whole job is to mirror @sentry/react's surface
export * from '@sentry/react'

// ---------------------------------------------------------------------------
// Next-specific APIs with no `@sentry/react` equivalent. None of them are in
// the TanStack/Vite module graph today (they're only referenced from
// Next-convention files: instrumentation-client.ts, instrumentation.ts and
// next.config.ts), but provide explicit stand-ins so the alias can never
// produce an `undefined is not a function` crash if one leaks in later.
// ---------------------------------------------------------------------------

/**
 * `@sentry/nextjs`'s hook for Next's `onRouterTransitionStart` instrumentation
 * event. TanStack Router navigation spans would instead come from
 * `Sentry.tanstackRouterBrowserTracingIntegration` — no-op here.
 */
export function captureRouterTransitionStart(_href: string, _navigationType: string): void {}

/**
 * `@sentry/nextjs`'s hook for Next's `onRequestError` server instrumentation.
 * Report the error through the regular capture pipeline instead.
 */
export function captureRequestError(
  error: unknown,
  _request: unknown,
  _errorContext: unknown
): void {
  // `captureException` from `@sentry/react` is isomorphic (no-op without an
  // initialized client), so this is safe on both server and client.
  captureException(error)
}

/**
 * Build-time-only wrapper for next.config — meaningless under Vite. Return
 * the config unchanged so any accidental usage is inert.
 */
export function withSentryConfig<T>(config: T, ..._options: unknown[]): T {
  return config
}
