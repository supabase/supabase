'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { cn } from 'ui'

import { DataTableBody } from './DataTableBody'
import { DataTableBulkBar } from './DataTableBulkBar'
import { DataTableEmpty } from './DataTableEmpty'
import { DataTableError } from './DataTableError'
import { DataTableHeader } from './DataTableHeader'
import { DataTableLoading } from './DataTableLoading'
import { DataTablePagination } from './DataTablePagination'
import { DataTableToolbar } from './DataTableToolbar'
import { useClientFilter } from './hooks/useClientFilter'
import { useClientSort } from './hooks/useClientSort'
import type { DataTableRendererProps, EditingCell, FilterState, SortState } from './types'

export function DataTableRenderer<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  isLoading = false,
  error = null,
  onRetry,
  sort: controlledSort,
  onSortChange: controlledOnSortChange,
  renderSortControl,
  filters,
  filterState: controlledFilterState,
  onFilterChange: controlledOnFilterChange,
  pagination,
  onPageChange,
  onPageSizeChange,
  selectable = false,
  selectedRows: controlledSelectedRows,
  onSelectionChange,
  onRowClick,
  onRowDoubleClick,
  rowActions,
  bulkActions,
  editable = false,
  onCellEdit,
  toolbarLeft,
  toolbarRight,
  emptyState,
  compact = false,
  hideToolbar = false,
  className,
}: DataTableRendererProps<T>) {
  // ── Row key helper ────────────────────────────────────────────────────────
  const getRowKey = useCallback(
    (row: T): string => {
      if (typeof rowKey === 'function') return rowKey(row)
      return String((row as Record<string, unknown>)[rowKey as string])
    },
    [rowKey]
  )

  // ── Sorting ───────────────────────────────────────────────────────────────
  const isControlledSort = controlledSort !== undefined && controlledOnSortChange !== undefined
  const [internalSort, setInternalSort] = useState<SortState | null>(null)
  const activeSort = isControlledSort ? (controlledSort ?? null) : internalSort
  const handleSortChange = useCallback(
    (s: SortState | null) => {
      if (isControlledSort) controlledOnSortChange(s)
      else setInternalSort(s)
    },
    [isControlledSort, controlledOnSortChange]
  )

  // ── Filtering ─────────────────────────────────────────────────────────────
  const isControlledFilter =
    controlledFilterState !== undefined && controlledOnFilterChange !== undefined
  const [internalFilterState, setInternalFilterState] = useState<FilterState>({})
  const activeFilterState = isControlledFilter ? controlledFilterState : internalFilterState
  const handleFilterChange = useCallback(
    (s: FilterState) => {
      if (isControlledFilter) controlledOnFilterChange(s)
      else setInternalFilterState(s)
    },
    [isControlledFilter, controlledOnFilterChange]
  )

  // ── Client-side sort + filter (when uncontrolled) ─────────────────────────
  const sortedRows = useClientSort(rows, isControlledSort ? null : activeSort, columns)
  const filteredRows = useClientFilter(
    isControlledSort ? rows : sortedRows,
    isControlledFilter ? {} : activeFilterState,
    isControlledFilter ? undefined : filters
  )
  const displayRows = isControlledSort && isControlledFilter ? rows : filteredRows

  // ── Column widths ──────────────────────────────────────────────────────────
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const col of columns) {
      if (col.width) initial[col.id] = col.width
    }
    return initial
  })
  const handleColumnResize = useCallback((columnId: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [columnId]: width }))
  }, [])

  useEffect(() => {
    setColumnWidths((prev) => {
      const next = { ...prev }
      for (const col of columns) {
        if (next[col.id] === undefined && col.width !== undefined) {
          next[col.id] = col.width
        }
      }
      return next
    })
  }, [columns])

  // ── Selection ─────────────────────────────────────────────────────────────
  const isControlledSelection = controlledSelectedRows !== undefined
  const [internalSelectedRows, setInternalSelectedRows] = useState<Set<string>>(new Set())
  const activeSelectedRows = isControlledSelection ? controlledSelectedRows : internalSelectedRows

  const handleSelect = useCallback(
    (key: string, checked: boolean) => {
      const next = new Set(activeSelectedRows)
      if (checked) next.add(key)
      else next.delete(key)
      if (isControlledSelection) onSelectionChange?.(next)
      else setInternalSelectedRows(next)
    },
    [activeSelectedRows, isControlledSelection, onSelectionChange]
  )

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const next = checked ? new Set(displayRows.map((r) => getRowKey(r))) : new Set<string>()
      if (isControlledSelection) onSelectionChange?.(next)
      else setInternalSelectedRows(next)
    },
    [displayRows, getRowKey, isControlledSelection, onSelectionChange]
  )

  const handleClearSelection = useCallback(() => {
    const empty = new Set<string>()
    if (isControlledSelection) onSelectionChange?.(empty)
    else setInternalSelectedRows(empty)
  }, [isControlledSelection, onSelectionChange])

  // ── Inline editing ────────────────────────────────────────────────────────
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)

  const handleCommitEdit = useCallback(
    async (rKey: string, columnId: string, value: unknown) => {
      setEditingCell(null)
      await onCellEdit?.(rKey, columnId, value)
    },
    [onCellEdit]
  )
  const handleCancelEdit = useCallback(() => setEditingCell(null), [])

  // ── Derived selection state ───────────────────────────────────────────────
  const allSelected =
    displayRows.length > 0 && displayRows.every((r) => activeSelectedRows.has(getRowKey(r)))
  const someSelected = !allSelected && displayRows.some((r) => activeSelectedRows.has(getRowKey(r)))

  const selectedRowObjects = useMemo(
    () => displayRows.filter((r) => activeSelectedRows.has(getRowKey(r))),
    [displayRows, activeSelectedRows, getRowKey]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  const hasBulkBar =
    selectable && activeSelectedRows.size > 0 && bulkActions && bulkActions.length > 0
  const hasPagination = !!pagination && !!onPageChange
  const hasRowActions = !!rowActions && rowActions.length > 0
  const showChromeToolbar =
    !hideToolbar &&
    (hasBulkBar || Boolean(filters?.length) || toolbarLeft || toolbarRight || renderSortControl)

  return (
    <div className={cn('sb-grid flex h-full min-h-0 flex-col', className)}>
      {/* Toolbar / bulk bar */}
      {hasBulkBar ? (
        <DataTableBulkBar
          selectedCount={activeSelectedRows.size}
          selectedRows={selectedRowObjects}
          bulkActions={bulkActions}
          onClearSelection={handleClearSelection}
        />
      ) : showChromeToolbar ? (
        <DataTableToolbar
          filters={filters}
          filterState={activeFilterState}
          onFilterChange={handleFilterChange}
          toolbarLeft={toolbarLeft}
          toolbarRight={
            <>
              {renderSortControl?.({
                sort: activeSort,
                onSortChange: handleSortChange,
              })}
              {toolbarRight}
            </>
          }
        />
      ) : null}

      {/* Main content scroll area */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        {error ? (
          <DataTableError error={error} onRetry={onRetry} />
        ) : isLoading ? (
          <DataTableLoading columns={columns} compact={compact} selectable={selectable} />
        ) : displayRows.length === 0 ? (
          <DataTableEmpty emptyState={emptyState} />
        ) : (
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {selectable ? <col style={{ width: 40 }} /> : null}
              {columns.map((col) => (
                <col
                  key={col.id}
                  style={{
                    width: columnWidths[col.id] ?? col.width ?? 160,
                  }}
                />
              ))}
              {hasRowActions ? <col style={{ width: 32 }} /> : null}
            </colgroup>
            <DataTableHeader
              columns={columns}
              sort={activeSort}
              onSortChange={handleSortChange}
              selectable={selectable}
              allSelected={allSelected}
              someSelected={someSelected}
              onSelectAll={handleSelectAll}
              hasRowActions={hasRowActions}
              compact={compact}
              columnWidths={columnWidths}
              onColumnResize={handleColumnResize}
            />
            <DataTableBody
              rows={displayRows}
              columns={columns}
              rowKey={rowKey}
              selectedRows={activeSelectedRows}
              selectable={selectable}
              onSelect={handleSelect}
              onRowClick={onRowClick}
              onRowDoubleClick={onRowDoubleClick}
              rowActions={rowActions}
              editingCell={editingCell}
              onStartEdit={setEditingCell}
              onCommitEdit={handleCommitEdit}
              onCancelEdit={handleCancelEdit}
              editable={editable}
              compact={compact}
            />
          </table>
        )}
      </div>

      {/* Footer: pagination */}
      {hasPagination && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}

// Re-export types for consumers
export type {
  BulkAction,
  DataTableColumn,
  DataTableRendererProps,
  FilterDefinition,
  FilterState,
  PaginationState,
  RowAction,
  SortState,
} from './types'
