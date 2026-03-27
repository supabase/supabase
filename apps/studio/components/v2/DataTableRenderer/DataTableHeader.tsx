'use client'

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useCallback, useRef } from 'react'
import { cn, Input_Shadcn_ } from 'ui'

import type { DataTableColumn, SortState } from './types'

interface DataTableHeaderProps<T = unknown> {
  columns: DataTableColumn<T>[]
  sort: SortState | null
  onSortChange: (sort: SortState | null) => void
  selectable?: boolean
  allSelected?: boolean
  someSelected?: boolean
  onSelectAll?: (checked: boolean) => void
  hasRowActions?: boolean
  compact?: boolean
  columnWidths: Record<string, number>
  onColumnResize: (columnId: string, width: number) => void
}

export function DataTableHeader<T = unknown>({
  columns,
  sort,
  onSortChange,
  selectable,
  allSelected,
  someSelected,
  onSelectAll,
  hasRowActions,
  compact,
  columnWidths,
  onColumnResize,
}: DataTableHeaderProps<T>) {
  const rowHeight = compact ? 'h-7' : 'h-[35px]'
  const resizingRef = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null)

  const handleSortClick = useCallback(
    (col: DataTableColumn<T>) => {
      if (!col.sortable && col.sortable !== undefined) return
      if (!sort || sort.columnId !== col.id) {
        onSortChange({ columnId: col.id, direction: 'asc' })
      } else if (sort.direction === 'asc') {
        onSortChange({ columnId: col.id, direction: 'desc' })
      } else {
        onSortChange(null)
      }
    },
    [sort, onSortChange]
  )

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, columnId: string) => {
      e.preventDefault()
      e.stopPropagation()
      const startWidth = columnWidths[columnId] ?? 160
      resizingRef.current = { columnId, startX: e.clientX, startWidth }

      const handleMove = (e: PointerEvent) => {
        if (!resizingRef.current) return
        const delta = e.clientX - resizingRef.current.startX
        const newWidth = Math.max(60, resizingRef.current.startWidth + delta)
        onColumnResize(resizingRef.current.columnId, newWidth)
      }

      const handleUp = () => {
        resizingRef.current = null
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }

      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    },
    [columnWidths, onColumnResize]
  )

  return (
    <thead className="sticky top-0 z-10">
      <tr className={cn('border-b border-default bg-surface-200 text-left', rowHeight)}>
        {selectable && (
          <th className="w-10 min-w-10 max-w-10 shrink-0 px-2 align-middle text-center">
            <Input_Shadcn_
              type="checkbox"
              size="small"
              className="h-3.5 w-3.5 cursor-pointer rounded border-control accent-brand"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = !!someSelected && !allSelected
              }}
              onChange={(e) => onSelectAll?.(e.target.checked)}
              aria-label="Select all rows"
            />
          </th>
        )}

        {columns.map((col) => {
          const isSorted = sort?.columnId === col.id
          const isSortable = col.sortable !== false
          const isResizable = col.resizable !== false

          return (
            <th
              key={col.id}
              className={cn(
                'group relative overflow-hidden px-2 align-middle',
                isSortable && 'cursor-pointer hover:bg-surface-300',
                col.frozen && 'sticky left-0 z-20 bg-surface-200'
              )}
              onClick={isSortable ? () => handleSortClick(col) : undefined}
            >
              <div className="flex min-w-0 items-center gap-1">
                {col.renderHeader ? (
                  col.renderHeader()
                ) : (
                  <span className="truncate text-xs font-medium text-foreground-light">
                    {col.name}
                  </span>
                )}

                {isSortable && (
                  <span className="ml-auto shrink-0 pl-1">
                    {isSorted && sort ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp className="h-3 w-3 text-foreground" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-foreground" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-foreground-lighter opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </span>
                )}
              </div>

              {isResizable && (
                <div
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none hover:bg-brand/50 active:bg-brand"
                  onPointerDown={(e) => handleResizeStart(e, col.id)}
                />
              )}
            </th>
          )
        })}

        {hasRowActions && <th className="w-8 min-w-8 max-w-8 shrink-0" />}
      </tr>
    </thead>
  )
}
