import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageColumn, StorageItem } from '../Storage.types'

/** The row the keyboard is on: a column in the stack, and a row within it */
export type ExplorerCursor = {
  columnIndex: number
  itemIndex: number
}

/** Stable row id, so a column can point `aria-activedescendant` at its active row */
export const getExplorerRowId = (columnIndex: number, itemIndex: number) =>
  `storage-explorer-row-${columnIndex}-${itemIndex}`

/** Clamps an index into a list, treating an empty list as index 0 */
export const clampIndex = (index: number, count: number) =>
  count === 0 ? 0 : Math.min(Math.max(index, 0), count - 1)

/**
 * Keeps the cursor on a row that exists. Refreshing a folder, collapsing a column or
 * switching view can all pull the row it was sitting on out from under it, and list view
 * only ever renders the deepest column, so that is the only place the cursor can be.
 */
export function resolveCursor(
  cursor: ExplorerCursor,
  columns: StorageColumn[],
  { isListView }: { isListView: boolean }
): ExplorerCursor {
  if (columns.length === 0) return { columnIndex: 0, itemIndex: 0 }

  const columnIndex = isListView
    ? columns.length - 1
    : clampIndex(cursor.columnIndex, columns.length)

  return { columnIndex, itemIndex: clampIndex(cursor.itemIndex, columns[columnIndex].items.length) }
}

/**
 * The row to start on when the keyboard arrives in a column: the folder that is currently
 * drilled into, so arrowing left out of a folder lands back on it, and falling back to the
 * first row when nothing below the column is open.
 */
export function getEntryItemIndex(
  column: StorageColumn | undefined,
  openedFolderName: string | undefined
): number {
  if (!column || !openedFolderName) return 0
  const openedIndex = column.items.findIndex((item) => item.name === openedFolderName)
  return openedIndex === -1 ? 0 : openedIndex
}

type StorageFolderItem = StorageItem & { type: STORAGE_ROW_TYPES.FOLDER }
type StorageFileItem = StorageItem & { type: STORAGE_ROW_TYPES.FILE }

/** A row that exists and is not still being created or uploaded */
export const isItemReady = (item: StorageItem | undefined): item is StorageItem =>
  item !== undefined && item.status !== STORAGE_ROW_STATUS.LOADING

export const isReadyFolder = (item: StorageItem | undefined): item is StorageFolderItem =>
  isItemReady(item) && item.type === STORAGE_ROW_TYPES.FOLDER

export const isReadyFile = (item: StorageItem | undefined): item is StorageFileItem =>
  isItemReady(item) && item.type === STORAGE_ROW_TYPES.FILE
