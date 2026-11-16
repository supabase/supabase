import { useEffect } from 'react'

interface UseFetchUntilScrollableOptions {
  /**
   * Returns the scroll container. Next pages are requested until its content overflows it.
   * Must be referentially stable (e.g. `useCallback`).
   */
  getContainer: () => HTMLElement | null
  hasNextPage?: boolean
  isLoading?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: (options?: { cancelRefetch?: boolean }) => void
  /** Number of rendered rows. Re-checks whether the container overflows when this changes. */
  rowCount: number
}

/**
 * Companion to `useInfiniteScroll`. Scroll-triggered loading never fires when the first
 * page doesn't overflow the container (tall viewports, filtered lists), so this keeps
 * requesting pages until the container is scrollable or there are no more pages.
 */
export function useFetchUntilScrollable({
  getContainer,
  hasNextPage = false,
  isLoading = false,
  isFetchingNextPage = false,
  fetchNextPage,
  rowCount,
}: UseFetchUntilScrollableOptions) {
  useEffect(() => {
    const container = getContainer()
    if (!container || !fetchNextPage || !hasNextPage || isLoading || isFetchingNextPage) return

    const fetchIfNotScrollable = () => {
      if (container.scrollHeight <= container.clientHeight) {
        fetchNextPage({ cancelRefetch: false })
      }
    }

    fetchIfNotScrollable()

    // The container can grow after the first check, e.g. the window is resized
    const observer = new ResizeObserver(fetchIfNotScrollable)
    observer.observe(container)
    return () => observer.disconnect()
  }, [getContainer, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage, rowCount])
}
