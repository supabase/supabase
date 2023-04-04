import * as React from 'react'
import { IconArrowRight, IconKey, IconLink, IconLock } from 'ui'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd'
import { XYCoord } from 'dnd-core'
import { useDispatch } from '../../store'
import { ColumnHeaderProps, ColumnType, DragItem, GridForeignKey } from '../../types'
import { ColumnMenu } from '../menu'
import { useTrackedState } from '../../store'
import { FOREIGN_KEY_DELETION_ACTION } from 'data/database/database-query-constants'
import { getForeignKeyDeletionAction } from 'components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  isEncrypted,
  format,
  foreignKey,
}: ColumnHeaderProps<R>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const columnIdx = column.idx
  const columnKey = column.key
  const columnFormat = getColumnFormat(columnType, format)
  const state = useTrackedState()
  const hoverValue = column.name as string

  // keep state.gridColumns' order in sync with data grid component
  if (state.gridColumns[columnIdx].key != columnKey) {
    dispatch({
      type: 'UPDATE_COLUMN_IDX',
      payload: { columnKey, columnIdx },
    })
  }

  const [{ isDragging }, drag] = useDrag({
    type: 'column-header',
    item: () => {
      return { key: columnKey, index: columnIdx }
    },
    canDrag: () => !column.frozen,
    collect: (monitor: any) => ({
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
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return
      }

      if (column.frozen) {
        return
      }

      const dragIndex = item.index
      const dragKey = item.key
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
      item.index = hoverIndex
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
                  <IconKey size="tiny" strokeWidth={2} />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">Primary key</span>
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
                <IconLock size="tiny" strokeWidth={2} />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">Encrypted column</span>
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
            <IconLink size="tiny" strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                  'border border-scale-200',
                ].join(' ')}
              >
                <div>
                  <p className="text-xs text-scale-1100">Foreign key relation:</p>
                  <div className="flex items-center space-x-1">
                    <p className="text-xs text-scale-1200">{name}</p>
                    <IconArrowRight size="tiny" strokeWidth={1.5} />
                    <p className="text-xs text-scale-1200">
                      {foreignKey?.targetTableSchema}.{foreignKey?.targetTableName}.
                      {foreignKey?.targetColumnName}
                    </p>
                  </div>
                  {foreignKey?.deletionAction !== FOREIGN_KEY_DELETION_ACTION.NO_ACTION && (
                    <p className="text-xs text-scale-1200 mt-1">
                      On delete: {getForeignKeyDeletionAction(foreignKey?.deletionAction)}
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
