import { ChevronDown, Edit, Lock, Trash, Unlock } from 'lucide-react'
import type { CalculatedColumn } from 'react-data-grid'

import { useTableEditorStateSnapshot } from 'state/table-editor'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
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

  const columnKey = column.key

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

  function renderMenu() {
    return (
      <>
        {snap.editable && (
          <Tooltip>
            <TooltipTrigger asChild className={`${isEncrypted ? 'opacity-50' : ''}`}>
              <DropdownMenuItem className="space-x-2" onClick={onEditColumn} disabled={isEncrypted}>
                <Edit size={14} />
                <p>Edit column</p>
              </DropdownMenuItem>
            </TooltipTrigger>
            {isEncrypted && (
              <TooltipContent side="bottom">Encrypted columns cannot be edited</TooltipContent>
            )}
          </Tooltip>
        )}
        <DropdownMenuItem
          className="space-x-2"
          onClick={column.frozen ? onUnfreezeColumn : onFreezeColumn}
        >
          {column.frozen ? (
            <>
              <Unlock size={14} />
              <p>Unfreeze column</p>
            </>
          ) : (
            <>
              <Lock size={14} />
              <p>Freeze column</p>
            </>
          )}
        </DropdownMenuItem>
        {snap.editable && (
          <>
            <Separator />
            <DropdownMenuItem className="space-x-2" onClick={onDeleteColumn}>
              <Trash size={14} stroke="red" />
              <p>Delete column</p>
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
