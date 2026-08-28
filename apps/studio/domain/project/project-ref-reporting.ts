import { Effect } from 'effect'

import { ErrorReporting } from '@/domain/monitoring/error-reporting'

/**
 * `withProjectRef` only renders `fallback` when there's no active project
 * route — for components it wraps, that's always a composition bug (they're
 * only ever meant to render on project-scoped routes), so report it.
 */
export const reportMissingProjectRef = (
  componentName: string
): Effect.Effect<void, never, ErrorReporting> =>
  Effect.gen(function* () {
    const reporting = yield* ErrorReporting
    yield* reporting.captureCriticalError(
      new Error(`${componentName} rendered without an active project route`),
      'withProjectRef'
    )
  })
