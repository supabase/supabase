import { compact, get, isEmpty, uniqBy } from 'lodash'
import { useEffect, useRef, useState } from 'react'

import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import type { Bucket } from 'data/storage/buckets-query'
import { useLatest } from 'hooks/misc/useLatest'
import { IS_PLATFORM } from 'lib/constants'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { useSelectedBucket } from '../FilesBuckets/useSelectedBucket'
import { STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { CustomExpiryModal } from './CustomExpiryModal'
import { FileExplorer } from './FileExplorer'
import { FileExplorerHeader } from './FileExplorerHeader'
import { FileExplorerHeaderSelection } from './FileExplorerHeaderSelection'
import { MoveItemsModal } from './MoveItemsModal'
import { PreviewPane } from './PreviewPane'

export const StorageExplorer = () => {
  const { ref, bucketId } = useParams()
  const storageExplorerRef = useRef(null)
  const {
    projectRef,
    view,
    columns,
    selectedItems,
    openedFolders,
    selectedItemsToMove,
    selectedBucket,
    openBucket,
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
  } = useStorageExplorerStateSnapshot()

  useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const { data: bucket, isLoading: isBucketQueryLoading } = useSelectedBucket()

  // Detect when transitioning between buckets to avoid showing stale content from the previous bucket.
  // This happens because the bucket query and effects that update the store run after the first render.
  const isLoading = isBucketQueryLoading || (!!bucketId && bucketId !== selectedBucket.id)

  // This state exists outside of the header because FileExplorerColumn needs to listen to these as well
  // Things like showing results from a search filter is "temporary", hence we use react state to manage
  const [itemSearchString, setItemSearchString] = useState('')
  const debouncedSearchString = useDebounce(itemSearchString, 500)

  const fetchContents = useStaticEffectEvent(async (bucket: Bucket) => {
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
  }, [bucket, projectRef, debouncedSearchString, fetchContents])

  const openBucketRef = useLatest(openBucket)
  useEffect(() => {
    if (bucket && !!projectRef) openBucketRef.current(bucket)
  }, [bucket, projectRef, openBucketRef])

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
    <div
      ref={storageExplorerRef}
      className="bg-studio border rounded-md border-overlay flex h-full w-full flex-col"
    >
      {selectedItems.length === 0 ? (
        <FileExplorerHeader
          itemSearchString={itemSearchString}
          setItemSearchString={setItemSearchString}
          onFilesUpload={onFilesUpload}
        />
      ) : (
        <FileExplorerHeaderSelection />
      )}
      <div className="flex flex-1 min-h-0">
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
        <PreviewPane />
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
