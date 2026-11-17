import { RefObject, UIEvent, useCallback, useEffect, useRef } from 'react'

import { isAtBottom } from '@/lib/helpers'

interface UseInfiniteScrollOptions {
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => void
  /**
   * The scroll container, e.g. the ref of a `react-data-grid` `DataGrid`. When provided, pages
   * are also requested until the container overflows, since the scroll handler can never fire
   * if the first page doesn't fill it (tall viewports, client-side filtered lists).
   */
  containerRef?: RefObject<{ element: HTMLElement | null } | null>
  /** Number of rendered rows. Re-checks whether the container overflows when this changes. */
  rowCount?: number
}

/**
 * Returns a scroll handler that triggers fetchNextPage when the user scrolls
 * to the bottom of a scrollable container. Includes horizontal scroll detection
 * to avoid triggering loads when the user scrolls horizontally.
 *
 * Pass `containerRef` to also keep loading while the container isn't scrollable.
 */
export function useInfiniteScroll({
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
  containerRef,
  rowCount,
}: UseInfiniteScrollOptions) {
  const xScroll = useRef(0)

  useEffect(() => {
    const container = containerRef?.current?.element
    if (!container || !hasNextPage || isLoading || isFetchingNextPage) return

    const fetchIfNotScrollable = () => {
      // A hidden container (display: none) reports 0 for both heights. Don't treat that as
      // underfilled, or every page would be fetched while it's hidden.
      if (container.clientHeight > 0 && container.scrollHeight <= container.clientHeight) {
        fetchNextPage({ cancelRefetch: false })
      }
    }

    fetchIfNotScrollable()

    // The container can grow after the first check, e.g. the window is resized
    const observer = new ResizeObserver(fetchIfNotScrollable)
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage, rowCount])

  return useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const isScrollingHorizontally = xScroll.current !== event.currentTarget.scrollLeft
      xScroll.current = event.currentTarget.scrollLeft

      const shouldFetchNextPage =
        !isLoading &&
        !isFetchingNextPage &&
        !isScrollingHorizontally &&
        isAtBottom(event) &&
        hasNextPage

      if (!shouldFetchNextPage) {
        return
      }

      fetchNextPage({ cancelRefetch: false })
    },
    [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]
  )
}
