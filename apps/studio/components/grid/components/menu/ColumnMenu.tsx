import type { Sort } from 'components/grid/types'
import { ArrowDown, ArrowUp, ChevronDown, Edit, Lock, Trash, Unlock } from 'lucide-react'
import type { CalculatedColumn } from 'react-data-grid'

import { useTableSort } from 'components/grid/hooks/useTableSort'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface ColumnMenuProps {
  column: CalculatedColumn<any, unknown>
  isEncrypted?: boolean
}

const ColumnMenu = ({ column, isEncrypted }: ColumnMenuProps) => {
  const tableEditorSnap = useTableEditorStateSnapshot()
  const snap = useTableEditorTableStateSnapshot()
  const { sorts, addOrUpdateSort, removeSort } = useTableSort()

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
        {snap.editable && (
          <>
            <DropdownMenuSeparator />
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
            type="text"
            style={{ padding: '3px' }}
            onClick={(e) => {
              e.stopPropagation()
            }}
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

export default ColumnMenu
