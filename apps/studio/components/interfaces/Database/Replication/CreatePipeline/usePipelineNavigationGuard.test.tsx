import {
  createBrowserHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { act, renderHook, waitFor } from '@testing-library/react'
import Router from 'next/router'
import { type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { usePipelineNavigationGuard } from './usePipelineNavigationGuard'
import { trackHistoryPositions } from '@/lib/navigation-history'

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

  it('restores cancelled Next Back and Forward without dropping history entries', async () => {
    window.history.replaceState({}, '', list)
    const stopTracking = trackHistoryPositions()
    window.history.pushState({}, '', wizard)
    window.history.pushState({}, '', `${wizard}?step=connection`)
    let beforePop: Parameters<typeof Router.beforePopState>[0] = () => true
    const spy = vi.spyOn(Router, 'beforePopState').mockImplementation((callback) => {
      beforePop = callback
    })
    const onPop = () => {
      if (
        beforePop({
          url: window.location.href,
          as: window.location.pathname + window.location.search,
          options: {},
        })
      ) {
        Router.events.emit('routeChangeComplete', window.location.href, { shallow: true })
      }
    }
    window.addEventListener('popstate', onPop)
    const { result, unmount } = renderHook(() => usePipelineNavigationGuard(true))
    try {
      await act(async () => {
        window.history.back()
      })
      await waitFor(() => expect(window.location.href).toContain(`${wizard}`))
      await waitFor(() => expect(window.location.search).toBe(''))
      expect(result.current.modalProps.visible).toBe(false)
      await act(async () => {
        window.history.back()
      })
      await waitFor(() => expect(result.current.modalProps.visible).toBe(true))
      expect(window.location.pathname).toBe(wizard)
      act(() => result.current.modalProps.onCancel())
      await act(async () => {
        window.history.forward()
      })
      await waitFor(() => expect(window.location.search).toBe('?step=connection'))
      expect(result.current.modalProps.visible).toBe(false)
      await act(async () => {
        window.history.go(-2)
      })
      await waitFor(() => expect(result.current.modalProps.visible).toBe(true))
      expect(window.location.search).toBe('?step=connection')
      await act(async () => result.current.modalProps.onClose())
      await waitFor(() => expect(window.location.pathname).toBe(list))
    } finally {
      unmount()
      window.removeEventListener('popstate', onPop)
      spy.mockRestore()
      stopTracking()
    }
  })

  it('blocks Next router links, allows step URLs and retries the requested destination', () => {
    window.history.replaceState({}, '', wizard)
    const push = vi.spyOn(Router, 'push').mockResolvedValue(true)
    const { result } = renderHook(() => usePipelineNavigationGuard(true))
    expect(() =>
      Router.events.emit('routeChangeStart', `${wizard}?step=connection`, { shallow: true })
    ).not.toThrow()
    act(() => {
      expect(() => Router.events.emit('routeChangeStart', list, { shallow: false })).toThrow(
        'Navigation cancelled'
      )
    })
    expect(result.current.modalProps.visible).toBe(true)
    act(() => result.current.modalProps.onClose())
    expect(push).toHaveBeenCalledWith(list)
    push.mockRestore()
  })

  it('uses native TanStack history blocking for links and traversal, allowing step changes', async () => {
    window.history.replaceState({}, '', list)
    const history = createBrowserHistory()
    history.push(wizard)
    const router = createRouter({ routeTree: createRootRoute(), history })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RouterContextProvider router={router}>{children}</RouterContextProvider>
    )
    const { result, unmount } = renderHook(() => usePipelineNavigationGuard(true), { wrapper })
    try {
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
        history.push(list)
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
