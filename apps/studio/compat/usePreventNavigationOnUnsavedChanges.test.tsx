import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
  type AnyRouter,
} from '@tanstack/react-router'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { usePreventNavigationOnUnsavedChanges } from './usePreventNavigationOnUnsavedChanges'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

let destroyHistory: (() => void) | undefined

function renderNavigationGuard(hasChanges = true, basepath = '/') {
  const editorPath = `${basepath === '/' ? '' : basepath}/editor`
  window.history.replaceState(null, '', editorPath)
  const history = createBrowserHistory()
  destroyHistory = () => history.destroy()
  const rootRoute = createRootRoute()
  const routeTree = rootRoute.addChildren([
    createRoute({ getParentRoute: () => rootRoute, path: '/editor' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/overview' }),
    createRoute({ getParentRoute: () => rootRoute, path: '/other' }),
  ])
  const router = createRouter({ routeTree, history, basepath, parseSearch, stringifySearch })
  const hook = renderHook(
    ({ hasChanges }) => usePreventNavigationOnUnsavedChanges({ hasChanges }),
    {
      initialProps: { hasChanges },
      wrapper: ({ children }: { children: ReactNode }) => (
        <RouterContextProvider router={router}>{children}</RouterContextProvider>
      ),
    }
  )
  return { ...hook, router, history, editorPath }
}

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event
}

afterEach(() => {
  destroyHistory?.()
  destroyHistory = undefined
})

describe('TanStack unsaved-change navigation guard', () => {
  it('allows clean navigation without confirmation', async () => {
    const { result, router, history } = renderNavigationGuard(false)

    await act(async () => {
      await router.navigate<AnyRouter, string>({ to: '/overview' })
    })

    expect(history.location.pathname).toBe('/overview')
    expect(window.location.pathname).toBe('/overview')
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('keeps the URL and history unchanged until a dirty navigation is confirmed', async () => {
    const { result, router, history } = renderNavigationGuard()
    const initialLength = history.length

    act(() => {
      void router.navigate<AnyRouter, string>({ to: '/overview' })
    })
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))

    expect(history.location.pathname).toBe('/editor')
    expect(window.location.pathname).toBe('/editor')
    expect(history.length).toBe(initialLength)

    await act(async () => result.current.handleConfirmNavigation())
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    expect(history.location.pathname).toBe('/overview')
    expect(history.length).toBe(initialLength + 1)
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('cancels dirty navigation and can cancel another destination afterward', async () => {
    const { result, history } = renderNavigationGuard()
    const initialLength = history.length

    for (const target of ['/overview', '/other']) {
      act(() => history.push(target))
      await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
      await act(async () => result.current.handleCancelNavigation())
      await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(false))

      expect(history.location.pathname).toBe('/editor')
      expect(window.location.pathname).toBe('/editor')
      expect(history.length).toBe(initialLength)
    }
  })

  it('confirms the new destination on the first click after canceling a previous attempt', async () => {
    const { result, history } = renderNavigationGuard()

    act(() => history.push('/overview'))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(false))

    act(() => history.push('/other?tab=details#section'))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleConfirmNavigation())

    await waitFor(() => expect(history.location.href).toBe('/other?tab=details#section'))
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(
      '/other?tab=details#section'
    )
  })

  it('preserves replace navigation and base paths when confirming', async () => {
    const { result, router, history } = renderNavigationGuard(true, '/dashboard')
    const initialLength = history.length

    act(() => {
      void router.navigate<AnyRouter, string>({ to: '/overview', replace: true })
    })
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    expect(window.location.pathname).toBe('/dashboard/editor')
    await act(async () => result.current.handleConfirmNavigation())

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/overview'))
    expect(history.length).toBe(initialLength)
  })

  it('preserves encoded query values, array values, and fragments through browser history', async () => {
    const { result, router, history } = renderNavigationGuard()
    const search = {
      s: 'select timestamp\nfrom logs\nlimit 5',
      filter: ['name:eq:日本語', 'count:gt:2'],
      q: 'space + plus % percent',
    }

    act(() => {
      void router.navigate<AnyRouter, string>({ to: '/overview', search, hash: 'details' })
    })
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    expect(window.location.pathname).toBe('/editor')
    await act(async () => result.current.handleConfirmNavigation())

    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    expect(history.location.href).toBe(`/overview${stringifySearch(search)}#details`)
    expect(window.location.search).toContain('%0A')
    expect(parseSearch(window.location.search)).toEqual(search)
    expect(window.location.hash).toBe('#details')
  })

  it('guards the next navigation after confirming one while the editor remains mounted', async () => {
    const { result, history } = renderNavigationGuard()

    act(() => history.push('/editor?tab=second'))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleConfirmNavigation())
    await waitFor(() => expect(history.location.href).toBe('/editor?tab=second'))

    act(() => history.push('/overview'))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(false))
    expect(history.location.href).toBe('/editor?tab=second')
  })

  it('uses the latest dirty state and allows navigation after saving', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    rerender({ hasChanges: true })

    act(() => history.push('/overview'))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(false))
    rerender({ hasChanges: false })

    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('cancels browser Back and subsequently confirms it without adding a history entry', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    const initialLength = history.length
    rerender({ hasChanges: true })

    act(() => window.history.back())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    expect(history.location.pathname).toBe('/overview')
    await act(async () => result.current.handleCancelNavigation())
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    expect(history.location.pathname).toBe('/overview')

    act(() => window.history.back())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleConfirmNavigation())
    await waitFor(() => expect(history.location.pathname).toBe('/editor'))
    expect(window.location.pathname).toBe('/editor')
    expect(history.length).toBe(initialLength)
  })

  it('confirms browser Forward without adding a history entry', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    act(() => window.history.back())
    await waitFor(() => expect(history.location.pathname).toBe('/editor'))
    const initialLength = history.length
    rerender({ hasChanges: true })

    act(() => window.history.forward())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    expect(history.location.pathname).toBe('/editor')
    await act(async () => result.current.handleConfirmNavigation())
    await waitFor(() => expect(history.location.pathname).toBe('/overview'))
    expect(window.location.pathname).toBe('/overview')
    expect(history.length).toBe(initialLength)
  })

  it('restores the current editor URL when browser Forward is canceled', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    act(() => window.history.back())
    await waitFor(() => expect(history.location.pathname).toBe('/editor'))
    rerender({ hasChanges: true })

    act(() => window.history.forward())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())

    await waitFor(() => expect(window.location.pathname).toBe('/editor'))
    expect(history.location.pathname).toBe('/editor')
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })

  it('restores the current editor URL when jumping multiple history entries is canceled', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    act(() => history.push('/other'))
    await waitFor(() => expect(window.location.pathname).toBe('/other'))
    rerender({ hasChanges: true })

    act(() => window.history.go(-2))
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())

    await waitFor(() => expect(window.location.pathname).toBe('/other'))
    expect(history.location.pathname).toBe('/other')
  })

  it('only prompts before unloading while dirty, and removes protection on unmount', () => {
    const { rerender, unmount } = renderNavigationGuard(false)
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false)

    rerender({ hasChanges: true })
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true)

    rerender({ hasChanges: false })
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false)

    rerender({ hasChanges: true })
    unmount()
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false)
  })

  it('retains unload protection after canceling and confirming an in-app history traversal', async () => {
    const { result, rerender, history } = renderNavigationGuard(false)
    act(() => history.push('/overview'))
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    rerender({ hasChanges: true })

    act(() => history.back())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleCancelNavigation())
    await waitFor(() => expect(window.location.pathname).toBe('/overview'))
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true)

    act(() => history.back())
    await waitFor(() => expect(result.current.shouldConfirmNavigation).toBe(true))
    await act(async () => result.current.handleConfirmNavigation())
    await waitFor(() => expect(history.location.pathname).toBe('/editor'))
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true)
  })

  it('ignores confirmation controls when there is no blocked navigation', async () => {
    const { result, history } = renderNavigationGuard()
    await act(async () => {
      result.current.handleCancelNavigation()
      result.current.handleConfirmNavigation()
    })
    expect(history.location.pathname).toBe('/editor')
    expect(result.current.shouldConfirmNavigation).toBe(false)
  })
})
