import { noop } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_VIEWS } from '../Storage.constants'
import { hasVersioningHistory } from '../StorageProtection.constants'
import type { StorageColumn, StorageItemWithColumn } from '../Storage.types'
import { getArchivedOverlayItems } from './archivedOverlay.utils'
import { FileExplorerColumn } from './FileExplorerColumn'
import { useStoragePreference } from './useStoragePreference'
import { useBucketTrashQuery } from '@/data/storage/protection/bucket-trash-query'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export interface FileExplorerProps {
  columns: StorageColumn[]
  selectedItems: StorageItemWithColumn[]
  itemSearchString: string
  isLoading?: boolean
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
}

export const FileExplorer = ({
  columns = [],
  selectedItems = [],
  itemSearchString,
  isLoading = false,
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
}: FileExplorerProps) => {
  const fileExplorerRef = useRef<any>(null)
  const snap = useStorageExplorerStateSnapshot()
  const { view, showArchivedInline } = useStoragePreference(snap.projectRef)

  const isVersioned = hasVersioningHistory(snap.selectedBucket?.id)
  const isOverlayEnabled = isVersioned && showArchivedInline

  const { data: trashObjects = [] } = useBucketTrashQuery(
    { projectRef: snap.projectRef, bucketId: snap.selectedBucket?.id },
    { enabled: isOverlayEnabled }
  )

  const overlaidColumns = useMemo(() => {
    if (!isOverlayEnabled) return columns
    return columns.map((column) => {
      // `column.path` is the folder path from the bucket root (e.g. "images/2024"
      // or "" at the root). Split it into segments to line up with the
      // archived item paths.
      const folderSegments = column.path.split('/').filter((segment) => segment.length > 0)
      const existingItemNames = new Set(column.items.map((item) => item.name))
      const archivedItems = getArchivedOverlayItems({
        folderSegments,
        trashObjects,
        existingItemNames,
      })
      if (archivedItems.length === 0) return column
      return { ...column, items: [...column.items, ...archivedItems] }
    })
  }, [columns, trashObjects, isOverlayEnabled])

  useEffect(() => {
    if (fileExplorerRef) {
      const { scrollWidth, clientWidth } = fileExplorerRef.current
      if (scrollWidth > clientWidth) {
        fileExplorerRef.current.scrollLeft += scrollWidth - clientWidth
      }
    }
  }, [overlaidColumns])

  return (
    <div
      ref={fileExplorerRef}
      className={cn(
        'file-explorer flex grow overflow-x-auto justify-between h-full w-full relative',
        view === STORAGE_VIEWS.LIST && 'flex-col'
      )}
    >
      {isLoading ? (
        <FileExplorerColumn
          column={{ id: '', name: '', path: '', items: [], status: STORAGE_ROW_STATUS.LOADING }}
        />
      ) : view === STORAGE_VIEWS.COLUMNS ? (
        <div className="flex">
          {overlaidColumns.map((column, index) => (
            <FileExplorerColumn
              key={`column-${index}`}
              index={index}
              column={column}
              selectedItems={selectedItems}
              itemSearchString={itemSearchString}
              onFilesUpload={onFilesUpload}
              onSelectAllItemsInColumn={onSelectAllItemsInColumn}
              onSelectColumnEmptySpace={onSelectColumnEmptySpace}
              onColumnLoadMore={onColumnLoadMore}
            />
          ))}
        </div>
      ) : view === STORAGE_VIEWS.LIST ? (
        <>
          {overlaidColumns.length > 0 && (
            <FileExplorerColumn
              fullWidth
              index={overlaidColumns.length - 1}
              column={overlaidColumns[overlaidColumns.length - 1]}
              selectedItems={selectedItems}
              itemSearchString={itemSearchString}
              onFilesUpload={onFilesUpload}
              onSelectAllItemsInColumn={onSelectAllItemsInColumn}
              onSelectColumnEmptySpace={onSelectColumnEmptySpace}
              onColumnLoadMore={onColumnLoadMore}
            />
          )}
        </>
      ) : (
        <div>Unknown view: {view}</div>
      )}
    </div>
  )
}
