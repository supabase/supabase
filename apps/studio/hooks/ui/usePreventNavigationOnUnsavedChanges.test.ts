import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'

const mocks = vi.hoisted(() => ({
  tanStackRouter: undefined as undefined | { history: { block: ReturnType<typeof vi.fn> } },
  nextEvents: { on: vi.fn(), off: vi.fn() },
  nextPush: vi.fn(),
}))

const tanStackNavigation = { nextLocation: { href: '/settings' } }

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

  it('allows configured Next navigation without prompting', () => {
    renderHook(() =>
      usePreventNavigationOnUnsavedChanges({
        hasChanges: true,
        shouldBypassNavigation: (url) => url.startsWith('/wizard'),
      })
    )
    const routeChangeHandler = mocks.nextEvents.on.mock.calls.find(
      ([event]) => event === 'routeChangeStart'
    )?.[1]

    expect(() => act(() => routeChangeHandler('/wizard?step=data'))).not.toThrow()
  })

  it('blocks TanStack navigation before the route changes and can cancel it', async () => {
    let blockerFn: ((args: typeof tanStackNavigation) => Promise<boolean>) | undefined
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
      navigationResult = blockerFn!(tanStackNavigation)
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

  it('allows configured TanStack navigation without prompting', async () => {
    let blockerFn: ((args: { nextLocation: { href: string } }) => Promise<boolean>) | undefined
    mocks.tanStackRouter = {
      history: {
        block: vi.fn(({ blockerFn: nextBlockerFn }) => {
          blockerFn = nextBlockerFn
          return vi.fn()
        }),
      },
    }

    const { result } = renderHook(() =>
      usePreventNavigationOnUnsavedChanges({
        hasChanges: true,
        shouldBypassNavigation: (url) => url.startsWith('/wizard'),
      })
    )

    await expect(blockerFn!({ nextLocation: { href: '/wizard?step=data' } })).resolves.toBe(false)
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('allows confirmed TanStack navigation to proceed', async () => {
    let blockerFn: ((args: typeof tanStackNavigation) => Promise<boolean>) | undefined
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
      navigationResult = blockerFn!(tanStackNavigation)
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
    let blockerFn: ((args: typeof tanStackNavigation) => Promise<boolean>) | undefined
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

    await expect(blockerFn!(tanStackNavigation)).resolves.toBe(false)

    let secondNavigation: Promise<boolean>
    act(() => {
      secondNavigation = blockerFn!(tanStackNavigation)
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
