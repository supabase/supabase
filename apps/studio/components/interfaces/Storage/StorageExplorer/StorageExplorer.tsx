import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { compact, get, isEmpty, uniqBy } from 'lodash'
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'

import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import type { Bucket } from '@/data/storage/buckets-query'
import { IS_PLATFORM } from '@/lib/constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

import { useSelectedBucket } from '../FilesBuckets/useSelectedBucket'
import { STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { CustomExpiryModal } from './CustomExpiryModal'
import { DeletedFilePreviewPane } from './DeletedFilePreviewPane'
import { useDeletedFilesContext } from './DeletedFilesContext'
import { DeletedFilesHeaderSelection } from './DeletedFilesHeaderSelection'
import { DeletedFilesList } from './DeletedFilesList'
import { FileExplorer } from './FileExplorer'
import { FileExplorerHeader } from './FileExplorerHeader'
import { FileExplorerHeaderSelection } from './FileExplorerHeaderSelection'
import { MoveItemsModal } from './MoveItemsModal'
import { PreviewPane } from './PreviewPane'
import { useStorageExplorerShortcuts } from './useStorageExplorerShortcuts'
import { useStoragePreference } from './useStoragePreference'

export const StorageExplorer = () => {
  const { ref, bucketId } = useParams()
  const storageExplorerRef = useRef(null)
  const {
    projectRef,
    columns,
    selectedItems,
    openedFolders,
    selectedItemsToMove,
    selectedBucket,
    fetchFolderContents,
    fetchMoreFolderContents,
    fetchFoldersByPath,
    uploadFiles,
    moveFiles,
    popColumnAtIndex,
    popOpenedFoldersAtIndex,
    setSelectedItems,
    clearSelectedItems,
    setSelectedFilePreview,
    setSelectedItemsToMove,
    setIsSearching,
  } = useStorageExplorerStateSnapshot()
  const { isShowingDeleted, selectedDeletedIds, selectedDeletedFile, selectedDeletedVersion } =
    useDeletedFilesContext()
  const { view } = useStoragePreference(projectRef)

  useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { data: bucket, isLoading: isBucketQueryLoading } = useSelectedBucket()

  // Detect when transitioning between buckets to avoid showing stale content from the previous bucket.
  // This happens because the bucket query and effects that update the store run after the first render.
  const isLoading = isBucketQueryLoading || (!!bucketId && bucketId !== selectedBucket.id)

  // This state exists outside of the header because FileExplorerColumn needs to listen to these as well
  // Things like showing results from a search filter is "temporary", hence we use react state to manage
  const [itemSearchString, setItemSearchString] = useState('')
  const debouncedSearchString = useDebounce(itemSearchString, 500)

  const handleClearSearch = useCallback(() => {
    setIsSearching(false)
    setItemSearchString('')
  }, [setIsSearching])

  useStorageExplorerShortcuts({ onClearSearch: handleClearSearch })

  const fetchContents = useEffectEvent(async (bucket: Bucket) => {
    if (view === STORAGE_VIEWS.LIST) {
      const currentFolderIdx = openedFolders.length - 1
      const currentFolder = openedFolders[currentFolderIdx]

      const folderId = !currentFolder ? bucket.id : currentFolder.id
      const folderName = !currentFolder ? bucket.name : currentFolder.name
      const index = !currentFolder ? -1 : currentFolderIdx

      await fetchFolderContents({
        bucketId: bucket.id,
        folderId,
        folderName,
        index,
        searchString: debouncedSearchString,
      })
    } else if (view === STORAGE_VIEWS.COLUMNS) {
      if (openedFolders.length > 0) {
        const paths = openedFolders.map((folder) => folder.name)
        fetchFoldersByPath({
          paths,
          searchString: debouncedSearchString,
          showLoading: true,
        })
      } else {
        await fetchFolderContents({
          bucketId: bucket.id,
          folderId: bucket.id,
          folderName: bucket.name,
          index: -1,
          searchString: debouncedSearchString,
        })
      }
    }
  })

  useEffect(() => {
    if (bucket && projectRef) fetchContents(bucket)
  }, [bucket, projectRef, debouncedSearchString, selectedBucket.id])

  /** Checkbox selection methods */
  /** [Joshen] We'll only support checkbox selection for files ONLY */

  const onSelectAllItemsInColumn = (columnIndex: number) => {
    const columnFiles = columns[columnIndex].items
      .filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item) => {
        return { ...item, columnIndex }
      })
    const columnFilesId = compact(columnFiles.map((item) => item.id))
    const selectedItemsFromColumn = selectedItems.filter(
      (item) => item.id && columnFilesId.includes(item.id)
    )

    if (selectedItemsFromColumn.length === columnFiles.length) {
      // Deselect all items from column
      const updatedSelectedItems = selectedItems.filter(
        (item) => item.id && !columnFilesId.includes(item.id)
      )
      setSelectedItems(updatedSelectedItems)
    } else {
      // Select all items from column
      const updatedSelectedItems = uniqBy(selectedItems.concat(columnFiles), 'id')
      setSelectedItems(updatedSelectedItems)
    }
  }

  /** File manipulation methods */

  const onFilesUpload = async (event: any, columnIndex: number = -1) => {
    event.persist()
    const items = event.target.files || event.dataTransfer.items
    const isDrop = !isEmpty(get(event, ['dataTransfer', 'items'], []))
    await uploadFiles({ files: items, columnIndex, isDrop })
    event.target.value = ''
  }

  const onMoveSelectedFiles = async (newPath: string) => {
    await moveFiles(newPath)
  }

  /** Misc UI methods */
  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setSelectedFilePreview(undefined)
    clearSelectedItems()
  }

  return (
    <div ref={storageExplorerRef} className="bg-studio flex h-full w-full flex-col">
      {isShowingDeleted && selectedDeletedIds.length > 0 ? (
        <DeletedFilesHeaderSelection />
      ) : selectedItems.length > 0 && !isShowingDeleted ? (
        <FileExplorerHeaderSelection />
      ) : (
        <FileExplorerHeader
          itemSearchString={itemSearchString}
          setItemSearchString={setItemSearchString}
          onFilesUpload={onFilesUpload}
        />
      )}
      <div className="flex flex-1 min-h-0">
        {isShowingDeleted ? (
          <div className="relative flex-1 min-w-0 overflow-hidden">
            <div className="absolute inset-0 overflow-auto">
              <DeletedFilesList bucketId={selectedBucket.name} searchString={itemSearchString} />
            </div>
            {(selectedDeletedFile || selectedDeletedVersion) && (
              <div className="absolute inset-y-0 right-0 z-10 shadow-lg">
                <DeletedFilePreviewPane />
              </div>
            )}
          </div>
        ) : (
          <>
            <FileExplorer
              columns={columns}
              selectedItems={selectedItems}
              itemSearchString={itemSearchString}
              isLoading={isLoading}
              onFilesUpload={onFilesUpload}
              onSelectAllItemsInColumn={onSelectAllItemsInColumn}
              onSelectColumnEmptySpace={onSelectColumnEmptySpace}
              onColumnLoadMore={(index, column) =>
                fetchMoreFolderContents({ index, column, searchString: itemSearchString })
              }
            />
            {/* Selecting an archived row while `Show archived` is on takes
                over the normal preview slot with the archived file preview,
                so restore/permanent-delete actions live in the same spot as
                the live file's actions. */}
            {selectedDeletedFile || selectedDeletedVersion ? (
              <DeletedFilePreviewPane />
            ) : (
              <PreviewPane />
            )}
          </>
        )}
      </div>

      <ConfirmDeleteModal />

      <MoveItemsModal
        bucketName={selectedBucket.name}
        visible={selectedItemsToMove.length > 0}
        selectedItemsToMove={selectedItemsToMove}
        onSelectCancel={() => setSelectedItemsToMove([])}
        onSelectMove={onMoveSelectedFiles}
      />

      <CustomExpiryModal />
    </div>
  )
}

StorageExplorer.displayName = 'StorageExplorer'
