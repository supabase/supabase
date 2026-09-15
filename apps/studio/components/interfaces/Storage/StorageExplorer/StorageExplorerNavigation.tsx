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
  /** Previews a file and collapses the stack back to the column holding it. */
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
  const previewedFileId = snap.selectedFilePreview?.id
  const lastColumn = snap.columns[snap.columns.length - 1]
  const isLastColumnReady = lastColumn?.status === STORAGE_ROW_STATUS.READY

  const previousStorePathRef = useRef(storePath)
  const previousSearchStringRef = useRef<string | null>(null)
  /** Marks a store move as deliberate navigation (push), not a mutation side effect (replace). */
  const navigationHistoryModeRef = useRef<'push' | null>(null)
  const previousPreviewRef = useRef(previewedFileName)
  /**
   * The `?path` a restore is in flight for. `fetchFoldersByPath` only updates
   * `openedFolders` at the very end, so mid-flight the store still reports the old path —
   * without this that divergence reads as fresh and kicks off a second restore.
   */
  const restoringPathRef = useRef<string | null>(null)
  /**
   * A `?path` change that landed mid-restore. Finishing that restore moves the store to the
   * *older* path, which would otherwise read as the store having moved last and be written
   * straight back over the newer URL.
   */
  const hasSupersededRestoreRef = useRef(false)

  const restoreFromUrl = useEffectEvent(async () => {
    restoringPathRef.current = urlPath
    hasSupersededRestoreRef.current = false
    try {
      const { missingPaths } = await snap.fetchFoldersByPath({
        paths: urlFolderPaths,
        searchString,
        showLoading: true,
      })
      // Skip the fallback once a newer URL has superseded this pass; its own restore runs.
      if (missingPaths.length > 0 && !hasSupersededRestoreRef.current) {
        // The link points at a folder that no longer exists. Fall back to the bucket root
        // and correct the URL together so the two stay in step — rewriting the URL alone
        // would leave the store on the dead path for the reconcile effect to write back.
        await snap.fetchFoldersByPath({ paths: [], searchString, showLoading: true })
        setUrlLocation({ paths: [], preview: null }, { history: 'replace' })
      }
    } finally {
      restoringPathRef.current = null
    }
  })

  const refetchForSearch = useEffectEvent(async () => {
    // Only the folder you are standing in is refetched — passing the term to every open
    // column (as the old fetch did) made the current folder vanish from its own parent.
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
    if (!isBucketReady) return
    if (restoringPathRef.current !== null) {
      // Hold on to a URL change that landed mid-restore; the pass after it is where it applies.
      if (urlPath !== restoringPathRef.current) hasSupersededRestoreRef.current = true
      return
    }

    const hasStoreChanged = storePath !== previousStorePathRef.current
    previousStorePathRef.current = storePath

    const hasSearchChanged = searchString !== previousSearchStringRef.current
    previousSearchStringRef.current = searchString

    // A superseded restore means the URL, not the store, is the side that moved last.
    const hasUrlSupersededStore = hasSupersededRestoreRef.current
    hasSupersededRestoreRef.current = false

    // Nothing loaded yet, or the store still holds the bucket we navigated away from —
    // the provider is keyed per project, so a bucket switch does not remount it.
    const isStoreEmpty = snap.columns.length === 0
    const isStoreOnAnotherBucket = rootColumnName !== bucketName
    if (isStoreEmpty || isStoreOnAnotherBucket) {
      restoreFromUrl()
      return
    }

    if (storePath !== urlPath) {
      if (hasStoreChanged && !hasUrlSupersededStore) {
        const history = navigationHistoryModeRef.current ?? 'replace'
        navigationHistoryModeRef.current = null
        reconcileUrlToStore(history)
        return
      }
      restoreFromUrl()
      return
    }

    // Settled. Drop an intent that never became a path change (a preview in the deepest
    // column, say) so it can't mislabel a later store mutation.
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

    const item = lastColumn.items.find(
      (columnItem) => columnItem.name === urlPreview && columnItem.type === STORAGE_ROW_TYPES.FILE
    )
    if (!item) {
      // Absent doesn't mean deleted: a search filters the listing and it is capped at
      // LIMIT, so only drop the param once this listing is complete and unfiltered.
      const isListingComplete = !searchString && !lastColumn.hasMoreItems
      if (isListingComplete) setUrlPreview(null)
      return
    }
    // Match on id, not name — the same name in a different folder is a different file.
    if (previewedFileId === item.id) return

    snap.setSelectedFilePreview({ ...item, columnIndex: snap.columns.length - 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBucketReady,
    isLastColumnReady,
    urlPreview,
    previewedFileName,
    previewedFileId,
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
    const paths = snap.openedFolders.slice(0, item.columnIndex).map((folder) => folder.name)
    // Collapsing back to the file's own column is a navigation; previewing in place isn't.
    const isCollapsingColumns = item.columnIndex < snap.openedFolders.length

    snap.popColumnAtIndex(item.columnIndex)
    snap.popOpenedFoldersAtIndex(item.columnIndex - 1)
    snap.clearSelectedItems()
    snap.setSelectedFilePreview(item)
    // One write, so the URL never pairs the new file with the old, deeper path — a
    // separate `preview` write would leave exactly that pairing behind in history.
    setUrlLocation(
      { paths, preview: item.name },
      { history: isCollapsingColumns ? 'push' : 'replace' }
    )
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
