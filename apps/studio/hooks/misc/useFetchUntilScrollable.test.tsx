import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFetchUntilScrollable } from './useFetchUntilScrollable'

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

const toElement = (container: FakeContainer) => container as HTMLElement

describe('useFetchUntilScrollable', () => {
  it('fetches the next page when the content does not overflow the container', () => {
    const fetchNextPage = vi.fn()
    const container = makeContainer(400, 900)
    renderHook(() =>
      useFetchUntilScrollable({
        getContainer: () => toElement(container),
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
        getContainer: () => toElement(container),
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
        getContainer: () => toElement(container),
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
      useFetchUntilScrollable({
        getContainer: () => toElement(container),
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
    const getContainer = () => toElement(container)
    const { rerender } = renderHook((props) => useFetchUntilScrollable(props), {
      initialProps: {
        getContainer,
        hasNextPage: true,
        isFetchingNextPage: false,
        fetchNextPage,
        rowCount: 20,
      },
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    // A request is in flight: no duplicate fetch
    rerender({
      getContainer,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
      rowCount: 20,
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    // Page landed but the grid is still underfilled: fetch again
    rerender({
      getContainer,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
      rowCount: 20,
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(2)

    // Content now overflows: stop
    container.scrollHeight = 1200
    rerender({
      getContainer,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
      rowCount: 40,
    })
    rerender({
      getContainer,
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
    const getContainer = () => toElement(container)
    const { rerender } = renderHook((props) => useFetchUntilScrollable(props), {
      initialProps: { getContainer, hasNextPage: true, fetchNextPage, rowCount: 20 },
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(1)

    rerender({ getContainer, hasNextPage: false, fetchNextPage, rowCount: 25 })
    triggerResize()
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('disconnects the observer on unmount', () => {
    const container = makeContainer(1200, 900)
    const { unmount } = renderHook(() =>
      useFetchUntilScrollable({
        getContainer: () => toElement(container),
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
