import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'

const routerEvents = {
  on: vi.fn(),
  off: vi.fn(),
}

vi.mock('next/router', () => ({
  useRouter: () => ({ events: routerEvents, push: vi.fn() }),
}))

describe('usePreventNavigationOnUnsavedChanges', () => {
  beforeEach(() => {
    routerEvents.on.mockClear()
    routerEvents.off.mockClear()
  })

  it('bypasses only the next intentional navigation', () => {
    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    const routeChangeHandler = routerEvents.on.mock.calls.find(
      ([event]) => event === 'routeChangeStart'
    )?.[1]

    act(() => result.current.bypassNavigationGuard())

    expect(() => act(() => routeChangeHandler('/replication'))).not.toThrow()
    expect(() => act(() => routeChangeHandler('/settings'))).toThrow('Route change declined')
  })
})
