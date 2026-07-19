import { Loader2, Search, X } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Input } from 'ui'

import type { TableEditorActiveFilter } from '@/components/grid/utils/table-editor-quick-filter.utils'
import { useTrack } from '@/lib/telemetry/track'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

const FILTER_PLACEHOLDER = 'Filter by id, name, email... or ask AI'

function FilterChip({
  filter,
  onRemove,
}: {
  filter: TableEditorActiveFilter
  onRemove: () => void
}) {
  return (
    <span
      data-filter-chip
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-default bg-surface-200 px-2 py-0.5 text-xs text-foreground"
    >
      <span className="text-foreground-light">{filter.column}</span>
      <span className="text-foreground-muted">{filter.operator}</span>
      <span>{filter.value}</span>
      <button
        type="button"
        className="text-foreground-lighter hover:text-foreground"
        aria-label="Remove filter"
        onClick={onRemove}
      >
        <X size={12} />
      </button>
    </span>
  )
}

export type TableEditorQuickFilterProps = {
  isRefetching?: boolean
}

export const TableEditorQuickFilter = ({ isRefetching = false }: TableEditorQuickFilterProps) => {
  const track = useTrack()
  const snap = useTableEditorTableStateSnapshot()
  const filterRowRef = useRef<HTMLDivElement>(null)
  const placeholderMeasureRef = useRef<HTMLSpanElement>(null)
  const [showFilterPlaceholder, setShowFilterPlaceholder] = useState(true)

  const hasActiveFilter = snap.activeFilter !== null

  useLayoutEffect(() => {
    const row = filterRowRef.current
    const measureEl = placeholderMeasureRef.current
    if (!row || !measureEl) return

    const measure = () => {
      if (!hasActiveFilter) {
        setShowFilterPlaceholder(true)
        return
      }

      const chip = row.querySelector<HTMLElement>('[data-filter-chip]')
      const reservedWidth = (chip?.getBoundingClientRect().width ?? 0) + 48
      const availableWidth = row.clientWidth - reservedWidth
      const placeholderWidth = measureEl.getBoundingClientRect().width + 16

      setShowFilterPlaceholder(availableWidth >= placeholderWidth)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(row)

    return () => observer.disconnect()
  }, [hasActiveFilter, snap.activeFilter])

  const handleApplyFilter = (filterText: string) => {
    const trimmed = filterText.trim()
    snap.applyQuickFilter(trimmed)

    if (trimmed) {
      track('table_editor_filter_applied', {
        schema_name: snap.table.schema,
        table_name: snap.table.name,
      })
    }
  }

  const handleRemoveFilter = () => {
    snap.removeQuickFilter()
    track('table_editor_filter_chip_removed', {
      schema_name: snap.table.schema,
      table_name: snap.table.name,
    })
  }

  const icon = isRefetching ? (
    <Loader2 className="animate-spin text-brand h-4 w-4 shrink-0" aria-label="Loading table data" />
  ) : null

  return (
    <div className="flex-1 min-w-0 px-1.5">
      <div
        ref={filterRowRef}
        className="relative flex items-center gap-2 w-full rounded-md h-full min-w-0 flex-nowrap"
      >
        <span
          ref={placeholderMeasureRef}
          aria-hidden
          className="invisible absolute left-0 top-0 text-xs whitespace-nowrap pointer-events-none"
        >
          {FILTER_PLACEHOLDER}
        </span>
        <div className="relative flex items-center justify-center shrink-0 px-2">
          {icon ?? (
            <Search size={16} strokeWidth={2} className="text-foreground-muted w-4 h-4" />
          )}
        </div>
        <Input
          data-testid="filter-bar-freeform-input"
          data-filter-input
          value={snap.filterInput}
          placeholder={showFilterPlaceholder ? FILTER_PLACEHOLDER : undefined}
          className="border-none bg-transparent text-xs focus:ring-0 focus-visible:ring-0 flex-1 h-auto min-w-0 px-2 py-1"
          onChange={(event) => snap.setFilterInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleApplyFilter(event.currentTarget.value)
            }
          }}
        />
        {snap.activeFilter ? (
          <FilterChip filter={snap.activeFilter} onRemove={handleRemoveFilter} />
        ) : null}
      </div>
    </div>
  )
}
