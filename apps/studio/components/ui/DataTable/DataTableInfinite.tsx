import { type FetchNextPageOptions } from '@tanstack/react-query'
import type { ColumnDef, Row, Table as TTable, VisibilityState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { LoaderCircle } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Fragment, memo, ReactNode, UIEvent, useCallback, useRef } from 'react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { Button, cn } from 'ui'
import { formatCompactNumber } from './DataTable.utils'
import { useDataTable } from './providers/DataTableProvider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table'

// TODO: add a possible chartGroupBy
export interface DataTableInfiniteProps<TData, TValue, TMeta> {
  columns: ColumnDef<TData, TValue>[]
  defaultColumnVisibility?: VisibilityState
  totalRows?: number
  filterRows?: number
  totalRowsFetched?: number
  isFetching?: boolean
  isLoading?: boolean
  hasNextPage?: boolean
  fetchNextPage: (options?: FetchNextPageOptions | undefined) => Promise<unknown>
  renderLiveRow?: (props?: { row: Row<TData> }) => ReactNode
  setColumnOrder: (columnOrder: string[]) => void
  setColumnVisibility: (columnVisibility: VisibilityState) => void

  // [Joshen] See if we can type this properly
  searchParamsParser: any
}

// [Joshen] JFYI this component is NOT virtualized and hence will struggle handling many data points
export function DataTableInfinite<TData, TValue, TMeta>({
  columns,
  defaultColumnVisibility = {},
  fetchNextPage,
  hasNextPage,
  totalRows = 0,
  filterRows = 0,
  totalRowsFetched = 0,
  renderLiveRow,
  setColumnOrder,
  setColumnVisibility,
  searchParamsParser,
}: DataTableInfiniteProps<TData, TValue, TMeta>) {
  const { table, isLoading, isFetching } = useDataTable()
  const tableRef = useRef<HTMLTableElement>(null)

  const headerGroups = table.getHeaderGroups()
  const headers = headerGroups[0].headers
  const rows = table.getRowModel().rows ?? []

  const onScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      const onPageBottom =
        Math.ceil(e.currentTarget.scrollTop + e.currentTarget.clientHeight) >=
        e.currentTarget.scrollHeight

      if (onPageBottom && !isFetching && totalRows > totalRowsFetched) {
        fetchNextPage()
      }
    },
    [fetchNextPage, isFetching, totalRows, totalRowsFetched]
  )

  useHotKey(() => {
    setColumnOrder([])
    setColumnVisibility(defaultColumnVisibility)
  }, 'u')

  return (
    <Table ref={tableRef} onScroll={onScroll}>
      <TableHeader>
        <TableRow className="bg-surface-75">
          {headers.map((header) => {
            const sort = header.column.getIsSorted()
            const canResize = header.column.getCanResize()
            const onResize = header.getResizeHandler()
            const headerClassName = (header.column.columnDef.meta as any)?.headerClassName

            return (
              <TableHead
                key={header.id}
                className={headerClassName}
                aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : 'none'}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
                {canResize && (
                  <div
                    onDoubleClick={() => header.column.resetSize()}
                    onMouseDown={onResize}
                    onTouchStart={onResize}
                    className={cn(
                      'user-select-none absolute -right-2 top-0 z-10 flex h-full w-4 cursor-col-resize touch-none justify-center',
                      'before:absolute before:inset-y-0 before:w-px before:translate-x-px before:bg-border'
                    )}
                  />
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody
        id="content"
        tabIndex={-1}
        // REMINDER: avoids scroll (skipping the table header) when using skip to content
        style={{ scrollMarginTop: 'calc(var(--top-bar-height))' }}
      >
        {rows.length ? (
          rows.map((row) => (
            // REMINDER: if we want to add arrow navigation https://github.com/TanStack/table/discussions/2752#discussioncomment-192558
            <Fragment key={row.id}>
              {renderLiveRow?.({ row: row as any })}
              <DataTableRow
                row={row}
                table={table}
                searchParamsParser={searchParamsParser}
                selected={row.getIsSelected()}
              />
            </Fragment>
          ))
        ) : (
          <Fragment>
            {renderLiveRow?.()}
            <TableRow>
              <TableCell colSpan={columns.length} className="h-[32vh] text-center">
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="h-6 w-6 animate-spin text-foreground-muted" />
                      <p className="text-foreground-light text-sm">Retrieving logs...</p>
                    </>
                  ) : (
                    <p className="text-foreground-light text-sm">No results found</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </Fragment>
        )}
        {/* Only show load more section if we have rows OR if we're not in initial loading state */}
        {(rows.length > 0 || (!isLoading && !rows.length)) && (
          <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
            <TableCell colSpan={columns.length} className="text-center !py-2">
              {hasNextPage || isFetching ? (
                <div className="flex flex-col items-center gap-2">
                  <Button
                    disabled={isFetching}
                    onClick={() => fetchNextPage()}
                    size="small"
                    type="outline"
                    icon={
                      isFetching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null
                    }
                  >
                    Load more
                  </Button>
                  <p className="text-xs text-foreground-lighter">
                    Showing{' '}
                    <span className="font-mono font-medium">
                      {formatCompactNumber(totalRowsFetched)}
                    </span>{' '}
                    of{' '}
                    <span className="font-mono font-medium">{formatCompactNumber(totalRows)}</span>{' '}
                    rows
                  </p>
                </div>
              ) : (
                <p className="text-xs text-foreground-lighter">
                  No more data to load (
                  <span className="font-mono font-medium">{formatCompactNumber(filterRows)}</span>{' '}
                  of <span className="font-mono font-medium">{formatCompactNumber(totalRows)}</span>{' '}
                  rows)
                </p>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

/**
 * REMINDER: this is the heaviest component in the table if lots of rows
 * Some other components are rendered more often necessary, but are fixed size (not like rows that can grow in height)
 * e.g. DataTableFilterControls, DataTableFilterCommand, DataTableToolbar, DataTableHeader
 */

function DataTableRow<TData>({
  row,
  table,
  selected,
  searchParamsParser,
}: {
  row: Row<TData>
  table: TTable<TData>
  selected?: boolean
  searchParamsParser: any
}) {
  useQueryState('live', searchParamsParser.live)
  const rowClassName = (table.options.meta as any)?.getRowClassName?.(row)
  const cells = row.getVisibleCells()

  return (
    <TableRow
      id={row.id}
      tabIndex={0}
      data-state={selected && 'selected'}
      onClick={() => row.toggleSelected()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          row.toggleSelected()
        }
      }}
      className={cn(rowClassName)}
    >
      {cells.map((cell) => {
        const cellClassName = (cell.column.columnDef.meta as any)?.cellClassName
        return (
          <TableCell key={cell.id} className={cn(cellClassName)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

// [Joshen] Using MemoizedRow will cause the column visibility to break as the rows aren't getting re-rendered
const MemoizedRow = memo(
  DataTableRow,
  (prev, next) => prev.row.id === next.row.id && prev.selected === next.selected
) as typeof DataTableRow
