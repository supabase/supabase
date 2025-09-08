import { useEffect, useState } from 'react'
import { useDragLayer } from 'react-dnd'
import { Checkbox, cn } from 'ui'
import { StorageItemWithColumn } from '../Storage.types'

interface ItemPosition {
  item: StorageItemWithColumn
  rect: DOMRect
  isOrigin: boolean
}

const DragPreview = ({ itemPositions }: { itemPositions: ItemPosition[] }) => {
  if (itemPositions.length === 0) return null

  // Find the origin item (the one that was clicked to start the drag)
  const originItem = itemPositions.find((pos) => pos.isOrigin)
  const originRect = originItem?.rect

  return (
    <div className="pointer-events-none">
      {itemPositions.map((itemPos, index) => {
        // Calculate the offset of this item relative to the origin item
        const offsetFromOrigin = originRect
          ? {
              x: itemPos.rect.left - originRect.left,
              y: itemPos.rect.top - originRect.top,
            }
          : { x: 0, y: 0 }

        return (
          <div
            key={`${itemPos.item.id}-${index}`}
            className={cn(
              'storage-row opacity-90 group flex gap-0.5 flex-1 min-h-[38px] items-center py-1 px-2 text-foreground-muted',
              'bg-surface-200 rounded-none shadow-sm border border-border'
            )}
            style={{
              position: 'absolute',
              left: offsetFromOrigin.x,
              top: offsetFromOrigin.y,
              width: itemPos.rect.width,
              minWidth: '200px',
              zIndex: itemPos.isOrigin ? 1000 : 999 - index,
            }}
          >
            <Checkbox label="" className="opacity-30" checked={true} />
            <span className="text-sm truncate">{itemPos.item.name}</span>
          </div>
        )
      })}
    </div>
  )
}

export const CustomDragLayer = () => {
  const { isDragging, item, currentOffset, initialOffset, differenceFromInitialOffset } =
    useDragLayer((monitor) => ({
      item: monitor.getItem(),
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getClientOffset(),
      initialOffset: monitor.getInitialClientOffset(),
      differenceFromInitialOffset: monitor.getDifferenceFromInitialOffset(),
    }))

  const [itemPositions, setItemPositions] = useState<ItemPosition[]>([])

  // Gather positions of all selected items when drag starts
  useEffect(() => {
    if (isDragging && item?.type === 'multi-item' && item?.items?.length) {
      const positions: ItemPosition[] = []

      // Find all storage-row elements in the DOM and match them to selected items
      const storageRows = document.querySelectorAll('[data-item-name]')

      item.items.forEach((selectedItem: StorageItemWithColumn) => {
        // Find the DOM element for this item
        const element = Array.from(storageRows).find(
          (row) =>
            row.getAttribute('data-item-name') === selectedItem.name &&
            row.getAttribute('data-item-type') === selectedItem.type.toLowerCase()
        ) as HTMLElement

        if (element) {
          const rect = element.getBoundingClientRect()
          positions.push({
            item: selectedItem,
            rect: rect,
            isOrigin: selectedItem.id === item.draggedFromElement?.itemId,
          })
        }
      })

      setItemPositions(positions)
    } else {
      setItemPositions([])
    }
  }, [isDragging, item])

  if (!isDragging || !currentOffset || !initialOffset || !differenceFromInitialOffset) {
    return null
  }

  // Only show custom drag layer for multi-item drags
  if (item?.type !== 'multi-item' || !item?.items?.length || itemPositions.length === 0) {
    return null
  }

  // Use the actual position from the dragged element if available
  const originRect = item.draggedFromElement?.rect
  const baseX = originRect ? originRect.left : initialOffset.x
  const baseY = originRect ? originRect.top : initialOffset.y

  // Position relative to the original item position with current mouse movement
  const transform = `translate(${baseX + differenceFromInitialOffset.x}px, ${baseY + differenceFromInitialOffset.y}px)`

  return (
    <div
      className="fixed top-0 left-0 z-50 pointer-events-none"
      style={{
        transform,
      }}
    >
      <div className="relative">
        <DragPreview itemPositions={itemPositions} />
      </div>
    </div>
  )
}
