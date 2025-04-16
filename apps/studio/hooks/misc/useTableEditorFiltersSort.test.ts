import { renderHook } from '@testing-library/react'
import { useRouter } from 'next/router'
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { useTableEditorFiltersSort } from './useTableEditorFiltersSort'

beforeAll(() => {
  vi.mock('next/router', () => import('next-router-mock'))
})

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
})
