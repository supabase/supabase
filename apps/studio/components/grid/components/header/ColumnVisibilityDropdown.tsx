import { useEffect, useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import type { XYCoord } from 'dnd-core'
import { Eye, EyeOff, GripVertical, Search } from 'lucide-react'
import {
  Button,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

interface DragItem {
  key: string
  index: number
}

interface ColumnItemProps {
  column: { key: string; name: string; visible: boolean }
  index: number
  moveColumn: (dragIndex: number, hoverIndex: number) => void
  toggleVisibility: (key: string) => void
}

const ColumnItem = ({ column, index, moveColumn, toggleVisibility }: ColumnItemProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'column-visibility-item',
    item: () => ({ key: column.key, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ handlerId }, drop] = useDrop({
    accept: 'column-visibility-item',
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

      moveColumn(dragIndex, hoverIndex)
      ;(item as DragItem).index = hoverIndex
    },
  })

  const opacity = isDragging ? 0.5 : 1
  drag(dragRef)
  drop(ref)

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{ opacity }}
      className="flex items-center gap-2 px-3 py-2 hover:bg-surface-200 rounded cursor-default group"
    >
      <div ref={dragRef} className="cursor-grab active:cursor-grabbing">
        <GripVertical size={16} className="text-foreground-lighter" />
      </div>
      <button
        onClick={() => toggleVisibility(column.key)}
        className="flex items-center gap-2 flex-1 text-left"
      >
        {column.visible ? (
          <Eye size={16} className="text-foreground-muted" />
        ) : (
          <EyeOff size={16} className="text-foreground-lighter" />
        )}
        <span className={cn('text-sm', !column.visible && 'text-foreground-lighter')}>
          {column.name}
        </span>
      </button>
    </div>
  )
}

export const ColumnVisibilityDropdown = () => {
  const snap = useTableEditorTableStateSnapshot()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [localColumns, setLocalColumns] = useState<
    Array<{ key: string; name: string; visible: boolean }>
  >([])

  // Get all columns except the select column and add column
  const dataColumns = snap.gridColumns.filter(
    (col) => col.key !== 'supabase-grid-select-row' && col.key !== 'supabase-grid-add-column'
  )

  useEffect(() => {
    if (open) {
      // Initialize local state when opening
      setLocalColumns(
        dataColumns.map((col) => ({
          key: col.key as string,
          name: col.name as string,
          visible: snap.columnVisibility?.[col.key as string] !== false,
        }))
      )
    }
  }, [open, dataColumns, snap.columnVisibility])

  const filteredColumns = localColumns.filter((col) =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const visibleCount = localColumns.filter((col) => col.visible).length
  const totalCount = localColumns.length

  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const dragColumn = localColumns[dragIndex]
    const newColumns = [...localColumns]
    newColumns.splice(dragIndex, 1)
    newColumns.splice(hoverIndex, 0, dragColumn)
    setLocalColumns(newColumns)
  }

  const toggleVisibility = (key: string) => {
    setLocalColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    )
  }

  const handleHideAll = () => {
    setLocalColumns((prev) => prev.map((col) => ({ ...col, visible: false })))
  }

  const handleApply = () => {
    // Update column order
    const orderedKeys = localColumns.map((col) => col.key)
    orderedKeys.forEach((key, index) => {
      const gridColumnIndex = snap.gridColumns.findIndex((col) => col.key === key)
      if (gridColumnIndex !== -1) {
        const targetIndex = index + 1 // +1 to account for select column
        if (gridColumnIndex !== targetIndex) {
          const toKey = snap.gridColumns[targetIndex]?.key
          if (toKey) {
            snap.moveColumn(key, toKey as string)
          }
        }
      }
    })

    // Update visibility
    const visibility: Record<string, boolean> = {}
    localColumns.forEach((col) => {
      visibility[col.key] = col.visible
    })
    snap.setColumnVisibility(visibility)

    setOpen(false)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="default" icon={<EyeOff size={16} strokeWidth={1.5} />}>
          Hide
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_
        portal
        className="w-[320px] p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex flex-col">
          {/* Search field */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
              />
              <Input
                placeholder="Search fields"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Column list */}
          <ScrollArea className="max-h-[300px]">
            <div className="py-2">
              {filteredColumns.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-foreground-lighter">
                  No columns found
                </div>
              ) : (
                filteredColumns.map((column, index) => (
                  <ColumnItem
                    key={column.key}
                    column={column}
                    index={index}
                    moveColumn={moveColumn}
                    toggleVisibility={toggleVisibility}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-3 py-3 border-t bg-surface-100">
            <span className="text-xs text-foreground-light">
              {visibleCount} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <Button type="link" size="tiny" onClick={handleHideAll}>
                Hide all
              </Button>
              <Button type="primary" size="tiny" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
