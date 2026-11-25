// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useTableEditorFiltersSort } from '../useTableEditorFiltersSort'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRenderHook } from '@/tests/lib/custom-render'

async function renderAt(initialUrl: string) {
  const rootRoute = createRootRoute()
  const testRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/test',
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([testRoute]),
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    parseSearch,
    stringifySearch,
  })
  await router.load()

  return { router, ...customRenderHook(() => useTableEditorFiltersSort(), { router }) }
}

describe('useTableEditorFilters', () => {
  it('reads repeated filter and sort params from the URL', async () => {
    const { result } = await renderAt(
      '/test?filter=id:eq:123&filter=created_at:eq:2021-01-01&filter=id:eq:456&sort=id:asc'
    )

    expect(result.current.filters).toEqual(['id:eq:123', 'created_at:eq:2021-01-01', 'id:eq:456'])
    expect(result.current.sorts).toEqual(['id:asc'])
  })

  it('returns empty arrays when filters or sorts are absent', async () => {
    const { result } = await renderAt('/test')

    expect(result.current.filters).toEqual([])
    expect(result.current.sorts).toEqual([])
  })

  it('keeps unchanged filters and sorts out of navigation history', async () => {
    const { router, result } = await renderAt(
      '/test?schema=public&filter=id:eq:1&sort=id:asc#selection'
    )
    const onNavigation = vi.fn()
    const unsubscribe = router.subscribe('onBeforeLoad', onNavigation)
    try {
      act(() => result.current.setParams((prev) => ({ ...prev })))
      act(() => result.current.setParams(() => ({ filter: ['id:eq:1'] })))
      act(() => result.current.setParams(() => ({ sort: ['id:asc'] })))
      expect(onNavigation).not.toHaveBeenCalled()

      await act(async () => result.current.setParams(() => ({ filter: ['id:eq:2'] })))
      expect(onNavigation).toHaveBeenCalledTimes(1)
      expect(router.state.location.href).toBe(
        '/test?schema=public&filter=id%3Aeq%3A2&sort=id%3Aasc#selection'
      )

      await act(async () =>
        result.current.setParams(() => ({ sort: ['id:desc', 'created_at:asc'] }))
      )
      expect(onNavigation).toHaveBeenCalledTimes(2)
      expect(result.current.filters).toEqual(['id:eq:2'])
      expect(result.current.sorts).toEqual(['id:desc', 'created_at:asc'])

      await act(async () =>
        result.current.setParams(() => ({ sort: ['created_at:asc', 'id:desc'] }))
      )
      expect(onNavigation).toHaveBeenCalledTimes(3)
      expect(result.current.sorts).toEqual(['created_at:asc', 'id:desc'])

      await act(async () => result.current.setParams(() => ({ filter: [], sort: [] })))
      expect(onNavigation).toHaveBeenCalledTimes(4)
      expect(router.state.location.href).toBe('/test?schema=public#selection')
    } finally {
      unsubscribe()
    }
  })
})
