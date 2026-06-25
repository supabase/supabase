import { type FetchNextPageOptions } from '@tanstack/react-query'
import type { ColumnDef, Row, Table as TTable, VisibilityState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { LoaderCircle } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { Fragment, UIEvent, useCallback, useRef } from 'react'
import { Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { ShimmeringLoader } from 'ui-patterns'

import { AlertError } from '../AlertError'
import { formatCompactNumber } from './DataTable.utils'
import { useDataTable } from './providers/DataTableProvider'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const TableRowClassName = 'border-b group data-[state=selected]:bg-muted hover:bg-surface-200'
const TableCellClassName = 'text-xs py-1! p-2 *:[[role=checkbox]]:translate-y-[2px] truncate'

// TODO: add a possible chartGroupBy
export interface DataTableInfiniteProps<TData, TValue, _TMeta> {
  columns: ColumnDef<TData, TValue>[]
  defaultColumnVisibility?: VisibilityState
  totalRows?: number
  filterRows?: number
  totalRowsFetched?: number
  hasNextPage?: boolean
  fetchNextPage: (options?: FetchNextPageOptions | undefined) => Promise<unknown>
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
  setColumnOrder,
  setColumnVisibility,
  searchParamsParser,
}: DataTableInfiniteProps<TData, TValue, TMeta>) {
  const tableRef = useRef<HTMLTableElement>(null)
  const { table, error, isError, isLoading, isFetching, openRowId, setOpenRowId } = useDataTable()

  const headerGroups = table.getHeaderGroups()
  const headers = headerGroups[0].headers
  const rows = table.getRowModel().rows ?? []

  const onScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      // Trigger fetching slightly before reaching the very bottom for a smoother experience
      const BOTTOM_BUFFER_PX = 300
      const onPageBottom =
        Math.ceil(e.currentTarget.scrollTop + e.currentTarget.clientHeight) >=
        e.currentTarget.scrollHeight - BOTTOM_BUFFER_PX

      if (onPageBottom && !isFetching && hasNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, isFetching, hasNextPage]
  )

  useShortcut(
    SHORTCUT_IDS.DATA_TABLE_RESET_COLUMNS,
    () => {
      setColumnOrder([])
      setColumnVisibility(defaultColumnVisibility)
    },
    { registerInCommandMenu: true }
  )

  return (
    <>
      <Table
        ref={tableRef}
        containerProps={{
          onScroll,
          className: 'h-full w-full overflow-auto caption-bottom text-sm @container',
        }}
        className={cn(
          !isLoading && rows.length === 0 && 'h-full',
          isLoading && '[mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]'
        )}
      >
        <TableHeader className="sticky top-0 z-1">
          <TableRow className={cn(TableRowClassName, 'bg-surface-75')}>
            {headers.map((header) => {
              const sort = header.column.getIsSorted()
              const canResize = header.column.getCanResize()
              const onResize = header.getResizeHandler()
              const headerClassName = (header.column.columnDef.meta as any)?.headerClassName

              return (
                <TableHead
                  key={header.id}
                  id={header.id}
                  className={cn(
                    'w-full text-xs! font-normal! text-foreground-lighter font-mono',
                    'relative select-none truncate [&>.cursor-col-resize]:last:opacity-0',
                    'text-muted-foreground h-9 px-2 text-left align-middle',
                    '[&:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-[2px]',
                    headerClassName
                  )}
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
          className={cn(
            'transition-colors outline-none focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-primary'
          )}
          // REMINDER: avoids scroll (skipping the table header) when using skip to content
          style={{ scrollMarginTop: 'calc(var(--top-bar-height))' }}
        >
          {rows.length ? (
            rows.map((row) => (
              // REMINDER: if we want to add arrow navigation https://github.com/TanStack/table/discussions/2752#discussioncomment-192558
              <DataTableRow
                key={row.id}
                row={row}
                table={table}
                searchParamsParser={searchParamsParser}
                selected={row.id === openRowId}
                onSelect={() => setOpenRowId(row.id === openRowId ? undefined : row.id)}
              />
            ))
          ) : isLoading ? (
            <Fragment>
              {new Array(15).fill(0).map((_, x) => (
                <TableRow
                  key={x}
                  className={cn(
                    TableRowClassName,
                    'h-[30px] hover:bg-transparent [&>td]:group-hover:!bg-transparent'
                  )}
                >
                  {table.getAllLeafColumns().map((col, idx) => (
                    <TableCell key={col.id} className={TableCellClassName}>
                      <ShimmeringLoader className={cn('py-2', idx % 2 === 0 && 'opacity-50')} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </Fragment>
          ) : isError ? (
            <Fragment>
              <TableRow className={cn(TableRowClassName, 'hover:bg-transparent h-full')}>
                <TableCell
                  colSpan={columns.length}
                  className={cn(TableCellClassName, 'text-center')}
                >
                  <div className="flex flex-col items-start justify-start h-full gap-3 px-4 pt-4">
                    <AlertError
                      error={error}
                      className="text-left"
                      subject="Failed to retrieve logs"
                    />
                  </div>
                </TableCell>
              </TableRow>
            </Fragment>
          ) : (
            <Fragment>
              <TableRow className={cn(TableRowClassName, 'hover:bg-transparent h-full')}>
                <TableCell
                  colSpan={columns.length}
                  className={cn(TableCellClassName, 'text-center')}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <p className="text-foreground-light text-sm">No results found</p>
                  </div>
                </TableCell>
              </TableRow>
            </Fragment>
          )}

          {/* Only show load more section if we have rows OR if we're not in initial loading state */}
          {(rows.length > 0 || (!isLoading && !rows.length)) && (
            <TableRow
              className={cn(
                TableRowClassName,
                'hover:bg-transparent data-[state=selected]:bg-transparent'
              )}
            >
              <TableCell colSpan={columns.length} className="text-xs p-0! overflow-visible">
                <div className="sticky left-0 w-[100cqw] flex flex-col items-center gap-2 py-2 text-center">
                  {hasNextPage || isFetching ? (
                    <>
                      <Button
                        disabled={isFetching}
                        onClick={() => fetchNextPage()}
                        size="tiny"
                        variant="default"
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
                        <span className="font-mono font-medium">
                          {formatCompactNumber(totalRows)}
                        </span>{' '}
                        rows
                      </p>
                    </>
                  ) : (
                    rows.length > 0 && (
                      <p className="text-xs text-foreground-lighter">
                        No more data to load (
                        <span className="font-mono font-medium">
                          {formatCompactNumber(filterRows)}
                        </span>{' '}
                        of{' '}
                        <span className="font-mono font-medium">
                          {formatCompactNumber(totalRows)}
                        </span>{' '}
                        rows)
                      </p>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
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
  onSelect,
}: {
  row: Row<TData>
  table: TTable<TData>
  selected?: boolean
  searchParamsParser: any
  onSelect: () => void
}) {
  useQueryState('live', searchParamsParser.live)
  const rowClassName = cn('group/row', (table.options.meta as any)?.getRowClassName?.(row))
  const cells = row.getVisibleCells()

  return (
    <TableRow
      id={row.id}
      tabIndex={0}
      data-state={selected && 'selected'}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(TableRowClassName, rowClassName)}
    >
      {cells.map((cell) => {
        const cellClassName = (cell.column.columnDef.meta as any)?.cellClassName
        return (
          <TableCell key={cell.id} className={cn(TableCellClassName, cellClassName)}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}
