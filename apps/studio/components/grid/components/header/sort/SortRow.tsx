import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { memo } from 'react'
import { Button, Switch } from 'ui'

import type { Sort } from '@/components/grid/types'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

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

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } =
    useSortable({
      id: columnName,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (!column) return null

  return (
    <div className="flex items-center gap-3 px-3" ref={setNodeRef} style={style}>
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="opacity-50 hover:opacity-100 transition cursor-grab text-foreground"
        type="button"
      >
        <GripVertical size={16} strokeWidth={1.5} />
      </button>
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
