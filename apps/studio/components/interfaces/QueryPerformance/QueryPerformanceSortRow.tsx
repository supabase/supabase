// Create: QueryPerformanceSortRow.tsx
import type { XYCoord } from 'dnd-core'
import { Menu, X } from 'lucide-react'
import { memo, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'

import type { DragItem, Sort } from 'components/grid/types'
import { Button, Toggle } from 'ui'

const QUERY_PERFORMANCE_COLUMNS = [
  { name: 'query', dataType: 'text' },
  { name: 'rolname', dataType: 'text' },
  { name: 'total_time', dataType: 'numeric' },
  { name: 'prop_total_time', dataType: 'numeric' },
  { name: 'calls', dataType: 'numeric' },
  { name: 'avg_rows', dataType: 'numeric' },
  { name: 'max_time', dataType: 'numeric' },
  { name: 'mean_time', dataType: 'numeric' },
  { name: 'min_time', dataType: 'numeric' },
]

export interface QueryPerformanceSortRowProps {
  index: number
  columnName: string
  sort: Sort
  onDelete: (columnName: string) => void
  onToggle: (columnName: string, ascending: boolean) => void
  onDrag: (dragIndex: number, hoverIndex: number) => void
}

const QueryPerformanceSortRow = ({
  index,
  columnName,
  sort,
  onDelete,
  onToggle,
  onDrag,
}: QueryPerformanceSortRowProps) => {
  const column = QUERY_PERFORMANCE_COLUMNS.find((x) => x.name === columnName)

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

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      moveSort(dragIndex, hoverIndex)
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
          {column.name}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-foreground-lighter">ascending:</label>
        <Toggle
          size="tiny"
          layout="flex"
          defaultChecked={sort.ascending}
          // @ts-ignore
          onChange={(e: boolean) => onToggle(columnName, e)}
        />
      </div>
      <Button
        icon={<X strokeWidth={1.5} />}
        size="tiny"
        type="text"
        onClick={() => onDelete(columnName)}
      />
    </div>
  )
}

export default memo(QueryPerformanceSortRow)
