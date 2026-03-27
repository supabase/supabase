'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { cn } from 'ui'

export type DataListColumnDef<TRow> = {
  key: string
  name: string
  minWidth?: number
  /** When set, clicking the header sorts by this accessor */
  sortValue?: (row: TRow) => string | number | boolean | null | undefined
  renderCell: (row: TRow) => ReactNode
}

export type DataListGridProps<TRow> = {
  /** Top chrome (schema picker, search, actions) — same row height as Table Editor header */
  toolbar?: ReactNode
  /** Optional tab strip under the toolbar (e.g. Data / Definition later) */
  tabs?: ReactNode
  columns: DataListColumnDef<TRow>[]
  rows: TRow[]
  rowKeyGetter: (row: TRow) => string | number
  isLoading?: boolean
  emptyMessage?: ReactNode
  onRowClick?: (row: TRow) => void
  onRowDoubleClick?: (row: TRow) => void
  /** Status text on the right of the toolbar (e.g. row count) */
  toolbarTrailing?: ReactNode
  className?: string
}

function compareSortValues(
  a: string | number | boolean | null | undefined,
  b: string | number | boolean | null | undefined
): number {
  if (a === b) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
}

/**
 * Read-only list grid with the same shell classes as Table Editor / SupabaseGrid
 * (`sb-grid`, header chrome). Intended for v2 Data layer list routes before a
 * fuller generic DataView exists.
 */
export function DataListGrid<TRow>({
  toolbar,
  tabs,
  columns: columnDefs,
  rows,
  rowKeyGetter,
  isLoading = false,
  emptyMessage,
  onRowClick,
  onRowDoubleClick,
  toolbarTrailing,
  className,
}: DataListGridProps<TRow>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortableColumn = useMemo(
    () => columnDefs.find((c) => c.key === sortKey),
    [columnDefs, sortKey]
  )

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortableColumn?.sortValue) return rows
    const accessor = sortableColumn.sortValue
    const next = [...rows].sort((ra, rb) => {
      const cmp = compareSortValues(accessor(ra), accessor(rb))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return next
  }, [rows, sortKey, sortableColumn, sortDir])

  const onHeaderClick = useCallback(
    (key: string) => {
      const def = columnDefs.find((c) => c.key === key)
      if (!def?.sortValue) return
      if (sortKey !== key) {
        setSortKey(key)
        setSortDir('asc')
      } else {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      }
    },
    [columnDefs, sortKey]
  )

  return (
    <div className={cn('sb-grid flex h-full min-h-0 flex-col', className)}>
      {(toolbar != null || toolbarTrailing != null) && (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-border bg-dash-sidebar px-1.5 py-1.5 dark:bg-surface-100">
          <div className="flex min-w-0 flex-1 items-center gap-2">{toolbar}</div>
          {toolbarTrailing != null ? (
            <div className="shrink-0 text-xs text-foreground-lighter">{toolbarTrailing}</div>
          ) : null}
        </div>
      )}
      {tabs != null ? (
        <div className="flex h-9 shrink-0 items-center border-b border-border px-2">{tabs}</div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {isLoading ? (
          <div className="absolute top-10 w-full px-4">Loading...</div>
        ) : sortedRows.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-foreground-lighter">
            {emptyMessage ?? 'No rows'}
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b border-border">
                  {columnDefs.map((col) => {
                    const active = sortKey === col.key
                    const canSort = Boolean(col.sortValue)
                    return (
                      <th
                        key={col.key}
                        className="h-[34px] px-2 text-left font-medium text-foreground-light"
                        style={{ minWidth: col.minWidth ?? 120 }}
                      >
                        <button
                          type="button"
                          className={cn(
                            'flex h-full w-full items-center gap-1 text-left',
                            canSort && 'hover:text-foreground'
                          )}
                          disabled={!canSort}
                          onClick={() => canSort && onHeaderClick(col.key)}
                        >
                          <span className="min-w-0 flex-1 truncate">{col.name}</span>
                          {canSort && active ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                            )
                          ) : null}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const key = rowKeyGetter(row)
                  return (
                    <tr
                      key={key}
                      className={cn(
                        'h-9 border-b border-border',
                        (onRowClick || onRowDoubleClick) && 'cursor-pointer hover:bg-surface-200/30'
                      )}
                      onClick={() => onRowClick?.(row)}
                      onDoubleClick={() => onRowDoubleClick?.(row)}
                    >
                      {columnDefs.map((col) => (
                        <td key={col.key} className="px-2 align-middle">
                          <div className="min-w-0 truncate">{col.renderCell(row)}</div>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
