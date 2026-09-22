import { type FetchNextPageOptions } from '@tanstack/react-query'
import type { Cell, ColumnDef, Row, VisibilityState } from '@tanstack/react-table'
import { flexRender } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { LoaderCircle } from 'lucide-react'
import {
  Fragment,
  KeyboardEvent,
  memo,
  MouseEvent,
  ReactNode,
  UIEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Button, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '../AlertError'
import { formatCompactNumber } from './DataTable.utils'
import {
  useDataTable,
  useDataTableSelection,
  useDataTableSelectionActions,
} from './providers/DataTableProvider'
import { useLatest } from '@/hooks/misc/useLatest'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const TableRowClassName = 'border-b group data-[state=selected]:bg-muted hover:bg-surface-200'
const TableCellClassName = 'text-xs py-1! p-2 truncate'

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
  /** Overrides the "No results found" copy shown when the current filters can't match any row. */
  emptyStateMessage?: string | ReactNode
  /** Overrides the subject shown in the error state, e.g. "Failed to retrieve X" */
  errorSubject?: string
}

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
  emptyStateMessage = 'No results found',
  errorSubject = 'Failed to retrieve data',
}: DataTableInfiniteProps<TData, TValue, TMeta>) {
  const tableRef = useRef<HTMLTableElement>(null)
  const { table, error, isError, isLoading, isFetching } = useDataTable()
  const { openRowId } = useDataTableSelection()
  const { setOpenRowId, onSelectRow, rowNavigationRef } = useDataTableSelectionActions()

  const headerGroups = table.getHeaderGroups()
  const headers = headerGroups[0].headers
  const rows = table.getRowModel().rows

  const indexById = useMemo(() => new Map(rows.map((row, index) => [row.id, index])), [rows])
  const getItemKey = useCallback((index: number) => rows[index].id, [rows])
  const virtualizer = useVirtualizer<HTMLElement, HTMLTableRowElement>({
    count: rows.length,
    getScrollElement: () => tableRef.current?.parentElement ?? null,
    estimateSize: () => 30,
    getItemKey,
    overscan: 8,
    paddingStart: 36,
    scrollPaddingStart: 36,
  })
  const virtualRows = virtualizer.getVirtualItems()
  const paddingTop = virtualRows.length ? virtualRows[0].start - 36 : 0
  const paddingBottom = virtualRows.length
    ? virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
    : 0
  const focusFrame = useRef<number | undefined>(undefined)
  const pendingFocus = useRef(false)
  useEffect(() => () => cancelAnimationFrame(focusFrame.current ?? 0), [])
  useImperativeHandle(
    rowNavigationRef,
    () => ({
      scrollToRow(id, focus) {
        const index = indexById.get(id)
        if (index === undefined) return
        cancelAnimationFrame(focusFrame.current ?? 0)
        virtualizer.scrollToIndex(index, { align: 'auto' })
        pendingFocus.current = focus || pendingFocus.current
        if (pendingFocus.current) {
          // Scrolling can mount a previously offscreen row. Focus after that commit.
          focusFrame.current = requestAnimationFrame(() => {
            const row = document.getElementById(id)
            if (row && tableRef.current?.contains(row)) row.focus({ preventScroll: true })
            pendingFocus.current = false
          })
        }
      },
    }),
    [indexById, virtualizer]
  )

  const selectionActions = useLatest({ onSelectRow, setOpenRowId, openRowId })
  const handleSelect = useCallback(
    (id: string, event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>) => {
      const { onSelectRow, setOpenRowId, openRowId } = selectionActions.current
      if (onSelectRow) onSelectRow(id, event)
      else setOpenRowId(id === openRowId ? undefined : id)
    },
    [selectionActions]
  )

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
        aria-rowcount={rows.length + 1}
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
            <>
              {paddingTop > 0 && (
                <TableRow aria-hidden="true">
                  <TableCell
                    colSpan={headers.length}
                    className="p-0! border-0"
                    style={{ height: paddingTop }}
                  />
                </TableRow>
              )}
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                return (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    index={virtualRow.index}
                    measureElement={virtualizer.measureElement}
                    cells={row.getVisibleCells()}
                    rowClassName={(
                      table.options.meta as { getRowClassName?: (row: Row<unknown>) => string }
                    )?.getRowClassName?.(row)}
                    selected={onSelectRow ? row.getIsSelected() : row.id === openRowId}
                    onSelect={handleSelect}
                  />
                )
              })}
              {paddingBottom > 0 && (
                <TableRow aria-hidden="true">
                  <TableCell
                    colSpan={headers.length}
                    className="p-0! border-0"
                    style={{ height: paddingBottom }}
                  />
                </TableRow>
              )}
            </>
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
                    <AlertError error={error} className="text-left" subject={errorSubject} />
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
                    {typeof emptyStateMessage === 'string' ? (
                      <p className="text-foreground-light text-sm">{emptyStateMessage}</p>
                    ) : (
                      emptyStateMessage
                    )}
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

const DataTableRow = memo(function DataTableRow<TData>({
  row,
  cells,
  index,
  measureElement,
  rowClassName,
  selected,
  onSelect,
}: {
  row: Row<TData>
  cells: Cell<TData, unknown>[]
  index: number
  measureElement: (element: HTMLTableRowElement | null) => void
  rowClassName?: string
  selected?: boolean
  onSelect: (
    id: string,
    event: MouseEvent<HTMLTableRowElement> | KeyboardEvent<HTMLTableRowElement>
  ) => void
}) {
  return (
    <TableRow
      id={row.id}
      ref={measureElement}
      data-index={index}
      aria-rowindex={index + 2}
      tabIndex={0}
      data-state={selected && 'selected'}
      aria-selected={!!selected}
      onClick={(event) => onSelect(row.id, event)}
      onMouseDown={(event) => {
        if (event.shiftKey) event.preventDefault()
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(row.id, event)
        }
      }}
      className={cn(TableRowClassName, 'group/row cursor-pointer', rowClassName)}
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
})
