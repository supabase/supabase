import { createContext, useContext } from 'react'
import { makeAutoObservable } from 'mobx'
import {
  find,
  compact,
  isEqual,
  isNull,
  isNil,
  isUndefined,
  has,
  some,
  chunk,
  get,
  uniq,
} from 'lodash'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'

import {
  STORAGE_VIEWS,
  STORAGE_ROW_TYPES,
  STORAGE_ROW_STATUS,
  STORAGE_SORT_BY,
} from 'components/to-be-cleaned/Storage/Storage.constants.ts'
import { timeout, copyToClipboard } from 'lib/helpers'

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

const LIMIT = 100000
const OFFSET = 0
const DEFAULT_EXPIRY = 10 * 365 * 24 * 60 * 60 // in seconds, default to 1 year
const PREVIEW_SIZE_LIMIT = 10000000 // 10MB
const BATCH_SIZE = 100
const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = '.emptyFolderPlaceholder'

class StorageExplorerStore {
  projectRef = ''
  loaded = false
  view = STORAGE_VIEWS.COLUMNS
  sortBy = STORAGE_SORT_BY.NAME
  buckets = []
  selectedBucket = {}
  selectedBucketToEdit = {}
  columns = []
  openedFolders = []
  selectedItems = []
  selectedItemsToDelete = []
  selectedItemsToMove = []
  selectedFilePreview = {}

  DEFAULT_OPTIONS = { limit: LIMIT, offset: OFFSET, sortBy: { column: this.sortBy, order: 'asc' } }

  /* Supabase client */
  supabaseClient = null

  /* FE to toggle page level modals */
  showCreateBucketModal = false
  showDeleteBucketModal = false
  showToggleBucketPublicModal = false

  /* FE Cacheing for file previews */
  filePreviewCache = []

  /* For file uploads, from 0 to 1 */
  uploadProgress = 0

  /* Controllers to abort API calls */
  abortController = null

  constructor(projectRef) {
    makeAutoObservable(this, { supabaseClient: false })
    this.projectRef = projectRef
    this.abortController = new AbortController()
  }

  initStore(projectRef, url, serviceKey) {
    this.projectRef = projectRef
    this.initializeSupabaseClient(serviceKey, url)
  }

  /* Methods which are commonly used + For better readability */

