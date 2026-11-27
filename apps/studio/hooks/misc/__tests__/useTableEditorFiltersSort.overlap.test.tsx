import { createRootRoute, createRoute, type AnyRouter } from '@tanstack/react-router'
import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableEditorFiltersSort } from '../useTableEditorFiltersSort'
import type { SearchRecord } from '@/lib/router-search-params'
import { createTestRouter, customRenderHook } from '@/tests/lib/custom-render'

const initialUrl = '/project/default/editor/1?schema=public&filter=name:eq:Red'

function createDeferredRouter(url = initialUrl) {
  const rootRoute = createRootRoute()
  const editorRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/project/$ref/editor/$id',
  })
  const router = createTestRouter(url, rootRoute.addChildren([editorRoute]))
  const realNavigate = router.navigate.bind(router)
  const settles: Array<() => Promise<void>> = []
  const navigateSpy = vi
    .spyOn(router, 'navigate')
    .mockImplementation((opts: Parameters<typeof router.navigate>[0]) => {
      return new Promise<void>((resolve) => {
        settles.push(async () => {
          await realNavigate(opts)
          resolve()
        })
      })
    })

  const settleAll = () =>
    act(async () => {
      for (const settle of settles.splice(0)) await settle()
    })

  const navigateImmediately = (search: SearchRecord) =>
    act(async () => {
      await realNavigate<AnyRouter, string>({
        to: '/project/default/editor/1',
        search,
      })
    })

  const renderFiltersSort = () =>
    customRenderHook(() => useTableEditorFiltersSort(), { router }).result

  return { router, navigateSpy, settleAll, navigateImmediately, renderFiltersSort }
}

describe('useTableEditorFiltersSort setParams with overlapping pushes', () => {
  let ctx: ReturnType<typeof createDeferredRouter>

  beforeEach(async () => {
    ctx = createDeferredRouter()
    await ctx.router.load()
  })

  it('a filter push after an unsettled sort push keeps the sort', async () => {
    const sortHook = ctx.renderFiltersSort()
    const filterHook = ctx.renderFiltersSort()

    sortHook.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))
    filterHook.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(ctx.navigateSpy.mock.lastCall?.[0]?.search).toEqual({
      schema: 'public',
      filter: ['name:eq:Green'],
      sort: ['id:desc'],
    })
    await ctx.settleAll()
    expect(ctx.router.state.location.href).toContain('filter=name%3Aeq%3AGreen&sort=id%3Adesc')
  })

  it('a sort push after an unsettled filter push keeps the filter edit', async () => {
    const filterHook = ctx.renderFiltersSort()
    const sortHook = ctx.renderFiltersSort()

    filterHook.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Blue'] }))
    sortHook.current.setParams((prev) => ({ ...prev, sort: ['id:asc'] }))

    expect(ctx.navigateSpy.mock.lastCall?.[0]?.search).toEqual({
      schema: 'public',
      filter: ['name:eq:Blue'],
      sort: ['id:asc'],
    })
  })

  it('bases pushes on the router again once the previous push settled', async () => {
    const result = ctx.renderFiltersSort()
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))
    await ctx.settleAll()

    // The URL moved on independently (e.g. another param) after the push settled
    await ctx.navigateImmediately({
      schema: 'other',
      filter: 'name:eq:Red',
      sort: 'id:desc',
    })
    result.current.setParams((prev) => ({ ...prev, filter: [] }))

    expect(ctx.navigateSpy.mock.lastCall?.[0]?.search).toEqual({
      schema: 'other',
      filter: [],
      sort: ['id:desc'],
    })
  })

  it('ignores an unsettled push once Back/Forward moved the router elsewhere', async () => {
    const result = ctx.renderFiltersSort()
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))

    await ctx.navigateImmediately({ schema: 'public' })
    result.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(ctx.navigateSpy.mock.lastCall?.[0]?.search).toEqual({
      schema: 'public',
      filter: ['name:eq:Green'],
      sort: [],
    })
  })

  it('drops an unsettled push on Back/Forward even if it lands on the URL the push started from', async () => {
    const result = ctx.renderFiltersSort()
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))

    // The router is still on the starting URL, so only the popstate itself marks the push stale
    window.dispatchEvent(new PopStateEvent('popstate'))
    result.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(ctx.navigateSpy.mock.lastCall?.[0]?.search).toEqual({
      schema: 'public',
      filter: ['name:eq:Green'],
      sort: [],
    })
  })
})
