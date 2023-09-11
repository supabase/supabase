import { createClient } from '@supabase/supabase-js'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { chunk, compact, find, findIndex, has, isEqual, some, uniq, uniqBy } from 'lodash'
import { makeAutoObservable } from 'mobx'
import { createContext, useContext } from 'react'
import toast from 'react-hot-toast'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_SORT_BY,
  STORAGE_VIEWS,
} from 'components/to-be-cleaned/Storage/Storage.constants.ts'
import { useStore } from 'hooks'
import { delete_, post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { PROJECT_ENDPOINT_PROTOCOL } from 'pages/api/constants'

/**
 * This is a preferred method rather than React Context and useStorageExplorerStore().
 * If we can switch to this method, we can remove the implementation below, and we don't need compose() within the react components
 */
let store = null
export function useStorageStore() {
  if (store === null) store = new StorageExplorerStore(null)
  return store
}

/**
 * Deprecated - it's preferable to use the useStorageStore() function above
 */
export const StorageExplorerContext = createContext(null)
export const useStorageExplorerStore = () => {
  return useContext(StorageExplorerContext)
}

const CORRUPTED_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
const LIMIT = 200
const OFFSET = 0
const DEFAULT_EXPIRY = 10 * 365 * 24 * 60 * 60 // in seconds, default to 10 years
const PREVIEW_SIZE_LIMIT = 10000000 // 10MB
const BATCH_SIZE = 2
const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = '.emptyFolderPlaceholder'
const STORAGE_PROGRESS_INFO_TEXT = "Please do not close the browser until it's completed"

class StorageExplorerStore {
  projectRef = ''
  loaded = false
  view = STORAGE_VIEWS.COLUMNS
  sortBy = STORAGE_SORT_BY.NAME
  sortByOrder = 'asc'
  buckets = []
  selectedBucket = {}
  columns = []
  openedFolders = []
  selectedItems = []
  selectedItemsToDelete = []
  selectedItemsToMove = []
  selectedFilePreview = {}
  selectedFileCustomExpiry = undefined

  DEFAULT_OPTIONS = {
    limit: LIMIT,
    offset: OFFSET,
    sortBy: { column: this.sortBy, order: this.sortByOrder },
  }

  /* UI store */
  ui = null

  /* Supabase client */
  supabaseClient = null
  /* [Joshen] Move towards using API */
  endpoint = ''

  /* FE Cacheing for file previews */
  filePreviewCache = []

  /* For file uploads, from 0 to 1 */
  uploadProgress = 0

  /* Controllers to abort API calls */
  abortController = null

  constructor(projectRef) {
    makeAutoObservable(this, { supabaseClient: false })
    this.projectRef = projectRef
    // eslint-disable-next-line react-hooks/rules-of-hooks
    this.ui = useStore().ui

    // ignore when in a non-browser environment
    if (typeof window !== 'undefined') {
      this.abortController = new AbortController()
    }
  }

  initStore(projectRef, url, serviceKey, protocol = PROJECT_ENDPOINT_PROTOCOL) {
    this.projectRef = projectRef
    this.endpoint = `${API_URL}/storage/${projectRef}`
    if (serviceKey !== undefined) this.initializeSupabaseClient(serviceKey, url, protocol)
  }

  /* Methods which are commonly used + For better readability */

  initializeSupabaseClient = (serviceKey, serviceEndpoint, protocol) => {
    this.supabaseClient = createClient(
      `${IS_PLATFORM ? 'https' : protocol}://${serviceEndpoint}`,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          multiTab: false,
          detectSessionInUrl: false,
          localStorage: {
            getItem: (key) => {
              return undefined
            },
            setItem: (key, value) => {},
            removeItem: (key) => {},
          },
        },
      }
    )
  }

  updateFileInPreviewCache = (fileCache) => {
    const updatedFilePreviewCache = this.filePreviewCache.map((file) => {
      if (file.id === fileCache.id) return fileCache
      return file
    })
    this.filePreviewCache = updatedFilePreviewCache
  }

  addFileToPreviewCache = (fileCache) => {
    const updatedFilePreviewCache = this.filePreviewCache.concat([fileCache])
    this.filePreviewCache = updatedFilePreviewCache
  }

  clearFilePreviewCache = () => {
    this.filePreviewCache = []
  }

  getLocalStorageKey = () => {
    return `supabase-storage-${this.projectRef}`
  }

  getLatestColumnIndex = () => {
    return this.columns.length - 1
  }

  getCurrentlySelectedBucket = () => {
    return this.columns.length > 1 ? this.columns[1] : null
  }

  // Probably refactor this to ignore bucket by default
  getPathAlongOpenedFolders = (includeBucket = true) => {
    if (includeBucket) {
      return this.openedFolders.length > 0
        ? `${this.selectedBucket.name}/${this.openedFolders.map((folder) => folder.name).join('/')}`
        : this.selectedBucket.name
    }
    return this.openedFolders.map((folder) => folder.name).join('/')
  }

  abortApiCalls = () => {
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  get currentBucketName() {
    return this.selectedBucket.name
  }

  /* UI specific methods */

  setLoaded = (val) => {
    this.loaded = val
  }

  setSelectedBucket = (bucket) => {
    this.selectedBucket = bucket
    this.clearOpenedFolders()
    this.closeFilePreview()
    this.clearSelectedItems()
  }

  setView = (view) => {
    this.view = view
    this.closeFilePreview()
    this.updateExplorerPreferences()
  }

  setSortBy = async (sortBy) => {
    this.sortBy = sortBy
    this.closeFilePreview()
    this.updateExplorerPreferences()
    await this.refetchAllOpenedFolders()
  }

  setSortByOrder = async (sortByOrder) => {
    this.sortByOrder = sortByOrder
    this.closeFilePreview()
    this.updateExplorerPreferences()
    await this.refetchAllOpenedFolders()
  }

  clearColumns = () => {
    this.columns = []
  }

  pushColumnAtIndex = (column, index) => {
    this.columns = this.columns.slice(0, index + 1).concat([column])
  }

  popColumn = () => {
    this.abortApiCalls()
    this.columns = this.columns.slice(0, this.getLatestColumnIndex())
  }

  popColumnAtIndex = (index) => {
    this.columns = this.columns.slice(0, index + 1)
  }

  setColumnIsLoadingMore = (index, isLoadingMoreItems = true) => {
    this.columns = this.columns.map((col, idx) => {
      return idx === index ? { ...col, isLoadingMoreItems } : col
    })
  }

  pushOpenedFolderAtIndex = (folder, index) => {
    this.openedFolders = this.openedFolders.slice(0, index).concat(folder)
  }

  popOpenedFolders = () => {
    this.openedFolders = this.openedFolders.slice(0, this.openedFolders.length - 1)
  }

  popOpenedFoldersAtIndex = (index) => {
    this.openedFolders = this.openedFolders.slice(0, index + 1)
  }

  clearOpenedFolders = () => {
    this.openedFolders = []
  }

  setSelectedItems = (items) => {
    this.selectedItems = items
  }

  clearSelectedItems = (columnIndex) => {
    if (columnIndex !== undefined) {
      this.selectedItems = this.selectedItems.filter((item) => item.columnIndex !== columnIndex)
    } else {
      this.selectedItems = []
    }
  }

  setSelectedItemsToDelete = (items) => {
    this.selectedItemsToDelete = items
  }

  clearSelectedItemsToDelete = () => {
    this.selectedItemsToDelete = []
  }

  setSelectedItemsToMove = (items) => {
    this.selectedItemsToMove = items
  }

  clearSelectedItemsToMove = () => {
    this.selectedItemsToMove = []
  }

  setSelectedFileCustomExpiry = (item) => {
    this.selectedFileCustomExpiry = item
  }

  addNewFolderPlaceholder = (columnIndex) => {
    const isPrepend = true
    const folderName = 'Untitled folder'
    const folderType = STORAGE_ROW_TYPES.FOLDER
    const columnIdx = columnIndex === -1 ? this.getLatestColumnIndex() : columnIndex
    this.addTempRow(folderType, folderName, STORAGE_ROW_STATUS.EDITING, columnIdx, {}, isPrepend)
  }

  addNewFolder = async (folderName, columnIndex) => {
    const autofix = false
    const formattedName = this.sanitizeNameForDuplicateInColumn(folderName, autofix, columnIndex)
    if (formattedName === null) return

    if (!/^[a-zA-Z0-9_-\s]*$/.test(formattedName)) {
      return this.ui.setNotification({
        message: 'Folder name contains invalid special characters',
        category: 'error',
        duration: 8000,
      })
    }
    /**
     * todo: move this to a util file, as renameFolder() uses same logic
     */
    if (formattedName.includes('/') || formattedName.includes('\\')) {
      return this.ui.setNotification({
        message: 'Folder names should not have forward or back slashes.',
        category: 'error',
        duration: 8000,
      })
    }
    if (formattedName.length === 0) {
      return this.removeTempRows(columnIndex)
    }

    this.updateFolderAfterEdit(formattedName, columnIndex)

    const emptyPlaceholderFile = `${formattedName}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
    const pathToFolder = this.openedFolders
      .slice(0, columnIndex)
      .map((folder) => folder.name)
      .join('/')
    const formattedPathToEmptyPlaceholderFile =
      pathToFolder.length > 0 ? `${pathToFolder}/${emptyPlaceholderFile}` : emptyPlaceholderFile

    await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .upload(formattedPathToEmptyPlaceholderFile, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME))

    if (pathToFolder.length > 0) {
      await delete_(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects`, {
        paths: [`${pathToFolder}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
      })
    }
  }

  setFilePreview = async (file) => {
    const size = file.metadata?.size
    const mimeType = file.metadata?.mimetype

    if (mimeType && size) {
      // Skip fetching of file preview if file is too big
      if (size > PREVIEW_SIZE_LIMIT) {
        this.selectedFilePreview = { ...file, previewUrl: 'skipped' }
        return
      }

      // Either retrieve file preview from FE cache or retrieve signed url
      this.selectedFilePreview = { ...file, previewUrl: 'loading' }
      const cachedPreview = find(this.filePreviewCache, { id: file.id })

      const fetchedAt = cachedPreview?.fetchedAt ?? null
      const expiresIn = cachedPreview?.expiresIn ?? null
      const existsInCache = fetchedAt !== null && expiresIn !== null
      const isExpired = existsInCache ? fetchedAt + expiresIn * 1000 < Date.now() : true

      if (!isExpired) {
        this.selectedFilePreview = { ...file, previewUrl: cachedPreview.url }
      } else {
        const previewUrl = await this.fetchFilePreview(file.name)
        const formattedPreviewUrl = this.selectedBucket.public
          ? `${previewUrl}?t=${new Date().toISOString()}`
          : previewUrl
        this.selectedFilePreview = { ...file, previewUrl: formattedPreviewUrl }

        const fileCache = {
          id: file.id,
          url: previewUrl,
          expiresIn: DEFAULT_EXPIRY,
          fetchedAt: Date.now(),
        }
        if (!existsInCache) {
          this.addFileToPreviewCache(fileCache)
        } else {
          this.updateFileInPreviewCache(fileCache)
        }
      }
    } else {
      this.selectedFilePreview = { ...file, previewUrl: null }
    }
  }

  closeFilePreview = () => {
    this.selectedFilePreview = {}
  }

  getFileUrl = async (file, expiresIn = 0) => {
    const filePreview = find(this.filePreviewCache, { id: file.id })
    if (filePreview !== undefined && expiresIn === 0) {
      return filePreview.url
    } else {
      const signedUrl = await this.fetchFilePreview(file.name, expiresIn)
      const formattedUrl = new URL(signedUrl)
      formattedUrl.searchParams.set('t', new Date().toISOString())
      const fileUrl = formattedUrl.toString()

      // Also save it to cache
      const fileCache = {
        id: file.id,
        url: fileUrl,
        expiresIn: DEFAULT_EXPIRY,
        fetchedAt: Date.now(),
      }
      this.addFileToPreviewCache(fileCache)

      return fileUrl
    }
  }

  /* Methods that involve the storage client library */
  /* Bucket CRUD */
  openBucket = async (bucket) => {
    const { id, name } = bucket
    const columnIndex = -1
    if (!isEqual(this.selectedBucket, bucket)) {
      this.setSelectedBucket(bucket)
      await this.fetchFolderContents(id, name, columnIndex)
    }
  }

  /* Files CRUD */

  getFile = async (fileEntry) => {
    try {
      return await new Promise((resolve, reject) => fileEntry.file(resolve, reject))
    } catch (err) {
      console.error('getFile error:', err)
      return undefined
    }
  }

  // https://stackoverflow.com/a/53058574
  getFilesDataTransferItems = async (items) => {
    const toastId = this.ui.setNotification({
      category: 'loading',
      message: 'Retrieving items to upload...',
    })
    const files = []
    const queue = []
    for (const item of items) {
      queue.push(item.webkitGetAsEntry())
    }
    while (queue.length > 0) {
      const entry = queue.shift() || {}
      if (entry.isFile) {
        const file = await this.getFile(entry)
        if (file !== undefined) {
          file.path = entry.fullPath.slice(1)
          files.push(file)
        }
      } else if (entry.isDirectory) {
        queue.push(...(await this.readAllDirectoryEntries(entry.createReader())))
      }
    }
    toast.dismiss(toastId)
    return files
  }

  // Get all the entries (files or sub-directories) in a directory
  // by calling readEntries until it returns empty array
  readAllDirectoryEntries = async (directoryReader) => {
    const entries = []
    let readEntries = await this.readEntriesPromise(directoryReader)
    while (readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await this.readEntriesPromise(directoryReader)
    }
    return entries
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  readEntriesPromise = async (directoryReader) => {
    try {
      return await new Promise((resolve, reject) => {
        directoryReader.readEntries(resolve, reject)
      })
    } catch (err) {
      console.error('readEntriesPromise error:', err)
    }
  }

  uploadFiles = async (files, columnIndex, isDrop = false) => {
    const t1 = new Date()

    const autofix = true
    // We filter out any folders which are just '#' until we can properly encode such characters in the URL
    const filesToUpload = isDrop
      ? (await this.getFilesDataTransferItems(files)).filter((file) => !file.path.includes('#/'))
      : Array.from(files)
    const derivedColumnIndex = columnIndex === -1 ? this.getLatestColumnIndex() : columnIndex

    // If we're uploading a folder which name already exists in the same folder that we're uploading to
    // We sanitize the folder name and let all file uploads through. (This is only via drag drop)
    const topLevelFolders = (this.columns?.[derivedColumnIndex]?.items ?? [])
      .filter((item) => !item.id)
      .map((item) => item.name)
    const formattedFilesToUpload = filesToUpload.map((file) => {
      // If the files are from clicking "Upload button", just take them as they are since users cannot
      // upload folders from clicking that button, only via drag drop
      if (!file.path) return file

      const path = file.path.split('/')
      const topLevelFolder = path.length > 1 ? path[0] : null
      if (topLevelFolders.includes(topLevelFolder)) {
        const newTopLevelFolder = this.sanitizeNameForDuplicateInColumn(
          topLevelFolder,
          autofix,
          columnIndex
        )
        path[0] = newTopLevelFolder
        file.path = path.join('/')
      }
      return file
    })

    this.uploadProgress = 0
    const uploadedTopLevelFolders = []
    const numberOfFilesToUpload = formattedFilesToUpload.length
    let numberOfFilesUploadedSuccess = 0
    let numberOfFilesUploadedFail = 0

    const pathToFile = this.openedFolders
      .slice(0, derivedColumnIndex)
      .map((folder) => folder.name)
      .join('/')

    const toastId = this.ui.setNotification({
      category: 'loading',
      message: `Uploading ${formattedFilesToUpload.length} file${
        formattedFilesToUpload.length > 1 ? 's' : ''
      }...`,
      description: STORAGE_PROGRESS_INFO_TEXT,
      progress: 0,
    })

    // Upload files in batches
    const promises = formattedFilesToUpload.map((file) => {
      const fileOptions = { cacheControl: '3600' }
      const metadata = { mimetype: file.type, size: file.size }

      const isWithinFolder = (file?.path ?? '').split('/').length > 1
      const fileName = !isWithinFolder
        ? this.sanitizeNameForDuplicateInColumn(file.name, autofix)
        : file.name
      const formattedFileName = has(file, ['path']) && isWithinFolder ? file.path : fileName
      const formattedPathToFile =
        pathToFile.length > 0 ? `${pathToFile}/${formattedFileName}` : formattedFileName

      if (isWithinFolder) {
        const topLevelFolder = file.path.split('/')[0]
        if (!uploadedTopLevelFolders.includes(topLevelFolder)) {
          this.addTempRow(
            STORAGE_ROW_TYPES.FOLDER,
            topLevelFolder,
            STORAGE_ROW_STATUS.LOADING,
            derivedColumnIndex,
            metadata
          )
          uploadedTopLevelFolders.push(topLevelFolder)
        }
      } else {
        this.addTempRow(
          STORAGE_ROW_TYPES.FILE,
          fileName,
          STORAGE_ROW_STATUS.LOADING,
          derivedColumnIndex,
          metadata
        )
      }

      return () => {
        return new Promise(async (resolve) => {
          const { error } = await this.supabaseClient.storage
            .from(this.selectedBucket.name)
            .upload(formattedPathToFile, file, fileOptions)

          this.uploadProgress = this.uploadProgress + 1 / formattedFilesToUpload.length

          if (error) {
            numberOfFilesUploadedFail += 1
            this.ui.setNotification({
              message: `Failed to upload ${file.name}: ${error.message}`,
              category: 'error',
            })
            resolve()
          } else {
            numberOfFilesUploadedSuccess += 1
            resolve()
          }
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
        this.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: `Uploading ${formattedFilesToUpload.length} file${
            formattedFilesToUpload.length > 1 ? 's' : ''
          }...`,
          description: STORAGE_PROGRESS_INFO_TEXT,
          progress: this.uploadProgress * 100,
        })
      }, Promise.resolve())

      if (numberOfFilesUploadedSuccess > 0) {
        await delete_(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects`, {
          paths: [`${pathToFile}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
        })
      }

      await this.refetchAllOpenedFolders()

      if (numberOfFilesToUpload === 0) {
        toast.dismiss(toastId)
      } else if (numberOfFilesUploadedFail === numberOfFilesToUpload) {
        this.ui.setNotification({
          id: toastId,
          category: 'error',
          message: `Failed to upload ${numberOfFilesToUpload} file${
            numberOfFilesToUpload > 1 ? 's' : ''
          }!`,
        })
      } else if (numberOfFilesUploadedSuccess === numberOfFilesToUpload) {
        this.ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Successfully uploaded ${numberOfFilesToUpload} file${
            numberOfFilesToUpload > 1 ? 's' : ''
          }!`,
        })
      } else {
        this.ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Successfully uploaded ${numberOfFilesUploadedSuccess} out of ${numberOfFilesToUpload} file${
            numberOfFilesToUpload > 1 ? 's' : ''
          }!`,
        })
      }
    } catch (e) {
      this.ui.setNotification({
        id: toastId,
        error: e,
        message: 'Failed to upload files',
        category: 'error',
      })
    }

    const t2 = new Date()
    console.log(
      `Total time taken for ${formattedFilesToUpload.length} files: ${(t2 - t1) / 1000} seconds`
    )
  }

  moveFiles = async (newPathToFile) => {
    const newPaths = compact(newPathToFile.split('/'))
    const formattedNewPathToFile = newPaths.join('/')
    let numberOfFilesMovedFail = 0
    this.clearSelectedItems()

    const infoToastId = toast('Please do not close the browser until the move is completed', {
      duration: Infinity,
    })

    await Promise.all(
      this.selectedItemsToMove.map(async (item) => {
        const pathToFile = this.openedFolders
          .slice(0, item.columnIndex)
          .map((folder) => folder.name)
          .join('/')

        const fromPath = pathToFile.length > 0 ? `${pathToFile}/${item.name}` : item.name
        const toPath =
          newPathToFile.length > 0 ? `${formattedNewPathToFile}/${item.name}` : item.name

        const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/move`, {
          from: fromPath,
          to: toPath,
        })
        if (res.error) {
          numberOfFilesMovedFail += 1
          this.ui.setNotification({ category: 'error', message: res.error.message })
        }
      })
    )

    if (numberOfFilesMovedFail === this.selectedItemsToMove.length) {
      this.ui.setNotification({
        message: 'Failed to move files',
        category: 'error',
      })
    } else {
      this.ui.setNotification({
        message: `Successfully moved ${
          this.selectedItemsToMove.length - numberOfFilesMovedFail
        } to ${formattedNewPathToFile}`,
        category: 'success',
      })
    }

    toast.dismiss(infoToastId)

    // Clear file preview cache if moved files exist in cache
    const idsOfItemsToMove = this.selectedItemsToMove.map((item) => item.id)
    const updatedFilePreviewCache = this.filePreviewCache.filter(
      (file) => !idsOfItemsToMove.includes(file.id)
    )
    this.filePreviewCache = updatedFilePreviewCache

    await this.refetchAllOpenedFolders()
    this.clearSelectedItemsToMove()
  }

  fetchFilePreview = async (fileName, expiresIn = 0) => {
    const includeBucket = false
    const pathToFile = this.getPathAlongOpenedFolders(includeBucket)
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName

    if (this.selectedBucket.public) {
      const res = await post(
        `${this.endpoint}/buckets/${this.selectedBucket.id}/objects/public-url`,
        { path: formattedPathToFile }
      )
      if (!res.error) {
        return res.publicUrl
      } else {
        this.ui.setNotification({
          category: 'error',
          message: `Failed to fetch public file preview: ${res.error.message}`,
        })
      }
    } else {
      const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/sign`, {
        path: formattedPathToFile,
        expiresIn: expiresIn || DEFAULT_EXPIRY,
      })
      if (!res.error) {
        return res.signedUrl
      } else {
        this.ui.setNotification({
          category: 'error',
          message: `Failed to fetch signed url preview: ${res.error.message}`,
        })
      }
    }
    return null
  }

  deleteFiles = async (files, isDeleteFolder = false) => {
    this.closeFilePreview()
    let progress = 0

    // If every file has the 'prefix' property, then just construct the prefix
    // directly (from delete folder). Otherwise go by the opened folders.
    const prefixes = !some(files, 'prefix')
      ? files.map((file) => {
          const { name, columnIndex } = file
          const pathToFile = this.openedFolders
            .slice(0, columnIndex)
            .map((folder) => folder.name)
            .join('/')
          this.updateRowStatus(name, STORAGE_ROW_STATUS.LOADING, columnIndex)
          return pathToFile.length > 0 ? `${pathToFile}/${name}` : name
        })
      : files.map((file) => `${file.prefix}/${file.name}`)

    this.clearSelectedItems()

    const toastId = this.ui.setNotification({
      category: 'loading',
      message: `Deleting ${prefixes.length} file(s)...`,
      description: STORAGE_PROGRESS_INFO_TEXT,
      progress: 0,
    })

    // batch BATCH_SIZE prefixes per request
    const batches = chunk(prefixes, BATCH_SIZE).map((batch) => () => {
      progress = progress + batch.length / prefixes.length
      return delete_(`${this.endpoint}/buckets/${this.selectedBucket.name}/objects`, {
        paths: batch,
      })
    })

    // make BATCH_SIZE requests at the same time
    await chunk(batches, BATCH_SIZE).reduce(async (previousPromise, nextBatch) => {
      await previousPromise
      await Promise.all(nextBatch.map((batch) => batch()))
      this.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Deleting ${prefixes.length} file(s)...`,
        description: STORAGE_PROGRESS_INFO_TEXT,
        progress: progress * 100,
      })
    }, Promise.resolve())

    // Clear file preview cache if deleted files exist in cache
    const idsOfFilesDeleted = files.map((file) => file.id)
    const updatedFilePreviewCache = this.filePreviewCache.filter(
      (file) => !idsOfFilesDeleted.includes(file.id)
    )
    this.filePreviewCache = updatedFilePreviewCache

    if (!isDeleteFolder) {
      // If parent folders are empty, reinstate .emptyFolderPlaceholder to persist them
      const parentFolderPrefixes = uniq(
        prefixes.map((prefix) => {
          const segments = prefix.split('/')
          return segments.slice(0, segments.length - 1).join('/')
        })
      )
      await Promise.all(
        parentFolderPrefixes.map((prefix) => this.validateParentFolderEmpty(prefix))
      )
      this.ui.setNotification({
        id: toastId,
        category: 'success',
        message: `Successfully deleted ${prefixes.length} file(s)`,
      })
      await this.refetchAllOpenedFolders()
      this.clearSelectedItemsToDelete()
    } else {
      toast.dismiss(toastId)
    }
  }

  downloadFolder = async (folder) => {
    let progress = 0
    const toastId = this.ui.setNotification({
      category: 'loading',
      message: 'Retrieving files from folder...',
    })

    const files = await this.getAllItemsAlongFolder(folder)

    this.ui.setNotification({
      id: toastId,
      category: 'loading',
      message: `Downloading ${files.length} files...`,
      description: STORAGE_PROGRESS_INFO_TEXT,
      progress: 0,
    })

    const promises = files.map((file) => {
      const fileMimeType = file.metadata?.mimetype ?? null
      return () => {
        return new Promise(async (resolve) => {
          const res = await post(
            `${this.endpoint}/buckets/${this.selectedBucket.id}/objects/download`,
            { path: `${file.prefix}/${file.name}` }
          )
          progress = progress + 1 / files.length

          if (!res.error) {
            const blob = await res.blob()
            resolve({
              name: file.name,
              prefix: file.prefix,
              blob: new Blob([blob], { type: fileMimeType }),
            })
          } else {
            console.error('Failed to download file', `${file.prefix}/${file.name}`)
            resolve(false)
          }
        })
      }
    })

    const batchedPromises = chunk(promises, 10)
    const downloadedFiles = await batchedPromises.reduce(async (previousPromise, nextBatch) => {
      const previousResults = await previousPromise
      const batchResults = await Promise.allSettled(nextBatch.map((batch) => batch()))
      this.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`,
        description: STORAGE_PROGRESS_INFO_TEXT,
        progress: progress * 100,
      })
      return (previousResults ?? []).concat(batchResults.map((x) => x.value).filter(Boolean))
    }, Promise.resolve())

    const zipFileWriter = new BlobWriter('application/zip')
    const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true })

    if (downloadedFiles.length === 0) {
      return this.ui.setNotification({
        id: toastId,
        category: 'error',
        message: `Failed to download files from "${folder.name}"`,
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
    link.parentNode.removeChild(link)

    this.ui.setNotification({
      id: toastId,
      category: 'success',
      message:
        downloadedFiles.length === files.length
          ? `Successfully downloaded folder "${folder.name}"`
          : `Downloaded folder "${folder.name}". However, ${
              files.length - downloadedFiles.length
            } files did not download successfully.`,
    })
  }

  downloadSelectedFiles = async (files) => {
    const lowestColumnIndex = Math.min(...files.map((file) => file.columnIndex))

    const formattedFilesWithPrefix = files.map((file) => {
      const { name, columnIndex } = file
      const pathToFile = this.openedFolders
        .slice(lowestColumnIndex, columnIndex)
        .map((folder) => folder.name)
        .join('/')
      const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${name}` : name
      return { ...file, formattedPathToFile }
    })

    let progress = 0
    const returnBlob = true
    const showIndividualToast = false
    const toastId = this.ui.setNotification({
      category: 'loading',
      message: `Downloading ${files.length} files...`,
    })

    const promises = formattedFilesWithPrefix.map((file) => {
      return () => {
        return new Promise(async (resolve) => {
          const data = await this.downloadFile(file, showIndividualToast, returnBlob)
          progress = progress + 1 / formattedFilesWithPrefix.length
          resolve({ ...data, name: file.formattedPathToFile })
        })
      }
    })

    const batchedPromises = chunk(promises, 10)
    const downloadedFiles = await batchedPromises.reduce(async (previousPromise, nextBatch) => {
      const previousResults = await previousPromise
      const batchResults = await Promise.allSettled(nextBatch.map((batch) => batch()))
      this.ui.setNotification({
        id: toastId,
        category: 'loading',
        message: `Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`,
        description: STORAGE_PROGRESS_INFO_TEXT,
        progress: progress * 100,
      })
      return (previousResults ?? []).concat(batchResults.map((x) => x.value).filter(Boolean))
    }, Promise.resolve())

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
    link.parentNode.removeChild(link)

    this.ui.setNotification({
      id: toastId,
      category: 'success',
      message: `Successfully downloaded ${downloadedFiles.length} files`,
    })
  }

  downloadFile = async (file, showToast = true, returnBlob = false) => {
    const fileName = file.name
    const fileMimeType = file?.metadata?.mimetype ?? null

    const toastId = showToast
      ? this.ui.setNotification({ category: 'loading', message: `Retrieving ${fileName}...` })
      : undefined

    const pathToFile = this.openedFolders
      .slice(0, file.columnIndex)
      .map((folder) => folder.name)
      .join('/')
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName
    const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/download`, {
      path: formattedPathToFile,
    })

    if (!res.error) {
      const blob = await res.blob()
      const newBlob = new Blob([blob], { type: fileMimeType })

      if (returnBlob) return { name: fileName, blob: newBlob }

      const blobUrl = window.URL.createObjectURL(newBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', `${fileName}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(blob)
      if (toastId) {
        this.ui.setNotification({
          id: toastId,
          category: 'success',
          message: `Downloading ${fileName}`,
        })
      }
      return true
    } else {
      if (toastId) {
        this.ui.setNotification({
          error: res.error,
          id: toastId,
          category: 'error',
          message: `Failed to download ${fileName}`,
        })
      }
      return false
    }
  }

  renameFile = async (file, newName, columnIndex) => {
    const originalName = file.name
    if (originalName === newName || newName.length === 0) {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    } else {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.LOADING, columnIndex, newName)
      const includeBucket = false
      const pathToFile = this.getPathAlongOpenedFolders(includeBucket)

      const fromPath = pathToFile.length > 0 ? `${pathToFile}/${originalName}` : originalName
      const toPath = pathToFile.length > 0 ? `${pathToFile}/${newName}` : newName

      const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/move`, {
        from: fromPath,
        to: toPath,
      })

      if (res.error) {
        this.ui.setNotification({
          category: 'error',
          message: `Failed to rename file: ${res.error.message}`,
        })
      } else {
        this.ui.setNotification({
          category: 'success',
          message: `Successfully renamed "${originalName}" to "${newName}"`,
        })

        // Clear file preview cache if the renamed file exists in the cache
        const updatedFilePreviewCache = this.filePreviewCache.filter(
          (fileCache) => fileCache.id !== file.id
        )
        this.filePreviewCache = updatedFilePreviewCache

        if (this.selectedFilePreview.name === originalName) {
          const { previewUrl, ...fileData } = file
          this.setFilePreview({ ...fileData, name: newName })
        }

        await this.refetchAllOpenedFolders()
      }
    }
  }

  /* Folders CRUD */

  fetchFolderContents = async (folderId, folderName, index, searchString = '') => {
    if (this.selectedBucket.id === undefined) return

    this.abortApiCalls()
    this.updateRowStatus(folderName, STORAGE_ROW_STATUS.LOADING, index)
    this.pushColumnAtIndex(
      { id: folderId, name: folderName, status: STORAGE_ROW_STATUS.LOADING, items: [] },
      index
    )

    const prefix = this.openedFolders
      .slice(0, index + 1)
      .map((folder) => folder.name)
      .join('/')
    const options = {
      limit: LIMIT,
      offset: OFFSET,
      search: searchString,
      sortBy: { column: this.sortBy, order: this.sortByOrder },
    }

    const res = await post(
      `${this.endpoint}/buckets/${this.selectedBucket.id}/objects/list`,
      { path: prefix, options },
      { abortSignal: this.abortController.signal }
    )

    this.updateRowStatus(folderName, STORAGE_ROW_STATUS.READY, index)

    if (!res.error) {
      const formattedItems = this.formatFolderItems(res)
      this.pushColumnAtIndex(
        {
          id: folderId || folderName,
          name: folderName,
          items: formattedItems,
          hasMoreItems: formattedItems.length === LIMIT,
          isLoadingMoreItems: false,
        },
        index
      )
    } else if (!res.error.message.includes('aborted')) {
      this.ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to retrieve folder contents from "${folderName}": ${res.error.message}`,
      })
    }
  }

  fetchMoreFolderContents = async (index, column, searchString = '') => {
    this.setColumnIsLoadingMore(index)

    const prefix = this.openedFolders.map((folder) => folder.name).join('/')
    const options = {
      limit: LIMIT,
      offset: column.items.length,
      search: searchString,
      sortBy: { column: this.sortBy, order: this.sortByOrder },
    }

    const res = await post(
      `${this.endpoint}/buckets/${this.selectedBucket.id}/objects/list`,
      { path: prefix, options },
      { abortSignal: this.abortController.signal }
    )

    if (!res.error) {
      // Add items to column
      const formattedItems = this.formatFolderItems(res)
      this.columns = this.columns.map((col, idx) => {
        if (idx === index) {
          return {
            ...col,
            items: col.items.concat(formattedItems),
            isLoadingMoreItems: false,
            hasMoreItems: res.length === LIMIT,
          }
        }
        return col
      })
    } else if (!res.error.message.includes('aborted')) {
      this.ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to retrieve folder contents from "${folderName}": ${res.error.message}`,
      })
    }
  }

  refetchAllOpenedFolders = async () => {
    const paths = this.openedFolders.map((folder) => folder.name)
    await this.fetchFoldersByPath(paths)
  }

  fetchFoldersByPath = async (paths, searchString = '', showLoading = false) => {
    if (this.selectedBucket.id === undefined) return

    const pathsWithEmptyPrefix = [''].concat(paths)

    if (showLoading) {
      this.columns = [this.selectedBucket.name].concat(paths).map((path) => {
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
          sortBy: { column: this.sortBy, order: this.sortByOrder },
        }

        const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/list`, {
          path: prefix,
          options,
        })
        if (res.error) {
          this.ui.setNotification({
            error: res.error,
            category: 'error',
            message: `Failed to fetch folders: ${res.error.message}`,
          })
          return []
        }
        return res
      })
    )

    const formattedFolders = foldersItems.map((folderItems, idx) => {
      const formattedItems = this.formatFolderItems(folderItems)
      return {
        id: null,
        name: idx === 0 ? this.selectedBucket.name : pathsWithEmptyPrefix[idx],
        items: formattedItems,
        hasMoreItems: formattedItems.length === LIMIT,
        isLoadingMoreItems: false,
      }
    })

    // Package into columns and update this.columns
    this.columns = formattedFolders

    // Update openedFolders as well
    const updatedOpenedFolders = paths.map((path, idx) => {
      const folderInfo = find(formattedFolders[idx].items, { name: path })
      // Folder doesnt exist, FE just scaffolds a "fake" folder
      if (!folderInfo) {
        return {
          id: null,
          name: path,
          type: STORAGE_ROW_TYPES.FOLDER,
          status: STORAGE_ROW_STATUS.READY,
        }
      }
      return folderInfo
    })
    this.openedFolders = updatedOpenedFolders
  }

  // Check parent folder if its empty, if yes, reinstate .emptyFolderPlaceholder
  // Used when deleting folder or deleting files
  validateParentFolderEmpty = async (parentFolderPrefix) => {
    const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.id}/objects/list`, {
      path: parentFolderPrefix,
      options: this.DEFAULT_OPTIONS,
    })
    if (!res.error && res.length === 0) {
      const prefixToPlaceholder = `${parentFolderPrefix}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
      await this.supabaseClient.storage
        .from(this.selectedBucket.name)
        .upload(prefixToPlaceholder, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME))
    }
  }

  deleteFolder = async (folder) => {
    const isDeleteFolder = true
    const files = await this.getAllItemsAlongFolder(folder)
    await this.deleteFiles(files, isDeleteFolder)

    const isFolderOpen = this.openedFolders[this.openedFolders.length - 1]?.name === folder.name
    if (isFolderOpen) {
      this.popColumnAtIndex(folder.columnIndex)
      this.popOpenedFoldersAtIndex(folder.columnIndex - 1)
    }

    const parentFolderPrefix = this.openedFolders.map((folder) => folder.name).join('/')
    if (parentFolderPrefix.length > 0) {
      await this.validateParentFolderEmpty(parentFolderPrefix)
    }

    await this.refetchAllOpenedFolders()
    this.clearSelectedItemsToDelete()

    this.ui.setNotification({
      category: 'success',
      message: `Successfully deleted ${folder.name}`,
    })
  }

  renameFolder = async (folder, newName, columnIndex) => {
    const originalName = folder.name
    if (originalName === newName) {
      return this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    }

    const toastId = this.ui.setNotification({
      category: 'loading',
      message: `Renaming folder to ${newName}`,
      description: STORAGE_PROGRESS_INFO_TEXT,
      progress: 0,
    })

    /**
     * Catch any folder names that contain slash or backslash
     *
     * this is because slashes are used to denote
     * children/parent relationships in bucket
     *
     * todo: move this to a util file, as createFolder() uses same logic
     */
    if (newName.includes('/') || newName.includes('\\')) {
      return this.ui.setNotification({
        message: `Folder name cannot contain forward or back slashes.`,
        type: 'error',
      })
    }

    this.updateRowStatus(originalName, STORAGE_ROW_STATUS.LOADING, columnIndex, newName)
    const files = await this.getAllItemsAlongFolder(folder)

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
        return new Promise(async (resolve) => {
          progress = progress + 1 / files.length
          const res = await post(
            `${this.endpoint}/buckets/${this.selectedBucket.name}/objects/move`,
            {
              from: fromPath,
              to: toPath,
            }
          )
          if (res.error) {
            hasErrors = true
            this.ui.setNotification({
              category: 'error',
              message: `Failed to move ${fromPath} to the new folder`,
            })
          }
          resolve()
        })
      }
    })

    const batchedPromises = chunk(promises, BATCH_SIZE)
    // [Joshen] I realised this can be simplified with just a vanilla for loop, no need for reduce
    // Just take note, but if it's working fine, then it's okay
    try {
      await batchedPromises.reduce(async (previousPromise, nextBatch) => {
        await previousPromise
        await Promise.all(nextBatch.map((batch) => batch()))
        this.ui.setNotification({
          id: toastId,
          category: 'loading',
          message: `Renaming folder to ${newName}`,
          description: STORAGE_PROGRESS_INFO_TEXT,
          progress: progress * 100,
        })
      }, Promise.resolve())

      if (!hasErrors) {
        this.ui.setNotification({
          id: toastId,
          message: `Successfully renamed folder to ${newName}`,
          category: 'success',
        })
      } else {
        this.ui.setNotification({
          id: toastId,
          message: `Renamed folder to ${newName} with some errors`,
          category: 'error',
        })
      }
      await this.refetchAllOpenedFolders()

      // Clear file preview cache if the moved file exists in the cache
      const fileIds = files.map((file) => file.id)
      const updatedFilePreviewCache = this.filePreviewCache.filter(
        (fileCache) => !fileIds.includes(fileCache.id)
      )
      this.filePreviewCache = updatedFilePreviewCache
    } catch (e) {
      this.ui.setNotification({
        id: toastId,
        message: `Failed to rename folder to ${newName}`,
        category: 'error',
      })
    }
  }

  /*
    Recursively returns a list of items along every directory within the specified base folder
    Each item has an extra property 'prefix' which has the prefix that leads to the item
    Used specifically for any operation that deals with every file along the folder
    e.g Delete folder, rename folder
  */
  getAllItemsAlongFolder = async (folder) => {
    const items = []

    let formattedPathToFolder = ''
    const { name, columnIndex, prefix } = folder

    if (prefix === undefined) {
      const pathToFolder = this.openedFolders
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
      sortBy: { column: this.sortBy, order: this.sortByOrder },
    }
    let folderContents = []

    for (;;) {
      const res = await post(`${this.endpoint}/buckets/${this.selectedBucket.name}/objects/list`, {
        path: formattedPathToFolder,
        options,
      })
      folderContents = folderContents.concat(res)
      options.offset += options.limit
      if ((res || []).length < options.limit) {
        break
      }
    }

    const subfolders = folderContents?.filter((item) => item.id === null) ?? []
    const folderItems = folderContents?.filter((item) => item.id !== null) ?? []

    folderItems.forEach((item) => items.push({ ...item, prefix: formattedPathToFolder }))

    const subFolderContents = await Promise.all(
      subfolders.map((folder) =>
        this.getAllItemsAlongFolder({ ...folder, prefix: formattedPathToFolder })
      )
    )
    subFolderContents.map((subfolderContent) => {
      subfolderContent.map((item) => items.push(item))
    })

    return items
  }

  /* UI Helper functions */

  sanitizeNameForDuplicateInColumn = (
    name,
    autofix = false,
    columnIndex = this.getLatestColumnIndex()
  ) => {
    const currentColumn = this.columns[columnIndex]
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
        this.ui.setNotification({
          message: `The name ${name} already exists in the current directory. Please use a different name.`,
          category: 'error',
          duration: 4000,
        })
        return null
      }
    }

    return name
  }

  formatFolderItems = (items = []) => {
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

          const itemObj = { ...item, type, status, isCorrupted }
          return itemObj
        }) ?? []
    return formattedItems
  }

  addTempRow = (type, name, status, columnIndex, metadata = {}, isPrepend = false) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const tempRow = { type, name, status, metadata }
        const updatedItems = isPrepend
          ? [tempRow].concat(column.items)
          : column.items.concat([tempRow])
        return { ...column, items: updatedItems }
      }
      return column
    })
    this.columns = updatedColumns
  }

  removeTempRows = (columnIndex) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const updatedItems = column.items.filter((item) => has(item, 'id'))
        return { ...column, items: updatedItems }
      }
      return column
    })
    this.columns = updatedColumns
  }

  setSelectedItemToRename = (file) => {
    this.updateRowStatus(file.name, STORAGE_ROW_STATUS.EDITING, file.columnIndex)
  }

  updateRowStatus = (
    name,
    status,
    columnIndex = this.getLatestColumnIndex(),
    updatedName = null
  ) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const updatedColumnItems = column.items.map((item) => {
          if (item.name === name) {
            return {
              ...item,
              status,
              ...(updatedName && { name: updatedName }),
            }
          }
          return item
        })
        return { ...column, items: updatedColumnItems }
      }
      return column
    })
    this.columns = updatedColumns
  }

  updateFolderAfterEdit = (
    folderName,
    columnIndex = this.getLatestColumnIndex(),
    status = STORAGE_ROW_STATUS.READY
  ) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
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
    this.columns = updatedColumns
  }

  /* User Preferences */

  updateExplorerPreferences = () => {
    const localStorageKey = this.getLocalStorageKey()
    const preferences = {
      view: this.view,
      sortBy: this.sortBy,
      sortByOrder: this.sortByOrder,
    }
    localStorage.setItem(localStorageKey, JSON.stringify(preferences))
    return preferences
  }

  loadExplorerPreferences = () => {
    const localStorageKey = this.getLocalStorageKey()
    const preferences = localStorage?.getItem(localStorageKey) ?? undefined
    if (preferences !== undefined) {
      const { view, sortBy, sortByOrder } = JSON.parse(preferences)
      this.view = view
      this.sortBy = sortBy
      this.sortByOrder = sortByOrder
    } else {
      const { view, sortBy, sortByOrder } = this.updateExplorerPreferences()
      this.view = view
      this.sortBy = sortBy
      this.sortByOrder = sortByOrder
    }
  }

  selectRangeItems = (columnIndex, toItemIndex) => {
    const columnItems = this.columns[columnIndex].items
    const toItem = columnItems[toItemIndex]
    const selectedItemIds = this.selectedItems.map((item) => item.id)
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
      this.setSelectedItems(
        this.selectedItems.filter(
          (item) => item.id === toItem.id || !rangeToDeselectIds.includes(item.id)
        )
      )
    } else {
      // Select items within the range
      this.setSelectedItems(uniqBy(this.selectedItems.concat(rangeToSelect), 'id'))
    }
  }
}

export default StorageExplorerStore
