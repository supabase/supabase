import type { DragItem, Sort } from 'components/grid/types'
import type { XYCoord } from 'dnd-core'
import { Menu, X } from 'lucide-react'
import { memo, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button, Switch } from 'ui'

export interface SortRowProps {
  index: number
  columnName: string
  sort: Sort
  onDelete: (columnName: string) => void
  onToggle: (columnName: string, ascending: boolean) => void
  onDrag: (dragIndex: number, hoverIndex: number) => void
}

const SortRow = ({ index, columnName, sort, onDelete, onToggle, onDrag }: SortRowProps) => {
  const snap = useTableEditorTableStateSnapshot()
  const column = snap.table.columns.find((x) => x.name === columnName)

  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'sort-row',
    item: () => {
      return { key: columnName, index }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ handlerId }, drop] = useDrop({
    accept: 'sort-row',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = (item as DragItem).index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveSort(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      ;(item as DragItem).index = hoverIndex
    },
  })

  const moveSort = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex == hoverIndex) return
    onDrag(dragIndex, hoverIndex)
  }

  const opacity = isDragging ? 0 : 1
  drag(drop(ref))

  if (!column) return null

  return (
    <div
      className="flex items-center gap-3 px-3"
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <span className="transition-color text-foreground-lighter hover:text-foreground-light">
        <Menu strokeWidth={2} size={16} />
      </span>
      <div className="grow">
        <span className="flex grow items-center gap-1 truncate text-sm text-foreground">
          <span className="text-xs text-foreground-lighter">
            {index > 0 ? 'then by' : 'sort by'}
          </span>
          <span className="text-xs">{column.name}</span>
        </span>
      </div>
      <div className="flex items-center gap-x-1.5">
        <label className="text-xs text-foreground-lighter">ascending:</label>
        <Switch
          defaultChecked={sort.ascending}
          onCheckedChange={(e: boolean) => onToggle(columnName, e)}
        />
      </div>
      <Button
        icon={<X strokeWidth={1.5} />}
        size="tiny"
        type="text"
        className="w-7"
        onClick={() => onDelete(columnName)}
      />
    </div>
  )
}
export default memo(SortRow)
