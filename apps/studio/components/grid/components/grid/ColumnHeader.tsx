import type { XYCoord } from 'dnd-core'
import { ArrowRight, Key, Lightbulb, Link, Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import { getForeignKeyCascadeAction } from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  useColumnHasIndexSuggestion,
  useTableIndexAdvisor,
} from '../../context/TableIndexAdvisorContext'
import type { ColumnHeaderProps, ColumnType, DragItem, GridForeignKey } from '../../types'
import { ColumnMenu } from '../menu/ColumnMenu'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  isEncrypted,
  format,
  foreignKey,
  comment,
}: ColumnHeaderProps<R>) {
  const ref = useRef<HTMLDivElement>(null)
  const columnIdx = column.idx
  const columnKey = column.key
  const columnFormat = getColumnFormat(columnType, format)
  const snap = useTableEditorTableStateSnapshot()
  const hoverValue = column.name as string
  const hasIndexSuggestion = useColumnHasIndexSuggestion(column.name as string)
  const { openSheet } = useTableIndexAdvisor()

  // keep snap.gridColumns' order in sync with data grid component
  useEffect(() => {
    const snapGridColumnKey = snap.gridColumns[columnIdx]?.key

    if (snapGridColumnKey != columnKey) {
      snap.updateColumnIdx(columnKey, columnIdx)
    }
  }, [columnKey, columnIdx, snap.gridColumns])

  const [{ isDragging }, drag] = useDrag({
    type: 'column-header',
    item: () => {
      return { key: columnKey, index: columnIdx } as DragItem
    },
    canDrag: () => !column.frozen,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ handlerId }, drop] = useDrop({
    accept: 'column-header',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }

      if (column.frozen) {
        return
      }

      const dragIndex = (item as DragItem).index
      const dragKey = (item as DragItem).key
      const hoverIndex = columnIdx
      const hoverKey = columnKey

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get horizontal middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientX = (clientOffset as XYCoord).x - hoverBoundingRect.left

      // Only perform the move when the mouse has crossed half of the items width

      // Dragging left
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return
      }

      // Dragging right
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return
      }

      // Time to actually perform the action
      snap.moveColumn(dragKey, hoverKey)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      ;(item as DragItem).index = hoverIndex
    },
  })

  const opacity = isDragging ? 0 : 1
  const cursor = column.frozen ? 'sb-grid-column-header--cursor' : ''
  drag(drop(ref))

  return (
    <div ref={ref} data-handler-id={handlerId} style={{ opacity }} className="w-full">
      <div className={`sb-grid-column-header ${cursor}`}>
        <div className="sb-grid-column-header__inner">
          {renderColumnIcon(columnType, { name: column.name as string, foreignKey })}
          {isPrimaryKey && (
            <Tooltip>
              <TooltipTrigger>
                <div className="sb-grid-column-header__inner__primary-key">
                  <Key size={14} strokeWidth={2} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Primary key
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger>
              <span className="sb-grid-column-header__inner__name">{column.name}</span>
            </TooltipTrigger>
            {!!comment && (
              <TooltipContent side="bottom" className="max-w-xs text-center">
                {comment}
              </TooltipContent>
            )}
          </Tooltip>

          <span className="sb-grid-column-header__inner__format">
            {columnFormat}
            {columnFormat === 'bytea' ? ` (hex)` : ''}
          </span>
          {isEncrypted && (
            <Tooltip>
              <TooltipTrigger>
                <Lock size={14} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Encrypted column
              </TooltipContent>
            </Tooltip>
          )}
          {hasIndexSuggestion && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center"
                  onClick={() => openSheet(column.name as string)}
                >
                  <Lightbulb size={14} strokeWidth={2} className="!text-warning" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Index might improve performance. Click for details.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <ColumnMenu column={column} isEncrypted={isEncrypted} />
      </div>
    </div>
  )
}

function renderColumnIcon(
  type: ColumnType,
  columnMeta: { name?: string; foreignKey?: GridForeignKey }
) {
  const { name, foreignKey } = columnMeta
  switch (type) {
    case 'foreign_key':
      // [Joshen] Look into this separately but this should be a hover card instead
      return (
        <Tooltip>
          <TooltipTrigger>
            <Link size={14} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="font-normal">
              <p className="text-xs text-foreground-light">Foreign key relation:</p>
              <div className="flex items-center space-x-1">
                <p className="text-xs !text-foreground">{name}</p>
                <ArrowRight size={14} strokeWidth={1.5} className="!text-foreground-light" />
                <p className="text-xs !text-foreground">
                  {foreignKey?.targetTableSchema}.{foreignKey?.targetTableName}.
                  {foreignKey?.targetColumnName}
                </p>
              </div>
              {foreignKey?.updateAction !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                <p className="text-xs !text-foreground mt-1">
                  On update: {getForeignKeyCascadeAction(foreignKey?.updateAction)}
                </p>
              )}
              {foreignKey?.deletionAction !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                <p className="text-xs !text-foreground mt-1">
                  On delete: {getForeignKeyCascadeAction(foreignKey?.deletionAction)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    default:
      return null
  }
}

function getColumnFormat(type: ColumnType, format: string) {
  if (type == 'array') {
    return `${format.replace('_', '')}[]`
  } else return format
}
