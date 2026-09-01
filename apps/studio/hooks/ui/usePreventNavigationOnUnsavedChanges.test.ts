import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'

const mocks = vi.hoisted(() => ({
  tanStackRouter: undefined as undefined | { history: { block: ReturnType<typeof vi.fn> } },
  nextEvents: { on: vi.fn(), off: vi.fn() },
  nextPush: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => mocks.tanStackRouter,
}))

vi.mock('next/router', () => ({
  useRouter: () => ({ events: mocks.nextEvents, push: mocks.nextPush }),
}))

describe('usePreventNavigationOnUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.tanStackRouter = undefined
  })

  it('retains the legacy Next navigation guard', () => {
    renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    const routeChangeHandler = mocks.nextEvents.on.mock.calls.find(
      ([event]) => event === 'routeChangeStart'
    )?.[1]

    expect(() => act(() => routeChangeHandler('/settings'))).toThrow('Route change declined')
  })

  it('blocks TanStack navigation before the route changes and can cancel it', async () => {
    let blockerFn: (() => Promise<boolean>) | undefined
    const unblock = vi.fn()
    mocks.tanStackRouter = {
      history: {
        block: vi.fn(({ blockerFn: nextBlockerFn }) => {
          blockerFn = nextBlockerFn
          return unblock
        }),
      },
    }

    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    let navigationResult: Promise<boolean>
    act(() => {
      navigationResult = blockerFn!()
    })

    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    act(() => result.current.handleCancelNavigation())

    let resolvedNavigation: boolean | undefined
    await act(async () => {
      resolvedNavigation = await navigationResult!
    })
    expect(resolvedNavigation).toBe(true)
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(false))
    expect(mocks.nextEvents.on).not.toHaveBeenCalled()
  })

  it('allows confirmed TanStack navigation to proceed', async () => {
    let blockerFn: (() => Promise<boolean>) | undefined
    mocks.tanStackRouter = {
      history: {
        block: vi.fn(({ blockerFn: nextBlockerFn }) => {
          blockerFn = nextBlockerFn
          return vi.fn()
        }),
      },
    }

    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    let navigationResult: Promise<boolean>
    act(() => {
      navigationResult = blockerFn!()
    })

    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    act(() => result.current.handleConfirmNavigation())

    let resolvedNavigation: boolean | undefined
    await act(async () => {
      resolvedNavigation = await navigationResult!
    })
    expect(resolvedNavigation).toBe(false)
  })

  it('bypasses only the next intentional TanStack navigation', async () => {
    let blockerFn: (() => Promise<boolean>) | undefined
    mocks.tanStackRouter = {
      history: {
        block: vi.fn(({ blockerFn: nextBlockerFn }) => {
          blockerFn = nextBlockerFn
          return vi.fn()
        }),
      },
    }

    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    act(() => result.current.bypassNavigationGuard())

    await expect(blockerFn!()).resolves.toBe(false)

    let secondNavigation: Promise<boolean>
    act(() => {
      secondNavigation = blockerFn!()
    })
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    act(() => result.current.handleCancelNavigation())
    let resolvedNavigation: boolean | undefined
    await act(async () => {
      resolvedNavigation = await secondNavigation!
    })
    expect(resolvedNavigation).toBe(true)
  })
})
