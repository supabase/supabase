import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'

import { noop } from 'lodash'
import { CONTEXT_MENU_KEYS, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn, StorageItem, StorageItemWithColumn } from '../Storage.types'
import ColumnContextMenu from './ColumnContextMenu'
import FileExplorerColumn from './FileExplorerColumn'
import FolderContextMenu from './FolderContextMenu'
import ItemContextMenu from './ItemContextMenu'

export interface FileExplorerProps {
  view: string
  columns: StorageColumn[]
  openedFolders: StorageItem[]
  selectedItems: StorageItemWithColumn[]
  selectedFilePreview: (StorageItemWithColumn & { previewUrl: string | undefined }) | null
  itemSearchString: string
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
  onCopyUrl: (name: string, url: string) => void
}

const FileExplorer = ({
  view = STORAGE_VIEWS.COLUMNS,
  columns = [],
  openedFolders = [],
  selectedItems = [],
  selectedFilePreview,
  itemSearchString,
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
  onCopyUrl = noop,
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

  return (
    <div
      ref={fileExplorerRef}
      className="file-explorer flex flex-grow overflow-x-auto justify-between h-full w-full"
    >
      <ColumnContextMenu id={CONTEXT_MENU_KEYS.STORAGE_COLUMN} />
      <ItemContextMenu id={CONTEXT_MENU_KEYS.STORAGE_ITEM} onCopyUrl={onCopyUrl} />
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
              selectedFilePreview={selectedFilePreview}
              itemSearchString={itemSearchString}
              onFilesUpload={onFilesUpload}
              onSelectAllItemsInColumn={onSelectAllItemsInColumn}
              onSelectColumnEmptySpace={onSelectColumnEmptySpace}
              onColumnLoadMore={onColumnLoadMore}
              onCopyUrl={onCopyUrl}
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
              selectedFilePreview={selectedFilePreview}
              itemSearchString={itemSearchString}
              onFilesUpload={onFilesUpload}
              onSelectAllItemsInColumn={onSelectAllItemsInColumn}
              onSelectColumnEmptySpace={onSelectColumnEmptySpace}
              onColumnLoadMore={onColumnLoadMore}
              onCopyUrl={onCopyUrl}
            />
          )}
        </>
      ) : (
        <div>Unknown view: {view}</div>
      )}
    </div>
  )
}

export default observer(FileExplorer)
