import { useMemo } from 'react'
import { Button, Card } from 'ui'

import { InfiniteListDefault } from '@/components/ui/InfiniteList'

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
  const itemProps = useMemo(() => ({ onRemoveTable }), [onRemoveTable])
  const tableIdsPendingRemovalSet = useMemo(
    () => new Set(tableIdsPendingRemoval),
    [tableIdsPendingRemoval]
  )

  const tables = useMemo(() => {
    return [
      { id: 1, schema: 'public', name: 'users' },
      { id: 2, schema: 'public', name: 'posts' },
      { id: 3, schema: 'public', name: 'comments' },
    ].filter((table) => !tableIdsPendingRemovalSet.has(table.id))
  }, [tableIdsPendingRemovalSet])

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

        {tables.length === 0 ? (
          <ExposedTablesListEmptyState />
        ) : (
          <InfiniteListDefault
            className="max-h-48"
            items={tables}
            ItemComponent={TableRow}
            itemProps={itemProps}
            LoaderComponent={() => null}
            getItemSize={() => 59}
            hasNextPage={false}
            isLoadingNextPage={false}
            onLoadNextPage={() => {}}
          />
        )}
      </div>
    </Card>
  )
}
