import { ArrowDown, ArrowUp, ChevronDown, Copy, Edit, Eye, Lock, Trash, Unlock } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import type { CalculatedColumn } from 'react-data-grid'
import { toast } from 'sonner'
import {
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useTableSort } from '@/components/grid/hooks/useTableSort'
import type { Sort } from '@/components/grid/types'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import {
  TableEditorTableStateContext,
  useTableEditorTableStateSnapshot,
} from '@/state/table-editor-table'

interface ColumnMenuProps {
  column: CalculatedColumn<any, unknown>
  isEncrypted?: boolean
}

export const ColumnMenu = ({ column, isEncrypted }: ColumnMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const state = useContext(TableEditorTableStateContext)
  const { sorts, addOrUpdateSort, removeSort } = useTableSort()
  const [tempRevealTimeouts, setTempRevealTimeouts] = useState<Map<string, NodeJS.Timeout>>(
    new Map()
  )

  const columnKey = column.key
  const columnName = column.name as string

  function onFreezeColumn() {
    snap.freezeColumn(columnKey)
  }

  function onUnfreezeColumn() {
    snap.unfreezeColumn(columnKey)
  }

  function onEditColumn() {
    const pgColumn = snap.originalTable.columns.find((c) => c.name === column.name)
    if (pgColumn) {
      tableEditorSnap.onEditColumn(pgColumn)
    }
  }

  function onDeleteColumn() {
    const pgColumn = snap.originalTable.columns.find((c) => c.name === column.name)
    if (pgColumn) {
      tableEditorSnap.onDeleteColumn(pgColumn)
    }
  }

  useEffect(() => {
    return () => {
      tempRevealTimeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [tempRevealTimeouts])

  function onToggleSensitiveData() {
    const isMasked = snap.sensitiveDataColumns.has(columnKey)
    const isTemporarilyRevealed = snap.temporarilyRevealedColumns.has(columnKey)

    if (isMasked && !isTemporarilyRevealed) {
      // Temporarily reveal for 5 seconds (don't persist)
      const existingTimeout = tempRevealTimeouts.get(columnKey)
      if (existingTimeout) clearTimeout(existingTimeout)

      state.temporarilyRevealedColumns.add(columnKey)

      const timeout = setTimeout(() => {
        state.temporarilyRevealedColumns.delete(columnKey)
        setTempRevealTimeouts((prev) => {
          const next = new Map(prev)
          next.delete(columnKey)
          return next
        })
      }, 5000)

      setTempRevealTimeouts((prev) => new Map(prev).set(columnKey, timeout))
      toast.info('Data will be hidden again in 5 seconds')
    } else {
      // Column is being revealed (either temp or persistent), toggle persistent mask
      const existingTimeout = tempRevealTimeouts.get(columnKey)
      if (existingTimeout) clearTimeout(existingTimeout)

      state.toggleSensitiveDataColumn(columnKey)

      state.temporarilyRevealedColumns.delete(columnKey)
      setTempRevealTimeouts((prev) => {
        const next = new Map(prev)
        next.delete(columnKey)
        return next
      })
    }
  }

  function onSortColumn(ascending: boolean) {
    if (!columnKey) return
    const currentSort = sorts.find((s) => s.column === columnKey)

    if (currentSort && currentSort.ascending === ascending) {
      // Clicked the currently active sort: Remove it
      removeSort(columnKey)
    } else {
      // Clicked the inactive sort or column wasn't sorted: Add or update it
      addOrUpdateSort(columnKey, ascending)
    }
  }

  function renderMenu() {
    const currentSort: Sort | undefined = sorts.find((s) => s.column === columnKey)

    return (
      <>
        <DropdownMenuItem
          className={cn(
            'space-x-2',
            currentSort?.ascending && 'bg-surface-200 dark:bg-surface-400 text-foreground'
          )}
          onClick={() => onSortColumn(true)}
        >
          <ArrowUp size={14} strokeWidth={currentSort?.ascending ? 3 : 1.5} />
          <span>Sort Ascending</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn(
            'space-x-2',
            currentSort &&
              !currentSort.ascending &&
              'bg-surface-200 dark:bg-surface-400 text-foreground'
          )}
          onClick={() => onSortColumn(false)}
        >
          <ArrowDown size={14} strokeWidth={currentSort && !currentSort.ascending ? 3 : 1.5} />
          <span>Sort Descending</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="space-x-2"
          onClick={(e) => {
            e.stopPropagation()
            copyToClipboard(columnName)
          }}
        >
          <Copy size={12} />
          <span>Copy name</span>
        </DropdownMenuItem>
        {snap.editable && (
          <>
            <Tooltip>
              <TooltipTrigger asChild className={`${isEncrypted ? 'opacity-50' : ''}`}>
                <DropdownMenuItem
                  className="space-x-2"
                  onClick={onEditColumn}
                  disabled={isEncrypted}
                >
                  <Edit size={14} strokeWidth={1.5} />
                  <span>Edit column</span>
                </DropdownMenuItem>
              </TooltipTrigger>
              {isEncrypted && (
                <TooltipContent side="bottom">Encrypted columns cannot be edited</TooltipContent>
              )}
            </Tooltip>
          </>
        )}
        <DropdownMenuItem
          className="space-x-2"
          onClick={column.frozen ? onUnfreezeColumn : onFreezeColumn}
        >
          {column.frozen ? (
            <>
              <Unlock size={14} strokeWidth={1.5} />
              <span>Unfreeze column</span>
            </>
          ) : (
            <>
              <Lock size={14} strokeWidth={1.5} />
              <span>Freeze column</span>
            </>
          )}
        </DropdownMenuItem>
        {snap.sensitiveDataColumns.has(columnKey) && (
          <DropdownMenuItem
            className="space-x-2"
            disabled={snap.temporarilyRevealedColumns.has(columnKey)}
            onClick={onToggleSensitiveData}
          >
            <Eye size={14} strokeWidth={1.5} />
            <span>
              {snap.temporarilyRevealedColumns.has(columnKey) ? 'Data revealed (5s)' : 'Show data'}
            </span>
          </DropdownMenuItem>
        )}
        {snap.editable && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="space-x-2" onClick={onDeleteColumn}>
              <Trash size={14} className="text-destructive" />
              <span>Delete column</span>
            </DropdownMenuItem>
          </>
        )}
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="opacity-50 flex"
            variant="text"
            style={{ padding: '3px' }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            aria-label={`Column ${column.name} actions`}
            icon={<ChevronDown />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          {renderMenu()}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
