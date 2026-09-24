import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import type { StorageFolder } from '@/data/storage/bucket-folders-query'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'

/** Maximum number of folders rendered in the search results list */
export const MAX_FOLDER_SEARCH_RESULTS = 100

/**
 * Returns the folder each item currently lives in
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

export function getDestinationName(bucketName: string, pathSegments: string[]): string {
  return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : bucketName
}

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
 * Narrows a listing to the folders in it. The picker only offers folders, so files are dropped.
 */
export function toFolders(objects: StorageObject[], parentPath: string): StorageFolder[] {
  return objects
    .filter((object) => !object.id)
    .map((object) => ({
      name: object.name,
      path: parentPath.length > 0 ? `${parentPath}/${object.name}` : object.name,
    }))
}

export function getParentPathLabel(folderPath: string, bucketName: string): string {
  const parentSegments = folderPath.split('/').slice(0, -1)
  return parentSegments.length > 0 ? parentSegments.join('/') : bucketName
}

export const BREADCRUMB_ITEMS_TO_DISPLAY = 3

export type MoveBreadcrumb = {
  label: string
  pathSegments: string[]
  isCurrent: boolean
}

export function getMoveBreadcrumbs(
  bucketName: string,
  pathSegments: string[]
): { first: MoveBreadcrumb; collapsed: MoveBreadcrumb[]; tail: MoveBreadcrumb[] } {
  const crumbs: MoveBreadcrumb[] = [bucketName, ...pathSegments].map((label, index) => ({
    label,
    pathSegments: pathSegments.slice(0, index),
    isCurrent: index === pathSegments.length,
  }))

  const [first, ...rest] = crumbs
  const tailLength = BREADCRUMB_ITEMS_TO_DISPLAY - 1
  const shouldCollapse = crumbs.length > BREADCRUMB_ITEMS_TO_DISPLAY

  return {
    first,
    collapsed: shouldCollapse ? rest.slice(0, -tailLength) : [],
    tail: shouldCollapse ? rest.slice(-tailLength) : rest,
  }
}

export function getMoveItemsTitle(items: StorageItemWithColumn[]): string {
  if (items.length === 1) return `Move ${items[0].name}`
  return `Move ${items.length} items`
}
