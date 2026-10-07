import { getCoreRowModel, useReactTable, type Row } from '@tanstack/react-table'
import { useMemo, type ReactNode } from 'react'
import { cn } from 'ui'

import { useLogsTableColumns } from '../UnifiedLogs.hooks'
import type { ColumnSchema } from '../UnifiedLogs.schema'
import { getLogRowClassName } from '../UnifiedLogs.utils'
import { generateDynamicColumns, UNIFIED_LOGS_COLUMNS } from './Columns'
import { LogsTable } from './LogsTable'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import type { ResponseError } from '@/types'

const getRowClassName = (row: Row<ColumnSchema>) => getLogRowClassName(row.original)
const noopFetchNextPage = async () => {}
// The header takes the background of whatever the list sits in, e.g. a Card, rather than the
// Logs page background. An embedded list is short enough that its sticky header never scrolls.
const HEADER_CLASS_NAME = '[&_thead_tr]:bg-transparent! [&_thead_tr:hover]:bg-transparent!'

interface EmbeddedLogsTableProps {
  /** Rows to show, e.g. `getUniqueLogRows(data.pages)` from `useUnifiedLogsInfiniteQuery` */
  rows: ColumnSchema[]
  isLoading: boolean
  isFetching?: boolean
  error?: ResponseError | null
  isError?: boolean
  /** Called with a row's log id when it's clicked, e.g. to open that log on a Logs page */
  onRowClick?: (logId: string) => void
  /** Rendered below the rows, e.g. a link to the rest of the logs. Nothing by default. */
  footer?: ReactNode
  /** Placeholder rows while `isLoading` */
  skeletonRowCount?: number
  emptyStateMessage?: ReactNode
  className?: string
}

/**
 * A read-only logs list for pages outside the Logs page: the same columns, styling and saved
 * column preferences as the Logs page, without multi-select, filters or pagination. Callers fetch
 * the rows, usually with the unified logs queries, and decide what a row click does.
 */
export const EmbeddedLogsTable = ({
  rows,
  isLoading,
  isFetching = false,
  error = null,
  isError = false,
  onRowClick,
  footer = null,
  skeletonRowCount,
  emptyStateMessage,
  className,
}: EmbeddedLogsTableProps) => {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder } =
    useLogsTableColumns()
  const { columns, columnVisibility: dynamicColumnVisibility } = useMemo(
    () => generateDynamicColumns({ data: rows, selectable: false }),
    [rows]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { columnVisibility: { ...dynamicColumnVisibility, ...columnVisibility }, columnOrder },
    meta: { getRowClassName },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <DataTableProvider
      table={table}
      columns={UNIFIED_LOGS_COLUMNS}
      filterFields={[]}
      error={error}
      isError={isError}
      isLoading={isLoading}
      isFetching={isFetching}
      isLoadingCounts={false}
      columnVisibility={columnVisibility}
      columnOrder={columnOrder}
      onSelectRow={onRowClick ? (logId) => onRowClick(logId) : undefined}
    >
      <LogsTable
        columns={columns}
        className={cn(HEADER_CLASS_NAME, className)}
        fetchNextPage={noopFetchNextPage}
        hasNextPage={false}
        setColumnOrder={setColumnOrder}
        setColumnVisibility={setColumnVisibility}
        skeletonRowCount={skeletonRowCount}
        emptyStateMessage={emptyStateMessage}
        footer={footer}
      />
    </DataTableProvider>
  )
}
