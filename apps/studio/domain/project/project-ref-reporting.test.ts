import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { reportMissingProjectRef } from './project-ref-reporting'
import { ErrorReporting } from '@/domain/monitoring/error-reporting'

describe('reportMissingProjectRef', () => {
  it('captures an error naming the offending component', async () => {
    const calls: Array<{ error: Error; context: string }> = []
    const layer = Layer.succeed(ErrorReporting, {
      captureCriticalError: (error, context) =>
        Effect.sync(() => void calls.push({ error, context })),
    })

    await Effect.runPromise(Effect.provide(reportMissingProjectRef('ExplorerSidebar'), layer))

    expect(calls).toHaveLength(1)
    expect(calls[0].context).toBe('withProjectRef')
    expect(calls[0].error.message).toBe('ExplorerSidebar rendered without an active project route')
  })
})
