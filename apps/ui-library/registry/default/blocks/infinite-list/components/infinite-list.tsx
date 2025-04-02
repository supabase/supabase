'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  useInfiniteQuery,
  SupabaseFilterBuilder,
} from '@/registry/default/blocks/infinite-list/hooks/use-infinite-query'

interface InfiniteListProps<TData> {
  tableName: string
  selectQuery?: string
  pageSize?: number
  filterBuilder?: (query: SupabaseFilterBuilder) => SupabaseFilterBuilder
  renderItem: (item: TData, index: number) => React.ReactNode
  className?: string
  listClassName?: string
  renderNoResults?: () => React.ReactNode
  renderEndMessage?: () => React.ReactNode
  renderSkeleton?: (count: number) => React.ReactNode
}

const DefaultNoResults = () => (
  <div className="text-center text-muted-foreground py-10">No results.</div>
)

const DefaultEndMessage = () => (
  <div className="text-center text-muted-foreground py-4 text-sm">You&apos;ve reached the end.</div>
)

export function InfiniteList<TData>({
  tableName,
  selectQuery = '*',
  pageSize = 20,
  filterBuilder,
  renderItem,
  className,
  listClassName,
  renderNoResults = DefaultNoResults,
  renderEndMessage = DefaultEndMessage,
  renderSkeleton,
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
    <div ref={scrollContainerRef} className={cn('relative h-full overflow-auto', className)}>
      <div className={cn(listClassName)}>
        {data.length === 0 && !loading && renderNoResults()}

        {data.map((item, index) => (
          <div key={(item as any)?.id ?? index}>{renderItem(item, index)}</div>
        ))}

        {loading && renderSkeleton && renderSkeleton(pageSize)}

        <div ref={loadMoreSentinelRef} style={{ height: '1px' }} />

        {!hasMore && data.length > 0 && renderEndMessage()}
      </div>
    </div>
  )
}
