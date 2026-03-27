'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'
import { AvatarCell } from './cells/AvatarCell'
import { BadgeCell } from './cells/BadgeCell'
import { BooleanCell } from './cells/BooleanCell'
import { CodeCell } from './cells/CodeCell'
import { DateCell } from './cells/DateCell'
import { JsonCell } from './cells/JsonCell'
import { NumberCell } from './cells/NumberCell'
import { TextCell } from './cells/TextCell'
import type { DataTableColumn, EditingCell } from './types'

interface DataTableCellProps<T = any> {
  column: DataTableColumn<T>
  row: T
  rowKey: string
  rowIndex: number
  isEditing: boolean
  onStartEdit: (cell: EditingCell) => void
  onCommitEdit: (rowKey: string, columnId: string, value: unknown) => void
  onCancelEdit: () => void
  editable: boolean
}

function renderDefaultCell<T>(col: DataTableColumn<T>, value: unknown): React.ReactNode {
  switch (col.type) {
    case 'number':
      return <NumberCell value={value} />
    case 'boolean':
      return <BooleanCell value={value} />
    case 'date':
      return <DateCell value={value} showTime={false} />
    case 'datetime':
      return <DateCell value={value} showTime />
    case 'badge':
      return <BadgeCell value={value} badgeMap={col.badgeMap} />
    case 'code':
      return <CodeCell value={value} copyable={col.copyable} />
    case 'json':
      return <JsonCell value={value} />
    case 'avatar':
      return <AvatarCell value={value} />
    default:
      if (col.copyable) return <CodeCell value={value} copyable />
      return <TextCell value={value} />
  }
}

export function DataTableCell<T extends Record<string, any>>({
  column,
  row,
  rowKey,
  rowIndex,
  isEditing,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  editable,
}: DataTableCellProps<T>) {
  const value = row[column.id]
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftValue, setDraftValue] = useState<string>('')

  useEffect(() => {
    if (isEditing) {
      setDraftValue(value === null || value === undefined ? '' : String(value))
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isEditing, value])

  const canEdit = editable && column.editable

  const handleDoubleClick = () => {
    if (canEdit) {
      onStartEdit({ rowKey, columnId: column.id })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onCommitEdit(rowKey, column.id, draftValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancelEdit()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      onCommitEdit(rowKey, column.id, draftValue)
    }
  }

  return (
    <td
      className={cn(
        'max-w-0 border-r border-secondary px-2 align-middle',
        'text-[13px] text-foreground',
        canEdit && 'cursor-text',
        column.frozen && 'sticky left-0 z-10 bg-inherit',
        column.align === 'right' && 'text-right',
        column.align === 'center' && 'text-center'
      )}
      style={{ minWidth: column.minWidth ?? 60 }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          onBlur={() => onCommitEdit(rowKey, column.id, draftValue)}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent font-inherit text-[13px] text-foreground outline-none"
          aria-label={`Edit ${column.name}`}
        />
      ) : (
        <div className="min-w-0 truncate">
          {column.renderCell
            ? column.renderCell(value, row, rowIndex)
            : renderDefaultCell(column, value)}
        </div>
      )}
    </td>
  )
}
