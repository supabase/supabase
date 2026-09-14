import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import type { StorageFolder } from '@/data/storage/bucket-folders-query'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'

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
 * Narrows a listing to the folders in it. The picker only offers folders, so files are dropped
 * rather than shown as unselectable rows. Objects without an id are prefixes (folders).
 */
export function toFolders(objects: StorageObject[], parentPath: string): StorageFolder[] {
  return objects
    .filter((object) => !object.id)
    .map((object) => ({
      name: object.name,
      path: parentPath.length > 0 ? `${parentPath}/${object.name}` : object.name,
    }))
}

/**
 * Where a folder lives, for search results that span the whole bucket. The bucket name stands in
 * for the root, which has no path of its own.
 */
export function getParentPathLabel(folderPath: string, bucketName: string): string {
  const parentSegments = folderPath.split('/').slice(0, -1)
  return parentSegments.length > 0 ? parentSegments.join('/') : bucketName
}

/**
 * Copy for the dialog title, which names what is being moved rather than where it's going.
 */
export function getMoveItemsTitle(items: StorageItemWithColumn[]): string {
  if (items.length === 1) return `Move ${items[0].name}`
  return `Move ${items.length} items`
}
