import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { chunk, compact, find, findIndex, has, isEqual, isObject, uniq, uniqBy } from 'lodash'
import { makeAutoObservable, toJS } from 'mobx'
import toast from 'react-hot-toast'
import * as tus from 'tus-js-client'

import {
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from 'components/to-be-cleaned/Storage/Storage.constants'
import {
  StorageColumn,
  StorageItem,
  StorageItemMetadata,
  StorageItemWithColumn,
} from 'components/to-be-cleaned/Storage/Storage.types'
import { convertFromBytes } from 'components/to-be-cleaned/Storage/StorageSettings/StorageSettings.utils'
import { ToastLoader } from 'components/ui/ToastLoader'
import { configKeys } from 'data/config/keys'
import { ProjectStorageConfigResponse } from 'data/config/project-storage-config-query'
import { getQueryClient } from 'data/query-client'
import { deleteBucketObject } from 'data/storage/bucket-object-delete-mutation'
import { downloadBucketObject } from 'data/storage/bucket-object-download-mutation'
import { getPublicUrlForBucketObject } from 'data/storage/bucket-object-get-public-url-mutation'
import { signBucketObject } from 'data/storage/bucket-object-sign-mutation'
import { StorageObject, listBucketObjects } from 'data/storage/bucket-objects-list-mutation'
import { Bucket } from 'data/storage/buckets-query'
import { moveStorageObject } from 'data/storage/object-move-mutation'
import { IS_PLATFORM } from 'lib/constants'
import { lookupMime } from 'lib/mime'
import { PROJECT_ENDPOINT_PROTOCOL } from 'pages/api/constants'
import { Button, toast as UiToast } from 'ui'

type CachedFile = { id: string; fetchedAt: number; expiresIn: number; url: string }

type UploadProgress = {
  percentage: number
  elapsed: number
  uploadSpeed: number
  remainingBytes: number
  remainingTime: number
}

/**
 * This is a preferred method rather than React Context and useStorageExplorerStore().
 * If we can switch to this method, we can remove the implementation below, and we don't need compose() within the react components
 */
let store: StorageExplorerStore | null = null
export function useStorageStore() {
  if (store === null) store = new StorageExplorerStore()
  return store
}

const CORRUPTED_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes
const LIMIT = 200
const OFFSET = 0
const DEFAULT_EXPIRY = 10 * 365 * 24 * 60 * 60 // in seconds, default to 10 years
const PREVIEW_SIZE_LIMIT = 10000000 // 10MB
const BATCH_SIZE = 2
const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = '.emptyFolderPlaceholder'
const STORAGE_PROGRESS_INFO_TEXT = "Do not close the browser until it's completed"

class StorageExplorerStore {
  private projectRef: string = ''
  view: STORAGE_VIEWS = STORAGE_VIEWS.COLUMNS
  sortBy: STORAGE_SORT_BY = STORAGE_SORT_BY.NAME
  sortByOrder: STORAGE_SORT_BY_ORDER = STORAGE_SORT_BY_ORDER.ASC
  // selectedBucket will get initialized with a bucket before using
  selectedBucket: Bucket = {} as Bucket
  columns: StorageColumn[] = []
  openedFolders: StorageItem[] = []
  selectedItems: StorageItemWithColumn[] = []
  selectedItemsToDelete: StorageItemWithColumn[] = []
  selectedItemsToMove: StorageItemWithColumn[] = []
  selectedFilePreview: (StorageItemWithColumn & { previewUrl: string | undefined }) | null = null
  selectedFileCustomExpiry: StorageItem | undefined = undefined

  private DEFAULT_OPTIONS = {
    limit: LIMIT,
    offset: OFFSET,
    sortBy: { column: this.sortBy, order: this.sortByOrder },
  }

  private resumableUploadUrl: string = ''
  private serviceKey: string = ''

  /* Supabase client, will get initialized immediately after constructing the instance */
  supabaseClient: SupabaseClient<any, 'public', any> = null as any as SupabaseClient<
    any,
    'public',
    any
  >

  /* FE Cacheing for file previews */
  private filePreviewCache: CachedFile[] = []

  /* For file uploads, from 0 to 1 */
  private uploadProgresses: UploadProgress[] = []

  /* Controllers to abort API calls */
  private abortController: AbortController | null = null

  private abortUploadCallbacks: {
    [key: string]: (() => void)[]
  } = {}

  constructor() {
    makeAutoObservable(this, { supabaseClient: false })

    // ignore when in a non-browser environment
    if (typeof window !== 'undefined') {
      this.abortController = new AbortController()
    }
  }

  initStore(
    projectRef: string,
    url: string,
    serviceKey: string,
    protocol: string = PROJECT_ENDPOINT_PROTOCOL
  ) {
    this.projectRef = projectRef
    this.resumableUploadUrl = `${IS_PLATFORM ? 'https' : protocol}://${url}/storage/v1/upload/resumable`
    this.serviceKey = serviceKey
    if (serviceKey !== undefined) this.initializeSupabaseClient(serviceKey, url, protocol)
  }

  /* Methods which are commonly used + For better readability */

  private initializeSupabaseClient = (
    serviceKey: string,
    serviceEndpoint: string,
    protocol: string
  ) => {
    this.supabaseClient = createClient(
      `${IS_PLATFORM ? 'https' : protocol}://${serviceEndpoint}`,
      serviceKey,
      {
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
      }
    )
  }

  private updateFileInPreviewCache = (fileCache: CachedFile) => {
    const updatedFilePreviewCache = this.filePreviewCache.map((file) => {
      if (file.id === fileCache.id) return fileCache
      return file
    })
    this.filePreviewCache = updatedFilePreviewCache
  }

  private addFileToPreviewCache = (fileCache: CachedFile) => {
    const updatedFilePreviewCache = this.filePreviewCache.concat([fileCache])
    this.filePreviewCache = updatedFilePreviewCache
  }

  private getLocalStorageKey = () => {
    return `supabase-storage-${this.projectRef}`
  }

  private getLatestColumnIndex = () => {
    return this.columns.length - 1
  }

  // Probably refactor this to ignore bucket by default
  private getPathAlongOpenedFolders = (includeBucket = true) => {
    if (includeBucket) {
      return this.openedFolders.length > 0
        ? `${this.selectedBucket.name}/${this.openedFolders.map((folder) => folder.name).join('/')}`
        : this.selectedBucket.name
    }
    return this.openedFolders.map((folder) => folder.name).join('/')
  }

  private abortApiCalls = () => {
    this.abortController?.abort()
    this.abortController = new AbortController()
  }

  get currentBucketName() {
    return this.selectedBucket.name
  }

  /* UI specific methods */

  private setSelectedBucket = (bucket: Bucket) => {
    this.selectedBucket = bucket
    this.clearOpenedFolders()
    this.closeFilePreview()
    this.clearSelectedItems()
  }

  setView = (view: STORAGE_VIEWS) => {
    this.view = view
    this.closeFilePreview()
    this.updateExplorerPreferences()
  }

  setSortBy = async (sortBy: STORAGE_SORT_BY) => {
    this.sortBy = sortBy
    this.closeFilePreview()
    this.updateExplorerPreferences()
    await this.refetchAllOpenedFolders()
  }

  setSortByOrder = async (sortByOrder: STORAGE_SORT_BY_ORDER) => {
    this.sortByOrder = sortByOrder
    this.closeFilePreview()
    this.updateExplorerPreferences()
    await this.refetchAllOpenedFolders()
  }

  private pushColumnAtIndex = (column: StorageColumn, index: number) => {
    this.columns = this.columns.slice(0, index + 1).concat([column])
  }

  popColumn = () => {
    this.abortApiCalls()
    this.columns = this.columns.slice(0, this.getLatestColumnIndex())
  }

  popColumnAtIndex = (index: number) => {
    this.columns = this.columns.slice(0, index + 1)
  }

  private setColumnIsLoadingMore = (index: number, isLoadingMoreItems: boolean = true) => {
    this.columns = this.columns.map((col, idx) => {
      return idx === index ? { ...col, isLoadingMoreItems } : col
    })
  }

  pushOpenedFolderAtIndex = (folder: StorageItem, index: number) => {
    this.openedFolders = this.openedFolders.slice(0, index).concat(folder)
  }

  popOpenedFolders = () => {
    this.openedFolders = this.openedFolders.slice(0, this.openedFolders.length - 1)
  }

  popOpenedFoldersAtIndex = (index: number) => {
    this.openedFolders = this.openedFolders.slice(0, index + 1)
  }

  clearOpenedFolders = () => {
    this.openedFolders = []
  }

  setSelectedItems = (items: StorageItemWithColumn[]) => {
    this.selectedItems = items
  }

  clearSelectedItems = (columnIndex?: number) => {
    if (columnIndex !== undefined) {
      this.selectedItems = this.selectedItems.filter((item) => item.columnIndex !== columnIndex)
    } else {
      this.selectedItems = []
    }
  }

  setSelectedItemsToDelete = (items: StorageItemWithColumn[]) => {
    this.selectedItemsToDelete = items
  }

  clearSelectedItemsToDelete = () => {
    this.selectedItemsToDelete = []
  }

  setSelectedItemsToMove = (items: StorageItemWithColumn[]) => {
    this.selectedItemsToMove = items
  }

  clearSelectedItemsToMove = () => {
    this.selectedItemsToMove = []
  }

  setSelectedFileCustomExpiry = (item: StorageItem | undefined) => {
    this.selectedFileCustomExpiry = item
  }

  addNewFolderPlaceholder = (columnIndex: number) => {
    const isPrepend = true
    const folderName = 'Untitled folder'
    const folderType = STORAGE_ROW_TYPES.FOLDER
    const columnIdx = columnIndex === -1 ? this.getLatestColumnIndex() : columnIndex
    this.addTempRow(folderType, folderName, STORAGE_ROW_STATUS.EDITING, columnIdx, null, isPrepend)
  }

  addNewFolder = async (folderName: string, columnIndex: number) => {
    const autofix = false
    const formattedName = this.sanitizeNameForDuplicateInColumn(folderName, autofix, columnIndex)
    if (formattedName === null) return

    if (!/^[a-zA-Z0-9_-\s]*$/.test(formattedName)) {
      return UiToast({
        variant: 'destructive',
        description: 'Folder name contains invalid special characters',
        duration: 6000,
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
      await deleteBucketObject({
        projectRef: this.projectRef,
        bucketId: this.selectedBucket.id,
        paths: [`${pathToFolder}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
      })
    }
  }

  setFilePreview = async (file: StorageItemWithColumn) => {
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
      const cachedPreview = this.filePreviewCache.find((cache) => cache.id === file.id)

      const fetchedAt = cachedPreview?.fetchedAt ?? null
      const expiresIn = cachedPreview?.expiresIn ?? null
      const existsInCache = fetchedAt !== null && expiresIn !== null
      const isExpired = existsInCache ? fetchedAt + expiresIn * 1000 < Date.now() : true

      if (!isExpired) {
        this.selectedFilePreview = { ...file, previewUrl: cachedPreview?.url }
      } else {
        const previewUrl = await this.fetchFilePreview(file.name)
        const formattedPreviewUrl = this.selectedBucket.public
          ? `${previewUrl}?t=${new Date().toISOString()}`
          : previewUrl
        this.selectedFilePreview = { ...file, previewUrl: formattedPreviewUrl }

        const fileCache: CachedFile = {
          id: file.id as string,
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
      this.selectedFilePreview = { ...file, previewUrl: undefined }
    }
  }

  closeFilePreview = () => {
    this.selectedFilePreview = null
  }

  getFileUrl = async (file: StorageItem, expiresIn = 0) => {
    const filePreview = this.filePreviewCache.find((cache) => cache.id === file.id)
    if (filePreview !== undefined && expiresIn === 0) {
      return filePreview.url
    } else {
      const signedUrl = await this.fetchFilePreview(file.name, expiresIn)
      try {
        const formattedUrl = new URL(signedUrl!)
        formattedUrl.searchParams.set('t', new Date().toISOString())
        const fileUrl = formattedUrl.toString()

        // Also save it to cache
        const fileCache: CachedFile = {
          id: file.id as string,
          url: fileUrl,
          expiresIn: DEFAULT_EXPIRY,
          fetchedAt: Date.now(),
        }
        this.addFileToPreviewCache(fileCache)
        return fileUrl
      } catch (error) {
        console.error('Failed to get file URL', error)
        return ''
      }
    }
  }

  /* Methods that involve the storage client library */
  /* Bucket CRUD */
  openBucket = async (bucket: Bucket) => {
    const { id, name } = bucket
    const columnIndex = -1
    if (!isEqual(this.selectedBucket, bucket)) {
      this.setSelectedBucket(bucket)
      await this.fetchFolderContents(id, name, columnIndex)
    }
  }

  /* Files CRUD */

  private getFile = async (fileEntry: FileSystemFileEntry): Promise<File | undefined> => {
    try {
      return await new Promise((resolve, reject) => fileEntry.file(resolve, reject))
    } catch (err) {
      console.error('getFile error:', err)
      return undefined
    }
  }

  // https://stackoverflow.com/a/53058574
  private getFilesDataTransferItems = async (items: DataTransferItemList) => {
    const { dismiss } = UiToast({ description: 'Retrieving items to upload...' })
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
        const file = await this.getFile(fileEntry)
        if (file !== undefined) {
          ;(file as any).path = fileEntry.fullPath.slice(1)
          files.push(file as File & { path: string })
        }
      } else if (entry && entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry
        queue.push(...(await this.readAllDirectoryEntries(dirEntry.createReader())))
      }
    }
    dismiss()
    return files
  }

  // Get all the entries (files or sub-directories) in a directory
  // by calling readEntries until it returns empty array
  private readAllDirectoryEntries = async (directoryReader: FileSystemDirectoryReader) => {
    const entries = []
    let readEntries = await this.readEntriesPromise(directoryReader)
    while (readEntries && readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await this.readEntriesPromise(directoryReader)
    }
    return entries
  }

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  private readEntriesPromise = async (directoryReader: FileSystemDirectoryReader) => {
    try {
      return await new Promise<FileSystemEntry[]>((resolve, reject) => {
        directoryReader.readEntries(resolve, reject)
      })
    } catch (err) {
      console.error('readEntriesPromise error:', err)
    }
  }

  onUploadProgress(toastId?: string) {
    const totalFiles = this.uploadProgresses.length
    const progress =
      (this.uploadProgresses.reduce((acc, { percentage }) => acc + percentage, 0) / totalFiles) *
      100
    const remainingTime = this.calculateTotalRemainingTime(this.uploadProgresses)

    return toast.loading(
      <ToastLoader
        progress={progress}
        message={`Uploading ${totalFiles} file${totalFiles > 1 ? 's' : ''}...`}
        labelTopOverride={`${remainingTime && !isNaN(remainingTime) && isFinite(remainingTime) ? `${this.formatTime(remainingTime)} remaining – ` : ''}${progress.toFixed(2)}%`}
      >
        <div className="flex items-center gap-2">
          <p className="flex-1 text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
          {toastId && (
            <Button
              type="default"
              size="tiny"
              className="ml-6"
              onClick={() => this.abortUploads(toastId)}
            >
              Cancel
            </Button>
          )}
        </div>
      </ToastLoader>,
      { id: toastId }
    )
  }

  uploadFiles = async (
    files: FileList | DataTransferItemList,
    columnIndex: number,
    isDrop: boolean = false
  ) => {
    const queryClient = getQueryClient()
    const storageConfiguration = queryClient
      .getQueryCache()
      .find(configKeys.storage(this.projectRef))?.state.data as
      | ProjectStorageConfigResponse
      | undefined
    const fileSizeLimit = storageConfiguration?.fileSizeLimit

    const t1 = new Date()

    const autofix = true
    // We filter out any folders which are just '#' until we can properly encode such characters in the URL
    const filesToUpload: (File & { path?: string })[] = isDrop
      ? (await this.getFilesDataTransferItems(files as DataTransferItemList)).filter(
          (file) => !file.path.includes('#/')
        )
      : Array.from(files as FileList)
    const derivedColumnIndex = columnIndex === -1 ? this.getLatestColumnIndex() : columnIndex

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
            {numberOfFilesRejected > 1 ? 's are' : ' is'} beyond the upload limit of {value}
            {unit}.
          </p>
          <p className="text-foreground-light">
            You may change the file size upload limit under Storage in Project Settings.
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
        </div>,
        { duration: 8000 }
      )

      if (numberOfFilesRejected === filesWithinUploadLimit.length) return
    }

    // If we're uploading a folder which name already exists in the same folder that we're uploading to
    // We sanitize the folder name and let all file uploads through. (This is only via drag drop)
    const topLevelFolders: string[] = (this.columns?.[derivedColumnIndex]?.items ?? [])
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
          const newTopLevelFolder = this.sanitizeNameForDuplicateInColumn(
            topLevelFolder as string,
            autofix,
            columnIndex
          )
          path[0] = newTopLevelFolder as string
          file.path = path.join('/')
        }
        return file
      })

    this.uploadProgresses = new Array(formattedFilesToUpload.length).fill({
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

    const pathToFile = this.openedFolders
      .slice(0, derivedColumnIndex)
      .map((folder) => folder.name)
      .join('/')

    const toastId = this.onUploadProgress()

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
        ? this.sanitizeNameForDuplicateInColumn(file.name, autofix)
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
        pathToFile.length > 0 ? `${pathToFile}/${formattedFileName}` : (formattedFileName as string)

      if (isWithinFolder) {
        const topLevelFolder = file.path?.split('/')[0] || ''
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
          fileName!,
          STORAGE_ROW_STATUS.LOADING,
          derivedColumnIndex,
          metadata
        )
      }

      let startingBytes = 0

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

          const upload = new tus.Upload(file, {
            endpoint: this.resumableUploadUrl,
            retryDelays: [0, 200, 500, 1500, 3000, 5000],
            headers: {
              authorization: `Bearer ${this.serviceKey}`,
              'x-source': 'supabase-dashboard',
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: this.selectedBucket.name,
              objectName: formattedPathToFile,
              ...fileOptions,
            },
            chunkSize,
            onShouldRetry(error) {
              const status = error.originalResponse ? error.originalResponse.getStatus() : 0
              const doNotRetryStatuses = [400, 403, 404, 409, 429]

              return !doNotRetryStatuses.includes(status)
            },
            onError(error) {
              numberOfFilesUploadedFail += 1
              toast.error(`Failed to upload ${file.name}: ${error.message}`)
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

              this.uploadProgresses[index] = {
                percentage,
                elapsed,
                uploadSpeed,
                remainingBytes,
                remainingTime,
              }
              this.onUploadProgress(toastId)
            },
            onSuccess() {
              numberOfFilesUploadedSuccess += 1
              resolve()
            },
          })

          if (!Array.isArray(this.abortUploadCallbacks[toastId])) {
            this.abortUploadCallbacks[toastId] = []
          }
          this.abortUploadCallbacks[toastId].push(() => {
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
        this.onUploadProgress(toastId)
      }, Promise.resolve())

      if (numberOfFilesUploadedSuccess > 0) {
        await deleteBucketObject({
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
          paths: [`${pathToFile}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`],
        })
      }

      await this.refetchAllOpenedFolders()

      if (
        numberOfFilesToUpload === 0 ||
        (numberOfFilesUploadedSuccess === 0 && numberOfFilesUploadedFail === 0)
      ) {
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
      toast.error('Failed to upload files', { id: toastId })
    }

    const t2 = new Date()
    console.log(
      `Total time taken for ${formattedFilesToUpload.length} files: ${((t2 as any) - (t1 as any)) / 1000} seconds`
    )
  }

  abortUploads = (toastId: string) => {
    this.abortUploadCallbacks[toastId].forEach((callback) => callback())
    this.abortUploadCallbacks[toastId] = []
  }

  moveFiles = async (newPathToFile: string) => {
    const newPaths = compact(newPathToFile.split('/'))
    const formattedNewPathToFile = newPaths.join('/')
    let numberOfFilesMovedFail = 0
    this.clearSelectedItems()

    const { dismiss } = UiToast({
      description: STORAGE_PROGRESS_INFO_TEXT,
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

        try {
          await moveStorageObject({
            projectRef: this.projectRef,
            bucketId: this.selectedBucket.id,
            from: fromPath,
            to: toPath,
          })
        } catch (error: any) {
          numberOfFilesMovedFail += 1
          toast.error(error.message)
        }
      })
    )

    if (numberOfFilesMovedFail === this.selectedItemsToMove.length) {
      UiToast({ variant: 'destructive', description: 'Failed to move files' })
    } else {
      UiToast({
        description: `Successfully moved ${
          this.selectedItemsToMove.length - numberOfFilesMovedFail
        } files to ${formattedNewPathToFile.length > 0 ? formattedNewPathToFile : 'the root of your bucket'}`,
      })
    }

    dismiss()

    // Clear file preview cache if moved files exist in cache
    const idsOfItemsToMove = this.selectedItemsToMove.map((item) => item.id)
    const updatedFilePreviewCache = this.filePreviewCache.filter(
      (file) => !idsOfItemsToMove.includes(file.id)
    )
    this.filePreviewCache = updatedFilePreviewCache

    await this.refetchAllOpenedFolders()
    this.clearSelectedItemsToMove()
  }

  private fetchFilePreview = async (fileName: string, expiresIn: number = 0) => {
    const includeBucket = false
    const pathToFile = this.getPathAlongOpenedFolders(includeBucket)
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName

    if (this.selectedBucket.public) {
      try {
        const data = await getPublicUrlForBucketObject({
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
          path: formattedPathToFile,
        })
        return data.publicUrl
      } catch (error: any) {
        toast.error(`Failed to fetch public file preview: ${error.message}`)
      }
    } else {
      try {
        const data = await signBucketObject({
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
          path: formattedPathToFile,
          expiresIn: expiresIn || DEFAULT_EXPIRY,
        })
        return data.signedUrl
      } catch (error: any) {
        toast.error(`Failed to fetch signed url preview: ${error.message}`)
      }
    }
    return ''
  }

  // the method accepts either files with column index or with prefix.
  deleteFiles = async (
    files: (StorageItemWithColumn & { prefix?: string })[],
    isDeleteFolder = false
  ) => {
    this.closeFilePreview()
    let progress = 0

    // If every file has the 'prefix' property, then just construct the prefix
    // directly (from delete folder). Otherwise go by the opened folders.
    const prefixes = !files.some((f) => f.prefix)
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

    const toastId = toast.loading(
      <ToastLoader progress={0} message={`Deleting ${prefixes.length} file(s)...`}>
        <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
      </ToastLoader>
    )

    // batch BATCH_SIZE prefixes per request
    const batches = chunk(prefixes, BATCH_SIZE).map((batch) => () => {
      progress = progress + batch.length / prefixes.length
      return deleteBucketObject({
        projectRef: this.projectRef,
        bucketId: this.selectedBucket.id,
        paths: batch as string[],
      })
    })

    // make BATCH_SIZE requests at the same time
    await chunk(batches, BATCH_SIZE).reduce(async (previousPromise, nextBatch) => {
      await previousPromise
      await Promise.all(nextBatch.map((batch) => batch()))
      toast.loading(
        <ToastLoader progress={progress * 100} message={`Deleting ${prefixes.length} file(s)...`}>
          <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
        </ToastLoader>,
        { id: toastId }
      )
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
      toast.success(`Successfully deleted ${prefixes.length} file(s)`, { id: toastId })
      await this.refetchAllOpenedFolders()
      this.clearSelectedItemsToDelete()
    } else {
      toast.dismiss(toastId)
    }
  }

  downloadFolder = async (folder: StorageItemWithColumn) => {
    let progress = 0
    const toastId = toast.loading('Retrieving files from folder...')

    try {
      const files = await this.getAllItemsAlongFolder(folder)

      toast.loading(
        <ToastLoader
          progress={0}
          message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
        >
          <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
        </ToastLoader>,
        { id: toastId }
      )

      const promises = files.map((file) => {
        const fileMimeType = file.metadata?.mimetype ?? null
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
                projectRef: this.projectRef,
                bucketId: this.selectedBucket.id,
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
          toast.loading(
            <ToastLoader
              progress={progress * 100}
              message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
            >
              <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
            </ToastLoader>,
            { id: toastId }
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
        toast.error(`Failed to download files from "${folder.name}"`, { id: toastId })
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
        { id: toastId }
      )
    } catch (error: any) {
      toast.error(`Failed to download folder: ${error.message}`, { id: toastId })
    }
  }

  downloadSelectedFiles = async (files: StorageItemWithColumn[]) => {
    const lowestColumnIndex = Math.min(...files.map((file) => file.columnIndex))

    const formattedFilesWithPrefix: any[] = files.map((file) => {
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
    const toastId = toast.loading(
      `Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`
    )

    const promises = formattedFilesWithPrefix.map((file) => {
      return () => {
        return new Promise<{ name: string; blob: Blob } | boolean>(async (resolve) => {
          const data = await this.downloadFile(file, showIndividualToast, returnBlob)
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
      toast.loading(
        <ToastLoader
          progress={progress * 100}
          message={`Downloading ${files.length} file${files.length > 1 ? 's' : ''}...`}
        >
          <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
        </ToastLoader>,
        { id: toastId }
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

    toast.success(`Successfully downloaded ${downloadedFiles.length} files`, { id: toastId })
  }

  downloadFile = async (file: StorageItemWithColumn, showToast = true, returnBlob = false) => {
    const fileName: string = file.name
    const fileMimeType = file?.metadata?.mimetype ?? undefined

    const toastId = showToast ? toast.loading(`Retrieving ${fileName}...`) : undefined

    const pathToFile = this.openedFolders
      .slice(0, file.columnIndex)
      .map((folder) => folder.name)
      .join('/')
    const formattedPathToFile = pathToFile.length > 0 ? `${pathToFile}/${fileName}` : fileName
    try {
      const data = await downloadBucketObject({
        projectRef: this.projectRef,
        bucketId: this.selectedBucket.id,
        path: formattedPathToFile,
      })

      const blob = await data.blob()
      const newBlob = new Blob([blob], { type: fileMimeType })

      if (returnBlob) return { name: fileName, blob: newBlob }

      const blobUrl = window.URL.createObjectURL(newBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('download', `${fileName}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(blob)
      if (toastId) {
        toast.success(`Downloading ${fileName}`, { id: toastId })
      }
      return true
    } catch {
      if (toastId) {
        toast.error(`Failed to download ${fileName}`, { id: toastId })
      }
      return false
    }
  }

  renameFile = async (file: StorageItem, newName: string, columnIndex: number) => {
    const originalName = file.name
    if (originalName === newName || newName.length === 0) {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    } else {
      this.updateRowStatus(originalName, STORAGE_ROW_STATUS.LOADING, columnIndex, newName)
      const includeBucket = false
      const pathToFile = this.getPathAlongOpenedFolders(includeBucket)

      const fromPath = pathToFile.length > 0 ? `${pathToFile}/${originalName}` : originalName
      const toPath = pathToFile.length > 0 ? `${pathToFile}/${newName}` : newName

      try {
        const data = await moveStorageObject({
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
          from: fromPath,
          to: toPath,
        })

        toast.success(`Successfully renamed "${originalName}" to "${newName}"`)

        // Clear file preview cache if the renamed file exists in the cache
        const updatedFilePreviewCache = this.filePreviewCache.filter(
          (fileCache) => fileCache.id !== file.id
        )
        this.filePreviewCache = updatedFilePreviewCache

        if (this.selectedFilePreview?.name === originalName) {
          const { previewUrl, ...fileData } = file as any
          this.setFilePreview({ ...fileData, name: newName })
        }

        await this.refetchAllOpenedFolders()
      } catch (error: any) {
        toast.error(`Failed to rename file: ${error.message}`)
      }
    }
  }

  /* Folders CRUD */

  fetchFolderContents = async (
    folderId: string | null,
    folderName: string,
    index: number,
    searchString: string = ''
  ) => {
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

    try {
      const data = await listBucketObjects(
        {
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
          path: prefix,
          options,
        },
        this.abortController?.signal
      )

      this.updateRowStatus(folderName, STORAGE_ROW_STATUS.READY, index)

      const formattedItems = this.formatFolderItems(data)
      this.pushColumnAtIndex(
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
      if (!error.message.includes('aborted')) {
        toast.error(`Failed to retrieve folder contents from "${folderName}": ${error.message}`)
      }
    }
  }

  fetchMoreFolderContents = async (
    index: number,
    column: StorageColumn,
    searchString: string = ''
  ) => {
    this.setColumnIsLoadingMore(index)

    const prefix = this.openedFolders.map((folder) => folder.name).join('/')
    const options = {
      limit: LIMIT,
      offset: column.items.length,
      search: searchString,
      sortBy: { column: this.sortBy, order: this.sortByOrder },
    }

    try {
      const data = await listBucketObjects(
        { projectRef: this.projectRef, bucketId: this.selectedBucket.id, path: prefix, options },
        this.abortController?.signal
      )

      // Add items to column
      const formattedItems = this.formatFolderItems(data)
      this.columns = this.columns.map((col, idx) => {
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
  }

  refetchAllOpenedFolders = async () => {
    const paths = this.openedFolders.map((folder) => folder.name)
    await this.fetchFoldersByPath(paths)
  }

  fetchFoldersByPath = async (
    paths: string[],
    searchString: string = '',
    showLoading: boolean = false
  ) => {
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

        try {
          const data = await listBucketObjects({
            projectRef: this.projectRef,
            bucketId: this.selectedBucket.id,
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
      const formattedItems = this.formatFolderItems(folderItems)
      return {
        id: null,
        status: STORAGE_ROW_STATUS.READY,
        name: idx === 0 ? this.selectedBucket.name : pathsWithEmptyPrefix[idx],
        items: formattedItems,
        hasMoreItems: formattedItems.length === LIMIT,
        isLoadingMoreItems: false,
      }
    })

    // Package into columns and update this.columns
    this.columns = formattedFolders

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
    this.openedFolders = updatedOpenedFolders
  }

  // Check parent folder if its empty, if yes, reinstate .emptyFolderPlaceholder
  // Used when deleting folder or deleting files
  private validateParentFolderEmpty = async (parentFolderPrefix: string) => {
    try {
      const data = await listBucketObjects({
        projectRef: this.projectRef,
        bucketId: this.selectedBucket.id,
        path: parentFolderPrefix,
        options: this.DEFAULT_OPTIONS,
      })

      if (data.length === 0) {
        const prefixToPlaceholder = `${parentFolderPrefix}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`
        await this.supabaseClient.storage
          .from(this.selectedBucket.name)
          .upload(prefixToPlaceholder, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME))
      }
    } catch (error) {}
  }

  deleteFolder = async (folder: StorageItemWithColumn) => {
    try {
      const isDeleteFolder = true
      const files = await this.getAllItemsAlongFolder(folder)
      await this.deleteFiles(files as any[], isDeleteFolder)

      this.popColumnAtIndex(folder.columnIndex)
      this.popOpenedFoldersAtIndex(folder.columnIndex - 1)

      if (folder.columnIndex > 0) {
        const parentFolderPrefix = this.openedFolders
          .slice(0, folder.columnIndex)
          .map((folder) => folder.name)
          .join('/')
        if (parentFolderPrefix.length > 0) await this.validateParentFolderEmpty(parentFolderPrefix)
      }

      await this.refetchAllOpenedFolders()
      this.clearSelectedItemsToDelete()

      toast.success(`Successfully deleted ${folder.name}`)
    } catch (error: any) {
      toast.error(`Failed to delete folder: ${error.message}`)
    }
  }

  renameFolder = async (folder: StorageItemWithColumn, newName: string, columnIndex: number) => {
    const originalName = folder.name
    if (originalName === newName) {
      return this.updateRowStatus(originalName, STORAGE_ROW_STATUS.READY, columnIndex)
    }

    const toastId = toast.loading(
      <ToastLoader progress={0} message={`Renaming folder to ${newName}`}>
        <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
      </ToastLoader>
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
          return new Promise<void>(async (resolve) => {
            progress = progress + 1 / files.length
            try {
              await moveStorageObject({
                projectRef: this.projectRef,
                bucketId: this.selectedBucket.id,
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
        toast.loading(
          <ToastLoader progress={progress * 100} message={`Renaming folder to ${newName}`}>
            <p className="text-xs text-foreground-light">{STORAGE_PROGRESS_INFO_TEXT}</p>
          </ToastLoader>,
          { id: toastId }
        )
      }, Promise.resolve())

      if (!hasErrors) {
        toast.success(`Successfully renamed folder to ${newName}`, { id: toastId })
      } else {
        toast.error(`Renamed folder to ${newName} with some errors`, { id: toastId })
      }
      await this.refetchAllOpenedFolders()

      // Clear file preview cache if the moved file exists in the cache
      const fileIds = files.map((file) => file.id)
      const updatedFilePreviewCache = this.filePreviewCache.filter(
        (fileCache) => !fileIds.includes(fileCache.id)
      )
      this.filePreviewCache = updatedFilePreviewCache
    } catch (e: any) {
      toast.error(`Failed to rename folder to ${newName}: ${e.message}`, { id: toastId })
    }
  }

  /*
    Recursively returns a list of items along every directory within the specified base folder
    Each item has an extra property 'prefix' which has the prefix that leads to the item
    Used specifically for any operation that deals with every file along the folder
    e.g Delete folder, rename folder
  */
  private getAllItemsAlongFolder = async (folder: {
    name: string
    columnIndex: number
    prefix?: string
  }): Promise<(StorageObject & { prefix: string })[]> => {
    const items: (StorageObject & { prefix: string })[] = []

    let hasError = false
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
    let folderContents: StorageObject[] = []

    for (;;) {
      try {
        const data = await listBucketObjects({
          projectRef: this.projectRef,
          bucketId: this.selectedBucket.id,
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
        this.getAllItemsAlongFolder({ ...folder, columnIndex: 0, prefix: formattedPathToFolder })
      )
    )
    subFolderContents.map((subfolderContent) => {
      subfolderContent.map((item) => items.push(item))
    })

    return items
  }

  /* UI Helper functions */

  private sanitizeNameForDuplicateInColumn = (
    name: string,
    autofix: boolean = false,
    columnIndex: number = this.getLatestColumnIndex()
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
        toast.error(
          `The name ${name} already exists in the current directory. Please use a different name.`
        )
        return null
      }
    }

    return name
  }

  private formatFolderItems = (items: StorageObject[] = []): StorageItem[] => {
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
          }
          return itemObj
        }) ?? []
    return formattedItems
  }

  private addTempRow = (
    type: STORAGE_ROW_TYPES,
    name: string,
    status: STORAGE_ROW_STATUS,
    columnIndex: number,
    metadata: StorageItemMetadata | null,
    isPrepend: boolean = false
  ) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const tempRow = { type, name, status, metadata } as StorageItem
        const updatedItems = isPrepend
          ? [tempRow].concat(column.items)
          : column.items.concat([tempRow])
        return { ...column, items: updatedItems }
      }
      return column
    })
    this.columns = updatedColumns
  }

  private removeTempRows = (columnIndex: number) => {
    const updatedColumns = this.columns.map((column, idx) => {
      if (idx === columnIndex) {
        const updatedItems = column.items.filter((item) => has(item, 'id'))
        return { ...column, items: updatedItems }
      }
      return column
    })
    this.columns = updatedColumns
  }

  setSelectedItemToRename = (file: { name: string; columnIndex: number }) => {
    this.updateRowStatus(file.name, STORAGE_ROW_STATUS.EDITING, file.columnIndex)
  }

  private updateRowStatus = (
    name: string,
    status: STORAGE_ROW_STATUS,
    columnIndex: number = this.getLatestColumnIndex(),
    updatedName?: string
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

  private updateFolderAfterEdit = (
    folderName: string,
    columnIndex: number = this.getLatestColumnIndex(),
    status: STORAGE_ROW_STATUS = STORAGE_ROW_STATUS.READY
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

  private updateExplorerPreferences = () => {
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

  selectRangeItems = (columnIndex: number, toItemIndex: number) => {
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

  private calculateTotalRemainingTime(progresses: UploadProgress[]) {
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

  private formatTime(seconds: number) {
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
}

export default StorageExplorerStore
