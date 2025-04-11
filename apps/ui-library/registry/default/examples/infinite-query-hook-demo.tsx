'use client'

import { cn } from '@/lib/utils'
import {
  SupabaseQueryHandler,
  SupabaseTableData,
  SupabaseTableName,
  useInfiniteQuery,
} from '@/registry/default/blocks/infinite-query-hook/hooks/use-infinite-query'
import { Database } from '@/registry/default/fixtures/database.types'
import * as React from 'react'

interface InfiniteListProps<TableName extends SupabaseTableName> {
  tableName: TableName
  selectQuery?: string
  pageSize?: number
  trailingQuery?: SupabaseQueryHandler<TableName>
  renderItem: (item: SupabaseTableData<TableName>, index: number) => React.ReactNode
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

export function InfiniteList<TableName extends SupabaseTableName>({
  tableName,
  selectQuery = '*',
  pageSize = 20,
  trailingQuery,
  renderItem,
  className,
  listClassName,
  renderNoResults = DefaultNoResults,
  renderEndMessage = DefaultEndMessage,
  renderSkeleton,
}: InfiniteListProps<TableName>) {
  const { data, isFetching, hasMore, fetchNextPage } = useInfiniteQuery({
    tableName: tableName,
    columns: selectQuery,
    pageSize,
    trailingQuery,
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
        if (entries[0].isIntersecting && hasMore && !isFetching) {
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
  }, [isFetching, hasMore, fetchNextPage])

  return (
    <div ref={scrollContainerRef} className={cn('relative h-full overflow-auto', className)}>
      <div className={cn(listClassName)}>
        {data.length === 0 && !isFetching && renderNoResults()}

        {data.map((item, index) => (
          <div key={(item as any)?.id ?? index}>{renderItem(item, index)}</div>
        ))}

        {isFetching && renderSkeleton && renderSkeleton(pageSize)}

        <div ref={loadMoreSentinelRef} style={{ height: '1px' }} />

        {!hasMore && data.length > 0 && renderEndMessage()}
      </div>
    </div>
  )
}

type Channel = Database['public']['Tables']['channels']['Row']

// Define how each item should be rendered
const renderChannelItem = (channel: Channel) => {
  return (
    <div className="border-b py-3 px-4 hover:bg-muted flex items-center justify-between">
      <div>
        <span className="font-medium text-sm text-foreground">
          {channel.slug} (ID: {channel.id})
        </span>
        <div className="text-sm text-foreground-light">
          {new Date(channel.inserted_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

// Define a filter to only show logs with log_level = 'info'
const orderByCreateAt: SupabaseQueryHandler<'channels'> = (query) => {
  return query.order('created_at', { ascending: false })
}

const InfiniteListDemo = () => {
  return (
    <div className="bg-surface-100 h-[600px]">
      <InfiniteList
        tableName="channels"
        renderItem={renderChannelItem}
        pageSize={15}
        trailingQuery={orderByCreateAt}
      />
    </div>
  )
}

export default InfiniteListDemo
