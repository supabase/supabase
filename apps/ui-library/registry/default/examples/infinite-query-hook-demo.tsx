'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import {
  SupabaseQueryHandler,
  SupabaseTableData,
  SupabaseTableName,
  useInfiniteQuery,
} from '@/registry/default/blocks/infinite-query-hook/hooks/use-infinite-query'
import { Checkbox } from '@/registry/default/components/ui/checkbox'
import { Database } from '@/registry/default/fixtures/database.types'

interface InfiniteListProps<TableName extends SupabaseTableName> {
  tableName: TableName
  columns?: string
  pageSize?: number
  trailingQuery?: SupabaseQueryHandler<TableName>
  renderItem: (item: SupabaseTableData<TableName>, index: number) => React.ReactNode
  className?: string
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

const defaultSkeleton = (count: number) => (
  <div className="flex flex-col gap-2 px-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-4 w-full bg-muted animate-pulse" />
    ))}
  </div>
)

export function InfiniteList<TableName extends SupabaseTableName>({
  tableName,
  columns = '*',
  pageSize = 20,
  trailingQuery,
  renderItem,
  className,
  renderNoResults = DefaultNoResults,
  renderEndMessage = DefaultEndMessage,
  renderSkeleton = defaultSkeleton,
}: InfiniteListProps<TableName>) {
  const { data, isFetching, hasMore, fetchNextPage, isSuccess } = useInfiniteQuery({
    tableName,
    columns,
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
      <div>
        {isSuccess && data.length === 0 && renderNoResults()}

        {data.map((item, index) => renderItem(item, index))}

        {isFetching && renderSkeleton && renderSkeleton(pageSize)}

        <div ref={loadMoreSentinelRef} style={{ height: '1px' }} />

        {!hasMore && data.length > 0 && renderEndMessage()}
      </div>
    </div>
  )
}

type TodoTask = Database['public']['Tables']['todos']['Row']

// Define how each item should be rendered
const renderTodoItem = (todo: TodoTask) => {
  return (
    <div
      key={todo.id}
      className="border-b py-3 px-4 hover:bg-muted flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Checkbox defaultChecked={todo.is_complete ?? false} />
        <div>
          <span className="font-medium text-sm text-foreground">{todo.task}</span>
          <div className="text-sm text-muted-foreground">
            {new Date(todo.inserted_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Define a filter to only show logs with log_level = 'info'
const orderByInsertedAt: SupabaseQueryHandler<'todos'> = (query) => {
  return query.order('inserted_at', { ascending: false })
}

const InfiniteListDemo = () => {
  return (
    <div className="bg-background h-[600px]">
      <InfiniteList
        tableName="todos"
        renderItem={renderTodoItem}
        pageSize={3}
        trailingQuery={orderByInsertedAt}
      />
    </div>
  )
}

export default InfiniteListDemo
