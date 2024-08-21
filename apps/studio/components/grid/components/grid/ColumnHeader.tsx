import * as Tooltip from '@radix-ui/react-tooltip'
import type { XYCoord } from 'dnd-core'
import { ArrowRight, Key, Link, Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import { getForeignKeyCascadeAction } from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { useDispatch, useTrackedState } from '../../store/Store'
import type { ColumnHeaderProps, ColumnType, DragItem, GridForeignKey } from '../../types'
import { ColumnMenu } from '../menu'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  isEncrypted,
  format,
  foreignKey,
}: ColumnHeaderProps<R>) {
  const ref = useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const columnIdx = column.idx
  const columnKey = column.key
  const columnFormat = getColumnFormat(columnType, format)
  const state = useTrackedState()
  const hoverValue = column.name as string

  // keep state.gridColumns' order in sync with data grid component
  useEffect(() => {
    if (state.gridColumns[columnIdx].key != columnKey) {
      dispatch({
        type: 'UPDATE_COLUMN_IDX',
        payload: { columnKey, columnIdx },
      })
    }
  }, [columnKey, columnIdx, state.gridColumns])

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
      moveColumn(dragKey, hoverKey)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      ;(item as DragItem).index = hoverIndex
    },
  })

  const moveColumn = (fromKey: string, toKey: string) => {
    if (fromKey == toKey) return
    dispatch({
      type: 'MOVE_COLUMN',
      payload: { fromKey, toKey },
    })
  }

  const opacity = isDragging ? 0 : 1
  const cursor = column.frozen ? 'sb-grid-column-header--cursor' : ''
  drag(drop(ref))

  return (
    <div ref={ref} data-handler-id={handlerId} style={{ opacity }} className="w-full">
      <div className={`sb-grid-column-header ${cursor}`}>
        <div className="sb-grid-column-header__inner">
          {renderColumnIcon(columnType, { name: column.name as string, foreignKey })}
          {isPrimaryKey && (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <div className="sb-grid-column-header__inner__primary-key">
                  <Key size={14} strokeWidth={2} />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">Primary key</span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
          <span className="sb-grid-column-header__inner__name" title={hoverValue}>
            {column.name}
          </span>
          <span className="sb-grid-column-header__inner__format">{columnFormat}</span>
          {isEncrypted && (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Lock size={14} strokeWidth={2} />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">Encrypted column</span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
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
      return (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <Link size={14} strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <div>
                  <p className="text-xs text-foreground-light">Foreign key relation:</p>
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-foreground">{name}</p>
                    <ArrowRight size={14} strokeWidth={1.5} />
                    <p className="text-xs text-foreground">
                      {foreignKey?.targetTableSchema}.{foreignKey?.targetTableName}.
                      {foreignKey?.targetColumnName}
                    </p>
                  </div>
                  {foreignKey?.deletionAction !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                    <p className="text-xs text-foreground mt-1">
                      On delete: {getForeignKeyCascadeAction(foreignKey?.deletionAction)}
                    </p>
                  )}
                </div>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
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
