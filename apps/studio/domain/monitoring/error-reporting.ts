import { Context, Effect, Layer } from 'effect'

import { CurrentLocation } from './current-location'
import { Sentry } from './sentry'

export class ErrorReporting extends Context.Service<
  ErrorReporting,
  {
    readonly captureCriticalError: (error: Error, context: string) => Effect.Effect<void>
  }
>()('studio/domain/monitoring/ErrorReporting') {}

export const ErrorReportingLive = Layer.effect(
  ErrorReporting,
  Effect.gen(function* () {
    const location = yield* CurrentLocation
    const sentry = yield* Sentry

    return {
      captureCriticalError: (error, context) =>
        Effect.gen(function* () {
          const path = yield* location.path
          yield* sentry.setContext('page', { path })

          const criticalError = new Error(error.message)
          criticalError.name = 'CriticalError'
          yield* sentry.captureException(criticalError, { critical: 'true', context })
        }),
    }
  })
)
