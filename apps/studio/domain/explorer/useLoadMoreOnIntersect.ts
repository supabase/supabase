import { useEffect } from 'react'

interface UseLoadMoreOnIntersectParams {
  readonly isIntersecting: boolean | undefined
  readonly canLoadMore: boolean
  readonly loadMore: () => void
}

/** Calls `loadMore` whenever the sentinel is intersecting and more can be loaded. */
export const useLoadMoreOnIntersect = ({
  isIntersecting,
  canLoadMore,
  loadMore,
}: UseLoadMoreOnIntersectParams) => {
  useEffect(() => {
    if (isIntersecting && canLoadMore) loadMore()
  }, [isIntersecting, canLoadMore, loadMore])
}
