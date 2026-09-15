import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  type PropsWithChildren,
} from 'react'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import { getPathAlongOpenedFolders, parseStoragePath } from './StorageExplorer.utils'
import { useStorageExplorerUrlState } from './useStorageExplorerUrlState'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

interface StorageExplorerNavigationContextValue {
  /** Opens a folder one level below `columnIndex`. */
  openFolderAtIndex: (columnIndex: number, folder: StorageItem) => Promise<void>
  /** Jumps to an arbitrary folder path. Drives the store via the URL. */
  navigateToPath: (paths: string[]) => void
  goUpOneLevel: () => void
  /** Collapses the column stack back to `columnIndex`. */
  truncateToColumn: (columnIndex: number) => void
  setPreviewedFile: (item: StorageItemWithColumn) => void
  clearPreviewedFile: () => void
}

const StorageExplorerNavigationContext =
  createContext<StorageExplorerNavigationContextValue | null>(null)

export const useStorageExplorerNavigation = () => {
  const context = useContext(StorageExplorerNavigationContext)
  if (!context) {
    throw new Error(
      'useStorageExplorerNavigation must be used within a StorageExplorerNavigationProvider'
    )
  }
  return context
}

interface StorageExplorerNavigationProviderProps {
  /** False while the bucket query is loading or the store still holds another bucket. */
  isBucketReady: boolean
  /** Already debounced by the caller. */
  searchString: string
}

/**
 * Keeps the `?path` / `?file` query params and the valtio explorer store in sync.
 *
 * The store stays authoritative for column data — it is the only thing that can fetch
 * incrementally, and it drives its own navigation from mutations (creating a folder
 * drills into it; deleting or renaming one pops out of it) from places that cannot
 * reach a router. So rather than making the URL the source of truth, a single effect
 * reconciles the two and uses *which side changed* to decide the direction:
 *
 * - The store moved (a row click, or an internal mutation) — write the URL from it.
 * - Only the URL moved (back/forward, a pasted link, the Navigate dialog) — rebuild
 *   the columns from it.
 *
 * Having exactly one writer in each direction is what keeps this from looping.
 */
