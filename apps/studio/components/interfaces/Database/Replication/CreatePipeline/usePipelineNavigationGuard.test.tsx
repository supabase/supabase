import {
  createBrowserHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { usePipelineNavigationGuard } from './usePipelineNavigationGuard'

const wizard = '/dashboard/project/test/database/pipelines/new'
const list = '/dashboard/project/test/database/pipelines'

const unload = () => {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('usePipelineNavigationGuard', () => {
  it('reuses confirmation for explicit exits and bypasses unload only after discard', () => {
    const exit = vi.fn()
    const { result, rerender } = renderHook(({ dirty }) => usePipelineNavigationGuard(dirty), {
      initialProps: { dirty: true },
    })
    act(() => result.current.requestNavigation(exit))
    expect(result.current.modalProps.visible).toBe(true)
    expect(unload()).toBe(true)
    act(() => result.current.modalProps.onCancel())
    expect(exit).not.toHaveBeenCalled()
    expect(unload()).toBe(true)
    act(() => result.current.requestNavigation(exit))
    act(() => result.current.modalProps.onClose())
    expect(exit).toHaveBeenCalledOnce()
    expect(unload()).toBe(false)
    rerender({ dirty: false })
    expect(unload()).toBe(false)
  })

  it('leaves immediately without changes', () => {
    const exit = vi.fn()
    const { result } = renderHook(() => usePipelineNavigationGuard(false))
    expect(unload()).toBe(false)
    act(() => result.current.requestNavigation(exit))
    expect(exit).toHaveBeenCalledOnce()
    expect(result.current.modalProps.visible).toBe(false)
  })

  it('uses native TanStack history blocking for links and traversal, allowing step changes', async () => {
    window.history.replaceState({}, '', list)
    const history = createBrowserHistory()
    history.push(wizard)
    const router = createRouter({ routeTree: createRootRoute(), history })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    )
    let isLocked = true
    const { result, unmount } = renderHook(() => usePipelineNavigationGuard(true, () => isLocked), {
      wrapper,
    })
    try {
      await act(async () => history.push('/blocked-during-submission'))
      expect(history.location.pathname).toBe(wizard)
      expect(result.current.modalProps.visible).toBe(false)
      await act(async () => history.push(`${wizard}?step=review`))
      expect(history.location.search).toBe('')
      isLocked = false
      await act(async () => {
        history.push(`${wizard}?step=connection`)
      })
      expect(history.location.search).toBe('?step=connection')
      await act(async () => {
        history.back()
      })
      await waitFor(() => expect(history.location.search).toBe(''))
      expect(result.current.modalProps.visible).toBe(false)
      await act(async () => {
        history.back()
      })
      await waitFor(() => expect(result.current.modalProps.visible).toBe(true))
      await act(async () => {
        history.push('/another-page')
      })
      act(() => result.current.modalProps.onCancel())
      await waitFor(() => expect(history.location.pathname).toBe(wizard))
      await act(async () => {
        history.forward()
      })
      await waitFor(() => expect(history.location.search).toBe('?step=connection'))
      expect(result.current.modalProps.visible).toBe(false)
      await act(async () => {
        history.go(-2)
      })
      await waitFor(() => expect(result.current.modalProps.visible).toBe(true))
      await act(async () => result.current.modalProps.onClose())
      await waitFor(() => expect(history.location.pathname).toBe(list))
    } finally {
      unmount()
      history.destroy()
    }
  })
})
