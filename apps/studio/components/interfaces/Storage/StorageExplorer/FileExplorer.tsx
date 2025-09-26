import { noop } from 'lodash'
import { DragEvent, useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { cn } from 'ui'
import { CONTEXT_MENU_KEYS, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageColumn, StorageItemWithColumn } from '../Storage.types'
import { ColumnContextMenu } from './ColumnContextMenu'
import { CustomDragLayer } from './CustomDragLayer'
import { FileExplorerColumn } from './FileExplorerColumn'
import { FolderContextMenu } from './FolderContextMenu'
import { ItemContextMenu } from './ItemContextMenu'

export interface FileExplorerProps {
  columns: StorageColumn[]
  selectedItems: StorageItemWithColumn[]
  itemSearchString: string
  onFilesUpload: (event: DragEvent<HTMLDivElement>, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
}

export const FileExplorer = ({
  columns = [],
  selectedItems = [],
  itemSearchString,
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
    <DndProvider backend={HTML5Backend}>
      <div
        ref={fileExplorerRef}
        className={cn(
          'file-explorer flex flex-grow overflow-x-auto justify-between h-full w-full relative',
          snap.view === STORAGE_VIEWS.LIST && 'flex-col'
        )}
      >
        <CustomDragLayer />
        <ColumnContextMenu id={CONTEXT_MENU_KEYS.STORAGE_COLUMN} />
        <ItemContextMenu id={CONTEXT_MENU_KEYS.STORAGE_ITEM} />
        <FolderContextMenu id={CONTEXT_MENU_KEYS.STORAGE_FOLDER} />
        {snap.view === STORAGE_VIEWS.COLUMNS ? (
          <div className="flex">
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
    </DndProvider>
  )
}
