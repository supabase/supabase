import { UIEvent, useCallback, useRef } from 'react'

import { isAtBottom } from '@/lib/helpers'

interface UseInfiniteScrollOptions {
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  fetchNextPage: (options?: { cancelRefetch?: boolean }) => void
}

/**
 * Returns a scroll handler that triggers fetchNextPage when the user scrolls
 * to the bottom of a scrollable container. Includes horizontal scroll detection
 * to avoid triggering loads when the user scrolls horizontally.
 */
export function useInfiniteScroll({
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  fetchNextPage,
}: UseInfiniteScrollOptions) {
  const xScroll = useRef(0)

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
