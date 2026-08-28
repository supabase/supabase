import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { CurrentLocation } from './current-location'
import { ErrorReporting, ErrorReportingLive } from './error-reporting'
import { Sentry } from './sentry'

describe('ErrorReportingLive', () => {
  it('attaches the current path as context and captures a tagged critical error', async () => {
    const setContextCalls: Array<{ key: string; value: Record<string, unknown> }> = []
    const captureCalls: Array<{ error: Error; tags: Record<string, string> }> = []

    const fakeSentry = Layer.succeed(Sentry, {
      setContext: (key, value) => Effect.sync(() => void setContextCalls.push({ key, value })),
      captureException: (error, tags) => Effect.sync(() => void captureCalls.push({ error, tags })),
    })
    const fakeCurrentLocation = Layer.succeed(CurrentLocation, {
      path: Effect.succeed('/project/default/explorer'),
    })

    await Effect.runPromise(
      Effect.provide(
        Effect.gen(function* () {
          const reporting = yield* ErrorReporting
          yield* reporting.captureCriticalError(new Error('boom'), 'test')
        }),
        Layer.provide(ErrorReportingLive, Layer.merge(fakeCurrentLocation, fakeSentry))
      )
    )

    expect(setContextCalls).toEqual([{ key: 'page', value: { path: '/project/default/explorer' } }])
    expect(captureCalls).toHaveLength(1)
    expect(captureCalls[0].error.message).toBe('boom')
    expect(captureCalls[0].error.name).toBe('CriticalError')
    expect(captureCalls[0].tags).toEqual({ critical: 'true', context: 'test' })
  })
})
