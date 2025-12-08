'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseInfiniteScrollOptions {
  /** Threshold for triggering the callback (0-1) */
  threshold?: number
  /** Root margin for the intersection observer */
  rootMargin?: string
}

interface UseInfiniteScrollWithFetchOptions<T> extends UseInfiniteScrollOptions {
  /** Initial items to display */
  initialItems: T[]
  /** Total number of items available */
  totalItems: number
  /** Number of items to fetch per page */
  pageSize: number
  /** Function to fetch more items */
  fetchMore: (offset: number, limit: number) => Promise<T[]>
}

export function useInfiniteScrollWithFetch<T>({
  initialItems,
  totalItems,
  pageSize,
  fetchMore,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollWithFetchOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [currentTotal, setCurrentTotal] = useState(totalItems)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialItems.length < totalItems)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const fetchingRef = useRef(false)

  // Reset when initial items change (e.g., filtering via server)
  useEffect(() => {
    setItems(initialItems)
    setCurrentTotal(totalItems)
    setHasMore(initialItems.length < totalItems)
  }, [initialItems, totalItems])

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return

    fetchingRef.current = true
    setIsLoading(true)

    try {
      const newItems = await fetchMore(items.length, pageSize)
      setItems((prev) => [...prev, ...newItems])
      // If we got fewer items than requested, we've reached the end
      setHasMore(newItems.length === pageSize)
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      setIsLoading(false)
      fetchingRef.current = false
    }
  }, [items.length, pageSize, fetchMore, hasMore])

  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !fetchingRef.current) {
          loadMore()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(currentRef)

    return () => {
      observer.unobserve(currentRef)
    }
  }, [hasMore, isLoading, loadMore, threshold, rootMargin])

  return {
    items,
    setItems,
    hasMore,
    isLoading,
    loadMoreRef,
    totalCount: totalItems,
  }
}
