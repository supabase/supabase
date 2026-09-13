import { MAX_ITEMS_PER_MOVE, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'

/** A single object move, with both paths relative to the bucket root */
export interface ObjectMove {
  from: string
  to: string
}

/** An item considered for a move, reduced to what the validation rules need */
export interface MoveCandidate {
  path: string
  isFolder: boolean
}

/** Joins path segments, dropping the empty ones so that the bucket root stays an empty string */
export const joinPaths = (...segments: string[]) => segments.filter(Boolean).join('/')

/** Returns the directory a path sits in. The bucket root is an empty string */
export const getParentPath = (path: string) => path.split('/').slice(0, -1).join('/')

/**
 * Path of the directory that a column lists, relative to the bucket root.
 * Column 0 lists the bucket root, column 1 lists the first opened folder, and so on.
 */
export const getColumnPath = (openedFolders: StorageItem[], columnIndex: number) =>
  openedFolders
    .slice(0, columnIndex)
    .map((folder) => folder.name)
    .join('/')

/** Path of an item relative to the bucket root */
export const getItemPath = (openedFolders: StorageItem[], item: StorageItemWithColumn) =>
  joinPaths(getColumnPath(openedFolders, item.columnIndex), item.name)

export const toMoveCandidates = (
  openedFolders: StorageItem[],
  items: StorageItemWithColumn[]
): MoveCandidate[] =>
  items.map((item) => ({
    path: getItemPath(openedFolders, item),
    isFolder: item.type === STORAGE_ROW_TYPES.FOLDER,
  }))

/**
 * An item can move into a directory as long as it isn't already there, and — for folders —
 * as long as the destination isn't the folder itself or one of its descendants.
 */
export const canMoveItemTo = (item: MoveCandidate, destinationPath: string) => {
  if (destinationPath === getParentPath(item.path)) return false
  if (!item.isFolder) return true
  return destinationPath !== item.path && !destinationPath.startsWith(`${item.path}/`)
}

export const canMoveItemsTo = (items: MoveCandidate[], destinationPath: string) =>
  items.length > 0 && items.every((item) => canMoveItemTo(item, destinationPath))

/** Folders count as one item here — what they hold is only known once they're expanded */
export const isWithinMoveLimit = (count: number) => count <= MAX_ITEMS_PER_MOVE

/**
 * Maps every object within a folder to its destination, preserving the structure beneath it.
 * Storage has no notion of a folder, so moving one means moving each object it holds.
 */
export const getFolderObjectMoves = ({
  folderPath,
  destinationPath,
  objects,
}: {
  folderPath: string
  destinationPath: string
  objects: { prefix: string; name: string }[]
}): ObjectMove[] => {
  const folderName = folderPath.split('/').pop() ?? folderPath
  const destinationFolderPath = joinPaths(destinationPath, folderName)

  return objects.map(({ prefix, name }) => {
    const from = joinPaths(prefix, name)
    const relativePath = from.slice(folderPath.length + 1)
    return { from, to: joinPaths(destinationFolderPath, relativePath) }
  })
}

const ROW_DRAG_ID_PREFIX = 'storage-row-drag:'
const ROW_DROP_ID_PREFIX = 'storage-row-drop:'
const COLUMN_DROP_ID_PREFIX = 'storage-column-drop:'

/** Item paths are unique within a bucket, which makes them stable ids across re-renders */
export const getRowDragId = (itemPath: string) => `${ROW_DRAG_ID_PREFIX}${itemPath}`
export const getRowDropId = (itemPath: string) => `${ROW_DROP_ID_PREFIX}${itemPath}`
export const getColumnDropId = (columnIndex: number) => `${COLUMN_DROP_ID_PREFIX}${columnIndex}`

export const isRowDropId = (id: string | number) => String(id).startsWith(ROW_DROP_ID_PREFIX)
