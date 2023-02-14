import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'

import { STORAGE_VIEWS, CONTEXT_MENU_KEYS } from '../Storage.constants'
import ItemContextMenu from './ItemContextMenu'
import FolderContextMenu from './FolderContextMenu'
import ColumnContextMenu from './ColumnContextMenu'
import FileExplorerColumn from './FileExplorerColumn'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'

const FileExplorer = ({
  view = STORAGE_VIEWS.COLUMNS,
  columns = [],
  openedFolders = [],
  selectedItems = [],
  selectedFilePreview = {},
  onFilesUpload = () => {},
  onSelectAllItemsInColumn = () => {},
  onSelectColumnEmptySpace = () => {},
  onSelectCreateFolder = () => {},
  onChangeView = () => {},
  onChangeSortBy = () => {},
  onChangeSortByOrder = () => {},
  onColumnLoadMore = () => {},
}) => {
  const fileExplorerRef = useRef(null)
  const storageExplorerStore = useStorageStore()

  const { setSelectedItemToRename, setSelectedItemsToDelete } = storageExplorerStore

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
      <ColumnContextMenu
        id={CONTEXT_MENU_KEYS.STORAGE_COLUMN}
        onCreateNewFolder={onSelectCreateFolder}
        onSelectAllItems={onSelectAllItemsInColumn}
        onSelectView={onChangeView}
        onSelectSort={onChangeSortBy}
        onSelectSortByOrder={onChangeSortByOrder}
      />
      <ItemContextMenu id={CONTEXT_MENU_KEYS.STORAGE_ITEM} />
      <FolderContextMenu
        id={CONTEXT_MENU_KEYS.STORAGE_FOLDER}
        onRenameFolder={(folder) => setSelectedItemToRename(folder)}
        onDeleteFolder={(folder) => setSelectedItemsToDelete([folder])}
      />
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
              selectedFilePreview={selectedFilePreview}
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

export default observer(FileExplorer)
