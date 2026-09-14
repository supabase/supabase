import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { IS_PLATFORM } from 'common'
import { capitalize, chunk, compact, find, findIndex, has, isObject, uniq, uniqBy } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useLatest } from 'react-use'
import { toast } from 'sonner'
import * as tus from 'tus-js-client'
import { Button, SONNER_DEFAULT_DURATION, SonnerProgress } from 'ui'
import { proxy, useSnapshot } from 'valtio'

import { useSelectedBucket } from '@/components/interfaces/Storage/FilesBuckets/useSelectedBucket'
import {
  MAX_ITEMS_PER_MOVE,
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
} from '@/components/interfaces/Storage/Storage.constants'
import {
  StorageColumn,
  StorageItem,
  StorageItemMetadata,
  StorageItemWithColumn,
} from '@/components/interfaces/Storage/Storage.types'
import {
  getColumnPath,
  getFolderObjectMoves,
  getItemPath,
  isWithinMoveLimit,
  joinPaths,
  type ObjectMove,
} from '@/components/interfaces/Storage/StorageExplorer/FileExplorerDnd.utils'
import {
  calculateTotalRemainingTime,
  EMPTY_FOLDER_PLACEHOLDER_FILE_NAME,
  formatFolderItems,
  formatTime,
  getFilesDataTransferItems,
  getPathAlongFoldersToIndex,
  sanitizeNameForDuplicateInColumn,
  validateFolderName,
} from '@/components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'
import { fetchFileUrl } from '@/components/interfaces/Storage/StorageExplorer/useFetchFileUrlQuery'
import { getStoragePreference } from '@/components/interfaces/Storage/StorageExplorer/useStoragePreference'
import { convertFromBytes } from '@/components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { getOrRefreshTemporaryApiKey } from '@/data/api-keys/temp-api-keys-utils'
import { configKeys } from '@/data/config/keys'
import { useProjectApiUrl } from '@/data/config/project-endpoint-query'
import type { ProjectStorageConfigResponse } from '@/data/config/project-storage-config-query'
import { getQueryClient } from '@/data/query-client'
import { deleteBucketObject } from '@/data/storage/bucket-object-delete-mutation'
import { signBucketObjects } from '@/data/storage/bucket-object-sign-mutation'
import { listBucketObjects, StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import { deleteBucketPrefix } from '@/data/storage/bucket-prefix-delete-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { moveStorageObject } from '@/data/storage/object-move-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import { lookupMime } from '@/lib/mime'
import { createProjectSupabaseClient } from '@/lib/project-supabase-client'
import { ResponseError } from '@/types'

type UploadProgress = {
  percentage: number
  elapsed: number
  uploadSpeed: number
  remainingBytes: number
  remainingTime: number
}

const LIMIT = 200
const OFFSET = 0
const DEFAULT_RETRY_SECONDS = 5
const RATE_LIMIT_RETRY_SECONDS = 60
const MOVE_RETRY_ATTEMPTS = 3

const STORAGE_PROGRESS_INFO_TEXT = "Do not close the browser until it's completed"

/** Counts down, ticking every second so that callers can keep a progress toast up to date */
const waitWithCountdown = (seconds: number, onTick: (secondsLeft: number) => void) =>
  new Promise<void>((resolve) => {
    let secondsLeft = seconds
    const interval = setInterval(() => {
      onTick(secondsLeft)
      secondsLeft -= 1
      if (secondsLeft <= 0) {
        clearInterval(interval)
        resolve()
      }
    }, 1000)
  })

/**
 * Storage has no bulk move endpoint, so objects are moved one request at a time and larger
 * batches run into rate limits. Retries with a backoff, reporting each wait so that callers can
 * explain the pause.
 */
const moveObjectWithRetry = async ({
  projectRef,
  bucketId,
  from,
  to,
  onRetry,
}: {
  projectRef: string
  bucketId: string
  from: string
  to: string
  onRetry: (info: { attempt: number; secondsLeft: number; isRateLimited: boolean }) => void
}) => {
  let retrySeconds = DEFAULT_RETRY_SECONDS
  let isRateLimited = false

  for (let attempt = 0; attempt < MOVE_RETRY_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await waitWithCountdown(retrySeconds, (secondsLeft) =>
        onRetry({ attempt, secondsLeft, isRateLimited })
      )
    }

    try {
      await moveStorageObject({ projectRef, bucketId, from, to })
      return true
    } catch (error) {
      isRateLimited = (error as ResponseError).code === 429
      retrySeconds = isRateLimited ? RATE_LIMIT_RETRY_SECONDS : DEFAULT_RETRY_SECONDS
    }
  }

  return false
}

const getMoveOutcomeMessage = ({
  total,
  failed,
  destinationLabel,
}: {
  total: number
  failed: number
  destinationLabel: string
}) => {
  const files = `${total} file${total > 1 ? 's' : ''}`
  if (failed === 0) return `Successfully moved ${files} to ${destinationLabel}`
  if (failed === total) return `Failed to move ${files} to ${destinationLabel}`
  return `Moved ${total - failed} of ${files} to ${destinationLabel}, ${failed} failed`
}

let abortController: AbortController
if (typeof window !== 'undefined') {
  abortController = new AbortController()
}

