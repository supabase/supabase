import { capitalize, chunk, compact, find, findIndex, has, isObject, uniq, uniqBy } from 'lodash'
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { useLatest } from 'react-use'
import { toast } from 'sonner'
import * as tus from 'tus-js-client'
import { proxy, useSnapshot } from 'valtio'

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { LOCAL_STORAGE_KEYS } from 'common'
import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from 'components/interfaces/Storage/Storage.constants'
import {
  StorageColumn,
  StorageItem,
  StorageItemMetadata,
  StorageItemWithColumn,
} from 'components/interfaces/Storage/Storage.types'
import {
  calculateTotalRemainingTime,
  downloadFile,
  EMPTY_FOLDER_PLACEHOLDER_FILE_NAME,
  formatFolderItems,
  formatTime,
  getFilesDataTransferItems,
} from 'components/interfaces/Storage/StorageExplorer/StorageExplorer.utils'
import { convertFromBytes } from 'components/interfaces/Storage/StorageSettings/StorageSettings.utils'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { configKeys } from 'data/config/keys'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { ProjectStorageConfigResponse } from 'data/config/project-storage-config-query'
import { getQueryClient } from 'data/query-client'
import { deleteBucketObject } from 'data/storage/bucket-object-delete-mutation'
import { downloadBucketObject } from 'data/storage/bucket-object-download-mutation'
import { listBucketObjects, StorageObject } from 'data/storage/bucket-objects-list-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { moveStorageObject } from 'data/storage/object-move-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { tryParseJson } from 'lib/helpers'
import { lookupMime } from 'lib/mime'
import { Button, SONNER_DEFAULT_DURATION, SonnerProgress } from 'ui'

type UploadProgress = {
  percentage: number
  elapsed: number
  uploadSpeed: number
  remainingBytes: number
  remainingTime: number
}

const LIMIT = 200
const OFFSET = 0
const BATCH_SIZE = 2

const DEFAULT_PREFERENCES = {
  view: STORAGE_VIEWS.COLUMNS,
  sortBy: STORAGE_SORT_BY.NAME,
  sortByOrder: STORAGE_SORT_BY_ORDER.ASC,
}
const STORAGE_PROGRESS_INFO_TEXT = "Do not close the browser until it's completed"

let abortController: any
if (typeof window !== 'undefined') {
  abortController = new AbortController()
}

