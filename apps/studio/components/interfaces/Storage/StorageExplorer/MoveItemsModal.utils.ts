import { STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import type { StorageFolder } from '@/data/storage/bucket-folders-query'

/** Maximum number of folders rendered in the search results list */
export const MAX_FOLDER_SEARCH_RESULTS = 100

/**
 * Returns the folder each item currently lives in, derived from the folders that were opened
 * to reach it. Items selected across several columns can have different source folders.
 */
export function getSourcePaths(
  items: StorageItemWithColumn[],
  openedFolders: readonly StorageItem[]
): string[] {
  const paths = items.map((item) =>
    openedFolders
      .slice(0, item.columnIndex)
      .map((folder) => folder.name)
      .join('/')
  )
  return Array.from(new Set(paths))
}

/**
 * True when every item is already in `destinationPath`, which would make the move a no-op.
 */
export function isSameAsSourcePath(sourcePaths: string[], destinationPath: string): boolean {
  return sourcePaths.length === 1 && sourcePaths[0] === destinationPath
}

/**
 * Human readable name for the folder items are being moved into. The bucket name stands in for
 * the root of the bucket, which has no folder name of its own.
 */
export function getDestinationName(bucketName: string, pathSegments: string[]): string {
  return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : bucketName
}

/**
 * Full destination path including the bucket, for display only. Moves are relative to the
 * bucket, so the bucket name is never part of the path sent to the API.
 */
export function getDestinationLabel(bucketName: string, pathSegments: string[]): string {
  return [bucketName, ...pathSegments].join('/')
}

/**
 * Folders whose name matches `searchString`, ordered by how closely they match: exact name
 * first, then names starting with the search string, then the rest. Capped at
 * `MAX_FOLDER_SEARCH_RESULTS` so a broad search can't render thousands of rows.
 */
export function filterFoldersBySearch(
  folders: StorageFolder[],
  searchString: string
): StorageFolder[] {
  const query = searchString.trim().toLowerCase()
  if (query.length === 0) return []

  const scored = folders
    .map((folder) => {
      const name = folder.name.toLowerCase()
      if (name === query) return { folder, score: 0 }
      if (name.startsWith(query)) return { folder, score: 1 }
      if (name.includes(query)) return { folder, score: 2 }
      if (folder.path.toLowerCase().includes(query)) return { folder, score: 3 }
      return undefined
    })
    .filter((match) => match !== undefined)

  return scored
    .sort((a, b) => a.score - b.score || a.folder.path.localeCompare(b.folder.path))
    .slice(0, MAX_FOLDER_SEARCH_RESULTS)
    .map((match) => match.folder)
}

/**
 * Sorts folders ahead of files so that the folders you can navigate into are always at the top
 * of the picker, and files (which are only there for context) sink to the bottom.
 */
export function sortFoldersFirst<T extends { type: STORAGE_ROW_TYPES }>(items: T[]): T[] {
  const folders = items.filter((item) => item.type === STORAGE_ROW_TYPES.FOLDER)
  const rest = items.filter((item) => item.type !== STORAGE_ROW_TYPES.FOLDER)
  return [...folders, ...rest]
}

/**
 * Copy for the dialog title, which names what is being moved rather than where it's going.
 */
export function getMoveItemsTitle(items: StorageItemWithColumn[]): string {
  if (items.length === 1) return `Move ${items[0].name}`
  return `Move ${items.length} items`
}