function createStorageExplorerState({
  projectRef,
  connectionString,
  bucket,
  resumableUploadUrl,
  clientEndpoint,
}: {
  projectRef: string
  connectionString: string
  bucket?: Bucket
  resumableUploadUrl: string
  clientEndpoint: string
}) {
  const getSortOptions = () => {
    const { sortBy, sortByOrder } = getStoragePreference(projectRef)
    return { column: sortBy, order: sortByOrder }
  }

  const state = proxy({
    projectRef,
    connectionString,
    resumableUploadUrl,
    uploadProgresses: [] as UploadProgress[],
    selectedBucket: bucket as Bucket,

    abortApiCalls: () => {
      if (abortController) {
        abortController.abort()
        abortController = new AbortController()
      }
    },

    abortUploadCallbacks: {} as { [key: string]: (() => void)[] },
    abortUploads: (toastId: string | number) => {
      state.abortUploadCallbacks[toastId].forEach((callback) => callback())
      state.abortUploadCallbacks[toastId] = []
    },

    columns: [] as StorageColumn[],
    popColumn: () => {
      state.abortApiCalls()
      state.columns = state.columns.slice(0, state.getLatestColumnIndex())
    },
    popColumnAtIndex: (index: number) => {
      state.columns = state.columns.slice(0, index + 1)
    },
    pushColumnAtIndex: (column: StorageColumn, index: number) => {
      state.columns = state.columns.slice(0, index + 1).concat([column])
    },

    openedFolders: [] as StorageItem[],
    pushOpenedFolderAtIndex: (folder: StorageItem, index: number) => {
      state.openedFolders = state.openedFolders.slice(0, index).concat(folder)
    },
    popOpenedFolders: () => {
      state.openedFolders = state.openedFolders.slice(0, state.openedFolders.length - 1)
    },
    popOpenedFoldersAtIndex: (index: number) => {
      state.openedFolders = state.openedFolders.slice(0, index + 1)
    },
    clearOpenedFolders: () => {
      state.openedFolders = []
    },

    selectedItems: [] as StorageItemWithColumn[],
    setSelectedItems: (items: StorageItemWithColumn[]) => (state.selectedItems = items),
    clearSelectedItems: (columnIndex?: number) => {
      if (columnIndex !== undefined) {
        state.selectedItems = state.selectedItems.filter((item) => item.columnIndex !== columnIndex)
      } else {
        state.selectedItems = []
      }
    },

    selectedItemsToDelete: [] as StorageItemWithColumn[],
    setSelectedItemsToDelete: (items: StorageItemWithColumn[]) => {
      state.selectedItemsToDelete = items
    },

    selectedItemsToMove: [] as StorageItemWithColumn[],
    setSelectedItemsToMove: (items: StorageItemWithColumn[]) => {
      state.selectedItemsToMove = items
    },

    setSelectedItemToRename: (file: { name: string; columnIndex: number }) => {
      state.updateRowStatus({
        name: file.name,
        status: STORAGE_ROW_STATUS.EDITING,
        columnIndex: file.columnIndex,
      })
    },

    isSearching: false,
    setIsSearching: (value: boolean) => (state.isSearching = value),

    isRefreshing: false,

    selectedFilePreview: undefined as StorageItemWithColumn | undefined,
    setSelectedFilePreview: (file?: StorageItemWithColumn) => (state.selectedFilePreview = file),

    selectedFileCustomExpiry: undefined as StorageItem | undefined,
    setSelectedFileCustomExpiry: (item?: StorageItem) => (state.selectedFileCustomExpiry = item),

    // Functions that manage the UI of the Storage Explorer

    getLatestColumnIndex: () => {
      return state.columns.length - 1
    },

    setColumnIsLoadingMore: (index: number, isLoadingMoreItems: boolean = true) => {
      state.columns = state.columns.map((col, idx) => {
        return idx === index ? { ...col, isLoadingMoreItems } : col
      })
    },

    // ======== Folders CRUD ========

    addNewFolderPlaceholder: (columnIndex: number) => {
      const isPrepend = true
      const folderName = 'Untitled folder'
      const folderType = STORAGE_ROW_TYPES.FOLDER
      const columnIdx = columnIndex === -1 ? state.getLatestColumnIndex() : columnIndex
      state.addTempRow({
        type: folderType,
        name: folderName,
        status: STORAGE_ROW_STATUS.EDITING,
        columnIndex: columnIdx,
        metadata: null,
        isPrepend,
      })
    },

    addNewFolder: async ({
      folderName,
      columnIndex,
      onError,
    }: {
      folderName: string
      columnIndex: number
      onError?: () => void
    }) => {
      const autofix = false
      const formattedName = sanitizeNameForDuplicateInColumn(state, {
        name: folderName,
        autofix,
        columnIndex,
      })

      if (formattedName === null) {
        onError?.()
        return
      }

      if (formattedName.length === 0) {
        return state.removeTempRows(columnIndex)
      }

      const folderNameError = validateFolderName(formattedName)
      if (folderNameError) {
        onError?.()
        return toast.error(folderNameError)
      }

      state.updateFolderAfterEdit({ folderName: formattedName, columnIndex })

      const emptyPlaceholderFile = `${formattedName}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
      const pathToFolder = state.openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .join('/')
      const formattedPathToEmptyPlaceholderFile =
        pathToFolder.length > 0 ? `${pathToFolder}/${emptyPlaceholderFile}` : emptyPlaceholderFile

      const client = await createProjectSupabaseClient(state.projectRef, clientEndpoint)
      await client.storage
        .from(state.selectedBucket.name)
        .upload(
          formattedPathToEmptyPlaceholderFile,
          new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME)
        )

      if (pathToFolder.length > 0) {
        await deleteBucketObject({
          projectRef: state.projectRef,
          bucketId: state.selectedBucket.id,
          paths: [`${pathToFolder}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
        })
      }

      const newFolder = state.columns[columnIndex]?.items?.find((x) => x?.name === formattedName)
      if (newFolder) state.openFolder(columnIndex, newFolder)
    },

    fetchFolderContents: async ({
      bucketId,
      folderId,
      folderName,
      index,
      searchString,
    }: {
      bucketId: string
      folderId: string | null
      folderName: string
      index: number
      searchString?: string
    }) => {
      state.abortApiCalls()
      state.updateRowStatus({
        name: folderName,
        status: STORAGE_ROW_STATUS.LOADING,
        columnIndex: index,
      })
      const prefix = state.openedFolders
        .slice(0, index + 1)
        .map((folder) => folder.name)
        .join('/')
      state.pushColumnAtIndex(
        {
          id: folderId,
          name: folderName,
          path: prefix,
          status: STORAGE_ROW_STATUS.LOADING,
          items: [],
        },
        index
      )

      const options = {
        limit: LIMIT,
        offset: OFFSET,
        search: searchString,
        sortBy: getSortOptions(),
      }

      try {
        const data = await listBucketObjects(
          {
            bucketId,
            projectRef: state.projectRef,
            path: prefix,
            options,
          },
          abortController?.signal
        )

        state.updateRowStatus({
          name: folderName,
          status: STORAGE_ROW_STATUS.READY,
          columnIndex: index,
        })
        const formattedItems = formatFolderItems(data, prefix)
        state.pushColumnAtIndex(
          {
            id: folderId || folderName,
            name: folderName,
            path: prefix,
            status: STORAGE_ROW_STATUS.READY,
            items: formattedItems,
            hasMoreItems: formattedItems.length === LIMIT,
            isLoadingMoreItems: false,
          },
          index
        )
      } catch (error: any) {
        if (error.name === 'AbortError') {
          state.updateRowStatus({
            name: folderName,
            status: STORAGE_ROW_STATUS.READY,
            columnIndex: index,
          })
        } else {
          toast.error(`Failed to retrieve folder contents from "${folderName}": ${error.message}`)
        }
      }
    },

    fetchMoreFolderContents: async ({
      index,
      column,
      searchString = '',
    }: {
      index: number
      column: StorageColumn
      searchString?: string
    }) => {
      state.setColumnIsLoadingMore(index)

      const options = {
        limit: LIMIT,
        offset: column.items.length,
        search: searchString,
        sortBy: getSortOptions(),
      }

      try {
        const data = await listBucketObjects(
          {
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            path: column.path,
            options,
          },
          abortController?.signal
        )

        // Add items to column
        const formattedItems = formatFolderItems(data, column.path)
        state.columns = state.columns.map((col, idx) => {
          if (idx === index) {
            return {
              ...col,
              items: col.items.concat(formattedItems),
              isLoadingMoreItems: false,
              hasMoreItems: data.length === LIMIT,
            }
          }
          return col
        })
      } catch (error: any) {
        if (!error.message.includes('aborted')) {
          toast.error(`Failed to retrieve more folder contents: ${error.message}`)
        }
      }
    },

    refetchAllOpenedFolders: async () => {
      const paths = state.openedFolders.map((folder) => folder.name)
      await state.fetchFoldersByPath({ paths })
    },

    refreshAll: async () => {
      state.isRefreshing = true
      try {
        await state.refetchAllOpenedFolders()
      } finally {
        state.isRefreshing = false
      }
    },

    fetchFoldersByPath: async ({
      paths,
      searchString = '',
      showLoading = false,
    }: {
      paths: string[]
      searchString?: string
      showLoading?: boolean
    }) => {
      if (state.selectedBucket.id === undefined) return

      const pathsWithEmptyPrefix = [''].concat(paths)

      if (showLoading) {
        state.columns = [state.selectedBucket.name].concat(paths).map((path) => {
          return { id: path, name: path, path, status: STORAGE_ROW_STATUS.LOADING, items: [] }
        })
      }

      const foldersItems = await Promise.all(
        pathsWithEmptyPrefix.map(async (_path, idx) => {
          const prefix = paths.slice(0, idx).join('/')
          const options = {
            limit: LIMIT,
            offset: OFFSET,
            search: searchString,
            sortBy: getSortOptions(),
          }

          try {
            const data = await listBucketObjects({
              projectRef: state.projectRef,
              bucketId: state.selectedBucket.id,
              path: prefix,
              options,
            })
            return data
          } catch (error: any) {
            toast.error(`Failed to fetch folders: ${error.message}`)
            return []
          }
        })
      )

      const formattedFolders = foldersItems.map((folderItems, idx) => {
        const prefix = paths.slice(0, idx).join('/')
        const formattedItems = formatFolderItems(folderItems, prefix)
        return {
          id: null,
          status: STORAGE_ROW_STATUS.READY,
          name: idx === 0 ? state.selectedBucket.name : pathsWithEmptyPrefix[idx],
          path: prefix,
          items: formattedItems,
          hasMoreItems: formattedItems.length === LIMIT,
          isLoadingMoreItems: false,
        }
      })

      // Package into columns and update this.columns
      state.columns = formattedFolders

      // Update openedFolders as well
      const updatedOpenedFolders: StorageItem[] = paths.map((path, idx) => {
        const folderInfo = find(formattedFolders[idx].items, { name: path })
        // Folder doesnt exist, FE just scaffolds a "fake" folder
        if (!folderInfo) {
          return {
            id: null,
            name: path,
            type: STORAGE_ROW_TYPES.FOLDER,
            status: STORAGE_ROW_STATUS.READY,
            metadata: null,
            isCorrupted: false,
            created_at: null,
            updated_at: null,
            last_accessed_at: null,
          }
        }
        return folderInfo
      })
      state.openedFolders = updatedOpenedFolders
    },

    /**
     * Check parent folder if its empty, if yes, reinstate .emptyFolderPlaceholder. Used when deleting folder or deleting files
     */
    validateParentFolderEmpty: async (parentFolderPrefix: string) => {
      try {
        const data = await listBucketObjects({
          projectRef: state.projectRef,
          bucketId: state.selectedBucket.id,
          path: parentFolderPrefix,
          options: {
            limit: LIMIT,
            offset: OFFSET,
            sortBy: getSortOptions(),
          },
        })

        if (data.length === 0) {
          const prefixToPlaceholder = `${parentFolderPrefix}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
          const client = await createProjectSupabaseClient(state.projectRef, clientEndpoint)
          await client.storage
            .from(state.selectedBucket.name)
            .upload(prefixToPlaceholder, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME))
        }
      } catch (error) {}
    },

    deleteFolder: async (folder: StorageItemWithColumn) => {
      try {
        const isDeleteFolder = true
        const files = await state.getAllItemsAlongFolder(folder)

        if (files.length === 0) {
          // [Joshen] This is to self-remediate orphan prefixes
          await deleteBucketPrefix({
            projectRef: state.projectRef,
            connectionString: state.connectionString,
            bucketId: state.selectedBucket.id,
            prefix: folder.path,
          })
        } else {
          await state.deleteFiles({ files: files as any[], isDeleteFolder })
        }

        state.popColumnAtIndex(folder.columnIndex)
        state.popOpenedFoldersAtIndex(folder.columnIndex - 1)

        if (folder.columnIndex > 0) {
          const parentFolderPrefix = state.openedFolders
            .slice(0, folder.columnIndex)
            .map((folder) => folder.name)
            .join('/')
          if (parentFolderPrefix.length > 0)
            await state.validateParentFolderEmpty(parentFolderPrefix)
        }

        await state.refetchAllOpenedFolders()
        state.setSelectedItemsToDelete([])
        toast.success(`Successfully deleted ${folder.name}`)
      } catch (error: any) {
        toast.error(`Failed to delete folder: ${error.message}`)
      }
    },

    renameFolder: async ({
      folder,
      newName,
      columnIndex,
      onError,
    }: {
      folder: StorageItemWithColumn
      newName: string
      columnIndex: number
      onError?: () => void
    }) => {
      const originalName = folder.name
      if (originalName === newName) {
        return state.updateRowStatus({
          name: originalName,
          status: STORAGE_ROW_STATUS.READY,
          columnIndex,
        })
      }

      const folderNameError = validateFolderName(newName)
      if (folderNameError) {
        onError?.()
        return toast.error(folderNameError)
      }

      const toastId = toast(
        <SonnerProgress progress={0} message={`Renaming folder to ${newName}`} />,
        { closeButton: false, position: 'top-right' }
      )

      try {
        state.updateRowStatus({
          name: originalName,
          status: STORAGE_ROW_STATUS.LOADING,
          columnIndex,
          updatedName: newName,
        })
        const files = await state.getAllItemsAlongFolder(folder)

        let progress = 0
        let failedFiles = 0

        for (const file of files) {
          const fromPath = `${file.prefix}/${file.name}`
          const pathSegments = fromPath.split('/')
          const toPath = pathSegments
            .slice(0, columnIndex)
            .concat(newName)
            .concat(pathSegments.slice(columnIndex + 1))
            .join('/')

          const hasMoved = await moveObjectWithRetry({
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            from: fromPath,
            to: toPath,
            onRetry: ({ attempt, secondsLeft, isRateLimited }) =>
              toast(
                <SonnerProgress
                  progress={Math.min(progress * 100, 100)}
                  message={`Renaming folder to ${newName}`}
                  description={`${isRateLimited ? 'API rate limited' : 'Error moving file'} - retrying in ${secondsLeft} seconds (${attempt}/${MOVE_RETRY_ATTEMPTS})`}
                />,
                { id: toastId, closeButton: false, position: 'top-right', duration: Infinity }
              ),
          })
          if (!hasMoved) failedFiles += 1

          progress += 1 / files.length
          toast(
            <SonnerProgress
              progress={Math.min(progress * 100, 100)}
              message={`Renaming folder to ${newName}`}
            />,
            { id: toastId, closeButton: false, position: 'top-right', duration: Infinity }
          )
        }

        if (failedFiles === 0) {
          toast.success(`Successfully renamed folder to ${newName}`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        } else {
          toast.error(
            <div>
              <p>
                Renamed folder to {newName} with {failedFiles} error{failedFiles > 1 ? 's' : ''}
              </p>
              <p className="text-foreground-light">
                You may try again to rename the folder {originalName} to {newName}
              </p>
            </div>,
            {
              id: toastId,
              closeButton: true,
              duration: Infinity,
            }
          )
        }

        if (state.openedFolders[columnIndex]?.name === folder.name) {
          state.setSelectedFilePreview(undefined)
          state.popOpenedFoldersAtIndex(columnIndex - 1)
        }
        await state.refetchAllOpenedFolders()

        // TODO: Should we invalidate the file preview cache when renaming folders?
      } catch (e: any) {
        toast.error(`Failed to rename folder to ${newName}: ${e.message}`, {
          id: toastId,
          closeButton: true,
          duration: SONNER_DEFAULT_DURATION,
        })
      }
    },

    updateFolderAfterEdit: ({
      folderName,
      columnIndex,
      status = STORAGE_ROW_STATUS.READY,
    }: {
      folderName: string
      columnIndex?: number
      status?: STORAGE_ROW_STATUS
    }) => {
      const columnIndex_ = columnIndex !== undefined ? columnIndex : state.getLatestColumnIndex()
      const updatedColumns = state.columns.map((column, idx) => {
        if (idx === columnIndex_) {
          const updatedItems = column.items.map((item) => {
            if (item.status === STORAGE_ROW_STATUS.EDITING) {
              const currentTime = new Date().toISOString()
              return {
                ...item,
                status,
                name: folderName,
                createdAt: currentTime,
                lastAccessedAt: currentTime,
                updatedAt: currentTime,
                metadata: null,
                id: null,
              }
            }
            return item
          })
          return { ...column, items: updatedItems }
        }
        return column
      })
      state.columns = updatedColumns
    },

    openFolder: async (columnIndex: number, folder: StorageItem) => {
      state.setSelectedFilePreview(undefined)
      state.clearSelectedItems(columnIndex + 1)
      state.popOpenedFoldersAtIndex(columnIndex - 1)
      state.pushOpenedFolderAtIndex(folder, columnIndex)
      await state.fetchFolderContents({
        bucketId: state.selectedBucket.id,
        folderId: folder.id,
        folderName: folder.name,
        index: columnIndex,
      })
    },

    downloadFolder: async (folder: StorageItemWithColumn) => {
      let progress = 0
      const toastId = toast.loading('Retrieving files from folder...')

      try {
        const files = await state.getAllItemsAlongFolder(folder)

        toast(
          <SonnerProgress
            progress={0}
            message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
          />,
          { id: toastId, closeButton: false, position: 'top-right' }
        )

        // Pre-fetch all URLs in a single batch to avoid N management API calls
        const filePaths = files.map((file) => `${file.prefix}/${file.name}`)
        const urlByPath = new Map<string, string>()

        if (state.selectedBucket.public) {
          for (const filePath of filePaths) {
            urlByPath.set(
              filePath,
              `${clientEndpoint}/storage/v1/object/public/${state.selectedBucket.id}/${filePath}`
            )
          }
        } else {
          const signedUrls = await signBucketObjects({
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            paths: filePaths,
            expiresIn: 60 * 60, // 1 hour — enough for large folder downloads
          })
          for (const item of signedUrls) {
            if (item.path && item.signedUrl) {
              urlByPath.set(item.path, item.signedUrl)
            }
          }
        }

        const promises = files.map((file) => {
          const fileMimeType = (file.metadata?.mimetype as string) ?? null
          const filePath = `${file.prefix}/${file.name}`
          return () => {
            return new Promise<
              | {
                  name: string
                  prefix: string
                  blob: Blob
                }
              | boolean
            >(async (resolve) => {
              try {
                const url = urlByPath.get(filePath)
                if (!url) throw new Error(`Failed to retrieve file ${filePath}`)

                const response = await fetch(url)
                if (!response.ok) throw new Error(`Failed to retrieve file ${filePath}`)
                const data = await response.blob()

                progress = progress + 1 / files.length

                resolve({
                  name: file.name,
                  prefix: file.prefix,
                  blob: new Blob([data], { type: fileMimeType ?? data.type }),
                })
              } catch (error) {
                console.error('Failed to download file', filePath)
                resolve(false)
              }
            })
          }
        })

        const batchedPromises = chunk(promises, 10)
        const downloadedFiles = await batchedPromises.reduce(
          async (previousPromise, nextBatch) => {
            const previousResults = await previousPromise
            const batchResults = await Promise.allSettled(nextBatch.map((batch) => batch()))
            toast(
              <SonnerProgress
                progress={progress * 100}
                message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
              />,
              { id: toastId, closeButton: false, position: 'top-right' }
            )
            return previousResults.concat(batchResults.map((x: any) => x.value).filter(Boolean))
          },
          Promise.resolve<
            {
              name: string
              prefix: string
              blob: Blob
            }[]
          >([])
        )

        const zipFileWriter = new BlobWriter('application/zip')
        const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })

        if (downloadedFiles.length === 0) {
          toast.error(`Failed to download files from "${folder.name}"`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        }

        downloadedFiles.forEach((file) => {
          if (file.blob) zipWriter.add(`${file.prefix}/${file.name}`, new BlobReader(file.blob))
        })

        const blobURL = URL.createObjectURL(await zipWriter.close())
        const link = document.createElement('a')
        link.href = blobURL
        link.setAttribute('download', `${folder.name}.zip`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)

        toast.success(
          downloadedFiles.length === files.length
            ? `Successfully downloaded folder "${folder.name}"`
            : `Downloaded folder "${folder.name}". However, ${
                files.length - downloadedFiles.length
              } files did not download successfully.`,
          { id: toastId, closeButton: true, duration: SONNER_DEFAULT_DURATION }
        )
      } catch (error: any) {
        toast.error(`Failed to download folder: ${error.message}`, {
          id: toastId,
          closeButton: true,
          duration: SONNER_DEFAULT_DURATION,
        })
      }
    },

    /**
     * Recursively returns a list of items along every directory within the specified base folder
     * Each item has an extra property 'prefix' which has the prefix that leads to the item
     * Used specifically for any operation that deals with every file along the folder
     * e.g Delete folder, rename folder
     */
    getAllItemsAlongFolder: async (folder: {
      name: string
      columnIndex: number
      prefix?: string
    }): Promise<(StorageObject & { prefix: string })[]> => {
      const items: (StorageObject & { prefix: string })[] = []

      let hasError = false
      let formattedPathToFolder = ''
      const { name, columnIndex, prefix } = folder

      if (prefix === undefined) {
        const pathToFolder = state.openedFolders
          .slice(0, columnIndex)
          .map((folder) => folder.name)
          .join('/')
        formattedPathToFolder = pathToFolder.length > 0 ? `${pathToFolder}/${name}` : name
      } else {
        formattedPathToFolder = `${prefix}/${name}`
      }

      // [Joshen] limit is set to 10k to optimize reduction of requests, we've done some experiments
      // that prove that the time to fetch all files in a folder reduces as the batch size increases
      // 10k however, is the hard limit at the API level.
      const options = {
        limit: 10000,
        offset: OFFSET,
        sortBy: getSortOptions(),
      }
      let folderContents: StorageObject[] = []

      for (;;) {
        try {
          const data = await listBucketObjects({
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            path: formattedPathToFolder,
            options,
          })
          folderContents = folderContents.concat(data)
          options.offset += options.limit
          if ((data || []).length < options.limit) {
            break
          }
        } catch (e) {
          hasError = true
          break
        }
      }

      if (hasError) {
        throw new Error('Failed to retrieve all files within folder')
      }

      const subfolders = folderContents?.filter((item) => item.id === null) ?? []
      const folderItems = folderContents?.filter((item) => item.id !== null) ?? []

      folderItems.forEach((item) => items.push({ ...item, prefix: formattedPathToFolder }))

      const subFolderContents = await Promise.all(
        subfolders.map((folder) =>
          state.getAllItemsAlongFolder({ ...folder, columnIndex: 0, prefix: formattedPathToFolder })
        )
      )
      subFolderContents.map((subfolderContent) => {
        subfolderContent.map((item) => items.push(item))
      })

      return items
    },

    // ======== Files CRUD ========

    uploadFiles: async ({
      files,
      columnIndex,
      isDrop = false,
    }: {
      files: FileList | DataTransferItemList
      columnIndex: number
      isDrop?: boolean
    }) => {
      const queryClient = getQueryClient()
      const storageConfiguration = queryClient
        .getQueryCache()
        .find({ queryKey: configKeys.storage(state.projectRef) })?.state.data as
        | ProjectStorageConfigResponse
        | undefined
      const fileSizeLimit = storageConfiguration?.fileSizeLimit

      const t1 = new Date()

      const autofix = true
      // We filter out any folders which are just '#' until we can properly encode such characters in the URL
      const filesToUpload: (File & { path?: string })[] = isDrop
        ? (await getFilesDataTransferItems(files as DataTransferItemList)).filter(
            (file) => !file.path.includes('#/')
          )
        : Array.from(files as FileList)
      const derivedColumnIndex = columnIndex === -1 ? state.getLatestColumnIndex() : columnIndex

      const filesWithinUploadLimit =
        fileSizeLimit !== undefined
          ? filesToUpload.filter((file) => file.size <= fileSizeLimit)
          : filesToUpload

      if (filesWithinUploadLimit.length < filesToUpload.length) {
        const numberOfFilesRejected = filesToUpload.length - filesWithinUploadLimit.length
        const { value, unit } = convertFromBytes(fileSizeLimit as number)

        toast.error(
          <div className="flex flex-col gap-y-1">
            <p className="text-foreground">
              Failed to upload {numberOfFilesRejected} file{numberOfFilesRejected > 1 ? 's' : ''} as{' '}
              {numberOfFilesRejected > 1 ? 'their' : 'its'} size
              {numberOfFilesRejected > 1 ? 's are' : ' is'} beyond the global upload limit of{' '}
              {value} {unit}.
            </p>
            <p className="text-foreground-light">
              You can change the global file size upload limit in{' '}
              <InlineLink href={`/project/${state.projectRef}/storage/settings`}>
                Storage Settings
              </InlineLink>
              .
            </p>
          </div>,
          { duration: 8000 }
        )

        if (numberOfFilesRejected === filesToUpload.length) return
      }

      const filesWithNonZeroSize = filesWithinUploadLimit.filter((file) => file.size > 0)
      if (filesWithNonZeroSize.length < filesWithinUploadLimit.length) {
        const numberOfFilesRejected = filesWithinUploadLimit.length - filesWithNonZeroSize.length
        toast.error(
          <div className="flex flex-col gap-y-1">
            <p className="text-foreground">
              Failed to upload {numberOfFilesRejected} file{numberOfFilesRejected > 1 ? 's' : ''} as{' '}
              {numberOfFilesRejected > 1 ? 'their' : 'its'} size
              {numberOfFilesRejected > 1 ? 's are' : ' is'} 0.
            </p>
          </div>
        )

        if (numberOfFilesRejected === filesWithinUploadLimit.length) return
      }

      // If we're uploading a folder which name already exists in the same folder that we're uploading to
      // We sanitize the folder name and let all file uploads through. (This is only via drag drop)
      const topLevelFolders: string[] = (state.columns?.[derivedColumnIndex]?.items ?? [])
        .filter((item) => !item.id)
        .map((item) => item.name)
      const formattedFilesToUpload = filesWithinUploadLimit
        .filter((file) => file.name !== '.DS_Store')
        .map((file) => {
          // If the files are from clicking "Upload button", just take them as they are since users cannot
          // upload folders from clicking that button, only via drag drop
          if (!file.path) return file

          const path = file.path.split('/')
          const topLevelFolder = path.length > 1 ? path[0] : null
          if (topLevelFolders.includes(topLevelFolder as string)) {
            const newTopLevelFolder = sanitizeNameForDuplicateInColumn(state, {
              name: topLevelFolder as string,
              autofix,
              columnIndex,
            })
            path[0] = newTopLevelFolder as string
            file.path = path.join('/')
          }
          return file
        })

      state.uploadProgresses = new Array(formattedFilesToUpload.length).fill({
        percentage: 0,
        elapsed: 0,
        uploadSpeed: 0,
        remainingBytes: 0,
        remainingTime: 0,
      })
      const uploadedTopLevelFolders: string[] = []
      const numberOfFilesToUpload = formattedFilesToUpload.length
      let numberOfFilesUploadedSuccess = 0
      let numberOfFilesUploadedFail = 0

      const pathToFile = state.openedFolders
        .slice(0, derivedColumnIndex)
        .map((folder) => folder.name)
        .join('/')

      const toastId = state.onUploadProgress()

      // Upload files in batches
      const promises = formattedFilesToUpload.map((file, index) => {
        const extension = file.name.split('.').pop()
        const metadata = {
          mimetype: (file.type || lookupMime(extension)) ?? '',
          size: file.size,
        } as StorageItemMetadata
        const fileOptions = { cacheControl: '3600', contentType: metadata.mimetype }

        const isWithinFolder = (file?.path ?? '').split('/').length > 1
        const fileName = !isWithinFolder
          ? sanitizeNameForDuplicateInColumn(state, { name: file.name, autofix })
          : file.name
        const unsanitizedFormattedFileName =
          has(file, ['path']) && isWithinFolder ? file.path : fileName
        /**
         * Storage maintains a list of allowed characters, which excludes
         * characters such as the narrow no-break space used in Mac screenshots.
         * [Joshen] Am limiting to just replacing nbsp with a blank space instead of
         * all non-word characters per before
         * */
        const formattedFileName = (unsanitizedFormattedFileName ?? 'unknown').replaceAll(
          /\u{202F}/gu,
          ' '
        )
        const formattedPathToFile =
          pathToFile.length > 0
            ? `${pathToFile}/${formattedFileName}`
            : (formattedFileName as string)

        if (isWithinFolder) {
          const topLevelFolder = file.path?.split('/')[0] || ''
          if (!uploadedTopLevelFolders.includes(topLevelFolder)) {
            state.addTempRow({
              type: STORAGE_ROW_TYPES.FOLDER,
              name: topLevelFolder,
              status: STORAGE_ROW_STATUS.LOADING,
              columnIndex: derivedColumnIndex,
              metadata,
            })
            uploadedTopLevelFolders.push(topLevelFolder)
          }
        } else {
          state.addTempRow({
            type: STORAGE_ROW_TYPES.FILE,
            name: fileName!,
            status: STORAGE_ROW_STATUS.LOADING,
            columnIndex: derivedColumnIndex,
            metadata,
          })
        }

        let startingBytes = 0
        const bucketName = state.selectedBucket.name

        return () => {
          return new Promise<void>(async (resolve, reject) => {
            const fileSizeInMB = file.size / (1024 * 1024)
            const startTime = Date.now()

            let chunkSize: number

            if (fileSizeInMB < 30) {
              chunkSize = 6 * 1024 * 1024 // 6MB
            } else if (fileSizeInMB < 100) {
              chunkSize = Math.floor(file.size / 8) // maximum 8 chunks, 12,5MB each
            } else if (fileSizeInMB < 500) {
              chunkSize = Math.floor(file.size / 10) // maximum 10 chunks, 50MB each
            } else if (fileSizeInMB < 1024) {
              chunkSize = Math.floor(file.size / 20) // maximum 20 chunks, 50MB each
            } else if (fileSizeInMB < 10 * 1024) {
              chunkSize = Math.floor(file.size / 30) // maximum 30 chunks, 333MB each
            } else {
              chunkSize = Math.floor(file.size / 50) // maximum 50 chunks
            }

            // Max chunk size is 500MB
            chunkSize = Math.min(chunkSize, 500 * 1024 * 1024)
            const uploadDataDuringCreation = file.size <= chunkSize

            const upload = new tus.Upload(file, {
              endpoint: state.resumableUploadUrl,
              retryDelays: [0, 200, 500, 1500, 3000, 5000],
              headers: {
                'x-source': 'supabase-dashboard',
              },
              uploadDataDuringCreation: uploadDataDuringCreation,
              removeFingerprintOnSuccess: true,
              metadata: {
                bucketName,
                objectName: formattedPathToFile,
                ...fileOptions,
              },
              chunkSize,
              onBeforeRequest: async (req) => {
                try {
                  // Use the shared temporary key for batch uploads
                  // This checks if the key is still valid and refreshes if needed
                  const { apiKey } = await getOrRefreshTemporaryApiKey(state.projectRef)
                  req.setHeader('apikey', apiKey)
                  if (!IS_PLATFORM) {
                    req.setHeader('Authorization', `Bearer ${apiKey}`)
                  }
                } catch (error) {
                  throw error
                }
              },
              onShouldRetry(error) {
                const status = error.originalResponse ? error.originalResponse.getStatus() : 0
                const doNotRetryStatuses = [400, 403, 404, 409, 413, 415, 429]

                return !doNotRetryStatuses.includes(status)
              },
              onError: (error) => {
                numberOfFilesUploadedFail += 1
                if (error instanceof tus.DetailedError) {
                  const status = error.originalResponse?.getStatus()

                  switch (status) {
                    case 415: {
                      // Unsupported mime type
                      toast.error(
                        capitalize(
                          error?.originalResponse?.getBody() ||
                            `Failed to upload ${file.name}: ${metadata.mimetype} is not allowed`
                        ),
                        {
                          description: `Allowed MIME types: ${state.selectedBucket.allowed_mime_types?.join(', ')}`,
                        }
                      )
                      break
                    }
                    case 413: {
                      // Payload too large
                      toast.error(
                        `Failed to upload ${file.name}: File size exceeds the bucket file size limit.`
                      )
                      break
                    }
                    case 409: {
                      // Resource already exists
                      toast.error(`Failed to upload ${file.name}: File name already exists.`)
                      break
                    }
                    case 400: {
                      const responseBody = error.originalResponse?.getBody()
                      if (typeof responseBody === 'string') {
                        if (responseBody.includes('Invalid key:')) {
                          toast.error(`Failed to upload ${file.name}: File name is invalid.`)
                          break
                        }

                        if (responseBody.includes('Invalid Compact JWS')) {
                          toast.error(`Failed to upload ${file.name}: Invalid Compact JWS.`)
                          break
                        }
                      }
                      // if it's not handled by the two ifs, fallthrough to the default case which shows the generic error message
                    }
                    default: {
                      toast.error(`Failed to upload ${file.name}: ${error.message}`)
                      break
                    }
                  }
                } else {
                  toast.error(`Failed to upload ${file.name}: ${error.message}`)
                }
                reject(error)
              },
              onProgress: (bytesSent, bytesTotal) => {
                if (startingBytes === 0 && bytesSent > chunkSize) {
                  startingBytes = bytesSent
                }

                const percentage = bytesTotal === 0 ? 0 : bytesSent / bytesTotal
                const realBytesSent = bytesSent - startingBytes
                const elapsed = (Date.now() - startTime) / 1000 // in seconds
                const uploadSpeed = realBytesSent / elapsed // in bytes per second
                const remainingBytes = bytesTotal - realBytesSent
                const remainingTime = remainingBytes / uploadSpeed // in seconds

                state.uploadProgresses[index] = {
                  percentage,
                  elapsed,
                  uploadSpeed,
                  remainingBytes,
                  remainingTime,
                }
                state.onUploadProgress(toastId)
              },
              onSuccess() {
                numberOfFilesUploadedSuccess += 1
                resolve()
              },
            })

            if (!Array.isArray(state.abortUploadCallbacks[toastId])) {
              state.abortUploadCallbacks[toastId] = []
            }
            state.abortUploadCallbacks[toastId].push(() => {
              try {
                upload.abort(true)
              } catch (error) {
                // Ignore error
              }
              reject(new Error('Upload aborted by user'))
            })

            // Check if there are any previous uploads to continue.
            return upload.findPreviousUploads().then((previousUploads) => {
              // Found previous uploads so we select the first one.
              if (previousUploads.length) {
                upload.resumeFromPreviousUpload(previousUploads[0])
              }

              upload.start()
            })
          })
        }
      })

      // For file uploads specifically, we have to lower the batch size for now as the client side
      // is just unable to handle such volumes of transfer
      // [Joshen] I realised this can be simplified with just a vanilla for loop, no need for reduce
      // Just take note, but if it's working fine, then it's okay
      const batchedPromises = chunk(promises, 10)
      try {
        await batchedPromises.reduce(async (previousPromise, nextBatch) => {
          await previousPromise
          await Promise.allSettled(nextBatch.map((batch) => batch()))
          state.onUploadProgress(toastId)
        }, Promise.resolve())

        if (numberOfFilesUploadedSuccess > 0) {
          await deleteBucketObject({
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            paths: [`${pathToFile}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
          })
        }

        await state.refetchAllOpenedFolders()

        if (
          numberOfFilesToUpload === 0 ||
          (numberOfFilesUploadedSuccess === 0 && numberOfFilesUploadedFail === 0)
        ) {
          toast.dismiss(toastId)
        } else if (numberOfFilesUploadedFail === numberOfFilesToUpload) {
          if (numberOfFilesToUpload === 1) {
            // [Joshen] We'd already be showing a toast when the upload files, so this is to prevent a
            // duplicate error toast if its only one file that's getting uploaded
            toast.dismiss(toastId)
          } else {
            toast.error(
              `Failed to upload ${numberOfFilesToUpload} file${numberOfFilesToUpload > 1 ? 's' : ''}!`,
              { id: toastId, closeButton: true, duration: SONNER_DEFAULT_DURATION }
            )
          }
        } else if (numberOfFilesUploadedSuccess === numberOfFilesToUpload) {
          toast.success(
            `Successfully uploaded ${numberOfFilesToUpload} file${
              numberOfFilesToUpload > 1 ? 's' : ''
            }!`,
            { id: toastId, closeButton: true, duration: SONNER_DEFAULT_DURATION }
          )
        } else {
          toast.success(
            `Successfully uploaded ${numberOfFilesUploadedSuccess} out of ${numberOfFilesToUpload} file${
              numberOfFilesToUpload > 1 ? 's' : ''
            }!`,
            { id: toastId, closeButton: true, duration: SONNER_DEFAULT_DURATION }
          )
        }
      } catch (e) {
        toast.error('Failed to upload files', {
          id: toastId,
          closeButton: true,
          duration: SONNER_DEFAULT_DURATION,
        })
      }

      const t2 = new Date()
      console.log(
        `Total time taken for ${formattedFilesToUpload.length} files: ${((t2 as any) - (t1 as any)) / 1000} seconds`
      )
    },

    /** Entry point for the "Move" dialog — drag and drop calls moveItems directly */
    moveFiles: async (newPathToFile: string) => {
      const items = [...state.selectedItemsToMove]
      state.setSelectedItemsToMove([])
      await state.moveItems(items, compact(newPathToFile.split('/')).join('/'))
    },

    /**
     * Expands the items into the individual objects that have to move. Storage has no notion of
     * a folder, so moving one means moving every object that sits beneath it.
     */
    getObjectsToMove: async (
      items: StorageItemWithColumn[],
      destinationPath: string
    ): Promise<ObjectMove[]> => {
      const movesPerItem = await Promise.all(
        items.map(async (item) => {
          const itemPath = getItemPath(state.openedFolders, item)

          if (item.type !== STORAGE_ROW_TYPES.FOLDER) {
            return [{ from: itemPath, to: joinPaths(destinationPath, item.name) }]
          }

          const objects = await state.getAllItemsAlongFolder(item)
          return getFolderObjectMoves({ folderPath: itemPath, destinationPath, objects })
        })
      )

      return movesPerItem.flat()
    },

    /** A folder that has been moved away can no longer be open, so step back to its parent */
    closeMovedFolders: (items: StorageItemWithColumn[]) => {
      const movedOpenFolders = items.filter(
        (item) =>
          item.type === STORAGE_ROW_TYPES.FOLDER &&
          state.openedFolders[item.columnIndex]?.name === item.name
      )
      if (movedOpenFolders.length === 0) return

      const columnIndex = Math.min(...movedOpenFolders.map((item) => item.columnIndex))
      state.popOpenedFoldersAtIndex(columnIndex - 1)
    },

    /** A folder disappears once its last object leaves, so reinstate the placeholder if one emptied */
    restoreEmptiedSourceFolders: async (items: StorageItemWithColumn[]) => {
      const sourceFolderPaths = uniq(
        items.map((item) => getColumnPath(state.openedFolders, item.columnIndex))
      ).filter((path) => path.length > 0)

      await Promise.all(sourceFolderPaths.map((path) => state.validateParentFolderEmpty(path)))
    },

    /** True while a move is running, so nothing can queue a second batch on top of it */
    isMovingItems: false,

    /**
     * Moves files and folders into another folder of the same bucket.
     *
     * Every object moves in its own request, so the batch is capped twice: once on the items the
     * user picked, and again on the objects those items expand into — a single folder can hold
     * far more files than the cap allows. One move runs at a time for the same reason: batches
     * started back to back would put the load on the API that the cap exists to avoid.
     */
    moveItems: async (items: StorageItemWithColumn[], destinationPath: string) => {
      if (state.isMovingItems) {
        return toast.warning('Another move is still running. Try again once it finishes.')
      }

      if (!isWithinMoveLimit(items.length)) {
        return toast.error(
          `Can't move ${items.length} items at once. Select up to ${MAX_ITEMS_PER_MOVE} items and try again.`
        )
      }

      state.isMovingItems = true
      try {
        await state.runMove(items, destinationPath)
      } catch (error) {
        toast.error(`Failed to move items: ${(error as ResponseError).message}`)
      } finally {
        state.isMovingItems = false
      }
    },

    /** The move itself. Go through moveItems, which guards the batch size and concurrency */
    runMove: async (items: StorageItemWithColumn[], destinationPath: string) => {
      // Pinned up front: the explorer reuses one state object across buckets, so switching
      // bucket part way through a move would otherwise retarget the remaining requests.
      const bucketId = state.selectedBucket.id
      const destinationLabel = destinationPath.length > 0 ? destinationPath : 'the bucket root'
      const toastId = toast.loading('Preparing to move items...', { position: 'top-right' })

      let objectsToMove: ObjectMove[] = []
      try {
        objectsToMove = await state.getObjectsToMove(items, destinationPath)
      } catch (error) {
        return toast.error('Failed to read the contents of the folders being moved', {
          id: toastId,
          closeButton: true,
          duration: SONNER_DEFAULT_DURATION,
        })
      }

      if (objectsToMove.length === 0) return toast.dismiss(toastId)

      if (!isWithinMoveLimit(objectsToMove.length)) {
        return toast.error(`Can't move ${objectsToMove.length} files at once`, {
          id: toastId,
          closeButton: true,
          duration: SONNER_DEFAULT_DURATION,
          description: `Moves are limited to ${MAX_ITEMS_PER_MOVE} files. Move this folder's contents in smaller batches instead.`,
        })
      }

      state.clearSelectedItems()
      state.setSelectedFilePreview(undefined)

      const message = `Moving ${objectsToMove.length} file${objectsToMove.length > 1 ? 's' : ''} to ${destinationLabel}`
      const showProgress = (progress: number, description: string = STORAGE_PROGRESS_INFO_TEXT) =>
        toast(<SonnerProgress progress={progress} message={message} description={description} />, {
          id: toastId,
          closeButton: false,
          position: 'top-right',
          duration: Infinity,
        })

      showProgress(0)

      let completed = 0
      let failed = 0

      for (const { from, to } of objectsToMove) {
        const hasMoved = await moveObjectWithRetry({
          projectRef: state.projectRef,
          bucketId,
          from,
          to,
          onRetry: ({ attempt, secondsLeft, isRateLimited }) =>
            showProgress(
              (completed / objectsToMove.length) * 100,
              `${isRateLimited ? 'API rate limited' : 'Error moving file'} - retrying in ${secondsLeft} seconds (${attempt}/${MOVE_RETRY_ATTEMPTS})`
            ),
        })

        if (!hasMoved) failed += 1
        completed += 1
        showProgress((completed / objectsToMove.length) * 100)
      }

      const outcomeMessage = getMoveOutcomeMessage({
        total: objectsToMove.length,
        failed,
        destinationLabel,
      })
      const notify = failed === 0 ? toast.success : toast.error
      notify(outcomeMessage, {
        id: toastId,
        closeButton: true,
        duration: SONNER_DEFAULT_DURATION,
      })

      await state.restoreEmptiedSourceFolders(items)
      state.closeMovedFolders(items)

      // TODO: invalidate the file preview cache when moving files
      await state.refetchAllOpenedFolders()
    },

    deleteFiles: async ({
      files,
      isDeleteFolder = false,
    }: {
      files: (StorageItemWithColumn & { prefix?: string })[]
      isDeleteFolder?: boolean
    }) => {
      state.setSelectedFilePreview(undefined)

      // If every file has the 'prefix' property, then just construct the prefix
      // directly (from delete folder). Otherwise go by the opened folders.
      const prefixes = !files.some((f) => f.prefix)
        ? files.map((file) => {
            const { name, columnIndex } = file
            const pathToFile = state.openedFolders
              .slice(0, columnIndex)
              .map((folder) => folder.name)
              .join('/')
            state.updateRowStatus({ name, status: STORAGE_ROW_STATUS.LOADING, columnIndex })
            return pathToFile.length > 0 ? `${pathToFile}/${name}` : name
          })
        : files.map((file) => `${file.prefix}/${file.name}`)

      state.clearSelectedItems()

      const toastId = toast.loading(`Deleting ${prefixes.length} file(s)...`)

      try {
        await deleteBucketObject({
          projectRef: state.projectRef,
          bucketId: state.selectedBucket.id,
          paths: prefixes,
        })

        if (!isDeleteFolder) {
          // If parent folders are empty, reinstate .emptyFolderPlaceholder to persist them
          const parentFolderPrefixes = uniq(
            prefixes.map((prefix) => {
              const segments = prefix.split('/')
              return segments.slice(0, segments.length - 1).join('/')
            })
          )
          await Promise.all(
            parentFolderPrefixes.map((prefix) => state.validateParentFolderEmpty(prefix))
          )

          toast.success(`Successfully deleted ${prefixes.length} file(s)`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
            description: undefined,
          })
          await state.refetchAllOpenedFolders()
          state.setSelectedItemsToDelete([])
        } else {
          toast.dismiss(toastId)
        }
      } catch (err) {
        if (!isDeleteFolder) {
          toast.error(`Failed to delete ${prefixes.length} file(s)`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
            description: (err as ResponseError).message,
          })

          if (!files.some((f) => f.prefix)) {
            files.forEach((file) => {
              const { name, columnIndex } = file
              state.updateRowStatus({ name, status: STORAGE_ROW_STATUS.READY, columnIndex })
            })
          }
        } else {
          toast.dismiss(toastId)
          throw err
        }
      }
    },

    downloadFile: async (file: StorageItemWithColumn, showToast = true) => {
      if (!file.path) {
        toast.error('Failed to download: Unable to find path to file')
        return false
      }

      const fileName: string = file.name
      const fileMimeType = file?.metadata?.mimetype ?? undefined

      const toastId = showToast ? toast.loading(`Retrieving ${fileName}...`) : undefined

      try {
        const url = await fetchFileUrl(
          file.path,
          state.projectRef,
          state.selectedBucket.id,
          state.selectedBucket.public
        )
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to retrieve file ${file.path}`)
        const data = await response.blob()

        const newBlob = new Blob([data], { type: fileMimeType ?? data.type })
        const blobUrl = window.URL.createObjectURL(newBlob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.setAttribute('download', `${fileName}`)
        document.body.appendChild(link)
        link.click()
        link.parentNode?.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)

        if (toastId) {
          toast.success(`Downloading ${fileName}`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        }
        return true
      } catch (err) {
        if (toastId) {
          toast.error(`Failed to download ${fileName}`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        }
        return false
      }
    },

    downloadFileAsBlob: async (file: StorageItemWithColumn) => {
      if (!file.path) return false

      try {
        const url = await fetchFileUrl(
          file.path,
          state.projectRef,
          state.selectedBucket.id,
          state.selectedBucket.public
        )
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to retrieve file ${file.path}`)
        const data = await response.blob()

        const fileMimeType = file?.metadata?.mimetype ?? undefined
        return { name: file.name, blob: new Blob([data], { type: fileMimeType ?? data.type }) }
      } catch (err) {
        console.error('Failed to download file', file.path)
        return false
      }
    },

    downloadSelectedFiles: async (files: StorageItemWithColumn[]) => {
      const lowestColumnIndex = Math.min(...files.map((file) => file.columnIndex))

      const formattedFilesWithPrefix: any[] = files.map((file) => {
        const { name, columnIndex } = file
        const pathToFile = state.openedFolders
          .slice(lowestColumnIndex, columnIndex)
          .map((folder) => folder.name)
          .join('/')
        const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${name}` : name
        return { ...file, formattedPathToFile }
      })

      let progress = 0
      const toastId = toast.loading(
        `Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`
      )

      const promises = formattedFilesWithPrefix.map((file) => {
        return () => {
          return new Promise<{ name: string; blob: Blob } | boolean>(async (resolve) => {
            const data = await state.downloadFileAsBlob(file)
            progress = progress + 1 / formattedFilesWithPrefix.length
            if (isObject(data)) {
              resolve({ ...data, name: file.formattedPathToFile })
            }
            resolve(false)
          })
        }
      })

      // Increase batch size to 50 since Storage API doesn't throttle like Management API
      const batchedPromises = chunk(promises, 50)
      const downloadedFiles = await batchedPromises.reduce(async (previousPromise, nextBatch) => {
        const previousResults = await previousPromise
        const batchResults = await Promise.allSettled(nextBatch.map((batch) => batch()))
        toast(
          <SonnerProgress
            progress={progress * 100}
            message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
          />,
          { id: toastId, closeButton: false, position: 'top-right' }
        )
        return previousResults.concat(batchResults.map((x: any) => x.value).filter(Boolean))
      }, Promise.resolve<{ name: string; blob: Blob }[]>([]))

      const zipFileWriter = new BlobWriter('application/zip')
      const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })
      downloadedFiles.forEach((file) => {
        zipWriter.add(file.name, new BlobReader(file.blob))
      })

      const blobURL = URL.createObjectURL(await zipWriter.close())
      const link = document.createElement('a')
      link.href = blobURL
      link.setAttribute('download', `supabase-files.zip`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)

      toast.success(`Successfully downloaded ${downloadedFiles.length} files`, {
        id: toastId,
        closeButton: true,
        duration: SONNER_DEFAULT_DURATION,
      })
    },

    renameFile: async (file: StorageItem, newName: string, columnIndex: number) => {
      const originalName = file.name
      if (originalName === newName || newName.length === 0) {
        state.updateRowStatus({ name: originalName, status: STORAGE_ROW_STATUS.READY, columnIndex })
      } else {
        state.updateRowStatus({
          name: originalName,
          status: STORAGE_ROW_STATUS.LOADING,
          columnIndex,
          updatedName: newName,
        })
        const pathToFile = getPathAlongFoldersToIndex(state, columnIndex)

        const fromPath = pathToFile.length > 0 ? `${pathToFile}/${originalName}` : originalName
        const toPath = pathToFile.length > 0 ? `${pathToFile}/${newName}` : newName

        try {
          await moveStorageObject({
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            from: fromPath,
            to: toPath,
          })

          toast.success(`Successfully renamed "${originalName}" to "${newName}"`)

          // TODO: Should we invalidate the file preview cache when renaming files?

          if (state.selectedFilePreview?.name === originalName) {
            const { previewUrl, ...fileData } = file as any
            state.setSelectedFilePreview({ ...fileData, name: newName })
          }

          await state.refetchAllOpenedFolders()
        } catch (error: any) {
          toast.error(`Failed to rename file: ${error.message}`)
          state.updateRowStatus({
            name: originalName,
            status: STORAGE_ROW_STATUS.READY,
            columnIndex,
          })
        }
      }
    },

    // ======== UI Helper functions ========

    selectRangeItems: (columnIndex: number, toItemIndex: number) => {
      const columnItems = state.columns[columnIndex].items
      const toItem = columnItems[toItemIndex]
      const selectedItemIds = state.selectedItems.map((item) => item.id)
      const lastSelectedItemId = selectedItemIds[selectedItemIds.length - 1]
      const lastSelectedItemIndex = findIndex(columnItems, { id: lastSelectedItemId })

      // Get the start and end index of the range to select
      const start = Math.min(toItemIndex, lastSelectedItemIndex)
      const end = Math.max(toItemIndex, lastSelectedItemIndex)

      // Get the range to select and reverse the order if necessary
      const rangeToSelect = columnItems
        .slice(start, end + 1)
        // we need `columnIndex` in all item of `selectedItems`
        .map((item) => ({ ...item, columnIndex }))
      if (toItemIndex < lastSelectedItemIndex) {
        rangeToSelect.reverse()
      }

      if (selectedItemIds.includes(toItem.id)) {
        const rangeToDeselectIds = rangeToSelect.map((item) => item.id)
        // Deselect all items within the selection range
        state.setSelectedItems(
          state.selectedItems.filter(
            (item) => item.id === toItem.id || !rangeToDeselectIds.includes(item.id)
          )
        )
      } else {
        // Select items within the range
        state.setSelectedItems(uniqBy(state.selectedItems.concat(rangeToSelect), 'id'))
      }
    },

    addTempRow: ({
      type,
      name,
      status,
      columnIndex,
      metadata,
      isPrepend = false,
    }: {
      type: STORAGE_ROW_TYPES
      name: string
      status: STORAGE_ROW_STATUS
      columnIndex: number
      metadata: StorageItemMetadata | null
      isPrepend?: boolean
    }) => {
      const updatedColumns = state.columns.map((column, idx) => {
        if (idx === columnIndex) {
          const tempRow = { type, name, status, metadata } as StorageItem
          const updatedItems = isPrepend
            ? [tempRow].concat(column.items)
            : column.items.concat([tempRow])
          return { ...column, items: updatedItems }
        }
        return column
      })
      state.columns = updatedColumns
    },

    removeTempRows: (columnIndex: number) => {
      const updatedColumns = state.columns.map((column, idx) => {
        if (idx === columnIndex) {
          const updatedItems = column.items.filter((item) => has(item, 'id'))
          return { ...column, items: updatedItems }
        }
        return column
      })
      state.columns = updatedColumns
    },

    onUploadProgress: (toastId?: string | number) => {
      const totalFiles = state.uploadProgresses.length
      const progress =
        (state.uploadProgresses.reduce((acc, { percentage }) => acc + percentage, 0) / totalFiles) *
        100
      const remainingTime = calculateTotalRemainingTime(state.uploadProgresses)

      return toast(
        <SonnerProgress
          progress={progress}
          message={`Uploading ${totalFiles} file${totalFiles > 1 ? 's' : ''}...`}
          progressPrefix={`${remainingTime && !isNaN(remainingTime) && isFinite(remainingTime) && remainingTime !== 0 ? `${formatTime(remainingTime)} remaining – ` : ''}`}
          action={
            toastId && (
              <Button size="tiny" className="ml-6" onClick={() => state.abortUploads(toastId)}>
                Cancel
              </Button>
            )
          }
        />,
        { id: toastId, closeButton: false, position: 'top-right', duration: Infinity }
      )
    },

    updateRowStatus: ({
      name,
      status,
      columnIndex,
      updatedName,
    }: {
      name: string
      status: STORAGE_ROW_STATUS
      columnIndex?: number
      updatedName?: string
    }) => {
      const columnIndex_ = columnIndex !== undefined ? columnIndex : state.getLatestColumnIndex()
      const updatedColumns = state.columns.map((column, idx) => {
        if (idx === columnIndex_) {
          const updatedColumnItems = column.items.map((item) => {
            return item.name === name
              ? {
                  ...item,
                  status,
                  ...(updatedName && { name: updatedName }),
                }
              : item
          })
          return { ...column, items: updatedColumnItems }
        }
        return column
      })
      state.columns = updatedColumns
    },
  })

  return state
}

export type StorageExplorerState = ReturnType<typeof createStorageExplorerState>

const createDefaultStateConfig = () => ({
  projectRef: '',
  connectionString: '',
  resumableUploadUrl: '',
  clientEndpoint: '',
  bucket: {} as Bucket,
})

const StorageExplorerStateContext = createContext<StorageExplorerState>(
  createStorageExplorerState(createDefaultStateConfig())
)

export const StorageExplorerStateContextProvider = ({ children }: PropsWithChildren) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: bucket } = useSelectedBucket()
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  const [state, setState] = useState(() => createStorageExplorerState(createDefaultStateConfig()))
  const stateRef = useLatest(state)

  const {
    storageEndpoint,
    hostEndpoint,
    isSuccess: isSuccessSettings,
  } = useProjectApiUrl({ projectRef: project?.ref })

  // [Joshen] JFYI opting with the useEffect here as the storage explorer state was being loaded
  // before the project details were ready, hence the store kept returning project ref as undefined
  // Can be verified when we're saving the storage explorer preferences into local storage, that ref is undefined
  // So the useEffect here is to make sure that the project ref is loaded into the state properly
  // Although I'd be keen to re-investigate this to see if we can remove this
  useEffect(() => {
    const hasDataReady = !!project && !!bucket
    const storeAlreadyLoaded = state.projectRef === project?.ref

    if (!isPaused && hasDataReady && !storeAlreadyLoaded && isSuccessSettings) {
      const clientEndpoint = storageEndpoint ?? hostEndpoint ?? ''
      const resumableUploadUrl = `${clientEndpoint}/storage/v1/upload/resumable`

      setState(
        createStorageExplorerState({
          projectRef: project.ref,
          connectionString: project.connectionString ?? '',
          bucket,
          resumableUploadUrl,
          clientEndpoint,
        })
      )
    }
  }, [
    state.projectRef,
    project,
    stateRef,
    isPaused,
    hostEndpoint,
    storageEndpoint,
    isSuccessSettings,
    bucket,
  ])

  // [Monica] The effect above only refreshes `selectedBucket` when the project changes, so
  // editing the current bucket (e.g. toggling public/private) doesn't update it there. This
  // keeps `selectedBucket` synced to the bucket query on every change, so Get URL always
  // uses the current public/private state instead of a stale one from initial load.
  useEffect(() => {
    if (bucket && state.projectRef === project?.ref) {
      state.selectedBucket = bucket
    }
  }, [bucket, project?.ref, state.projectRef])

  return (
    <StorageExplorerStateContext.Provider value={state}>
      {children}
    </StorageExplorerStateContext.Provider>
  )
}

export function useStorageExplorerStateSnapshot(options?: Parameters<typeof useSnapshot>[1]) {
  const state = useContext(StorageExplorerStateContext)
  return useSnapshot(state, options) as StorageExplorerState
}
