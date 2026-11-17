import { renderHook } from '@testing-library/react'
import type { UIEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useInfiniteScroll } from './useInfiniteScroll'

const observe = vi.fn()
let triggerResize: () => void = () => {}
// Like the real observer, stop delivering callbacks once disconnected
const disconnect = vi.fn(() => {
  triggerResize = () => {}
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        triggerResize = callback
      }
      observe = observe
      disconnect = disconnect
    }
  )
})

type FakeContainer = { scrollHeight: number; clientHeight: number }

const makeContainer = (scrollHeight: number, clientHeight: number): FakeContainer => ({
  scrollHeight,
  clientHeight,
})

const makeRef = (container: FakeContainer) => ({
  current: { element: container as HTMLElement },
})

describe('useInfiniteScroll fill behavior', () => {
  it('fetches the next page when the content does not overflow the container', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    renderHook(() =>
      useInfiniteScroll({
        containerRef: makeRef(container),
        hasNextPage: true,
        fetchNextPage,
        rowCount: 20,
      })
    )
    expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false })
  })

  it('does not retry in a loop after a failed fetch, and re-checks when the error clears', () => {
    const fetchNextPage = vi.fn()
    const containerRef = makeRef(makeContainer(400, 900))
    const base = { containerRef, hasNextPage: true, fetchNextPage, rowCount: 20 }
    const { rerender } = renderHook((props) => useInfiniteScroll(props), {
      initialProps: { ...base, isFetchingNextPage: false, isError: false },
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    rerender({ ...base, isFetchingNextPage: true, isError: false })
    // The request failed: fetching ends, but the page is still missing
    rerender({ ...base, isFetchingNextPage: false, isError: true })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    rerender({ ...base, isFetchingNextPage: false, isError: false })
    expect(fetchNextPage).toHaveBeenCalledTimes(2)
  })

  it('waits for a background refetch to finish, then re-checks', () => {
    const fetchNextPage = vi.fn()
    const containerRef = makeRef(makeContainer(400, 900))
    const base = { containerRef, hasNextPage: true, fetchNextPage, rowCount: 20 }
    const { rerender } = renderHook((props) => useInfiniteScroll(props), {
      initialProps: { ...base, isRefetching: true },
    })
    expect(fetchNextPage).not.toHaveBeenCalled()

    rerender({ ...base, isRefetching: false })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('does not fetch when the container is hidden', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(0, 0)
    renderHook(() =>
      useInfiniteScroll({
        containerRef: makeRef(container),
        hasNextPage: true,
        fetchNextPage,
        rowCount: 20,
      })
    )
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not fetch when the container is already scrollable', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(1200, 900)
    renderHook(() =>
      useInfiniteScroll({
        containerRef: makeRef(container),
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
      useInfiniteScroll({
        containerRef: makeRef(container),
        fetchNextPage,
        rowCount: 20,
        ...options,
      })
    )
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('fetches again when the container grows taller than its content', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(1200, 900)
    renderHook(() =>
      useInfiniteScroll({
        containerRef: makeRef(container),
        hasNextPage: true,
        fetchNextPage,
        rowCount: 20,
      })
    )
    expect(fetchNextPage).not.toHaveBeenCalled()

    container.clientHeight = 1500
    triggerResize()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('keeps fetching after each page lands until the container overflows', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    const containerRef = makeRef(container)
    const { rerender } = renderHook((props) => useInfiniteScroll(props), {
      initialProps: {
        containerRef,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        rowCount: 20,
      },
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    // A request is in flight: no duplicate fetch
    rerender({
      containerRef,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
      rowCount: 20,
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    // Page landed but the grid is still underfilled: fetch again
    rerender({
      containerRef,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      rowCount: 20,
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(2)

    // Content now overflows: stop
    container.scrollHeight = 1200
    rerender({
      containerRef,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
      rowCount: 40,
    })
    rerender({
      containerRef,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      rowCount: 40,
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(2)
  })

  it('stops fetching once there are no more pages', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    const containerRef = makeRef(container)
    const { rerender } = renderHook((props) => useInfiniteScroll(props), {
      initialProps: { containerRef, hasNextPage: true, fetchNextPage, rowCount: 20 },
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    rerender({ containerRef, hasNextPage: false, fetchNextPage, rowCount: 25 })
    triggerResize()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('disconnects the observer on unmount', () => {
    const container = makeContainer(1200, 900)
    const { unmount } = renderHook(() =>
      useInfiniteScroll({
        containerRef: makeRef(container),
        hasNextPage: true,
        fetchNextPage: vi.fn(),
        rowCount: 20,
      })
    )
    expect(observe).toHaveBeenCalledWith(container)
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})

const scrollEvent = (target: { scrollTop: number; scrollLeft: number }) =>
  ({
    currentTarget: { scrollHeight: 1000, clientHeight: 500, ...target },
  }) as unknown as UIEvent<HTMLDivElement>

describe('useInfiniteScroll scroll handler', () => {
  it('fetches the next page when scrolled to the bottom', () => {
    const fetchNextPage = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll({ hasNextPage: true, fetchNextPage }))
    result.current(scrollEvent({ scrollTop: 500, scrollLeft: 0 }))
    expect(fetchNextPage).toHaveBeenCalledWith({ cancelRefetch: false })
  })

  it('does not fetch when not at the bottom', () => {
    const fetchNextPage = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll({ hasNextPage: true, fetchNextPage }))
    result.current(scrollEvent({ scrollTop: 100, scrollLeft: 0 }))
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not fetch while scrolling horizontally', () => {
    const fetchNextPage = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll({ hasNextPage: true, fetchNextPage }))
    result.current(scrollEvent({ scrollTop: 500, scrollLeft: 40 }))
    expect(fetchNextPage).not.toHaveBeenCalled()
  })
})
