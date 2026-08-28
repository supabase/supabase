import { RegistryContext } from '@effect/atom-react'
import { renderHook } from '@testing-library/react'
import { useParams } from 'common'
import { Option } from 'effect'
import { AtomRegistry } from 'effect/unstable/reactivity'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { projectRefAtom } from './project.atoms'
import { useSyncProjectRef } from './project.hooks'

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: vi.fn() }
})

const mockUseParams = vi.mocked(useParams)

const renderSync = () => {
  const registry = AtomRegistry.make()
  const rendered = renderHook(() => useSyncProjectRef(), {
    wrapper: ({ children }) => (
      <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
    ),
  })
  return { registry, ...rendered }
}

describe('useSyncProjectRef', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('writes the current ref into projectRefAtom on mount', () => {
    mockUseParams.mockReturnValue({ ref: 'my-project' })

    const { registry, unmount } = renderSync()

    expect(registry.get(projectRefAtom)).toEqual(Option.some('my-project'))

    unmount()
    registry.dispose()
  })

  it('writes None when there is no active project route', () => {
    mockUseParams.mockReturnValue({ ref: undefined })

    const { registry, unmount } = renderSync()

    expect(registry.get(projectRefAtom)).toEqual(Option.none())

    unmount()
    registry.dispose()
  })

  it('updates the atom when the ref changes across renders', () => {
    mockUseParams.mockReturnValue({ ref: 'first' })
    const { registry, rerender, unmount } = renderSync()
    expect(registry.get(projectRefAtom)).toEqual(Option.some('first'))

    mockUseParams.mockReturnValue({ ref: 'second' })
    rerender()

    expect(registry.get(projectRefAtom)).toEqual(Option.some('second'))

    unmount()
    registry.dispose()
  })

  it('does not write again when the ref is unchanged across renders', () => {
    mockUseParams.mockReturnValue({ ref: 'stable' })
    const { registry, rerender, unmount } = renderSync()
    const setSpy = vi.spyOn(registry, 'set')

    rerender()
    rerender()

    expect(setSpy).not.toHaveBeenCalled()

    unmount()
    registry.dispose()
  })
})
