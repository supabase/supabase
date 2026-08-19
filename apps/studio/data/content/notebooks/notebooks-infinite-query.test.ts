import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { STUB_NOTEBOOKS, useNotebooksInfiniteQuery } from './notebooks-infinite-query'
import { customRenderHook } from '@/tests/lib/custom-render'

// The stub simulates network latency via `timeout` — mock it away so these tests are fast
// and don't race against @testing-library's default 1000ms `waitFor` window.
vi.mock('@/lib/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/helpers')>()
  return { ...actual, timeout: () => Promise.resolve() }
})

describe('useNotebooksInfiniteQuery', () => {
  it('returns stub notebooks without hitting the network', async () => {
    const { result } = customRenderHook(() => useNotebooksInfiniteQuery({ projectRef: 'default' }))

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.pages[0].content).toEqual(STUB_NOTEBOOKS)
  })

  it('respects the limit', async () => {
    const { result } = customRenderHook(() =>
      useNotebooksInfiniteQuery({ projectRef: 'default', limit: 1 })
    )

    await waitFor(() => expect(result.current.data).toBeDefined())

    expect(result.current.data?.pages[0].content).toHaveLength(1)
  })
})
