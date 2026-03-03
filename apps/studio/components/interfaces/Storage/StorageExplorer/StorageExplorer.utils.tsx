import { toast } from 'sonner'

import { StorageObject } from 'data/storage/bucket-objects-list-mutation'
import { copyToClipboard } from 'ui'
import { inverseValidObjectKeyRegex, validObjectKeyRegex } from '../CreateBucketModal.utils'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import { StorageItem, StorageItemMetadata } from '../Storage.types'
import type { StorageExplorerState } from '@/state/storage-explorer'

type UploadProgress = {
  percentage: number
  elapsed: number
  uploadSpeed: number
  remainingBytes: number
  remainingTime: number
}

const CORRUPTED_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = '.emptyFolderPlaceholder'

/**
 * Returns the path to the current folder, optionally prefixed with the bucket name.
 */
export function getPathAlongOpenedFolders(
  state: Pick<StorageExplorerState, 'openedFolders' | 'selectedBucket'>,
  includeBucket = true
): string {
  if (includeBucket) {
    return state.openedFolders.length > 0
      ? `${state.selectedBucket.name}/${state.openedFolders.map((folder) => folder.name).join('/')}`
      : state.selectedBucket.name
  }
  return state.openedFolders.map((folder) => folder.name).join('/')
}

/**
 * Returns the path to the folder at the given index in the openedFolders array,
 * joining all folders from the root up to (but not including) the given index.
 */
export function getPathAlongFoldersToIndex(
  state: Pick<StorageExplorerState, 'openedFolders'>,
  index: number
): string {
  return state.openedFolders
    .slice(0, index)
    .map((folder) => folder.name)
    .join('/')
}

/**
 * Returns an error message string if the folder name contains invalid characters,
 * or null if the name is valid.
 */
export function validateFolderName(name: string): string | null {
  if (!validObjectKeyRegex.test(name)) {
    const [match] = name.match(inverseValidObjectKeyRegex) ?? []
    return !!match
      ? `Folder name cannot contain the "${match}" character`
      : 'Folder name contains an invalid special character'
  }
  return null
}

/**
 * Checks whether `name` already exists in the column (case-insensitive).
 * - When `autofix` is false and a duplicate is found, shows an error toast and returns null.
 * - When `autofix` is true and a duplicate is found, appends a numeric suffix and returns the new name.
 * - Returns the original name when there is no conflict.
 *
 * When `columnIndex` is omitted it defaults to the last column.
 */
export function sanitizeNameForDuplicateInColumn(
  state: Pick<StorageExplorerState, 'columns'>,
  {
    name,
    columnIndex,
    autofix = false,
  }: {
    name: string
    columnIndex?: number
    autofix?: boolean
  }
): string | null {
  const columnIndex_ = columnIndex !== undefined ? columnIndex : state.columns.length - 1
  const currentColumn = state.columns[columnIndex_]
  const currentColumnItems = currentColumn.items.filter(
    (item) => item.status !== STORAGE_ROW_STATUS.EDITING
  )
  // [Joshen] JFYI storage does support folders of the same name with different casing
  // but its an issue with the List V1 endpoint that's causing an issue with fetching contents
  // for folders of the same name with different casing
  // We should remove this check once all projects are on the List V2 endpoint
  const hasSameNameInColumn =
    currentColumnItems.filter((item) => item.name.toLowerCase() === name.toLowerCase()).length > 0

  if (hasSameNameInColumn) {
    if (autofix) {
      const fileNameSegments = name.split('.')
      const fileName = fileNameSegments.slice(0, fileNameSegments.length - 1).join('.')
      const fileExt = fileNameSegments[fileNameSegments.length - 1]

      const dupeNameRegex = new RegExp(`${fileName} \\([-0-9]+\\)${fileExt ? '.' + fileExt : ''}$`)
      const itemsWithSameNameInColumn = currentColumnItems.filter((item) =>
        item.name.match(dupeNameRegex)
      )

      const updatedFileName = fileName + ` (${itemsWithSameNameInColumn.length + 1})`
      return fileExt ? `${updatedFileName}.${fileExt}` : updatedFileName
    } else {
      toast.error(
        `The name ${name} already exists in the current directory. Please use a different name.`
      )
      return null
    }
  }

  return name
}

