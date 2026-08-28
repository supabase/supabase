import { act, renderHook } from '@testing-library/react'
import { useBlocker } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'

vi.mock('@tanstack/react-router', () => ({
  useBlocker: vi.fn(),
}))

const mockUseBlocker = vi.mocked(useBlocker)
const proceed = vi.fn()
const reset = vi.fn()

const setBlockerStatus = (status: 'blocked' | 'unblocked') => {
  mockUseBlocker.mockReturnValue({
    status,
    proceed,
    reset,
  } as unknown as ReturnType<typeof useBlocker>)
}

const getLastBlockerOptions = () =>
  mockUseBlocker.mock.lastCall?.[0] as unknown as {
    shouldBlockFn: () => boolean
    withResolver: boolean
    enableBeforeUnload: boolean
    disabled: boolean
  }

describe('usePreventNavigationOnUnsavedChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setBlockerStatus('unblocked')
  })

  it('guards in-app navigation and tab close while there are changes', () => {
    renderHook(() => usePreventNavigationOnUnsavedChanges({ hasChanges: true }))

    expect(mockUseBlocker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        withResolver: true,
        enableBeforeUnload: true,
        disabled: false,
      })
    )
    expect(getLastBlockerOptions().shouldBlockFn()).toBe(true)
  })

  it('reports and cancels a blocked navigation', () => {
    setBlockerStatus('blocked')
    const { result } = renderHook(() =>
      usePreventNavigationOnUnsavedChanges({ hasChanges: true })
    )

    expect(result.current.shouldConfirmNavigation).toBe(true)
    act(() => result.current.handleCancelNavigation())
    expect(reset).toHaveBeenCalledOnce()
  })

  it('proceeds after the user confirms navigation', () => {
    setBlockerStatus('blocked')
    const { result } = renderHook(() =>
      usePreventNavigationOnUnsavedChanges({ hasChanges: true })
    )

    act(() => result.current.handleConfirmNavigation())

    expect(proceed).toHaveBeenCalledOnce()
    expect(mockUseBlocker).toHaveBeenLastCalledWith(
      expect.objectContaining({ enableBeforeUnload: false, disabled: true })
    )
  })

  it('allows an intentional navigation to bypass the guard', () => {
    const { result } = renderHook(() =>
      usePreventNavigationOnUnsavedChanges({ hasChanges: true })
    )

    act(() => result.current.bypassNavigationGuard())

    expect(proceed).not.toHaveBeenCalled()
    expect(mockUseBlocker).toHaveBeenLastCalledWith(
      expect.objectContaining({ enableBeforeUnload: false, disabled: true })
    )
  })
})
