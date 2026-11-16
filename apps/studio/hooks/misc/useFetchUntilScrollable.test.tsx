import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFetchUntilScrollable } from './useFetchUntilScrollable'

const observe = vi.fn()
const disconnect = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = observe
      disconnect = disconnect
    }
  )
})

const makeContainer = (scrollHeight: number, clientHeight: number) =>
  ({ scrollHeight, clientHeight }) as HTMLElement

describe('useFetchUntilScrollable', () => {
  it('fetches the next page when the content does not overflow the container', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    renderHook(() =>
      useFetchUntilScrollable({
        getContainer: () => container,
        hasNextPage: true,
        fetchNextPage,
        rowCount: 20,
      })
    )
    expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false })
  })

  it('does not fetch when the container is already scrollable', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(1200, 900)
    renderHook(() =>
      useFetchUntilScrollable({
        getContainer: () => container,
        hasNextPage: true,
        fetchNextPage,
        rowCount: 20,
      })
    )
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it.each([
    ['there is no next page', { hasNextPage: false }],
    ['the initial load is in progress', { hasNextPage: true, isLoading: true }],
    ['a page is already being fetched', { hasNextPage: true, isFetchingNextPage: true }],
  ])('does not fetch when %s', (_, options) => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    renderHook(() =>
      useFetchUntilScrollable({
        getContainer: () => container,
        fetchNextPage,
        rowCount: 20,
        ...options,
      })
    )
    expect(fetchNextPage).not.toHaveBeenCalled()
  })
})