  initializeSupabaseClient = (serviceKey, serviceEndpoint) => {
    this.supabaseClient = createClient(`https://${serviceEndpoint}`, serviceKey, {
      localStorage: {
        getItem: (key) => {
          return undefined
        },
        setItem: (key, value) => {},
        removeItem: (key) => {},
      },
    })
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

  openCreateBucketModal = () => {
    this.showCreateBucketModal = true
  }

  closeCreateBucketModal = () => {
    this.showCreateBucketModal = false
  }

  openDeleteBucketModal = (bucket) => {
    this.selectedBucketToEdit = bucket
    this.showDeleteBucketModal = true
  }

  closeDeleteBucketModal = () => {
    this.showDeleteBucketModal = false
  }

  openToggleBucketPublicModal = (bucket) => {
    this.selectedBucketToEdit = bucket
    this.showToggleBucketPublicModal = true
  }

  closeToggleBucketPublicModal = () => {
    this.showToggleBucketPublicModal = false
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

  clearSelectedItems = () => {
    this.selectedItems = []
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

  addNewFolderPlaceholder = (columnIndex) => {
    const folderName = 'Untitled folder'
    const folderType = STORAGE_ROW_TYPES.FOLDER
    const columnIdx = columnIndex === -1 ? this.getLatestColumnIndex() : columnIndex
    this.addTempRow(folderType, folderName, STORAGE_ROW_STATUS.EDITING, columnIdx)
  }

  addNewFolder = async (folderName, columnIndex) => {
    const autofix = false
    const formattedName = this.sanitizeNameForDuplicateInColumn(folderName, autofix, columnIndex)
    if (isNull(formattedName)) {
      return
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
      await this.supabaseClient.storage
        .from(this.selectedBucket.name)
        .remove([`${pathToFolder}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`])
    }
  }

  setFilePreview = async (file) => {
    const size = file.metadata?.size
    const mimeType = file.metadata?.mimetype
    if (mimeType && size && this.selectedFilePreview.id !== file.id) {
      // Skip fetching of file preview if file is too big
      if (size > PREVIEW_SIZE_LIMIT) {
        this.selectedFilePreview = { ...file, previewUrl: 'skipped' }
        return
      }

      // Either retrieve file preview from FE cache or retrieve signed url
      this.selectedFilePreview = { ...file, previewUrl: 'loading' }
      const cachedPreview = find(this.filePreviewCache, { id: file.id })

      const fetchedAt = get(cachedPreview, ['fetchedAt'], null)
      const expiresIn = get(cachedPreview, ['expiresIn'], null)
      const existsInCache = !isNull(fetchedAt) && !isNull(expiresIn)
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

  copyFileURLToClipboard = async (file) => {
    const filePreview = find(this.filePreviewCache, { id: file.id })
    if (filePreview) {
      // Already generated signed URL
      copyToClipboard(filePreview.url, () => {
        toast(`Copied URL for ${file.name} to clipboard.`)
      })
    } else {
      // Need to generate signed URL, and might as well save it to cache as well
      const signedUrl = await this.fetchFilePreview(file.name)
      copyToClipboard(signedUrl, () => {
        toast(`Copied URL for ${file.name} to clipboard.`)
      })
      const fileCache = {
        id: file.id,
        url: signedUrl,
        expiresIn: DEFAULT_EXPIRY,
        fetchedAt: Date.now(),
      }
      this.addFileToPreviewCache(fileCache)
    }
  }

  /* Methods that involve the storage client library */
  /* Bucket CRUD */

  createBucket = async (bucketName, isPublic = false) => {
    if (isNil(this.supabaseClient)) {
      return toast.error('Failed to initialize supabase client, try refreshing your browser.')
    }

    const { error } = await this.supabaseClient.storage.createBucket(bucketName, {
      public: isPublic,
    })
    if (error) {
      toast.error(error.message)
      return this.closeCreateBucketModal()
    }

    await this.fetchBuckets()
    this.closeCreateBucketModal()
  }

  openBucket = async (bucket) => {
    const { id, name } = bucket
    const columnIndex = -1
    if (!isEqual(this.selectedBucket, bucket)) {
      this.setSelectedBucket(bucket)
      await this.fetchFolderContents(id, name, columnIndex)
    }
  }

  fetchBuckets = async () => {
    const { data: buckets, error } = await this.supabaseClient.storage.listBuckets()
    if (error) return toast(error.message)

    const formattedBuckets = buckets.map((bucket) => {
      return { ...bucket, type: STORAGE_ROW_TYPES.BUCKET, status: STORAGE_ROW_STATUS.READY }
    })
    this.buckets = formattedBuckets
    return formattedBuckets
  }

  deleteBucket = async (bucket) => {
    // Deleting a bucket requires the bucket to be empty first
    // hence delete bucket and empty bucket are coupled tightly here
    const { id, name: bucketName } = bucket

    const { error: emptyBucketError } = await this.supabaseClient.storage.emptyBucket(id)
    if (emptyBucketError) {
      toast(emptyBucketError.message)
      return false
    }

    const { error: deleteBucketError } = await this.supabaseClient.storage.deleteBucket(id)
    if (deleteBucketError) {
      toast(deleteBucketError.message)
      return false
    }

    await this.fetchBuckets()
    if (bucketName === this.selectedBucket.name) {
      this.setSelectedBucket({})
      this.clearColumns()
      this.clearOpenedFolders()
    }
    this.clearSelectedItemsToDelete()
    this.closeDeleteBucketModal()
    return true
  }

  toggleBucketPublic = async (bucket) => {
    const { name: bucketName } = bucket

    const { data, error } = await this.supabaseClient.storage.updateBucket(bucketName, {
      public: !bucket.public,
    })
    if (error) {
      toast(error.message)
      return this.closeToggleBucketPublicModal()
    }

    await this.fetchBuckets()
    this.clearFilePreviewCache()
    this.closeToggleBucketPublicModal()

    await this.openBucket({ ...bucket, public: !bucket.public })
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
    const toastId = toast.loading('Retrieving items to upload...')
    const files = []
    const queue = []
    for (const item of items) {
      queue.push(item.webkitGetAsEntry())
    }
    while (queue.length > 0) {
      const entry = queue.shift() || {}
      if (entry.isFile) {
        const file = await this.getFile(entry)
        if (!isUndefined(file)) {
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
    const topLevelFolders = get(this.columns, [derivedColumnIndex, 'items'], [])
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

    const uploadedTopLevelFolders = []
    this.uploadProgress = 0
    let numberOfFilesToUpload = formattedFilesToUpload.length
    let numberOfFilesUploadedSuccess = 0
    let numberOfFilesUploadedFail = 0

    const pathToFile = this.openedFolders
      .slice(0, derivedColumnIndex)
      .map((folder) => folder.name)
      .join('/')

    const toastId = toast.loading(
      `Uploading ${formattedFilesToUpload.length} file${
        formattedFilesToUpload.length > 1 ? 's' : ''
      }...`
    )

    // Upload files in batches
    const promises = formattedFilesToUpload.map((file) => {
      const fileOptions = { cacheControl: 3600 }
      const metadata = { mimetype: file.type, size: file.size }

      const isWithinFolder = get(file, ['path'], '').split('/').length > 1
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
        return Promise.race([
          new Promise(async (resolve) => {
            const { error } = await this.supabaseClient.storage
              .from(this.selectedBucket.name)
              .upload(formattedPathToFile, file, fileOptions)

            this.uploadProgress = this.uploadProgress + 1 / formattedFilesToUpload.length

            if (error) {
              numberOfFilesUploadedFail += 1
              toast.error(`Failed to upload ${file.name}: ${error.message}`)
              resolve()
            } else {
              numberOfFilesUploadedSuccess += 1
              resolve()
            }
          }),
          timeout(30000),
        ])
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
        toast.loading(
          `Uploading ${formattedFilesToUpload.length} file${
            formattedFilesToUpload.length > 1 ? 's' : ''
          }... (${(this.uploadProgress * 100).toFixed(2)}%)`,
          { id: toastId }
        )
      }, Promise.resolve())

      if (numberOfFilesUploadedSuccess > 0) {
        await this.supabaseClient.storage
          .from(this.selectedBucket.name)
          .remove([`${pathToFile}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`])
      }

      await this.refetchAllOpenedFolders()

      if (numberOfFilesToUpload === 0) {
        toast.dismiss(toastId)
      } else if (numberOfFilesUploadedFail === numberOfFilesToUpload) {
        toast.error(
          `Failed to upload ${numberOfFilesToUpload} file${numberOfFilesToUpload > 1 ? 's' : ''}!`,
          { id: toastId }
        )
      } else if (numberOfFilesUploadedSuccess === numberOfFilesToUpload) {
        toast.success(
          `Successfully uploaded ${numberOfFilesToUpload} file${
            numberOfFilesToUpload > 1 ? 's' : ''
          }!`,
          { id: toastId }
        )
      } else {
        toast.success(
          `Successfully uploaded ${numberOfFilesUploadedSuccess} out of ${numberOfFilesToUpload} file${
            numberOfFilesToUpload > 1 ? 's' : ''
          }!`,
          { id: toastId }
        )
      }
    } catch (e) {
      console.error(e)
      toast.error(`Failed to upload files`)
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

    await Promise.all(
      this.selectedItemsToMove.map(async (item) => {
        const pathToFile = this.openedFolders
          .slice(0, item.columnIndex)
          .map((folder) => folder.name)
          .join('/')

        const fromPath = pathToFile.length > 0 ? `${pathToFile}/${item.name}` : item.name
        const toPath =
          newPathToFile.length > 0 ? `${formattedNewPathToFile}/${item.name}` : item.name

        const { error } = await this.supabaseClient.storage
          .from(this.selectedBucket.name)
          .move(fromPath, toPath)

        if (error) {
          numberOfFilesMovedFail += 1
          toast.error(error.message)
        }
      })
    )

    if (numberOfFilesMovedFail === this.selectedItemsToMove.length) {
      toast.error(`Failed to move files`)
    } else {
      toast.success(
        `Successfully moved ${
          this.selectedItemsToMove.length - numberOfFilesMovedFail
        } to ${formattedNewPathToFile}`
      )
    }

    // Clear file preview cache if moved files exist in cache
    const idsOfItemsToMove = this.selectedItemsToMove.map((item) => item.id)
    const updatedFilePreviewCache = this.filePreviewCache.filter(
      (file) => !idsOfItemsToMove.includes(file.id)
    )
    this.filePreviewCache = updatedFilePreviewCache

    await this.refetchAllOpenedFolders()
    this.clearSelectedItemsToMove()
  }

  fetchFilePreview = async (fileName) => {
    const includeBucket = false
    const pathToFile = this.getPathAlongOpenedFolders(includeBucket)
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName

    if (this.selectedBucket.public) {
      const { data, error } = await this.supabaseClient.storage
        .from(this.selectedBucket.name)
        .getPublicUrl(formattedPathToFile)

      if (!error) {
        return data.publicURL
      }
    }

    const { data, error } = await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .createSignedUrl(formattedPathToFile, DEFAULT_EXPIRY)

    if (!error) {
      return data.signedURL
    }

    return null
  }

  deleteFiles = async (files, isDeleteFolder = false) => {
    this.closeFilePreview()

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

    const batches = chunk(prefixes, BATCH_SIZE)
    await Promise.all(
      batches.map(
        async (batchedPrefixes) =>
          await this.supabaseClient.storage.from(this.selectedBucket.name).remove(batchedPrefixes)
      )
    )

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

      toast.success(`Successfully deleted ${prefixes.length} file(s)`)
      await this.refetchAllOpenedFolders()
      this.clearSelectedItemsToDelete()
    }
  }

  downloadSelectedFiles = async () => {
    const showIndividualToast = false
    const toastId = toast(`Retrieving ${this.selectedItems.length} files...`, {
      autoClose: false,
      hideProgressBar: true,
    })

    const res = await Promise.all(
      this.selectedItems.map(async (item) => await this.downloadFile(item, showIndividualToast))
    )

    const numberOfSuccessfullyDownloadedFiles = res.filter((x) => x === true).length
    toast.success(`Downloaded ${numberOfSuccessfullyDownloadedFiles} files`, {
      id: toastId,
    })
  }

  downloadFile = async (file, showToast = true) => {
    let toastId
    const fileName = file.name
    const fileMimeType = get(file, ['metadata', 'mimetype'], null)

    if (showToast) {
      toastId = toast.loading(`Retrieving ${fileName}...`, {
        autoClose: false,
      })
    }

    const pathToFile = this.openedFolders
      .slice(0, file.columnIndex)
      .map((folder) => folder.name)
      .join('/')
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName

    const { data, error } = await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .download(formattedPathToFile)

    if (!error) {
      const blob = data
      const newBlob = new Blob([blob], { type: fileMimeType })
      const blobUrl = window.URL.createObjectURL(newBlob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', `${fileName}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(blob)
      if (toastId) {
        toast.success(`Downloading ${fileName}`, {
          id: toastId,
        })
      }
      return true
    } else {
      console.error('Failed to download:', fileName)
      if (toastId) {
        toast.error(`Failed to download ${fileName}`, {
          id: toastId,
        })
      }
      return false
    }
  }

  renameFile = async (file, newName, columnIndex) => {
    const originalName = file.name
    if (originalName === newName) {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    } else {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.LOADING, columnIndex, newName)
      const includeBucket = false
      const pathToFile = this.getPathAlongOpenedFolders(includeBucket)

      const fromPath = pathToFile.length > 0 ? `${pathToFile}/${originalName}` : originalName
      const toPath = pathToFile.length > 0 ? `${pathToFile}/${newName}` : newName
      const { error } = await this.supabaseClient.storage
        .from(this.selectedBucket.name)
        .move(fromPath, toPath)

      if (error) {
        toast.error(error.message)
      }
      await this.refetchAllOpenedFolders()

      // Clear file preview cache if the renamed file exists in the cache
      const updatedFilePreviewCache = this.filePreviewCache.filter(
        (fileCache) => fileCache.id !== file.id
      )
      this.filePreviewCache = updatedFilePreviewCache
    }
  }

  /* Folders CRUD */

  fetchFolderContents = async (folderId, folderName, index, showLoading = true) => {
    this.abortApiCalls()

    if (showLoading) {
      this.updateRowStatus(folderName, STORAGE_ROW_STATUS.LOADING, index)
      this.pushColumnAtIndex(
        { id: folderId, name: folderName, status: STORAGE_ROW_STATUS.LOADING, items: [] },
        index
      )
    }

    const prefix = this.openedFolders.map((folder) => folder.name).join('/')
    const options = { limit: LIMIT, offset: OFFSET, sortBy: { column: this.sortBy, order: 'asc' } }
    const parameters = { signal: this.abortController.signal }

    const { data: items, error } = await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .list(prefix, options, parameters)

    if (showLoading) {
      this.updateRowStatus(folderName, STORAGE_ROW_STATUS.READY, index)
    }

    if (!error) {
      const formattedItems = this.formatFolderItems(items)
      this.pushColumnAtIndex(
        { id: folderId || folderName, name: folderName, items: formattedItems },
        index
      )
    }
  }

  refetchAllOpenedFolders = async () => {
    const paths = this.openedFolders.map((folder) => folder.name)
    await this.fetchFoldersByPath(paths)
  }

  fetchFoldersByPath = async (paths) => {
    const pathsWithEmptyPrefix = [''].concat(paths)

    const foldersItems = await Promise.all(
      pathsWithEmptyPrefix.map(async (path, idx) => {
        const prefix = paths.slice(0, idx).join('/')
        const options = {
          limit: LIMIT,
          offset: OFFSET,
          sortBy: { column: this.sortBy, order: 'asc' },
        }

        const { data: items, error } = await this.supabaseClient.storage
          .from(this.selectedBucket.name)
          .list(prefix, options)

        if (error) {
          console.error('Error at fetchFoldersByPath:', error)
        }

        return items
      })
    )

    const formattedFolders = foldersItems.map((folderItems, idx) => {
      const formattedItems = this.formatFolderItems(folderItems)
      return {
        id: null,
        name: idx === 0 ? this.selectedBucket.name : pathsWithEmptyPrefix[idx],
        items: formattedItems,
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
    const { data: items, error } = await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .list(parentFolderPrefix, this.DEFAULT_OPTIONS)
    if (!error && items.length === 0) {
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

    const parentFolderPrefix = this.openedFolders.map((folder) => folder.name).join('/')
    if (parentFolderPrefix.length > 0) {
      await this.validateParentFolderEmpty(parentFolderPrefix)
    }

    await this.refetchAllOpenedFolders()
    this.clearSelectedItemsToDelete()
    toast.success(`Successfully deleted ${folder.name}`)
  }

  renameFolder = async (folder, newName, columnIndex) => {
    const originalName = folder.name
    if (originalName === newName) {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    } else {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.LOADING, columnIndex, newName)
      const files = await this.getAllItemsAlongFolder(folder)
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
          return new Promise(async (resolve, reject) => {
            const { error } = await this.supabaseClient.storage
              .from(this.selectedBucket.name)
              .move(fromPath, toPath)
            if (error) reject()
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
        }, Promise.resolve())

        toast.success(`Successfully renamed folder to ${newName}`)
        await this.refetchAllOpenedFolders()

        // Clear file preview cache if the moved file exists in the cache
        const fileIds = files.map((file) => file.id)
        const updatedFilePreviewCache = this.filePreviewCache.filter(
          (fileCache) => !fileIds.includes(fileCache.id)
        )
        this.filePreviewCache = updatedFilePreviewCache
      } catch (e) {
        toast.error(`Failed to rename folder to ${newName}`)
      }
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

    if (isUndefined(prefix)) {
      const pathToFolder = this.openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .join('/')
      formattedPathToFolder = pathToFolder.length > 0 ? `${pathToFolder}/${name}` : name
    } else {
      formattedPathToFolder = `${prefix}/${name}`
    }

    const options = { limit: LIMIT, offset: OFFSET, sortBy: { column: this.sortBy, order: 'asc' } }
    const { data: folderContents } = await this.supabaseClient.storage
      .from(this.selectedBucket.name)
      .list(formattedPathToFolder, options)

    const subfolders = folderContents?.filter((item) => isNull(item.id)) ?? []
    const folderItems = folderContents?.filter((item) => !isNull(item.id)) ?? []

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
        toast(
          `The name ${name} already exists in the current directory. Please use a different name.`
        )
        return null
      }
    }

    return name
  }

  formatFolderItems = (items = []) => {
    const formattedItems =
      items
        ?.filter((item) => item.name !== EMPTY_FOLDER_PLACEHOLDER_FILE_NAME)
        .map((item) => {
          const itemObj = {
            ...item,
            type: item.id ? STORAGE_ROW_TYPES.FILE : STORAGE_ROW_TYPES.FOLDER,
            status: STORAGE_ROW_STATUS.READY,
          }
          return itemObj
        }) ?? []
    return formattedItems
  }

  addTempRow = (type, name, status, columnIndex, metadata = {}) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const tempRow = { type, name, status, metadata }
        const updatedItems = column.items.concat([tempRow])
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
    }
    localStorage.setItem(localStorageKey, JSON.stringify(preferences))
    return preferences
  }

  loadExplorerPreferences = () => {
    const localStorageKey = this.getLocalStorageKey()
    const preferences = localStorage.getItem(localStorageKey)
    if (preferences) {
      const { view, sortBy } = JSON.parse(preferences)
      this.view = view
      this.sortBy = sortBy
    } else {
      const { view, sortBy } = this.updateExplorerPreferences()
      this.view = view
      this.sortBy = sortBy
    }
  }
}

export default StorageExplorerStore
