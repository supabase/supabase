import { Check, GripVertical, Lock, Settings2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { DragOverEvent, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SELECT_COLUMN_KEY } from 'components/grid/constants'
import { useTableColumnOrder } from 'components/grid/hooks/useTableColumnOrder'
import { useTableColumnVisibility } from 'components/grid/hooks/useTableColumnVisibility'
import {
  Sortable,
  SortableDragHandle as SortableDragHandlePrimitive,
} from 'components/ui/Sortable/sortable'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import {
  Button,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  CommandSeparator_Shadcn_ as CommandSeparator,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'

interface CommonColumnInfo {
  id: string
  name: string
  isFrozenOrPk: boolean
}

interface BaseColumnItemProps {
  column: CommonColumnInfo
  isVisible: boolean
  onSelect: (id: string) => void
}

// base component for each Column item
// used for pinned columns and draggable overlay
function PinnedColumnItem({ column, isVisible, onSelect }: BaseColumnItemProps) {
  return (
    <CommandItem
      key={column.id}
      value={column.name}
      onSelect={() => onSelect(column.id)}
      className="cursor-default opacity-75 p-0"
    >
      <div className="flex items-center justify-between w-full px-2 py-1.5">
        <div className="flex items-center">
          <div
            className={cn(
              'mr-2 flex h-4 w-4 items-center justify-center border-foreground-muted rounded border',
              isVisible ? 'bg-foreground text-background' : 'opacity-50 [&_svg]:invisible'
            )}
          >
            <Check className={cn('h-3 w-3')} strokeWidth={4} />
          </div>
          <span>{column.name}</span>
        </div>
        <Lock size={14} strokeWidth={1.5} className="text-foreground-lighter flex-shrink-0" />
      </div>
    </CommandItem>
  )
}

// drag handle for sortable columns
// used for Sortable dragging
function SortableDragHandle({ attributes, listeners }: { attributes: any; listeners: any }) {
  return (
    <SortableDragHandlePrimitive
      size="tiny"
      className="absolute right-2 size-5 text-foreground-lighter opacity-50 hover:opacity-100 cursor-grab data-[state=dragging]:cursor-grabbing p-1 flex-shrink-0"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={14} strokeWidth={1.5} />
    </SortableDragHandlePrimitive>
  )
}

/**
 * Renders a sortable column item with checkbox and custom drag handle.
 * Used as the base component for draggable columns in the list.
 */
function SortableItem({
  handle,
  column,
  isVisible,
  onSelect,
  setNodeRef,
  style,
}: BaseColumnItemProps & {
  // drag handle for sortable columns
  handle?: React.ReactNode
  // ref callback for sortable container
  setNodeRef?: React.RefCallback<HTMLDivElement>
  // CSS properties for sortable container
  style?: React.CSSProperties
}) {
  return (
    <div ref={setNodeRef} style={style} className={cn('rounded-md')}>
      <CommandItem
        key={column.id}
        value={column.name}
        onSelect={() => onSelect(column.id)}
        className="p-0 cursor-default data-[state=dragging]:bg-muted relative"
      >
        <div className="flex justify-between items-center w-full px-2 py-1.5">
          <div className="flex items-center flex-grow min-w-0">
            <div
              className={cn(
                'mr-2 flex h-4 w-4 items-center justify-center border-foreground-muted rounded border flex-shrink-0',
                isVisible ? 'bg-foreground text-background' : 'opacity-50 [&_svg]:invisible'
              )}
            >
              <Check className={cn('h-3 w-3')} strokeWidth={4} />
            </div>
            <span className="truncate">{column.name}</span>
          </div>
          {handle}
        </div>
      </CommandItem>
    </div>
  )
}

/**
 * Handles SortableItem with drag behaviour
 */
function DraggableColumnItem({ column, isVisible, onSelect }: BaseColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  })

  // CSS properties for sortable container
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  return (
    <SortableItem
      handle={<SortableDragHandle attributes={attributes} listeners={listeners} />}
      column={column}
      isVisible={isVisible}
      onSelect={onSelect}
      setNodeRef={setNodeRef}
      style={style}
    />
  )
}

/**
 * A component that renders a column visibility popover.
 * It allows users to show/hide columns and reorder them.
 *
 */
