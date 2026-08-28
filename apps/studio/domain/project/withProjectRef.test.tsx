import { RegistryContext } from '@effect/atom-react'
import { screen } from '@testing-library/react'
import { Option } from 'effect'
import { AtomRegistry } from 'effect/unstable/reactivity'
import { describe, expect, it } from 'vitest'

import { projectRefAtom } from './project.atoms'
import { withProjectRef } from './withProjectRef'
import { customRender } from '@/tests/lib/custom-render'

const TestComponent = ({ projectRef }: { projectRef: string }) => <p>ref: {projectRef}</p>
const Wrapped = withProjectRef(TestComponent, <p>No active project</p>)

describe('withProjectRef', () => {
  it('renders the fallback when there is no active project ref', () => {
    const registry = AtomRegistry.make()

    customRender(
      <RegistryContext.Provider value={registry}>
        <Wrapped />
      </RegistryContext.Provider>
    )

    expect(screen.getByText('No active project')).toBeInTheDocument()
    expect(screen.queryByText(/^ref:/)).not.toBeInTheDocument()

    registry.dispose()
  })

  it('renders the wrapped component with projectRef once one is set', () => {
    const registry = AtomRegistry.make()
    registry.set(projectRefAtom, Option.some('my-ref'))

    customRender(
      <RegistryContext.Provider value={registry}>
        <Wrapped />
      </RegistryContext.Provider>
    )

    expect(screen.getByText('ref: my-ref')).toBeInTheDocument()
    expect(screen.queryByText('No active project')).not.toBeInTheDocument()

    registry.dispose()
  })
})
