import { useParams } from 'common'
import { Settings2, Check, GripVertical, Lock } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback, DragEvent } from 'react'

import {
  Button,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  Command_Shadcn_ as Command,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandGroup_Shadcn_ as CommandGroup,
  CommandInput_Shadcn_ as CommandInput,
  CommandItem_Shadcn_ as CommandItem,
  CommandList_Shadcn_ as CommandList,
  CommandSeparator_Shadcn_ as CommandSeparator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'

import { Sortable, SortableItem, SortableDragHandle } from 'components/ui/Sortable/sortable'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { useTableColumnVisibility } from 'components/grid/hooks/useTableColumnVisibility'
import { useTableColumnOrder } from 'components/grid/hooks/useTableColumnOrder'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

interface CommonColumnInfo {
  id: string
  name: string
  isFrozenOrPk: boolean
}

export const ColumnVisibility = () => {
  const snap = useTableEditorTableStateSnapshot()
  const { hiddenColumns, hideColumn, showColumn } = useTableColumnVisibility()
  const { columnOrder, setColumnOrder } = useTableColumnOrder()

  const [open, setOpen] = useState(false)
  const [frozenOrPkColumns, setFrozenOrPkColumns] = useState<CommonColumnInfo[]>([])
  const [draggableColumns, setDraggableColumns] = useState<CommonColumnInfo[]>([])
  const [draggedItem, setDraggedItem] = useState<CommonColumnInfo | null>(null)

  const sortableItems = useMemo(
    () => draggableColumns.map((col) => ({ id: col.id })),
    [draggableColumns]
  )

  useEffect(() => {
    console.log('--- ColumnVisibility useEffect --- START ---')
    const baseColumns = snap.table?.columns ?? []
    console.log(
      'useEffect: baseColumns:',
      baseColumns.map((c) => c.name)
    )
    console.log('useEffect: columnOrder from hook:', columnOrder)

    if (baseColumns.length === 0) {
      console.log('useEffect: No base columns, resetting state.')
      setFrozenOrPkColumns([])
      setDraggableColumns([])
      console.log('--- ColumnVisibility useEffect --- END ---')
      return
    }

    const frozen: CommonColumnInfo[] = []
    const draggable: CommonColumnInfo[] = []
    baseColumns.forEach((col) => {
      const id = col.name
      const info: CommonColumnInfo = { id, name: col.name, isFrozenOrPk: col.isPrimaryKey ?? false }
      if (info.isFrozenOrPk) {
        frozen.push(info)
      } else {
        draggable.push(info)
      }
    })
    console.log(
      'useEffect: Partitioned Frozen:',
      frozen.map((c) => c.id)
    )
    console.log(
      'useEffect: Partitioned Draggable:',
      draggable.map((c) => c.id)
    )

    setFrozenOrPkColumns(frozen)

    let finalDraggableOrder = [...draggable]
    if (columnOrder.length > 0) {
      console.log('useEffect: Applying custom order...')
      const orderMap = new Map(columnOrder.map((id, index) => [id, index]))
      const columnsInOrderSet = new Set(columnOrder)

      const orderedDraggable: CommonColumnInfo[] = []
      const unorderedDraggable: CommonColumnInfo[] = []
      draggable.forEach((col) => {
        if (columnsInOrderSet.has(col.id)) {
          orderedDraggable.push(col)
        } else {
          unorderedDraggable.push(col)
        }
      })
      console.log(
        'useEffect: Draggable split - Ordered:',
        orderedDraggable.map((c) => c.id)
      )
      console.log(
        'useEffect: Draggable split - Unordered:',
        unorderedDraggable.map((c) => c.id)
      )

      orderedDraggable.sort((a, b) => {
        const posA = orderMap.get(a.id) ?? Infinity
        const posB = orderMap.get(b.id) ?? Infinity
        return posA - posB
      })
      console.log(
        'useEffect: Draggable after sorting ordered part:',
        orderedDraggable.map((c) => c.id)
      )

      finalDraggableOrder = [...orderedDraggable, ...unorderedDraggable]
    } else {
      console.log('useEffect: No custom order found, using natural draggable order.')
    }

    console.log(
      'useEffect: Setting final draggable order:',
      finalDraggableOrder.map((c) => c.id)
    )
    setDraggableColumns(finalDraggableOrder)
    console.log('--- ColumnVisibility useEffect --- END ---')
  }, [snap.table?.columns, columnOrder])

  const handleSelect = (columnId: string) => {
    const isHidden = hiddenColumns.has(columnId)
    if (isHidden) {
      showColumn(columnId)
    } else {
      hideColumn(columnId)
    }
  }

  const handleOrderChange = useCallback(
    (orderedItems: { id: string }[]) => {
      const newDraggableOrder = orderedItems
        .map((item) => draggableColumns.find((col) => col.id === item.id)!)
        .filter(Boolean)

      setDraggableColumns(newDraggableOrder)

      const fullNewOrder = [
        ...frozenOrPkColumns.map((col) => col.id),
        ...newDraggableOrder.map((col) => col.id),
      ]
      setColumnOrder(fullNewOrder)
    },
    [draggableColumns, frozenOrPkColumns, setColumnOrder]
  )

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, item: CommonColumnInfo) => {
    if (item.isFrozenOrPk) {
      e.preventDefault()
      return
    }
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, targetItem: CommonColumnInfo) => {
      e.preventDefault()
      if (!draggedItem || targetItem.isFrozenOrPk || draggedItem.isFrozenOrPk) {
        setDraggedItem(null)
        return
      }
      if (draggedItem.id === targetItem.id) {
        setDraggedItem(null)
        return
      }

      const currentIndex = draggableColumns.findIndex(
        (item: CommonColumnInfo) => item.id === draggedItem.id
      )
      const targetIndex = draggableColumns.findIndex(
        (item: CommonColumnInfo) => item.id === targetItem.id
      )

      if (currentIndex === -1 || targetIndex === -1) {
        setDraggedItem(null)
        return
      }

      const newOrderedDraggable = [...draggableColumns]
      newOrderedDraggable.splice(currentIndex, 1)
      newOrderedDraggable.splice(targetIndex, 0, draggedItem)

      handleOrderChange(newOrderedDraggable)

      setDraggedItem(null)
    },
    [draggableColumns, draggedItem, handleOrderChange]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null)
  }, [])

  if (frozenOrPkColumns.length === 0 && draggableColumns.length === 0) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
      <PopoverContent className="p-0 w-60" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Filter columns..." />
          <CommandList>
            <CommandEmpty>No columns found.</CommandEmpty>

            {frozenOrPkColumns.length > 0 && (
              <CommandGroup heading="Pinned Columns">
                {frozenOrPkColumns.map((column) => {
                  const isVisible = !hiddenColumns.has(column.id)
                  return (
                    <CommandItem
                      key={column.id}
                      value={column.name}
                      onSelect={() => handleSelect(column.id)}
                      className="cursor-default opacity-75 p-0"
                    >
                      <div className="flex items-center justify-between w-full px-2 py-1.5">
                        <div className="flex items-center">
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center border-foreground-muted rounded border',
                              isVisible
                                ? 'bg-foreground text-background'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <Check className={cn('h-3 w-3')} strokeWidth={4} />
                          </div>
                          <span>{column.name}</span>
                        </div>
                        <Lock
                          size={14}
                          strokeWidth={1.5}
                          className="text-foreground-lighter flex-shrink-0"
                        />
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {frozenOrPkColumns.length > 0 && draggableColumns.length > 0 && <CommandSeparator />}

            {draggableColumns.length > 0 && (
              <CommandGroup heading="Columns">
                <Sortable
                  value={sortableItems}
                  onValueChange={handleOrderChange}
                  orientation="vertical"
                >
                  <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
                    {draggableColumns.map((column) => {
                      const isVisible = !hiddenColumns.has(column.id)
                      const isDraggable = true
                      return (
                        <SortableItem key={column.id} value={column.id} asChild>
                          <div
                            draggable={isDraggable}
                            onDragStart={(e) => handleDragStart(e, column)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              'cursor-grab rounded-md',
                              draggedItem?.id === column.id ? 'opacity-50' : ''
                            )}
                            style={{ touchAction: 'none' }}
                          >
                            <CommandItem
                              value={column.name}
                              onSelect={() => handleSelect(column.id)}
                              className="data-[state=dragging]:bg-muted p-0"
                            >
                              <div className="flex justify-between items-center w-full px-2 py-1.5">
                                <div className="flex items-center flex-grow min-w-0">
                                  <div
                                    className={cn(
                                      'mr-2 flex h-4 w-4 items-center justify-center border-foreground-muted rounded border flex-shrink-0',
                                      isVisible
                                        ? 'bg-foreground text-background'
                                        : 'opacity-50 [&_svg]:invisible'
                                    )}
                                  >
                                    <Check className={cn('h-3 w-3')} strokeWidth={4} />
                                  </div>
                                  <span className="truncate">{column.name}</span>
                                </div>
                                <SortableDragHandle
                                  size="tiny"
                                  className="size-5 text-foreground-lighter opacity-50 hover:opacity-100 cursor-grab data-[state=dragging]:cursor-grabbing p-1 flex-shrink-0"
                                >
                                  <GripVertical size={14} strokeWidth={1.5} />
                                </SortableDragHandle>
                              </div>
                            </CommandItem>
                          </div>
                        </SortableItem>
                      )
                    })}
                  </SortableContext>
                </Sortable>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