export const ColumnVisibilityPopover = () => {
  const snap = useTableEditorTableStateSnapshot()
  const { hiddenColumns, hideColumn, showColumn } = useTableColumnVisibility()
  const { columnOrder, moveColumn } = useTableColumnOrder()

  const [open, setOpen] = useState(false)
  const [frozenOrPkColumns, setFrozenOrPkColumns] = useState<CommonColumnInfo[]>([])
  const [draggableColumns, setDraggableColumns] = useState<CommonColumnInfo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentOverId, setCurrentOverId] = useState<string | null>(null)

  const sortableItemsIds = useMemo(() => draggableColumns.map((col) => col.id), [draggableColumns])

  useEffect(() => {
    const baseColumnsInput = snap.gridColumns ?? []
    const baseColumns = baseColumnsInput.filter((col) => {
      if (!col.key || col.key === SELECT_COLUMN_KEY) return false
      const effectiveName = typeof col.name === 'string' ? col.name : col.key
      return !!effectiveName
    })
    if (baseColumns.length === 0) {
      setFrozenOrPkColumns([])
      setDraggableColumns([])
      return
    }
    const frozen: CommonColumnInfo[] = []
    const draggable: CommonColumnInfo[] = []
    baseColumns.forEach((col) => {
      const id = col.key
      const name = typeof col.name === 'string' ? col.name : col.key
      const isPrimaryKey = (col as any).isPrimaryKey ?? false
      const isFrozen = (col as any).frozen ?? false
      const shouldBePinned = isPrimaryKey || isFrozen
      const info: CommonColumnInfo = { id, name, isFrozenOrPk: shouldBePinned }
      if (info.isFrozenOrPk) frozen.push(info)
      else draggable.push(info)
    })
    setFrozenOrPkColumns(frozen)
    let orderedDraggable = [...draggable]
    if (columnOrder.length > 0) {
      const orderMap = new Map(columnOrder.map((id, index) => [id, index]))
      const draggableInOrder = draggable.filter((col) => orderMap.has(col.id))
      const draggableNotInOrder = draggable.filter((col) => !orderMap.has(col.id))
      draggableInOrder.sort(
        (a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity)
      )
      orderedDraggable = [...draggableInOrder, ...draggableNotInOrder]
    }
    setDraggableColumns(orderedDraggable)
  }, [snap.gridColumns, columnOrder])

  const handleSelect = (columnId: string) => {
    const isHidden = hiddenColumns.has(columnId)
    if (isHidden) showColumn(columnId)
    else hideColumn(columnId)
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setCurrentOverId(null)
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over || !active.id) return

      const sourceId = active.id as string
      const targetId = over.id as string

      if (sourceId === targetId || targetId === currentOverId) {
        return
      }

      setCurrentOverId(targetId)

      const sourceItem = draggableColumns.find((c) => c.id === sourceId)
      const targetItem = draggableColumns.find((c) => c.id === targetId)

      if (sourceItem && targetItem && !sourceItem.isFrozenOrPk && !targetItem.isFrozenOrPk) {
        const sourceIndex = draggableColumns.findIndex((col) => col.id === sourceId)
        const targetIndex = draggableColumns.findIndex((col) => col.id === targetId)

        if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
          moveColumn(sourceId, targetId, sourceIndex, targetIndex)
        }
      }
    },
    [draggableColumns, moveColumn, currentOverId]
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    setCurrentOverId(null)
  }, [])

  if (frozenOrPkColumns.length === 0 && draggableColumns.length === 0) {
    return null
  }

  // Find the active column for the overlay
  const activeColumn = activeId ? draggableColumns.find((col) => col.id === activeId) : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="text"
              icon={<Settings2 size={14} strokeWidth={1.5} />}
              className="rounded px-1.5"
            />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Show/hide columns</TooltipContent>
      </Tooltip>
      <PopoverContent className="!p-0 w-60 relative" side="bottom" align="start" portal={true}>
        <Command>
          <CommandInput placeholder="Filter columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>
            {frozenOrPkColumns.length > 0 && (
              <CommandGroup heading="Pinned Columns">
                {frozenOrPkColumns.map((column) => {
                  const isVisible = !hiddenColumns.has(column.id)
                  return (
                    <PinnedColumnItem
                      key={column.id}
                      column={column}
                      isVisible={isVisible}
                      onSelect={handleSelect}
                    />
                  )
                })}
              </CommandGroup>
            )}

            {frozenOrPkColumns.length > 0 && draggableColumns.length > 0 && (
              <CommandSeparator className="!mx-0 w-full" />
            )}

            <Sortable
              value={draggableColumns}
              orientation="vertical"
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              overlay={
                activeColumn ? (
                  <SortableItem
                    column={activeColumn}
                    isVisible={!hiddenColumns.has(activeColumn.id)}
                    onSelect={handleSelect}
                  />
                ) : null
              }
            >
              {draggableColumns.length > 0 && (
                <CommandGroup heading="Columns">
                  <SortableContext items={sortableItemsIds} strategy={verticalListSortingStrategy}>
                    {draggableColumns.map((column) => {
                      const isVisible = !hiddenColumns.has(column.id)
                      return (
                        <DraggableColumnItem
                          key={column.id}
                          column={column}
                          isVisible={isVisible}
                          onSelect={handleSelect}
                        />
                      )
                    })}
                  </SortableContext>
                </CommandGroup>
              )}
            </Sortable>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
