import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { act, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'

import { useRouter } from './router'

describe('next/router redirect effects', () => {
  it('keeps the router object stable when only match loading state changes', async () => {
    const seen: ReturnType<typeof useRouter>[] = []
    const rootRoute = createRootRoute({ component: Outlet })
    const dataRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/project/$ref/database/triggers/data',
      component: function DataPage() {
        const router = useRouter()
        useEffect(() => {
          seen.push(router)
        }, [router])
        return <div>Triggers loaded</div>
      },
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([dataRoute]),
      history: createMemoryHistory({
        initialEntries: ['/project/default/database/triggers/data?schema=public'],
      }),
    })
    await router.load()
    const view = render(<RouterProvider router={router} />)
    try {
      await screen.findByText('Triggers loaded')
      const initial = seen.at(-1)
      await act(async () => {
        await router.invalidate()
      })
      expect(seen.at(-1)).toBe(initial)
      expect(initial?.pathname).toBe('/project/[ref]/database/triggers/data')
      expect(initial?.query).toEqual({ ref: 'default', schema: 'public' })

      await act(async () => {
        await router.navigate({
          to: '/project/$ref/database/triggers/data',
          params: { ref: 'other' },
          search: { schema: 'realtime' },
        })
      })
      expect(seen.at(-1)).not.toBe(initial)
      expect(seen.at(-1)?.asPath).toBe('/project/other/database/triggers/data?schema=realtime')
      expect(seen.at(-1)?.query).toEqual({ ref: 'other', schema: 'realtime' })
    } finally {
      view.unmount()
    }
  })
})
