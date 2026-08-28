import { RegistryContext } from '@effect/atom-react'
import { renderHook, waitFor } from '@testing-library/react'
import { Effect, Layer } from 'effect'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { describe, expect, it } from 'vitest'

import { useReportMissingProjectRefOnce } from './useReportMissingProjectRefOnce'
import { ErrorReporting } from '@/domain/monitoring/error-reporting'

const makeTestRuntime = () => {
  const calls: Array<{ error: Error; context: string }> = []
  const runtime = Atom.runtime(
    Layer.succeed(ErrorReporting, {
      captureCriticalError: (error, context) =>
        Effect.sync(() => void calls.push({ error, context })),
    })
  )
  return { calls, runtime }
}

describe('useReportMissingProjectRefOnce', () => {
  it('does not re-fire when only the runtime reference changes while still missing', async () => {
    const registry = AtomRegistry.make()
    const first = makeTestRuntime()

    const { rerender } = renderHook(
      ({ projectRef, runtime }) => useReportMissingProjectRefOnce(projectRef, runtime, 'Test'),
      {
        initialProps: { projectRef: undefined as string | undefined, runtime: first.runtime },
        wrapper: ({ children }) => (
          <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
        ),
      }
    )

    await waitFor(() => expect(first.calls).toHaveLength(1))

    // A brand new runtime (also resolving to Success) while `projectRef`
    // stays unchanged (still missing) simulates `runtimeResult` changing for
    // reasons unrelated to `projectRef` itself.
    const second = makeTestRuntime()
    rerender({ projectRef: undefined, runtime: second.runtime })

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(first.calls).toHaveLength(1)
    expect(second.calls).toHaveLength(0)

    registry.dispose()
  })

  it('reports again after regaining and then losing the project ref', async () => {
    const registry = AtomRegistry.make()
    const { calls, runtime } = makeTestRuntime()

    const { rerender } = renderHook(
      ({ projectRef }) => useReportMissingProjectRefOnce(projectRef, runtime, 'Test'),
      {
        initialProps: { projectRef: undefined as string | undefined },
        wrapper: ({ children }) => (
          <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
        ),
      }
    )

    await waitFor(() => expect(calls).toHaveLength(1))

    rerender({ projectRef: 'my-ref' })
    rerender({ projectRef: undefined })

    await waitFor(() => expect(calls).toHaveLength(2))

    registry.dispose()
  })
})
