import { toast } from 'sonner'

import { StorageObject } from 'data/storage/bucket-objects-list-mutation'
import { copyToClipboard } from 'ui'
import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import { StorageItem, StorageItemMetadata } from '../Storage.types'

type UploadProgress = {
  percentage: number
  elapsed: number
  uploadSpeed: number
  remainingBytes: number
  remainingTime: number
}

const CORRUPTED_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = '.emptyFolderPlaceholder'

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
