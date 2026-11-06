import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  type AnyRouter,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { NuqsAdapter } from './nuqs-tanstack-adapter'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'

// Queues a nuqs write and navigates away in the same commit, like the Table Editor index
// redirecting while the sidebar provider writes `sidebar` on mount.
function RedirectingPage({ value }: { value: string | null }) {
  const [, setFoo] = useQueryState('foo', parseAsString)
  const navigate = useNavigate()
  useEffect(() => {
    void setFoo(value)
    void navigate<AnyRouter, string>({ to: '/b', search: { keep: '1' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

function renderRouter(value: string | null) {
  window.history.replaceState(null, '', '/a')
  const history = createBrowserHistory()
  const root = createRootRoute({
    component: () => (
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
    ),
  })
  const routeTree = root.addChildren([
    createRoute({
      getParentRoute: () => root,
      path: '/a',
      component: () => <RedirectingPage value={value} />,
    }),
    createRoute({
      getParentRoute: () => root,
      path: '/b',
      component: () => <output data-testid="page">b</output>,
    }),
  ])
  const router = createRouter({ routeTree, history, parseSearch, stringifySearch, isServer: false })
  const view = render(<RouterProvider router={router} />)
  return {
    history,
    cleanup: () => {
      view.unmount()
      history.destroy()
    },
  }
}

describe('NuqsAdapter (TanStack) flush after a navigation', () => {
  let cleanup: (() => void) | undefined
  afterEach(() => cleanup?.())

  it.each([
    ['clearing an absent param', null, '/b?keep=1'],
    ['setting a param', 'bar', '/b?keep=1&foo=bar'],
  ])(
    "%s doesn't replace the navigation's destination with the old pathname",
    async (_, value, expected) => {
      const result = renderRouter(value)
      cleanup = result.cleanup
      const startIndex = result.history.location.state.__TSR_index

      await waitFor(() => expect(screen.getByTestId('page')).toBeInTheDocument())
      // Outlast nuqs' next-tick flush
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(`${window.location.pathname}${window.location.search}`).toBe(expected)
      // The redirect's entry is still there: Back returns to /a
      expect(result.history.location.state.__TSR_index).toBe(startIndex + 1)
    }
  )
})
