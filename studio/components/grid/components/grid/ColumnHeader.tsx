import * as React from 'react'
import { IconKey, IconLink } from '@supabase/ui'
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd'
import { XYCoord } from 'dnd-core'
import { useDispatch } from '../../store'
import { ColumnHeaderProps, ColumnType, DragItem } from '../../types'
import { ColumnMenu } from '../menu'
import { useTrackedState } from '../../store'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  format,
}: ColumnHeaderProps<R>) {
  const ref = React.useRef<HTMLDivElement>(null)
  const dispatch = useDispatch()
  const columnIdx = column.idx
  const columnKey = column.key
  const columnFormat = getColumnFormat(columnType, format)
  const state = useTrackedState()

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
          {renderColumnIcon(columnType)}
          {isPrimaryKey && (
            <div className="sb-grid-column-header__inner__primary-key">
              <IconKey size="tiny" strokeWidth={2} />
            </div>
          )}
          <span className="sb-grid-column-header__inner__name">{column.name}</span>
          <span className="sb-grid-column-header__inner__format">{columnFormat}</span>
        </div>
        <ColumnMenu column={column} />
      </div>
    </div>
  )
}

function renderColumnIcon(type: ColumnType) {
  switch (type) {
    case 'foreign_key':
      return (
        <div>
          <IconLink size="tiny" strokeWidth={2} />
        </div>
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
