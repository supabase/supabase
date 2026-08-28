import * as SentryClient from '@sentry/nextjs'
import { Context, Effect, Layer } from 'effect'

/**
 * Thin wrapper over the primitive Sentry SDK calls we use. Deliberately no
 * logic here (no whitelisting, no naming conventions) — that belongs in
 * whatever depends on this service, where it's testable without a real
 * Sentry mock. This is the only file that imports `@sentry/nextjs`.
 */
export class Sentry extends Context.Service<
  Sentry,
  {
    readonly captureException: (error: Error, tags: Record<string, string>) => Effect.Effect<void>
    readonly setContext: (key: string, value: Record<string, unknown>) => Effect.Effect<void>
  }
>()('studio/domain/monitoring/Sentry') {}

export const SentryLive = Layer.succeed(Sentry, {
  captureException: (error, tags) =>
    Effect.sync(() => {
      SentryClient.withScope((scope) => {
        Object.entries(tags).forEach(([key, value]) => scope.setTag(key, value))
        SentryClient.captureException(error)
      })
    }),
  setContext: (key, value) => Effect.sync(() => SentryClient.setContext(key, value)),
})
