'use client'

import { memo } from 'react'
import type { RenderCellProps } from 'react-data-grid'
import { cn } from 'ui'

import { cellKey, useDemoGridFocus } from './demoGridContext'
import type { UserRow } from './mockUserTableData'

type DemoGridCellProps = RenderCellProps<UserRow>

function DemoGridCellInner({ row, column }: DemoGridCellProps) {
  const focusedCells = useDemoGridFocus()
  const key = cellKey(row.id, column.key)
  const remoteFocus = focusedCells[key]
  const rawValue = row[column.key as keyof UserRow]
  const displayValue = rawValue === null || rawValue === undefined ? null : String(rawValue)

  const focusStyle = remoteFocus
    ? {
        boxShadow: `inset 0 0 0 1px ${remoteFocus.color}`,
        backgroundColor: `${remoteFocus.color}15`,
      }
    : undefined

  return (
    <div
      data-cell={`${row.id}:${column.key}`}
      className={cn(
        'sb-grid-text-editor__trigger h-full w-full select-none',
        remoteFocus && 'realtime-hero-cell--remote-focus'
      )}
      style={focusStyle}
    >
      {displayValue === null ? (
        <span className="null-value">NULL</span>
      ) : (
        <span className="truncate">{displayValue}</span>
      )}
      {remoteFocus && (
        <span
          className="realtime-hero-cell__editor-badge"
          style={{ backgroundColor: remoteFocus.color }}
        >
          {remoteFocus.name}
        </span>
      )}
    </div>
  )
}

export const DemoGridCell = memo(DemoGridCellInner)
