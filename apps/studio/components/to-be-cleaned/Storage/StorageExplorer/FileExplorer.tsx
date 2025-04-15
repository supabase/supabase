import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'

import { noop, get, sum } from 'lodash'
import { CONTEXT_MENU_KEYS, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn, StorageItem, StorageItemWithColumn } from '../Storage.types'
import ColumnContextMenu from './ColumnContextMenu'
import FileExplorerColumn from './FileExplorerColumn'
import FolderContextMenu from './FolderContextMenu'
import ItemContextMenu from './ItemContextMenu'
import { formatBytes } from 'lib/helpers'

export interface FileExplorerProps {
  view: string
  columns: StorageColumn[]
  openedFolders: StorageItem[]
  selectedItems: StorageItemWithColumn[]
  itemSearchString: string
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
}

const FileExplorer = ({
  view = STORAGE_VIEWS.COLUMNS,
  columns = [],
  openedFolders = [],
  selectedItems = [],
  itemSearchString,
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
}: FileExplorerProps) => {
  const fileExplorerRef = useRef<any>(null)

  useEffect(() => {
    if (fileExplorerRef) {
      const { scrollWidth, clientWidth } = fileExplorerRef.current
      if (scrollWidth > clientWidth) {
        fileExplorerRef.current.scrollLeft += scrollWidth - clientWidth
      }
    }
  }, [columns])

  // Calculate total size and count across all columns
  const totalItems = columns.reduce((acc, column) => {
    return acc + column.items.length
  }, 0)

  const totalSize = columns.reduce((acc, column) => {
    const columnItems = column.items.map((item) => get(item, ['metadata', 'size'], 0))
    return acc + sum(columnItems)
  }, 0)

  return (
    <div className="flex flex-col h-full w-full">
      <div
        ref={fileExplorerRef}
        className="file-explorer flex flex-grow overflow-x-auto justify-between h-full w-full relative"
      >
        <ColumnContextMenu id={CONTEXT_MENU_KEYS.STORAGE_COLUMN} />
        <ItemContextMenu id={CONTEXT_MENU_KEYS.STORAGE_ITEM} />
        <FolderContextMenu id={CONTEXT_MENU_KEYS.STORAGE_FOLDER} />
        {view === STORAGE_VIEWS.COLUMNS ? (
          <div className="flex">
            {columns.map((column, index) => (
              <FileExplorerColumn
                key={`column-${index}`}
                index={index}
                view={view}
                column={column}
                openedFolders={openedFolders}
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
            {columns.length > 0 && (
              <FileExplorerColumn
                fullWidth
                index={columns.length - 1}
                view={view}
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
          <div>Unknown view: {view}</div>
        )}
      </div>
      {view === STORAGE_VIEWS.LIST && (
        <div
          className="
          sticky bottom-0 rounded-b-md mt-auto
          z-10 flex min-w-min items-center bg-panel-footer-light px-2.5 py-2 [[data-theme*=dark]_&]:bg-panel-footer-dark w-full
          "
        >
          <p className="text-sm">
            {formatBytes(totalSize)} for {totalItems} items
          </p>
        </div>
      )}
    </div>
  )
}

export default observer(FileExplorer)
