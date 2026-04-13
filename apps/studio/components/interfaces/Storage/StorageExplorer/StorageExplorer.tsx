import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { compact, get, isEmpty, uniqBy } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { cn } from 'ui'

import { useSelectedBucket } from '../FilesBuckets/useSelectedBucket'
import { STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItem, StorageItemWithColumn } from '../Storage.types'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import { CustomExpiryModal } from './CustomExpiryModal'
import { FileExplorer } from './FileExplorer'
import { FileExplorerHeader } from './FileExplorerHeader'
import { FileExplorerHeaderSelection } from './FileExplorerHeaderSelection'
import { MoveItemsModal } from './MoveItemsModal'
import { PreviewPane } from './PreviewPane'
import {
  StorageExplorerPickerProvider,
  type StoragePickerReturnValue,
} from './StorageExplorerPickerContext'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import type { Bucket } from '@/data/storage/buckets-query'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { IS_PLATFORM } from '@/lib/constants'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export type StorageExplorerProps = {
  variant?: 'default' | 'picker'
  pickerReturnValue?: StoragePickerReturnValue
  onPickerPick?: (value: string) => void
  pickerAcceptedFileExtensions?: string[]
  pickerHideUnsupportedFiles?: boolean
  forceListView?: boolean

  expectedBucketId?: string
  className?: string
}

export const StorageExplorer = ({
  variant = 'default',
  pickerReturnValue = 'objectPath',
  onPickerPick,
  pickerAcceptedFileExtensions,
  pickerHideUnsupportedFiles = false,
  forceListView = false,
  expectedBucketId,
  className,
}: StorageExplorerProps = {}) => {
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

  const isPicker = variant === 'picker'

  useProjectStorageConfigQuery({ projectRef }, { enabled: IS_PLATFORM && !!projectRef })
  const { data: routeBucket, isLoading: isRouteBucketLoading } = useSelectedBucket()

  const isLoading = isPicker
    ? !selectedBucket?.id ||
      (expectedBucketId !== undefined && expectedBucketId !== selectedBucket.id)
    : isRouteBucketLoading || (!!bucketId && bucketId !== selectedBucket.id)

  const bucketForFetch = isPicker ? (selectedBucket as Bucket | undefined) : routeBucket
  const bucketForFetchId = bucketForFetch?.id
  const bucketForFetchName = bucketForFetch?.name

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
        const paths = openedFolders.map((folder: StorageItem) => folder.name)
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
    if (!projectRef || !bucketForFetchId || !bucketForFetchName) return
    // These values intentionally trigger refetches when search/sort view changes.
    void debouncedSearchString
    void view
    void fetchContents({ id: bucketForFetchId, name: bucketForFetchName } as Bucket)
  }, [projectRef, bucketForFetchId, bucketForFetchName, debouncedSearchString, view, fetchContents])

  const onSelectAllItemsInColumn = (columnIndex: number) => {
    const columnFiles = columns[columnIndex].items
      .filter((item: StorageItem) => item.type === STORAGE_ROW_TYPES.FILE)
      .map((item: StorageItem) => {
        return { ...item, columnIndex }
      })
    const columnFilesId = compact(columnFiles.map((item: StorageItemWithColumn) => item.id))
    const selectedItemsFromColumn = selectedItems.filter(
      (item: StorageItemWithColumn) => item.id && columnFilesId.includes(item.id)
    )

    if (selectedItemsFromColumn.length === columnFiles.length) {
      const updatedSelectedItems = selectedItems.filter(
        (item: StorageItemWithColumn) => item.id && !columnFilesId.includes(item.id)
      )
      setSelectedItems(updatedSelectedItems)
    } else {
      const updatedSelectedItems = uniqBy(selectedItems.concat(columnFiles), 'id')
      setSelectedItems(updatedSelectedItems)
    }
  }

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

  const onSelectColumnEmptySpace = (columnIndex: number) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setSelectedFilePreview(undefined)
    clearSelectedItems()
  }

  const explorerTree = (
    <div
      ref={storageExplorerRef}
      className={cn(
        'bg-studio border border-overlay flex h-full min-h-full w-full min-w-0 flex-1 flex-col rounded-md',
        className
      )}
    >
      {selectedItems.length === 0 ? (
        <FileExplorerHeader
          itemSearchString={itemSearchString}
          setItemSearchString={setItemSearchString}
          onFilesUpload={onFilesUpload}
          variant={variant}
          forceListView={forceListView}
        />
      ) : (
        <FileExplorerHeaderSelection />
      )}
      <div className="file-explorer flex min-h-0 min-w-0 flex-1 h-full">
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

      {!isPicker && (
        <>
          <MoveItemsModal
            bucketName={selectedBucket.name}
            visible={selectedItemsToMove.length > 0}
            selectedItemsToMove={selectedItemsToMove}
            onSelectCancel={() => setSelectedItemsToMove([])}
            onSelectMove={onMoveSelectedFiles}
          />

          <CustomExpiryModal />
        </>
      )}
    </div>
  )

  if (isPicker && onPickerPick) {
    return (
      <StorageExplorerPickerProvider
        returnValue={pickerReturnValue}
        onPick={onPickerPick}
        forceListView={forceListView}
        acceptedFileExtensions={pickerAcceptedFileExtensions}
        hideUnsupportedFiles={pickerHideUnsupportedFiles}
      >
        {explorerTree}
      </StorageExplorerPickerProvider>
    )
  }

  return explorerTree
}

StorageExplorer.displayName = 'StorageExplorer'
