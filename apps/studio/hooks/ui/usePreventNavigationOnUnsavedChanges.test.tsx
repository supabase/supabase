import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'
import { routerMock } from '@/tests/lib/route-mock'

vi.mock('@/lib/constants', () => ({ BASE_PATH: '/dashboard' }))

describe('Next unsaved-change navigation guard', () => {
  it('runs without a TanStack router provider and allows clean navigation', async () => {
    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: false }))
    await act(async () => {
      await routerMock.push('/overview')
    })
    expect(routerMock.asPath).toBe('/overview')
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('retains the Next route-change cancellation and keep-editing behavior', () => {
    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    const initialPath = routerMock.asPath

    act(() => {
      expect(() =>
        routerMock.events.emit('routeChangeStart', '/overview', { shallow: false })
      ).toThrow('Route change declined')
    })
    expect(result.current.shouldConfirmNavigation).toBe(true)
    expect(routerMock.asPath).toBe(initialPath)

    act(() => result.current.handleCancelNavigation())
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('keeps base-path normalization when confirming in the Next runtime', () => {
    const push = vi.spyOn(routerMock, 'push').mockResolvedValue(true)
    const { result } = renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))
    act(() => {
      expect(() =>
        routerMock.events.emit('routeChangeStart', '/dashboard/overview?tab=details', {
          shallow: false,
        })
      ).toThrow('Route change declined')
    })

    act(() => result.current.handleConfirmNavigation())
    expect(push).toHaveBeenCalledWith('/overview?tab=details')
    expect(result.current.shouldConfirmNavigation).toBe(false)
    push.mockRestore()
  })

  it('keeps unload protection conditional on dirty state', () => {
    const { rerender, unmount } = renderHook(
      ({ hasChanges }) => usePreventNavigationOnUnsavedChanges({ hasChanges }),
      { initialProps: { hasChanges: false } }
    )
    const beforeUnload = () => {
      const event = new Event('beforeunload', { cancelable: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(beforeUnload()).toBe(false)
    rerender({ hasChanges: true })
    expect(beforeUnload()).toBe(true)
    unmount()
    expect(beforeUnload()).toBe(false)
  })
})
