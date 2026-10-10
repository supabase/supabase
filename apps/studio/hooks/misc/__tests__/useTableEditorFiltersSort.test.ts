import { act, renderHook } from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { useRouter } from 'next/router'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { describe, expect, it, vi } from 'vitest'

import { useTableEditorFiltersSort } from '../useTableEditorFiltersSort'

vi.mock('next/router', () => import('next-router-mock'))

describe('useTableEditorFilters', () => {
  it('should support old syntax', async () => {
    const url =
      '/test?filter=id:eq:123&filter=created_at:eq:2021-01-01&filter=id:eq:456&sort=id:asc'

    const expected = ['id:eq:123', 'created_at:eq:2021-01-01', 'id:eq:456']

    const router = renderHook(() => useRouter()).result.current
    router.push(url)

    const { result } = renderHook(() => useTableEditorFiltersSort(), {
      wrapper: withNuqsTestingAdapter(),
    })

    expect(result.current.filters).toEqual(expected)

    expect(result.current.sorts).toEqual(['id:asc'])
  })

  it('should support new syntax', async () => {
    const router = renderHook(() => useRouter()).result.current
    router.push(
      '/test?filter=id:eq:123&filter=created_at:eq:2021-01-01&filter=id:eq:456&sort=id:asc'
    )

    const { result } = renderHook(() => useTableEditorFiltersSort(), {
      wrapper: withNuqsTestingAdapter(),
    })

    expect(result.current.filters).toEqual(['id:eq:123', 'created_at:eq:2021-01-01', 'id:eq:456'])
    expect(result.current.sorts).toEqual(['id:asc'])
  })

  it('should return empty array if no filters are present', async () => {
    const router = renderHook(() => useRouter()).result.current
    router.push('/test')

    const { result } = renderHook(() => useTableEditorFiltersSort(), {
      wrapper: withNuqsTestingAdapter(),
    })

    expect(result.current.filters).toEqual([])
  })

  it('should return empty array if no sorts are present', async () => {
    const router = renderHook(() => useRouter()).result.current
    router.push('/test?filter=id:eq:123&filter=created_at:eq:2021-01-01&filter=id:eq:456')

    const { result } = renderHook(() => useTableEditorFiltersSort(), {
      wrapper: withNuqsTestingAdapter(),
    })

    expect(result.current.sorts).toEqual([])
  })

  it('keeps unchanged filters and sorts out of Next navigation history', async () => {
    const router = mockRouter
    await act(async () => {
      await router.push('/test?schema=public&filter=id:eq:1&sort=id:asc#selection')
    })
    const { result } = renderHook(() => useTableEditorFiltersSort())
    const onNavigation = vi.fn()
    router.events.on('routeChangeStart', onNavigation)
    try {
      act(() => result.current.setParams((prev) => ({ ...prev })))
      act(() => result.current.setParams(() => ({ filter: ['id:eq:1'] })))
      act(() => result.current.setParams(() => ({ sort: ['id:asc'] })))
      expect(onNavigation).not.toHaveBeenCalled()

      await act(async () => result.current.setParams(() => ({ filter: ['id:eq:2'] })))
      expect(onNavigation).toHaveBeenCalledTimes(1)
      expect(router.asPath).toBe('/test?schema=public&filter=id%3Aeq%3A2&sort=id%3Aasc#selection')

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
      expect(router.asPath).toBe('/test?schema=public#selection')
    } finally {
      router.events.off('routeChangeStart', onNavigation)
    }
  })
})