export const copyPathToFolder = (
  openedFolders: StorageItem[],
  item: StorageItem & { columnIndex: number }
) => {
  const folders = openedFolders.slice(0, item.columnIndex).map((folder) => folder.name)
  const path = folders.length > 0 ? `${folders.join('/')}/${item.name}` : item.name
  copyToClipboard(path)
  toast.success(`Copied path to folder "${item.name}"`)
}

export const formatTime = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 3600))
  seconds %= 24 * 3600
  const hours = Math.floor(seconds / 3600)
  seconds %= 3600
  const minutes = Math.floor(seconds / 60)
  seconds = Math.floor(seconds % 60)

  if (days > 0) return `${days}d `
  if (hours > 0) return `${hours}h `
  if (minutes > 0) return `${minutes}m `
  return `${seconds}s`
}

export const calculateTotalRemainingTime = (progresses: UploadProgress[]) => {
  let totalRemainingTime = 0
  let totalRemainingBytes = 0

  progresses.forEach((progress) => {
    totalRemainingBytes += progress.remainingBytes
    if (totalRemainingBytes === 0) {
      return
    }
    const weight = progress.remainingBytes / totalRemainingBytes
    totalRemainingTime += weight * progress.remainingTime
  })

  return totalRemainingTime
}

export const formatFolderItems = (items: StorageObject[] = [], prefix?: string): StorageItem[] => {
  const formattedItems =
    (items ?? [])
      ?.filter((item) => item.name !== EMPTY_FOLDER_PLACEHOLDER_FILE_NAME)
      .map((item) => {
        const type = item.id ? STORAGE_ROW_TYPES.FILE : STORAGE_ROW_TYPES.FOLDER

        const durationSinceCreated = Number(new Date()) - Number(new Date(item.created_at))
        const isCorrupted =
          type === STORAGE_ROW_TYPES.FILE &&
          !item.metadata &&
          durationSinceCreated >= CORRUPTED_THRESHOLD_MS

        const status =
          type === STORAGE_ROW_TYPES.FILE &&
          !item.metadata &&
          durationSinceCreated <= CORRUPTED_THRESHOLD_MS
            ? STORAGE_ROW_STATUS.LOADING
            : STORAGE_ROW_STATUS.READY

        const itemObj = {
          ...item,
          metadata: item.metadata as any as StorageItemMetadata,
          type,
          status,
          isCorrupted,
          path: !!prefix ? `${prefix}/${item.name}` : item.name,
        }
        return itemObj
      }) ?? []
  return formattedItems
}

export const getFile = async (fileEntry: FileSystemFileEntry): Promise<File | undefined> => {
  try {
    return await new Promise((resolve, reject) => fileEntry.file(resolve, reject))
  } catch (err) {
    console.error('getFile error:', err)
    return undefined
  }
}

// Referenced from: // https://stackoverflow.com/a/53058574
export const getFilesDataTransferItems = async (items: DataTransferItemList) => {
  const toastId = toast('Retrieving items to upload...')
  const files: (File & { path: string })[] = []
  const queue: FileSystemEntry[] = []
  for (const item of items) {
    const entry = item.webkitGetAsEntry()
    if (entry) {
      queue.push(entry)
    }
  }
  while (queue.length > 0) {
    const entry = queue.shift()
    if (entry && entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry
      const file = await getFile(fileEntry)
      if (file !== undefined) {
        ;(file as any).path = fileEntry.fullPath.slice(1)
        files.push(file as File & { path: string })
      }
    } else if (entry && entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry
      queue.push(...(await readAllDirectoryEntries(dirEntry.createReader())))
    }
  }
  toast.dismiss(toastId)
  return files
}

/**
 * Get all the entries (files or sub-directories) in a directory by calling readEntries until it returns empty array
 */
const readAllDirectoryEntries = async (directoryReader: FileSystemDirectoryReader) => {
  const entries = []
  let readEntries = await readEntriesPromise(directoryReader)
  while (readEntries && readEntries.length > 0) {
    entries.push(...readEntries)
    readEntries = await readEntriesPromise(directoryReader)
  }
  return entries
}

/**
 * Wrap readEntries in a promise to make working with readEntries easier
 * readEntries will return only some of the entries in a directory
 * e.g. Chrome returns at most 100 entries at a time
 */
const readEntriesPromise = async (directoryReader: FileSystemDirectoryReader) => {
  try {
    return await new Promise<FileSystemEntry[]>((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  } catch (err) {
    console.error('readEntriesPromise error:', err)
  }
}
