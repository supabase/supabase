import { noop } from 'lodash'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from 'ui'

import {
  STORAGE_ROW_STATUS,
  STORAGE_SORT_BY,
  STORAGE_SORT_BY_ORDER,
  STORAGE_VIEWS,
} from '../Storage.constants'
import type { StorageColumn, StorageItem, StorageItemWithColumn } from '../Storage.types'
import { useArchivedFilesContext } from './ArchivedFilesContext'
import { getArchivedOverlayItems } from './archivedOverlay.utils'
import { FileExplorerColumn } from './FileExplorerColumn'
import { useStoragePreference } from './useStoragePreference'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

/** Archived rows fall back to the archive timestamp so they don't all sink. */
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
    // Nulls last either way, matching the server-side sort on the live items.
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
  const { view, sortBy, sortByOrder } = useStoragePreference(snap.projectRef)
  const { isOverlayEnabled, archivedObjects } = useArchivedFilesContext()

  const overlaidColumns = useMemo(() => {
    if (!isOverlayEnabled || archivedObjects.length === 0) return columns
    const compare = compareItems(sortBy, sortByOrder)

    return columns.map((column) => {
      const folderSegments = column.path.split('/').filter((segment) => segment !== '')
      const archivedItems = getArchivedOverlayItems({
        folderSegments,
        archivedObjects,
        existingItemNames: new Set(column.items.map((item) => item.name)),
      })
      if (archivedItems.length === 0) return column

      // The server-side sort never saw the archived rows.
      return { ...column, items: [...column.items, ...archivedItems].sort(compare) }
    })
  }, [columns, archivedObjects, isOverlayEnabled, sortBy, sortByOrder])

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
