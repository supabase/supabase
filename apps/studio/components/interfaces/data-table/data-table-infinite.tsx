'use client'

import { type FetchNextPageOptions } from '@tanstack/react-query'
import type { ColumnDef, Row, Table as TTable, VisibilityState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/interfaces/DataTableDemo/components/custom/table'
import { useHotKey } from 'components/interfaces/DataTableDemo/hooks/use-hot-key'
import { searchParamsParser } from 'components/interfaces/DataTableDemo/infinite/search-params'
import { formatCompactNumber } from 'components/interfaces/DataTableDemo/lib/format'
import { LoaderCircle } from 'lucide-react'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { Button, cn } from 'ui'
import { useDataTable } from '../DataTableDemo/components/data-table/data-table-provider'

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
  renderLiveRow?: (props?: { row: Row<TData> }) => React.ReactNode
  setColumnOrder: (columnOrder: string[]) => void
  setColumnVisibility: (columnVisibility: VisibilityState) => void
}

export function DataTableInfinite<TData, TValue, TMeta>({
  columns,
  defaultColumnVisibility = {},
  isFetching,
  isLoading,
  fetchNextPage,
  hasNextPage,
  totalRows = 0,
  filterRows = 0,
  totalRowsFetched = 0,
  renderLiveRow,
  setColumnOrder,
  setColumnVisibility,
}: DataTableInfiniteProps<TData, TValue, TMeta>) {
  const { table } = useDataTable()

  const tableRef = React.useRef<HTMLTableElement>(null)
  // const [topBarHeight, setTopBarHeight] = React.useState(0)
  // FIXME: searchParamsParser needs to be passed as property

  const onScroll = React.useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const onPageBottom =
        Math.ceil(e.currentTarget.scrollTop + e.currentTarget.clientHeight) >=
        e.currentTarget.scrollHeight

      if (onPageBottom && !isFetching && totalRowsFetched < filterRows) {
        fetchNextPage()
      }
    },
    [fetchNextPage, isFetching, filterRows, totalRowsFetched]
  )

  useHotKey(() => {
    setColumnOrder([])
    setColumnVisibility(defaultColumnVisibility)
  }, 'u')

  return (
    <>
      <div className="z-0">
        <Table
          ref={tableRef}
          onScroll={onScroll}
          // REMINDER: https://stackoverflow.com/questions/50361698/border-style-do-not-work-with-sticky-position-element
          className="border-separate border-spacing-0"
          containerClassName="max-h-[calc(100vh_-_var(--top-bar-height))]"
        >
          <TableHeader className={cn('sticky top-0 z-20 bg-background')}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  'bg-muted/50 hover:bg-muted/50',
                  '[&>*]:border-t [&>:not(:last-child)]:border-r'
                )}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'relative select-none truncate border-b border-border [&>.cursor-col-resize]:last:opacity-0',
                        header.column.columnDef.meta?.headerClassName
                      )}
                      aria-sort={
                        header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : header.column.getIsSorted() === 'desc'
                            ? 'descending'
                            : 'none'
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanResize() && (
                        <div
                          onDoubleClick={() => header.column.resetSize()}
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
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
            ))}
          </TableHeader>
          <TableBody
            id="content"
            tabIndex={-1}
            className="outline-1 -outline-offset-1 outline-primary transition-colors focus-visible:outline"
            // REMINDER: avoids scroll (skipping the table header) when using skip to content
            style={{
              scrollMarginTop: 'calc(var(--top-bar-height) + 40px)',
            }}
          >
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                // REMINDER: if we want to add arrow navigation https://github.com/TanStack/table/discussions/2752#discussioncomment-192558
                <React.Fragment key={row.id}>
                  {renderLiveRow?.({ row })}
                  <MemoizedRow row={row} table={table} selected={row.getIsSelected()} />
                </React.Fragment>
              ))
            ) : (
              <React.Fragment>
                {renderLiveRow?.()}
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )}
            <TableRow className="hover:bg-transparent data-[state=selected]:bg-transparent">
              <TableCell colSpan={columns.length} className="text-center">
                {hasNextPage || isFetching || isLoading ? (
                  <Button
                    disabled={isFetching || isLoading}
                    onClick={() => fetchNextPage()}
                    size="small"
                    type="outline"
                    icon={
                      isFetching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null
                    }
                  >
                    Load More
                  </Button>
                ) : (
                  <p className="text-sm text-foreground-lighter py-4">
                    No more data to load (
                    <span className="font-mono font-medium">{formatCompactNumber(filterRows)}</span>{' '}
                    of{' '}
                    <span className="font-mono font-medium">{formatCompactNumber(totalRows)}</span>{' '}
                    rows)
                  </p>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {/* </div> */}
    </>
  )
}

/**
 * REMINDER: this is the heaviest component in the table if lots of rows
 * Some other components are rendered more often necessary, but are fixed size (not like rows that can grow in height)
 * e.g. DataTableFilterControls, DataTableFilterCommand, DataTableToolbar, DataTableHeader
 */

function Row<TData>({
  row,
  table,
  selected,
}: {
  row: Row<TData>
  table: TTable<TData>
  // REMINDER: row.getIsSelected(); - just for memoization
  selected?: boolean
}) {
  // REMINDER: rerender the row when live mode is toggled - used to opacity the row
  // via the `getRowClassName` prop - but for some reasons it wil render the row on data fetch
  useQueryState('live', searchParamsParser.live)
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
      className={cn(
        '[&>:not(:last-child)]:border-r',
        'outline-1 -outline-offset-1 outline-primary transition-colors focus-visible:bg-muted/50 focus-visible:outline data-[state=selected]:outline',
        table.options.meta?.getRowClassName?.(row)
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            'truncate border-b border-border',
            cell.column.columnDef.meta?.cellClassName
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

const MemoizedRow = React.memo(
  Row,
  (prev, next) => prev.row.id === next.row.id && prev.selected === next.selected
) as typeof Row
