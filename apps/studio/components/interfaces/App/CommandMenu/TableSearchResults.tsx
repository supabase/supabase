import { useIntersectionObserver } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { Database, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import {
  EmptyState,
  ResultsList,
  SkeletonResults,
  type SearchResult,
} from './ContextSearchResults.shared'
import { useInfiniteTablesQuery } from '@/data/tables/tables-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface TableSearchResultsProps {
  debouncedFilterString: string
}

export function TableSearchResults({ debouncedFilterString }: TableSearchResultsProps) {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [sentinelRef, sentinelEntry] = useIntersectionObserver({
    threshold: 0,
    rootMargin: '200px 0px 200px 0px',
  })

  const {
    data: tablesData,
    isSuccess,
    isError: isErrorTables,
    isPending: isLoadingTables,
    hasNextPage: hasNextTablesPage,
    isFetchingNextPage: isFetchingNextTablesPage,
    fetchNextPage: fetchNextTablesPage,
  } = useInfiniteTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    includeColumns: false,
    pageSize: 50,
    nameFilter: debouncedFilterString,
  })

  const tables = useMemo(() => tablesData?.pages.flat() ?? [], [tablesData])

  const tableResults: SearchResult[] = useMemo(() => {
    if (!tables) return []

    return tables.map((table) => {
      const displayName =
        table.schema && table.schema !== 'public'
          ? `${table.schema}.${table.name}`
          : table.name || 'Untitled Table'

      const description = table.comment
        ? table.comment.length > 50
          ? `${table.comment.slice(0, 50)}...`
          : table.comment
        : undefined

      return {
        id: String(table.id),
        name: displayName,
        description,
      }
    })
  }, [tables])

  const totalTables = tables?.length ?? 0

  useEffect(() => {
    if (
      sentinelEntry?.isIntersecting &&
      hasNextTablesPage &&
      !isFetchingNextTablesPage &&
      isSuccess
    ) {
      fetchNextTablesPage()
    }
  }, [
    isSuccess,
    sentinelEntry?.isIntersecting,
    hasNextTablesPage,
    isFetchingNextTablesPage,
    fetchNextTablesPage,
  ])

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoadingTables ? (
          <SkeletonResults />
        ) : isErrorTables ? (
          <div className="h-full flex flex-col items-center justify-center py-12 px-4 gap-4 text-center text-foreground-lighter">
            <Database className="h-6 w-6" strokeWidth={1.5} />
            <p className="text-sm">Failed to load tables</p>
          </div>
        ) : tableResults.length === 0 ? (
          <EmptyState icon={Database} label="Database Tables" query={debouncedFilterString} />
        ) : (
          <>
            <ResultsList
              results={tableResults}
              icon={Database}
              getRoute={(result) => {
                const table = tables?.find((t) => String(t.id) === result.id)
                if (!table || !projectRef) return `/project/${projectRef}/editor` as `/${string}`

                const schemaParam = table.schema ? `?schema=${table.schema}` : ''
                return `/project/${projectRef}/editor/${table.id}${schemaParam}` as `/${string}`
              }}
              infiniteLoadingObserverRef={sentinelRef}
              className="pb-9"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between min-h-9 h-9 px-4 border-t bg-surface-200 text-xs text-foreground-light z-10">
              <div className="flex items-center gap-x-2">
                {isLoadingTables ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </span>
                ) : (
                  <span>
                    Total: {totalTables.toLocaleString()} table{totalTables !== 1 ? 's' : ''}
                    {hasNextTablesPage ? ' loaded' : ''}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