function createStorageExplorerState({
  projectRef,
  resumableUploadUrl,
  serviceKey,
  supabaseClient,
}: {
  projectRef: string
  resumableUploadUrl: string
  serviceKey: string
  supabaseClient?: SupabaseClient<any, 'public', any>
}) {
  const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
  const { view, sortBy, sortByOrder } =
    (typeof window !== 'undefined' && tryParseJson(localStorage?.getItem(localStorageKey))) ||
    DEFAULT_PREFERENCES

  const state = proxy({
    projectRef,
    supabaseClient,
    resumableUploadUrl,
    serviceKey,
    uploadProgresses: [] as UploadProgress[],

    // abortController,
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

    selectedBucket: {} as Bucket,
    setSelectedBucket: (bucket: Bucket) => {
      state.selectedBucket = bucket
      state.setSelectedFilePreview(undefined)
      state.clearOpenedFolders()
      state.clearSelectedItems()
    },

    setSelectedItemToRename: (file: { name: string; columnIndex: number }) => {
      state.updateRowStatus({
        name: file.name,
        status: STORAGE_ROW_STATUS.EDITING,
        columnIndex: file.columnIndex,
      })
    },

    view,
    setView: (value: STORAGE_VIEWS) => {
      state.view = value
      state.updateExplorerPreference()
    },

    sortBy,
    setSortBy: async (value: STORAGE_SORT_BY) => {
      state.sortBy = value
      state.updateExplorerPreference()
      state.setSelectedFilePreview(undefined)
      await state.refetchAllOpenedFolders()
    },

    sortByOrder,
    setSortByOrder: async (value: STORAGE_SORT_BY_ORDER) => {
      state.sortByOrder = value
      state.updateExplorerPreference()
      state.setSelectedFilePreview(undefined)
      await state.refetchAllOpenedFolders()
    },

    isSearching: false,
    setIsSearching: (value: boolean) => (state.isSearching = value),

    selectedFilePreview: undefined as StorageItemWithColumn | undefined,
    setSelectedFilePreview: (file?: StorageItemWithColumn) => (state.selectedFilePreview = file),

    selectedFileCustomExpiry: undefined as StorageItem | undefined,
    setSelectedFileCustomExpiry: (item?: StorageItem) => (state.selectedFileCustomExpiry = item),

    updateExplorerPreference: () => {
      const localStorageKey = LOCAL_STORAGE_KEYS.STORAGE_PREFERENCE(projectRef)
      const { view, sortBy, sortByOrder } = state
      localStorage.setItem(localStorageKey, JSON.stringify({ view, sortBy, sortByOrder }))
    },

    // Functions that manage the UI of the Storage Explorer

    getLatestColumnIndex: () => {
      return state.columns.length - 1
    },

    setColumnIsLoadingMore: (index: number, isLoadingMoreItems: boolean = true) => {
      state.columns = state.columns.map((col, idx) => {
        return idx === index ? { ...col, isLoadingMoreItems } : col
      })
    },

    openBucket: async (bucket: Bucket) => {
      const { id, name } = bucket
      state.setSelectedBucket(bucket)
      await state.fetchFolderContents({
        bucketId: bucket.id,
        folderId: id,
        folderName: name,
        index: -1,
      })
    },

    // ======== Folders CRUD ========

    getPathAlongOpenedFolders: (includeBucket = true) => {
      if (includeBucket) {
        return state.openedFolders.length > 0
          ? `${state.selectedBucket.name}/${state.openedFolders.map((folder) => folder.name).join('/')}`
          : state.selectedBucket.name
      }
      return state.openedFolders.map((folder) => folder.name).join('/')
    },

    getPathAlongFoldersToIndex: (index: number) => {
      return state.openedFolders
        .slice(0, index)
        .map((folder) => folder.name)
        .join('/')
    },

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

    addNewFolder: async (folderName: string, columnIndex: number) => {
      if (!state.supabaseClient) return console.error('Supabase Client is missing')

      const autofix = false
      const formattedName = state.sanitizeNameForDuplicateInColumn({
        name: folderName,
        autofix,
        columnIndex,
      })
      if (formattedName === null) return

      if (!/^[a-zA-Z0-9_-\s]*$/.test(formattedName)) {
        return toast.error('Folder name contains invalid special characters')
      }

      if (formattedName.length === 0) {
        return state.removeTempRows(columnIndex)
      }

      state.updateFolderAfterEdit({ folderName: formattedName, columnIndex })

      const emptyPlaceholderFile = `${formattedName}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
      const pathToFolder = state.openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .join('/')
      const formattedPathToEmptyPlaceholderFile =
        pathToFolder.length > 0 ? `${pathToFolder}/${emptyPlaceholderFile}` : emptyPlaceholderFile

      await state.supabaseClient.storage
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
      state.pushColumnAtIndex(
        { id: folderId, name: folderName, status: STORAGE_ROW_STATUS.LOADING, items: [] },
        index
      )

      const prefix = state.openedFolders
        .slice(0, index + 1)
        .map((folder) => folder.name)
        .join('/')
      const options = {
        limit: LIMIT,
        offset: OFFSET,
        search: searchString,
        sortBy: { column: state.sortBy, order: state.sortByOrder },
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

      const prefix = state.openedFolders.map((folder) => folder.name).join('/')
      const options = {
        limit: LIMIT,
        offset: column.items.length,
        search: searchString,
        sortBy: { column: state.sortBy, order: state.sortByOrder },
      }

      try {
        const data = await listBucketObjects(
          {
            projectRef: state.projectRef,
            bucketId: state.selectedBucket.id,
            path: prefix,
            options,
          },
          abortController?.signal
        )

        // Add items to column
        const formattedItems = formatFolderItems(data, prefix)
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
          return { id: path, name: path, status: STORAGE_ROW_STATUS.LOADING, items: [] }
        })
      }

      const foldersItems = await Promise.all(
        pathsWithEmptyPrefix.map(async (path, idx) => {
          const prefix = paths.slice(0, idx).join('/')
          const options = {
            limit: LIMIT,
            offset: OFFSET,
            search: searchString,
            sortBy: { column: state.sortBy, order: state.sortByOrder },
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
            sortBy: { column: state.sortBy, order: state.sortByOrder },
          },
        })

        if (data.length === 0) {
          const prefixToPlaceholder = `${parentFolderPrefix}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
          await state.supabaseClient?.storage
            .from(state.selectedBucket.name)
            .upload(prefixToPlaceholder, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME))
        }
      } catch (error) {}
    },

    deleteFolder: async (folder: StorageItemWithColumn) => {
      try {
        const isDeleteFolder = true
        const files = await state.getAllItemsAlongFolder(folder)
        await state.deleteFiles({ files: files as any[], isDeleteFolder })

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

    renameFolder: async (folder: StorageItemWithColumn, newName: string, columnIndex: number) => {
      const originalName = folder.name
      if (originalName === newName) {
        return state.updateRowStatus({
          name: originalName,
          status: STORAGE_ROW_STATUS.READY,
          columnIndex,
        })
      }

      const toastId = toast(
        <SonnerProgress progress={0} message={`Renaming folder to ${newName}`} />,
        { closeButton: false, position: 'top-right' }
      )

      try {
        /**
         * Catch any folder names that contain slash or backslash
         *
         * this is because slashes are used to denote
         * children/parent relationships in bucket
         *
         * todo: move this to a util file, as createFolder() uses same logic
         */
        if (newName.includes('/') || newName.includes('\\')) {
          return toast.error(`Folder name cannot contain forward or back slashes.`)
        }

        state.updateRowStatus({
          name: originalName,
          status: STORAGE_ROW_STATUS.LOADING,
          columnIndex,
          updatedName: newName,
        })
        const files = await state.getAllItemsAlongFolder(folder)

        let progress = 0
        let hasErrors = false

        // Make this batched promises into a reusable function for storage, i think this will be super helpful
        const promises = files.map((file) => {
          const fromPath = `${file.prefix}/${file.name}`
          const pathSegments = fromPath.split('/')
          const toPath = pathSegments
            .slice(0, columnIndex)
            .concat(newName)
            .concat(pathSegments.slice(columnIndex + 1))
            .join('/')
          return () => {
            return new Promise<void>(async (resolve) => {
              progress = progress + 1 / files.length
              try {
                await moveStorageObject({
                  projectRef: state.projectRef,
                  bucketId: state.selectedBucket.id,
                  from: fromPath,
                  to: toPath,
                })
              } catch (error) {
                hasErrors = true
                toast.error(`Failed to move ${fromPath} to the new folder`)
              }
              resolve()
            })
          }
        })

        const batchedPromises = chunk(promises, BATCH_SIZE)
        // [Joshen] I realised this can be simplified with just a vanilla for loop, no need for reduce
        // Just take note, but if it's working fine, then it's okay

        await batchedPromises.reduce(async (previousPromise, nextBatch) => {
          await previousPromise
          await Promise.all(nextBatch.map((batch) => batch()))
          toast(
            <SonnerProgress progress={progress * 100} message={`Renaming folder to ${newName}`} />,
            { id: toastId, closeButton: false, position: 'top-right' }
          )
        }, Promise.resolve())

        if (!hasErrors) {
          toast.success(`Successfully renamed folder to ${newName}`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        } else {
          toast.error(`Renamed folder to ${newName} with some errors`, {
            id: toastId,
            closeButton: true,
            duration: SONNER_DEFAULT_DURATION,
          })
        }

        if (state.openedFolders[columnIndex].name === folder.name) {
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

        const promises = files.map((file) => {
          const fileMimeType = (file.metadata?.mimetype as string) ?? null
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
                const data = await downloadBucketObject({
                  projectRef: state.projectRef,
                  bucketId: state.selectedBucket.id,
                  path: `${file.prefix}/${file.name}`,
                })
                progress = progress + 1 / files.length

                const blob = await data.blob()
                resolve({
                  name: file.name,
                  prefix: file.prefix,
                  blob: new Blob([blob], { type: fileMimeType }),
                })
              } catch (error) {
                console.error('Failed to download file', `${file.prefix}/${file.name}`)
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
        sortBy: { column: state.sortBy, order: state.sortByOrder },
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
      if (!state.serviceKey) {
        toast(
          <p>
            Uploading files to Storage through the dashboard is currently unavailable with the new
            API keys. Please re-enable{' '}
            <InlineLink href={`/project/${state.projectRef}/settings/api-keys`}>
              legacy JWT keys
            </InlineLink>{' '}
            if you'd like to upload files to Storage through the dashboard.
          </p>
        )
        return
      }

      const queryClient = getQueryClient()
      const storageConfiguration = queryClient
        .getQueryCache()
        .find(configKeys.storage(state.projectRef))?.state.data as
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
              {value}
              {unit}.
            </p>
            <p className="text-foreground-light">
              You can change the global file size upload limit in{' '}
              <InlineLink href={`/project/${state.projectRef}/settings/storage`}>
                Storage settings
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
            const newTopLevelFolder = state.sanitizeNameForDuplicateInColumn({
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
          ? state.sanitizeNameForDuplicateInColumn({ name: file.name, autofix })
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
              chunkSize = 6 * 1024 * 1024
            } else if (fileSizeInMB < 100) {
              chunkSize = Math.floor(file.size / 8)
            } else if (fileSizeInMB < 500) {
              chunkSize = Math.floor(file.size / 10)
            } else if (fileSizeInMB < 1024) {
              chunkSize = Math.floor(file.size / 20)
            } else if (fileSizeInMB < 10 * 1024) {
              chunkSize = Math.floor(file.size / 30)
            } else {
              chunkSize = Math.floor(file.size / 50)
            }

            // Max chunk size is 500MB
            chunkSize = Math.min(chunkSize, 500 * 1024 * 1024)
            const uploadDataDuringCreation = file.size <= chunkSize

            const upload = new tus.Upload(file, {
              endpoint: state.resumableUploadUrl,
              retryDelays: [0, 200, 500, 1500, 3000, 5000],
              headers: {
                authorization: `Bearer ${state.serviceKey}`,
                'x-source': 'supabase-dashboard',
                ...(state.serviceKey.includes('secret') ? { apikey: state.serviceKey } : {}),
              },
              uploadDataDuringCreation: uploadDataDuringCreation,
              removeFingerprintOnSuccess: true,
              metadata: {
                bucketName,
                objectName: formattedPathToFile,
                ...fileOptions,
              },
              chunkSize,
              onShouldRetry(error) {
                const status = error.originalResponse ? error.originalResponse.getStatus() : 0
                const doNotRetryStatuses = [400, 403, 404, 409, 413, 415, 429]

                return !doNotRetryStatuses.includes(status)
              },
              onError: (error) => {
                numberOfFilesUploadedFail += 1
                if (error instanceof tus.DetailedError) {
                  const status = error.originalResponse?.getStatus()
                  if (status === 415) {
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
                  } else if (status === 413) {
                    // Payload too large
                    toast.error(
                      `Failed to upload ${file.name}: File size exceeds the bucket upload limit.`
                    )
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
          toast.error(
            `Failed to upload ${numberOfFilesToUpload} file${numberOfFilesToUpload > 1 ? 's' : ''}!`,
            { id: toastId, closeButton: true, duration: SONNER_DEFAULT_DURATION }
          )
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

    moveFiles: async (newPathToFile: string) => {
      const newPaths = compact(newPathToFile.split('/'))
      const formattedNewPathToFile = newPaths.join('/')
      let numberOfFilesMovedFail = 0
      state.clearSelectedItems()

      const toastId = toast(
        `Moving ${state.selectedItemsToMove.length} file${state.selectedItemsToMove.length > 1 ? 's' : ''}...`,
        {
          description: STORAGE_PROGRESS_INFO_TEXT,
          duration: Infinity,
        }
      )

      await Promise.all(
        state.selectedItemsToMove.map(async (item) => {
          const pathToFile = state.openedFolders
            .slice(0, item.columnIndex)
            .map((folder) => folder.name)
            .join('/')

          const fromPath = pathToFile.length > 0 ? `${pathToFile}/${item.name}` : item.name
          const toPath =
            newPathToFile.length > 0 ? `${formattedNewPathToFile}/${item.name}` : item.name

          try {
            await moveStorageObject({
              projectRef: state.projectRef,
              bucketId: state.selectedBucket.id,
              from: fromPath,
              to: toPath,
            })
          } catch (error: any) {
            numberOfFilesMovedFail += 1
            toast.error(error.message)
          }
        })
      )

      if (numberOfFilesMovedFail === state.selectedItemsToMove.length) {
        toast.error('Failed to move files')
      } else {
        toast(
          `Successfully moved ${
            state.selectedItemsToMove.length - numberOfFilesMovedFail
          } files to ${formattedNewPathToFile.length > 0 ? formattedNewPathToFile : 'the root of your bucket'}`
        )
      }

      toast.dismiss(toastId)

      // TODO: invalidate the file preview cache when moving files
      await state.refetchAllOpenedFolders()
      state.setSelectedItemsToMove([])
    },

    deleteFiles: async ({
      files,
      isDeleteFolder = false,
    }: {
      files: (StorageItemWithColumn & { prefix?: string })[]
      isDeleteFolder?: boolean
    }) => {
      state.setSelectedFilePreview(undefined)
      let progress = 0

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

      const toastId = toast(
        <SonnerProgress progress={0} message={`Deleting ${prefixes.length} file(s)...`} />,
        { closeButton: false, position: 'top-right' }
      )

      // batch BATCH_SIZE prefixes per request
      const batches = chunk(prefixes, BATCH_SIZE).map((batch) => () => {
        progress = progress + batch.length / prefixes.length
        return deleteBucketObject({
          projectRef: state.projectRef,
          bucketId: state.selectedBucket.id,
          paths: batch as string[],
        })
      })

      // make BATCH_SIZE requests at the same time
      await chunk(batches, BATCH_SIZE).reduce(async (previousPromise, nextBatch) => {
        await previousPromise
        await Promise.all(nextBatch.map((batch) => batch()))
        toast(
          <SonnerProgress
            progress={progress * 100}
            message={`Deleting ${prefixes.length} file(s)...`}
          />,
          {
            id: toastId,
            closeButton: false,
            position: 'top-right',
          }
        )
      }, Promise.resolve())

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
      const returnBlob = true
      const toastId = toast.loading(
        `Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`
      )

      const promises = formattedFilesWithPrefix.map((file) => {
        return () => {
          return new Promise<{ name: string; blob: Blob } | boolean>(async (resolve) => {
            const data = await downloadFile({
              projectRef: state.projectRef,
              bucketId: state.selectedBucket.id,
              file,
              returnBlob,
            })
            progress = progress + 1 / formattedFilesWithPrefix.length
            if (isObject(data)) {
              resolve({ ...data, name: file.formattedPathToFile })
            }
            resolve(false)
          })
        }
      })

      const batchedPromises = chunk(promises, 10)
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
        const pathToFile = state.getPathAlongFoldersToIndex(columnIndex)

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

    sanitizeNameForDuplicateInColumn: ({
      name,
      columnIndex,
      autofix = false,
    }: {
      name: string
      columnIndex?: number
      autofix?: boolean
    }) => {
      const columnIndex_ = columnIndex !== undefined ? columnIndex : state.getLatestColumnIndex()
      const currentColumn = state.columns[columnIndex_]
      const currentColumnItems = currentColumn.items.filter(
        (item) => item.status !== STORAGE_ROW_STATUS.EDITING
      )
      const hasSameNameInColumn = currentColumnItems.filter((item) => item.name === name).length > 0

      if (hasSameNameInColumn) {
        if (autofix) {
          const [fileName, fileExt] = name.split('.')
          const dupeNameRegex = new RegExp(
            `${fileName} \\([-0-9]+\\)${fileExt ? '.' + fileExt : ''}$`
          )
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
              <Button
                size="tiny"
                type="default"
                className="ml-6"
                onClick={() => state.abortUploads(toastId)}
              >
                Cancel
              </Button>
            )
          }
        />,
        { id: toastId, closeButton: false, position: 'top-right' }
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

type StorageExplorerState = ReturnType<typeof createStorageExplorerState>

const DEFAULT_STATE_CONFIG = {
  projectRef: '',
  resumableUploadUrl: '',
  serviceKey: '',
  supabaseClient: undefined,
}

const StorageExplorerStateContext = createContext<StorageExplorerState>(
  createStorageExplorerState(DEFAULT_STATE_CONFIG)
)

export const StorageExplorerStateContextProvider = ({ children }: PropsWithChildren) => {
  const project = useSelectedProject()
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE

  const [state, setState] = useState(() => createStorageExplorerState(DEFAULT_STATE_CONFIG))
  const stateRef = useLatest(state)

  const { data: apiKeys } = useAPIKeysQuery({ projectRef: project?.ref, reveal: true })
  const { data: settings } = useProjectSettingsV2Query({ projectRef: project?.ref })

  const { serviceKey } = getKeys(apiKeys)
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const resumableUploadUrl = `${IS_PLATFORM ? 'https' : protocol}://${endpoint}/storage/v1/upload/resumable`

  // [Joshen] JFYI opting with the useEffect here as the storage explorer state was being loaded
  // before the project details were ready, hence the store kept returning project ref as undefined
  // Can be verified when we're saving the storage explorer preferences into local storage, that ref is undefined
  // So the useEffect here is to make sure that the project ref is loaded into the state properly
  // Although I'd be keen to re-investigate this to see if we can remove this
  useEffect(() => {
    const hasDataReady = !!project?.ref
    const serviceApiKey = serviceKey?.api_key ?? 'unknown'

    if (!isPaused && hasDataReady) {
      const clientEndpoint = `${IS_PLATFORM ? 'https' : protocol}://${endpoint}`
      const supabaseClient = createClient(clientEndpoint, serviceApiKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            getItem: (key) => {
              return null
            },
            setItem: (key, value) => {},
            removeItem: (key) => {},
          },
        },
      })

      setState(
        createStorageExplorerState({
          projectRef: project?.ref ?? '',
          supabaseClient,
          resumableUploadUrl,
          serviceKey: serviceApiKey,
        })
      )
    }
  }, [
    project?.ref,
    stateRef,
    serviceKey?.api_key,
    isPaused,
    resumableUploadUrl,
    protocol,
    endpoint,
  ])

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
