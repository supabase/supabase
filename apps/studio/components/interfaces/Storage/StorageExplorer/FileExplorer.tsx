import { noop } from 'lodash'
import { useEffect, useRef } from 'react'
import { cn } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn, StorageItemWithColumn } from '../Storage.types'
import { FileExplorerColumn } from './FileExplorerColumn'
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

  useEffect(() => {
    if (fileExplorerRef) {
      const { scrollWidth, clientWidth } = fileExplorerRef.current
      if (scrollWidth > clientWidth) {
        fileExplorerRef.current.scrollLeft += scrollWidth - clientWidth
      }
    }
  }, [columns])

  return (
    <div
      ref={fileExplorerRef}
      className={cn(
        'file-explorer relative flex min-h-0 min-w-0 w-full flex-1 h-full justify-between overflow-x-auto',
        snap.view === STORAGE_VIEWS.LIST && 'h-full min-h-0 flex-col',
        snap.view === STORAGE_VIEWS.COLUMNS && 'h-full'
      )}
    >
      {isLoading ? (
        <FileExplorerColumn
          column={{ id: '', name: '', path: '', items: [], status: STORAGE_ROW_STATUS.LOADING }}
        />
      ) : snap.view === STORAGE_VIEWS.COLUMNS ? (
        <div className="flex h-full min-h-0 min-w-0">
          {columns.map((column, index) => (
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
      ) : snap.view === STORAGE_VIEWS.LIST ? (
        <>
          {columns.length > 0 && (
            <FileExplorerColumn
              fullWidth
              index={columns.length - 1}
              column={columns[columns.length - 1]}
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
        <div>Unknown view: {snap.view}</div>
      )}
    </div>
  )
}
