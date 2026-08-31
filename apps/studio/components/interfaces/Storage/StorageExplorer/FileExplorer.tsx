import { noop } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from 'ui'

import {
  STORAGE_ROW_STATUS,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from '../Storage.constants'
import { hasVersioningHistory } from '../StorageProtection.constants'
import type { StorageColumn, StorageItem, StorageItemWithColumn } from '../Storage.types'
import { getArchivedOverlayItems } from './archivedOverlay.utils'
import { FileExplorerColumn } from './FileExplorerColumn'
import { useStoragePreference } from './useStoragePreference'
import { useBucketTrashQuery } from '@/data/storage/protection/bucket-trash-query'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/**
 * Values from a storage item used for sorting. Nulls sort last regardless of
 * order — falls back to `deletedAt` for the archived items that don't have
 * their own created_at / last_accessed_at so they still land somewhere
 * sensible in the merged list rather than always at the end.
 */
const getSortValue = (item: StorageItem, sortBy: STORAGE_SORT_BY): string | number | null => {
  switch (sortBy) {
    case STORAGE_SORT_BY.NAME:
      return item.name.toLowerCase()
    case STORAGE_SORT_BY.CREATED_AT:
      return item.created_at ?? (item.archived ? item.updated_at : null)
    case STORAGE_SORT_BY.UPDATED_AT:
      return item.updated_at
    case STORAGE_SORT_BY.LAST_ACCESSED_AT:
      return item.last_accessed_at ?? (item.archived ? item.updated_at : null)
  }
}

const compareItems =
  (sortBy: STORAGE_SORT_BY, order: STORAGE_SORT_BY_ORDER) => (a: StorageItem, b: StorageItem) => {
    const aValue = getSortValue(a, sortBy)
    const bValue = getSortValue(b, sortBy)
    // Nulls sort last regardless of order — same behavior as the server-side
    // sort on the live items, so a merged list stays consistent.
    if (aValue === null && bValue === null) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1
    if (aValue < bValue) return order === STORAGE_SORT_BY_ORDER.ASC ? -1 : 1
    if (aValue > bValue) return order === STORAGE_SORT_BY_ORDER.ASC ? 1 : -1
    return 0
  }

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
  const { view, showArchivedInline, sortBy, sortByOrder } = useStoragePreference(snap.projectRef)

  const isVersioned = hasVersioningHistory(snap.selectedBucket?.id)
  const isOverlayEnabled = isVersioned && showArchivedInline

  const { data: trashObjects = [] } = useBucketTrashQuery(
    { projectRef: snap.projectRef, bucketId: snap.selectedBucket?.id },
    { enabled: isOverlayEnabled }
  )

  const overlaidColumns = useMemo(() => {
    if (!isOverlayEnabled) return columns
    const compare = compareItems(sortBy, sortByOrder)
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
      // Re-sort the merged list here rather than lean on the server-side
      // sort (which never sees the archived rows). Live items came back
      // already sorted, so a stable sort of the merged list produces the
      // same interleaving that a single sort of every row would.
      const items = [...column.items, ...archivedItems].sort(compare)
      return { ...column, items }
    })
  }, [columns, trashObjects, isOverlayEnabled, sortBy, sortByOrder])

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
