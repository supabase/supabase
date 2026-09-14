import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useCallback } from 'react'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItemWithColumn } from '../Storage.types'
import { useFileExplorerDnd } from './FileExplorerDnd'
import {
  canMoveItemsTo,
  getItemPath,
  getItemsToDrag,
  getRowDragId,
  getRowDropId,
  isWithinMoveLimit,
  toMoveCandidates,
} from './FileExplorerDnd.utils'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

interface UseFileExplorerRowDndParams {
  item: StorageItemWithColumn
  selectedItems: StorageItemWithColumn[]
  /** Whether the user is allowed to move items in this bucket */
  canMoveItems: boolean
}

/**
 * Makes a file explorer row draggable, and — when it's a folder — a target for other rows.
 *
 * Dragging a row that's part of the current selection drags the whole selection along with it.
 * Dragging is off while a move is running: only one batch goes to the API at a time.
 */
export const useFileExplorerRowDnd = ({
  item,
  selectedItems,
  canMoveItems,
}: UseFileExplorerRowDndParams) => {
  const { openedFolders, isMovingItems } = useStorageExplorerStateSnapshot()
  const { draggedItems } = useFileExplorerDnd()

  const itemPath = getItemPath(openedFolders, item)
  const isFolder = item.type === STORAGE_ROW_TYPES.FOLDER
  const isReady = item.status === STORAGE_ROW_STATUS.READY

  const canStartMove = canMoveItems && !isMovingItems
  const itemsToDrag = getItemsToDrag(openedFolders, item, selectedItems)
  const isDraggable = canStartMove && isReady && item.type !== STORAGE_ROW_TYPES.BUCKET

  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: getRowDragId(itemPath),
    disabled: !isDraggable,
    data: { items: itemsToDrag },
  })

  const { setNodeRef: setDropNodeRef, isOver } = useDroppable({
    id: getRowDropId(itemPath),
    disabled: !(canStartMove && isFolder && isReady),
    data: { path: itemPath },
  })

  const draggedItemPaths = toMoveCandidates(openedFolders, draggedItems)
  const canAcceptDraggedItems =
    isWithinMoveLimit(draggedItems.length) && canMoveItemsTo(draggedItemPaths, itemPath)
  const isPartOfDrag = draggedItemPaths.some((dragged) => dragged.path === itemPath)

  // The row is both the drag handle and the drop target, so both refs point at the same element.
  // Memoized because dnd-kit re-registers the node whenever the ref callback identity changes.
  const setRowNodeRef = useCallback(
    (element: HTMLElement | null) => {
      setNodeRef(element)
      setDropNodeRef(element)
    },
    [setNodeRef, setDropNodeRef]
  )

  return {
    setNodeRef: setRowNodeRef,
    /**
     * Spread onto the row. Only the pointer listeners: there's no keyboard sensor, so dnd-kit's
     * `attributes` would make every row a focusable button that does nothing when activated.
     */
    dragListeners: isDraggable ? listeners : undefined,
    /** True while this row is the grabbed row or part of the selection being dragged with it */
    isDragging: isDragging || isPartOfDrag,
    /** True while hovering a valid drop, so the folder can highlight itself */
    isDropTarget: isFolder && isOver && canAcceptDraggedItems,
  }
}
