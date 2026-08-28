import { RegistryContext } from '@effect/atom-react'
import { screen, waitFor } from '@testing-library/react'
import { Effect, Layer, Option } from 'effect'
import { Atom, AtomRegistry } from 'effect/unstable/reactivity'
import { describe, expect, it } from 'vitest'

import { projectRefAtom } from './project.atoms'
import { withProjectRef } from './withProjectRef'
import { ErrorReporting } from '@/domain/monitoring/error-reporting'
import { customRender } from '@/tests/lib/custom-render'

const TestComponent = ({ projectRef }: { projectRef: string }) => <p>ref: {projectRef}</p>

const makeTestReportingRuntime = () => {
  const calls: Array<{ error: Error; context: string }> = []
  const runtime = Atom.runtime(
    Layer.succeed(ErrorReporting, {
      captureCriticalError: (error, context) =>
        Effect.sync(() => void calls.push({ error, context })),
    })
  )
  return { calls, runtime }
}

describe('withProjectRef', () => {
  it('renders the fallback and reports a bug when there is no active project ref', async () => {
    const registry = AtomRegistry.make()
    const { calls, runtime } = makeTestReportingRuntime()
    const Wrapped = withProjectRef(TestComponent, <p>No active project</p>, runtime)

    customRender(
      <RegistryContext.Provider value={registry}>
        <Wrapped />
      </RegistryContext.Provider>
    )

    expect(screen.getByText('No active project')).toBeInTheDocument()
    expect(screen.queryByText(/^ref:/)).not.toBeInTheDocument()

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].context).toBe('withProjectRef')
    expect(calls[0].error.message).toBe('TestComponent rendered without an active project route')

    registry.dispose()
  })

  it('reports the bug only once across multiple re-renders while still missing', async () => {
    const registry = AtomRegistry.make()
    const { calls, runtime } = makeTestReportingRuntime()
    const Wrapped = withProjectRef(TestComponent, <p>No active project</p>, runtime)
    const ui = (
      <RegistryContext.Provider value={registry}>
        <Wrapped />
      </RegistryContext.Provider>
    )

    const { rerender } = customRender(ui)
    await waitFor(() => expect(calls).toHaveLength(1))

    rerender(ui)
    rerender(ui)
    rerender(ui)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toHaveLength(1)

    registry.dispose()
  })

  it('renders the wrapped component with projectRef and reports nothing', async () => {
    const registry = AtomRegistry.make()
    registry.set(projectRefAtom, Option.some('my-ref'))
    const { calls, runtime } = makeTestReportingRuntime()
    const Wrapped = withProjectRef(TestComponent, <p>No active project</p>, runtime)

    customRender(
      <RegistryContext.Provider value={registry}>
        <Wrapped />
      </RegistryContext.Provider>
    )

    expect(screen.getByText('ref: my-ref')).toBeInTheDocument()
    expect(screen.queryByText('No active project')).not.toBeInTheDocument()
    expect(calls).toHaveLength(0)

    registry.dispose()
  })
})
