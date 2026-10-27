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
const HEADER_CLASS_NAME = '[&_thead_tr]:bg-transparent! [&_thead_tr:hover]:bg-transparent!'

interface EmbeddedLogsTableProps {
  rows: ColumnSchema[]
  isLoading: boolean
  isFetching?: boolean
  error?: ResponseError | null
  isError?: boolean
  onRowClick?: (logId: string) => void
  footer?: ReactNode
  skeletonRowCount?: number
  emptyStateMessage?: ReactNode
  columnPreferencesKey?: string
  className?: string
}
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
  columnPreferencesKey,
  className,
}: EmbeddedLogsTableProps) => {
  const { columnVisibility, setColumnVisibility, columnOrder, setColumnOrder } =
    useLogsTableColumns(columnPreferencesKey)
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
