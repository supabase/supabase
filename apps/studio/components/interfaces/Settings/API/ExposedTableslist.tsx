import { useInfiniteQuery } from '@tanstack/react-query'
import { CSSProperties, useMemo } from 'react'
import { Button, Card, Skeleton } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import AlertError from '@/components/ui/AlertError'
import { InfiniteListDefault } from '@/components/ui/InfiniteList'
import { exposedTablesInfiniteQueryOptions } from '@/data/privileges/exposed-tables-infinite-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type TableRowProps = {
  item: {
    id: number
    schema: string
    name: string
  }
  style?: React.CSSProperties
  onRemoveTable: (tableId: number) => void
}

const TableRow = ({ item, style, onRemoveTable }: TableRowProps) => {
  return (
    <div className="flex border-b [&:hover]:bg-surface-200 transition-colors" style={style}>
      <div className="p-4 align-middle flex-1">{`${item.schema}.${item.name}`}</div>
      <div className="p-4 align-middle text-right">
        <Button type="default" size="tiny" onClick={() => onRemoveTable(item.id)}>
          Remove
        </Button>
      </div>
    </div>
  )
}

const TableRowLoader = ({ style }: { style?: CSSProperties }) => (
  <div className="flex border-b" style={style}>
    <div className="p-4 align-middle flex-1">
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="p-4 align-middle text-right">
      <Skeleton className="h-6 w-16" />
    </div>
  </div>
)

const ExposedTablesListEmptyState = () => (
  <div className="flex flex-col gap-1 items-center justify-center py-8 text-center">
    <h3 className="text-foreground">No exposed tables</h3>
    <p className="text-xs max-w-xs text-foreground-lighter">
      Add tables above to expose them via the API.
    </p>
  </div>
)

type ExposedTablesListProps = {
  tableIdsPendingRemoval: number[]
  onRemoveTable: (tableId: number) => void
}

export const ExposedTablesList = ({
  tableIdsPendingRemoval,
  onRemoveTable,
}: ExposedTablesListProps) => {
  const { data: project } = useSelectedProjectQuery()

  const itemProps = useMemo(() => ({ onRemoveTable }), [onRemoveTable])
  const tableIdsPendingRemovalSet = useMemo(
    () => new Set(tableIdsPendingRemoval),
    [tableIdsPendingRemoval]
  )

  const {
    data,
    isError,
    error,
    isSuccess,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(
    exposedTablesInfiniteQueryOptions({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    })
  )

  const tables = useMemo(() => {
    return (data?.pages.flatMap((page) => page.tables) ?? []).filter(
      (table) => !tableIdsPendingRemovalSet.has(table.id)
    )
  }, [data, tableIdsPendingRemovalSet])

  return (
    <Card>
      <div className="w-full text-sm">
        <div className="flex border-b bg-200">
          <div className="h-10 px-4 flex items-center flex-1 heading-meta whitespace-nowrap text-foreground-lighter">
            Table Name
          </div>
          <div className="h-10 px-4 flex items-center text-right">
            <span className="sr-only">Actions</span>
          </div>
        </div>

        {isPending && (
          <div className="p-4">
            <GenericSkeletonLoader />
          </div>
        )}

        {isError && (
          <div className="p-4">
            <AlertError subject="Failed to retrieve exposed tables" error={error} />
          </div>
        )}

        {isSuccess && tables.length === 0 && <ExposedTablesListEmptyState />}

        {isSuccess && tables.length > 0 && (
          <InfiniteListDefault
            className="max-h-48"
            items={tables}
            ItemComponent={TableRow}
            itemProps={itemProps}
            LoaderComponent={TableRowLoader}
            getItemSize={() => 59}
            hasNextPage={!!hasNextPage}
            isLoadingNextPage={isFetchingNextPage}
            onLoadNextPage={() => fetchNextPage()}
          />
        )}
      </div>
    </Card>
  )
}
