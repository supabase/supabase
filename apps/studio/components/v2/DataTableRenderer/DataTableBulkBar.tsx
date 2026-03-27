'use client'

import { X } from 'lucide-react'
import { Button, cn } from 'ui'
import type { BulkAction } from './types'

interface DataTableBulkBarProps<T = any> {
  selectedCount: number
  selectedRows: T[]
  bulkActions?: BulkAction<T>[]
  onClearSelection: () => void
}

export function DataTableBulkBar<T extends Record<string, any>>({
  selectedCount,
  selectedRows,
  bulkActions,
  onClearSelection,
}: DataTableBulkBarProps<T>) {
  if (selectedCount === 0) return null

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-200 px-2 text-xs">
      <div className="flex items-center gap-3">
        <span className="font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? 'row' : 'rows'} selected
        </span>

        {bulkActions?.map((action) => {
          const isDanger = action.variant === 'danger'
          return (
            <Button
              key={action.id}
              type={isDanger ? 'danger' : 'default'}
              size="tiny"
              icon={action.icon}
              onClick={() => action.onClick(selectedRows)}
            >
              {action.label}
            </Button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className={cn(
          'flex h-6 items-center gap-1 rounded px-2 text-xs',
          'text-foreground-light hover:text-foreground hover:bg-surface-300 transition-colors'
        )}
      >
        <X className="h-3 w-3" />
        Clear
      </button>
    </div>
  )
}
