import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableEditorFiltersSort } from '../useTableEditorFiltersSort'

type Query = Record<string, string | string[]>

// Like the Next pages router: `query`/`asPath` only reflect a shallow push once it settles.
const router = vi.hoisted(() => {
  const state = {
    pathname: '/project/[ref]/editor/[id]',
    query: {} as Query,
    asPath: '',
    settles: [] as Array<() => void>,
    push: vi.fn(),
  }
  return state
})
vi.mock('next/router', () => ({ useRouter: () => router }))

const toAsPath = (query: Query) => {
  const { ref, id, ...search } = query
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    for (const v of ([] as string[]).concat(value)) params.append(key, v)
  }
  return `/project/${ref}/editor/${id}?${params.toString()}`
}

const navigateTo = (query: Query) => {
  router.query = query
  router.asPath = toAsPath(query)
}

const settleAll = () =>
  act(async () => {
    for (const settle of router.settles.splice(0)) settle()
  })

const initialQuery: Query = { ref: 'default', id: '1', schema: 'public', filter: 'name:eq:Red' }

describe('useTableEditorFiltersSort setParams with overlapping pushes', () => {
  beforeEach(() => {
    navigateTo(initialQuery)
    router.settles = []
    router.push.mockReset()
    router.push.mockImplementation(({ query }: { query: Query }) => {
      return new Promise<boolean>((resolve) => {
        router.settles.push(() => {
          navigateTo(query)
          resolve(true)
        })
      })
    })
  })

  it('a filter push after an unsettled sort push keeps the sort', async () => {
    const sortHook = renderHook(() => useTableEditorFiltersSort()).result
    const filterHook = renderHook(() => useTableEditorFiltersSort()).result

    sortHook.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))
    filterHook.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(router.push.mock.lastCall?.[0].query).toEqual({
      ...initialQuery,
      filter: ['name:eq:Green'],
      sort: ['id:desc'],
    })
    await settleAll()
    expect(router.asPath).toContain('filter=name%3Aeq%3AGreen&sort=id%3Adesc')
  })

  it('a sort push after an unsettled filter push keeps the filter edit', async () => {
    const filterHook = renderHook(() => useTableEditorFiltersSort()).result
    const sortHook = renderHook(() => useTableEditorFiltersSort()).result

    filterHook.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Blue'] }))
    sortHook.current.setParams((prev) => ({ ...prev, sort: ['id:asc'] }))

    expect(router.push.mock.lastCall?.[0].query).toEqual({
      ...initialQuery,
      filter: ['name:eq:Blue'],
      sort: ['id:asc'],
    })
  })

  it('bases pushes on the router again once the previous push settled', async () => {
    const { result } = renderHook(() => useTableEditorFiltersSort())
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))
    await settleAll()

    // The URL moved on independently (e.g. another param) after the push settled
    navigateTo({ ...router.query, schema: 'other' })
    result.current.setParams((prev) => ({ ...prev, filter: [] }))

    expect(router.push.mock.lastCall?.[0].query).toEqual({
      ...initialQuery,
      schema: 'other',
      filter: [],
      sort: ['id:desc'],
    })
  })

  it('ignores an unsettled push once Back/Forward moved the router elsewhere', async () => {
    const { result } = renderHook(() => useTableEditorFiltersSort())
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))

    navigateTo({ ref: 'default', id: '1', schema: 'public' })
    result.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(router.push.mock.lastCall?.[0].query).toEqual({
      ref: 'default',
      id: '1',
      schema: 'public',
      filter: ['name:eq:Green'],
      sort: [],
    })
  })

  it('drops an unsettled push on Back/Forward even if it lands on the URL the push started from', async () => {
    const { result } = renderHook(() => useTableEditorFiltersSort())
    result.current.setParams((prev) => ({ ...prev, sort: ['id:desc'] }))

    // The router is still on the starting URL, so only the popstate itself marks the push stale
    window.dispatchEvent(new PopStateEvent('popstate'))
    result.current.setParams((prev) => ({ ...prev, filter: ['name:eq:Green'] }))

    expect(router.push.mock.lastCall?.[0].query).toEqual({
      ...initialQuery,
      filter: ['name:eq:Green'],
      sort: [],
    })
  })
})