export const StorageExplorerNavigationProvider = ({
  isBucketReady,
  searchString,
  children,
}: PropsWithChildren<StorageExplorerNavigationProviderProps>) => {
  const snap = useStorageExplorerStateSnapshot()
  const { urlPath, urlFolderPaths, urlPreview, setUrlLocation, setUrlPreview } =
    useStorageExplorerUrlState()

  const storePath = getPathAlongOpenedFolders(snap, false)
  const bucketName = snap.selectedBucket.name
  const rootColumnName = snap.columns[0]?.name
  const previewedFileName = snap.selectedFilePreview?.name
  const lastColumn = snap.columns[snap.columns.length - 1]
  const isLastColumnReady = lastColumn?.status === STORAGE_ROW_STATUS.READY

  const previousStorePathRef = useRef(storePath)
  const previousSearchStringRef = useRef<string | null>(null)
  /**
   * Set by the navigation actions so the reconciliation below knows a store move was a
   * deliberate user navigation (push) rather than the side effect of a mutation (replace).
   */
  const navigationHistoryModeRef = useRef<'push' | null>(null)
  const previousPreviewRef = useRef(previewedFileName)
  /**
   * `fetchFoldersByPath` swaps in placeholder columns before it resolves, but only
   * updates `openedFolders` at the very end — so mid-flight the store still reports the
   * old path while the URL holds the new one. Without this flag that reads as another
   * divergence and kicks off a second restore.
   */
  const isRestoringRef = useRef(false)

  const restoreFromUrl = useEffectEvent(async () => {
    isRestoringRef.current = true
    try {
      const { missingPaths } = await snap.fetchFoldersByPath({
        paths: urlFolderPaths,
        searchString,
        showLoading: true,
      })
      if (missingPaths.length > 0) {
        // The link points at a folder that no longer exists. Fall back to the bucket
        // root and correct the URL together, so the store and the URL stay in step —
        // rewriting the URL alone would leave the store on the dead path and the
        // reconcile effect would immediately write it back.
        await snap.fetchFoldersByPath({ paths: [], searchString, showLoading: true })
        setUrlLocation({ paths: [], preview: null }, { history: 'replace' })
      }
    } finally {
      isRestoringRef.current = false
    }
  })

  const refetchForSearch = useEffectEvent(async () => {
    // Search narrows the folder you are standing in, so only that level is refetched.
    // Passing the term to every open column (which is what the old fetch did) made the
    // current folder disappear from its own parent.
    const currentIndex = snap.openedFolders.length - 1
    const currentFolder = snap.openedFolders[currentIndex]
    await snap.fetchFolderContents({
      bucketId: snap.selectedBucket.id,
      folderId: currentFolder?.id ?? snap.selectedBucket.id,
      folderName: currentFolder?.name ?? snap.selectedBucket.name,
      index: currentFolder ? currentIndex : -1,
      searchString,
    })
  })

  const reconcileUrlToStore = useEffectEvent((history: 'push' | 'replace') => {
    setUrlLocation(
      { paths: parseStoragePath(storePath), preview: snap.selectedFilePreview?.name ?? null },
      { history }
    )
  })

  useEffect(() => {
    if (!isBucketReady || isRestoringRef.current) return

    const hasStoreChanged = storePath !== previousStorePathRef.current
    previousStorePathRef.current = storePath

    const hasSearchChanged = searchString !== previousSearchStringRef.current
    previousSearchStringRef.current = searchString

    // Nothing loaded yet, or the store still holds the bucket we just navigated away
    // from — the provider is keyed per project, not per bucket, so it is not remounted
    // on a bucket switch.
    const isStoreEmpty = snap.columns.length === 0
    const isStoreOnAnotherBucket = rootColumnName !== bucketName
    if (isStoreEmpty || isStoreOnAnotherBucket) {
      restoreFromUrl()
      return
    }

    if (storePath !== urlPath) {
      if (hasStoreChanged) {
        const history = navigationHistoryModeRef.current ?? 'replace'
        navigationHistoryModeRef.current = null
        reconcileUrlToStore(history)
        return
      }
      restoreFromUrl()
      return
    }

    // Settled. Drop any intent that never turned into a path change — selecting a file
    // in the deepest column, for instance — so it can't mislabel a later store mutation.
    navigationHistoryModeRef.current = null

    if (hasSearchChanged) refetchForSearch()
  }, [
    isBucketReady,
    urlPath,
    storePath,
    searchString,
    bucketName,
    rootColumnName,
    snap.columns.length,
  ])

  // Restoring `?preview` needs the full item, which only exists once its column has loaded.
  useEffect(() => {
    if (!isBucketReady || !isLastColumnReady) return

    // Same "which side moved" rule the path sync uses. Clicking a row mutates the store
    // synchronously while the URL is written a render later, so without this the effect
    // would compare a stale `?preview` against an already-truncated column stack and
    // mistake the lag for a deleted file. When the store moved, the reconcile effect
    // owns writing the URL; this effect only adopts changes that came from the URL.
    const hasPreviewChangedInStore = previewedFileName !== previousPreviewRef.current
    previousPreviewRef.current = previewedFileName
    if (hasPreviewChangedInStore) return

    if (!urlPreview) {
      if (previewedFileName) snap.setSelectedFilePreview(undefined)
      return
    }
    if (previewedFileName === urlPreview) return

    const item = lastColumn.items.find(
      (columnItem) => columnItem.name === urlPreview && columnItem.type === STORAGE_ROW_TYPES.FILE
    )
    if (!item) {
      // Absent from `items` doesn't always mean deleted: a search filters the listing,
      // and the listing is capped at LIMIT. Only drop the param when this listing is
      // complete and unfiltered, otherwise the file may simply not be loaded yet.
      const isListingComplete = !searchString && !lastColumn.hasMoreItems
      if (isListingComplete) setUrlPreview(null)
      return
    }
    snap.setSelectedFilePreview({ ...item, columnIndex: snap.columns.length - 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBucketReady,
    isLastColumnReady,
    urlPreview,
    previewedFileName,
    lastColumn?.path,
    searchString,
  ])

  const openFolderAtIndex = async (columnIndex: number, folder: StorageItem) => {
    navigationHistoryModeRef.current = 'push'
    await snap.openFolder(columnIndex, folder)
  }

  const goUpOneLevel = () => {
    navigationHistoryModeRef.current = 'push'
    snap.popColumn()
    snap.popOpenedFolders()
    snap.setSelectedFilePreview(undefined)
  }

  const truncateToColumn = (columnIndex: number) => {
    navigationHistoryModeRef.current = 'push'
    snap.popColumnAtIndex(columnIndex)
    snap.popOpenedFoldersAtIndex(columnIndex - 1)
    snap.setSelectedFilePreview(undefined)
    snap.clearSelectedItems()
  }

  const navigateToPath = (paths: string[]) => {
    setUrlLocation({ paths, preview: null }, { history: 'push' })
  }

  const setPreviewedFile = (item: StorageItemWithColumn) => {
    snap.setSelectedFilePreview(item)
    setUrlPreview(item.name)
  }

  const clearPreviewedFile = () => {
    snap.setSelectedFilePreview(undefined)
    setUrlPreview(null)
  }

  return (
    <StorageExplorerNavigationContext.Provider
      value={{
        openFolderAtIndex,
        navigateToPath,
        goUpOneLevel,
        truncateToColumn,
        setPreviewedFile,
        clearPreviewedFile,
      }}
    >
      {children}
    </StorageExplorerNavigationContext.Provider>
  )
}
