import {
  DndContext,
  DragOverlay,
  getClientRect,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Active,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type MeasuringConfiguration,
  type Over,
} from '@dnd-kit/core'
import { createContext, useContext, useState, type PropsWithChildren } from 'react'

import { MAX_ITEMS_PER_MOVE, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItemWithColumn } from '../Storage.types'
import { StorageRowIcon } from '../StorageRowIcon'
import {
  canMoveItemsTo,
  isRowDropId,
  isWithinMoveLimit,
  toMoveCandidates,
} from './FileExplorerDnd.utils'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/**
 * Rows only start dragging past this many pixels, so that a plain click still opens a folder
 * or previews a file.
 */
const DRAG_ACTIVATION_DISTANCE = 5

/**
 * Rows live in a virtualized list that positions each one with `transform: translateY(...)`.
 * dnd-kit measures with `getTransformAgnosticClientRect` by default, which subtracts an
 * element's own transform — that collapses every row onto the top of the list, so the drag
 * preview starts in the wrong place and every row reports the same drop area. `getClientRect`
 * keeps the transform, which is the position the row actually occupies on screen.
 */
const MEASURING: MeasuringConfiguration = {
  draggable: { measure: getClientRect },
  droppable: { measure: getClientRect },
}

const FileExplorerDndContext = createContext<{ draggedItems: StorageItemWithColumn[] }>({
  draggedItems: [],
})

/** Items currently being dragged, so that every row can reflect the drag, not just the grabbed one */
export const useFileExplorerDnd = () => useContext(FileExplorerDndContext)

const getDraggedItems = (active: Active): StorageItemWithColumn[] => {
  const items = active.data.current?.items
  return Array.isArray(items) ? items : []
}

const getDropPath = (over: Over): string | undefined => {
  const path = over.data.current?.path
  return typeof path === 'string' ? path : undefined
}

/**
 * Rows are nested inside columns, so both report a hit. Dropping onto a folder should win over
 * dropping onto the column that folder is listed in.
 */
const preferRowOverColumn: CollisionDetection = (args) => {
  const collisions = pointerWithin(args)
  const rowCollision = collisions.find((collision) => isRowDropId(collision.id))
  return rowCollision ? [rowCollision] : collisions
}

const DragPreview = ({ items }: { items: StorageItemWithColumn[] }) => {
  const [firstItem] = items
  if (!firstItem) return null

  // The overlay is sized to the row being dragged, so the preview fills it to read as a copy
  return (
    <div className="flex h-full w-full items-center gap-x-2 rounded-md border border-strong bg-surface-200 px-2.5 opacity-90 shadow-md">
      <StorageRowIcon
        view={STORAGE_VIEWS.COLUMNS}
        status={firstItem.status}
        fileType={firstItem.type}
        mimeType={firstItem.metadata?.mimetype}
      />
      <span className="truncate text-sm">
        {items.length > 1 ? `${items.length} items` : firstItem.name}
      </span>
      {!isWithinMoveLimit(items.length) && (
        <span className="ml-auto shrink-0 text-xs text-destructive-600">
          Max {MAX_ITEMS_PER_MOVE} items
        </span>
      )}
    </div>
  )
}

/**
 * Wires up dragging items within the file explorer to move them between folders.
 *
 * Dragging is pointer driven, which leaves the browser's own file drag events free for uploads.
 * There's no keyboard equivalent — the "Move" action in the row menu covers that.
 */
export const FileExplorerDndProvider = ({ children }: PropsWithChildren) => {
  const { openedFolders, moveItems } = useStorageExplorerStateSnapshot()
  const [draggedItems, setDraggedItems] = useState<StorageItemWithColumn[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE } })
  )

  const onDragStart = (event: DragStartEvent) => {
    setDraggedItems(getDraggedItems(event.active))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedItems([])
    if (!over) return

    const items = getDraggedItems(active)
    const destinationPath = getDropPath(over)
    if (destinationPath === undefined) return
    if (!canMoveItemsTo(toMoveCandidates(openedFolders, items), destinationPath)) return

    moveItems(items, destinationPath)
  }

  return (
    <DndContext
      sensors={sensors}
      measuring={MEASURING}
      collisionDetection={preferRowOverColumn}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggedItems([])}
    >
      <FileExplorerDndContext.Provider value={{ draggedItems }}>
        {children}
        <DragOverlay dropAnimation={null} className="pointer-events-none">
          {draggedItems.length > 0 && <DragPreview items={draggedItems} />}
        </DragOverlay>
      </FileExplorerDndContext.Provider>
    </DndContext>
  )
}
