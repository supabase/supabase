'use client'

import * as React from 'react'
import { type PostgrestFilterBuilder } from '@supabase/postgrest-js'

import { cn } from '@/lib/utils'
import { useInfiniteQuery } from '@/registry/default/blocks/infinite-list/hooks/use-infinite-query'

interface InfiniteListProps<TData> {
  tableName: string
  selectQuery?: string
  pageSize?: number
  filterBuilder?: (
    query: PostgrestFilterBuilder<any, any, any>
  ) => PostgrestFilterBuilder<any, any, any>
  renderItem: (item: TData, index: number) => React.ReactNode
  className?: string
  listClassName?: string
  skeletonCount?: number
  skeletonHeightClass?: string
  endMessage?: React.ReactNode
}

export function InfiniteList<TData>({
  tableName,
  selectQuery = '*',
  pageSize = 20,
  filterBuilder,
  renderItem,
  className,
  listClassName,
  skeletonCount = 3,
  skeletonHeightClass = 'h-10',
  endMessage = "You've reached the end.",
}: InfiniteListProps<TData>) {
  const { data, loading, hasMore, fetchNextPage } = useInfiniteQuery<TData>({
    tableName,
    selectQuery,
    pageSize,
    filterBuilder,
  })

  // Ref for the scrolling container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Intersection observer logic - target the last rendered *item* or a dedicated sentinel
  const loadMoreSentinelRef = React.useRef<HTMLDivElement>(null)
  const observer = React.useRef<IntersectionObserver | null>(null)

  React.useEffect(() => {
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchNextPage()
        }
      },
      {
        root: scrollContainerRef.current, // Use the scroll container for scroll detection
        threshold: 0.1, // Trigger when 10% of the target is visible
        rootMargin: '0px 0px 100px 0px', // Trigger loading a bit before reaching the end
      }
    )

    if (loadMoreSentinelRef.current) {
      observer.current.observe(loadMoreSentinelRef.current)
    }

    return () => {
      if (observer.current) observer.current.disconnect()
    }
  }, [loading, hasMore, fetchNextPage])

  return (
    <div
      ref={scrollContainerRef}
      className={cn('relative h-[600px] overflow-auto rounded-md border', className)}
    >
      <div className={cn('p-4 space-y-2', listClassName)}>
        {data.length === 0 && !loading && (
          <div className="text-center text-muted-foreground py-10">No results.</div>
        )}
        {data.map((item, index) => (
          <div key={(item as any)?.id ?? index}>
            {' '}
            {/* Use item id if available, otherwise index */}
            {renderItem(item, index)}
          </div>
        ))}

        {/* Loading skeleton items */}
        {loading && Array.from({ length: skeletonCount }).map((_, i) => 'Skeleton')}

        {/* Sentinel element to trigger loading more */}
        <div ref={loadMoreSentinelRef} style={{ height: '1px' }} />

        {!hasMore && data.length > 0 && (
          <div className="text-center text-muted-foreground py-4 text-sm">{endMessage}</div>
        )}
      </div>
    </div>
  )
}
