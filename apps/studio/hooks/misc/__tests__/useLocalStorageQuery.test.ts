import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useLocalStorageQuery } from '../useLocalStorage'
import { customRenderHook } from '@/tests/lib/custom-render'

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function makeWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLocalStorageQuery', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it('returns initialValue when localStorage has no entry for the key', async () => {
    const { result } = customRenderHook(() => useLocalStorageQuery('test-key', 'default'))

    await waitFor(() => expect(result.current[2].isSuccess).toBe(true))
    expect(result.current[0]).toBe('default')
  })

  it('returns the stored value from localStorage on mount', async () => {
    window.localStorage.setItem('test-key', JSON.stringify('persisted'))

    const { result } = customRenderHook(() => useLocalStorageQuery('test-key', 'default'))

    await waitFor(() => expect(result.current[0]).toBe('persisted'))
  })

  it('updates the value in state and localStorage when setValue is called', async () => {
    const { result } = customRenderHook(() => useLocalStorageQuery('test-key', 'default'))
    await waitFor(() => expect(result.current[2].isSuccess).toBe(true))

    act(() => {
      result.current[1]('updated')
    })

    await waitFor(() => expect(result.current[0]).toBe('updated'))
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('updated'))
  })

  it('supports a function updater that receives the current value', async () => {
    window.localStorage.setItem('count', JSON.stringify(5))

    const { result } = customRenderHook(() => useLocalStorageQuery('count', 0))
    await waitFor(() => expect(result.current[0]).toBe(5))

    act(() => {
      result.current[1]((prev: number) => prev + 1)
    })

    await waitFor(() => expect(result.current[0]).toBe(6))
    expect(window.localStorage.getItem('count')).toBe(JSON.stringify(6))
  })

  it('works with object values', async () => {
    const stored = { count: 3, label: 'hello' }
    window.localStorage.setItem('obj-key', JSON.stringify(stored))

    const { result } = customRenderHook(() =>
      useLocalStorageQuery('obj-key', { count: 0, label: '' })
    )

    await waitFor(() => expect(result.current[0]).toEqual(stored))
  })

  it('syncs two hooks sharing the same key via the same QueryClient', async () => {
    const queryClient = makeQueryClient()

    const { result } = renderHook(
      () => ({
        a: useLocalStorageQuery('shared-key', 'initial'),
        b: useLocalStorageQuery('shared-key', 'initial'),
      }),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.a[2].isSuccess).toBe(true))

    act(() => {
      result.current.a[1]('from-a')
    })

    await waitFor(() => {
      expect(result.current.a[0]).toBe('from-a')
      expect(result.current.b[0]).toBe('from-a')
    })
  })

  it('uses the initialValue as fallback when the function updater runs before any stored value', async () => {
    const { result } = customRenderHook(() => useLocalStorageQuery('new-key', 10))
    await waitFor(() => expect(result.current[2].isSuccess).toBe(true))

    act(() => {
      result.current[1]((prev: number) => prev * 2)
    })

    await waitFor(() => expect(result.current[0]).toBe(20))
    expect(window.localStorage.getItem('new-key')).toBe(JSON.stringify(20))
  })
})
