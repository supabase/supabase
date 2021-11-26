import { useState, useRef, useEffect } from 'react'
import { get, sum } from 'lodash'
import { Checkbox, IconUpload, Typography } from '@supabase/ui'
import { Transition } from '@headlessui/react'
import { useContextMenu } from 'react-contexify'

import InfiniteList from 'components/ui/InfiniteList'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import FileExplorerRow from './FileExplorerRow'
import {
  STORAGE_VIEWS,
  STORAGE_ROW_TYPES,
  STORAGE_ROW_STATUS,
  CONTEXT_MENU_KEYS,
} from '../Storage.constants'
import { formatBytes } from 'lib/helpers'

const DragOverOverlay = ({ isOpen, onDragLeave, onDrop, folderIsEmpty }) => {
  return (
    <Transition
      show={isOpen}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0"
      enterTo="transform opacity-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
    >
      <div
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="absolute w-full h-full top-0 flex items-center justify-center"
        style={{ backgroundColor: folderIsEmpty ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)' }}
      >
        {!folderIsEmpty && (
          <div
            className="w-3/4 h-32 border-2 border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center p-6 pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <IconUpload className="text-white pointer-events-none" size={20} strokeWidth={2} />
            <Typography.Text className="text-center text-sm mt-2 pointer-events-none">
              Drop your files to upload to this folder
            </Typography.Text>
          </div>
        )}
      </div>
    </Transition>
  )
}

const FileExplorerColumn = ({
  index = 0,
  view = STORAGE_VIEWS.COLUMNS,
  column = {},
  fullWidth = false,
  openedFolders = [],
  selectedItems = [],
  selectedFilePreview = {},
  isSearching = false,
  itemSearchString = '',
  onCheckItem = () => {},
  onSelectItemDelete = () => {},
  onSelectItemRename = () => {},
  onSelectItemMove = () => {},
  onSelectFile = () => {},
  onRenameFile = () => {},
  onCopyFileURL = () => {},
  onFilesUpload = () => {},
  onDownloadFile = () => {},
  onSelectFolder = () => {},
  onRenameFolder = () => {},
  onCreateFolder = () => {},
  onSelectAllItemsInColumn = () => {},
  onSelectColumnEmptySpace = () => {},
}) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const fileExplorerColumnRef = useRef(null)

  useEffect(() => {
    if (fileExplorerColumnRef) {
      const { scrollHeight, clientHeight } = fileExplorerColumnRef.current
      if (scrollHeight > clientHeight) {
        fileExplorerColumnRef.current.scrollTop += scrollHeight - clientHeight
      }
    }
  }, [column])

  const haveSelectedItems = selectedItems.length > 0
  const columnItemsId = column.items.map((item) => item.id)
  const columnFiles = column.items.filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
  const selectedItemsFromColumn = selectedItems.filter((item) => columnItemsId.includes(item.id))
  const selectedFilesFromColumn = selectedItemsFromColumn.filter(
    (item) => item.type === STORAGE_ROW_TYPES.FILE
  )

  const columnItems = isSearching
    ? column.items.filter((item) =>
        item.name.toLowerCase().includes(itemSearchString.toLowerCase())
      )
    : column.items

  const columnItemsSize = sum(columnItems.map((item) => get(item, ['metadata', 'size'], 0)))

  const { show } = useContextMenu()
  const displayMenu = (event) => {
    show(event, {
      id: CONTEXT_MENU_KEYS.STORAGE_COLUMN,
      props: { index },
    })
  }

  const onDragOver = (event) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      }
    }
  }

  const onDrop = (event) => {
    onDragOver(event)
    onFilesUpload(event, index)
  }

  const SelectAllCheckbox = () => (
    <Checkbox
      label=""
      checked={columnFiles.length !== 0 && selectedFilesFromColumn.length === columnFiles.length}
      disabled={columnFiles.length === 0}
      onChange={() => onSelectAllItemsInColumn(index)}
    />
  )

  return (
    <div
      ref={fileExplorerColumnRef}
      className={`
        ${
          fullWidth
            ? 'w-full'
            : 'w-64 border-r border-panel-border-light dark:border-panel-border-dark'
        }
        ${view === STORAGE_VIEWS.COLUMNS ? '' : ''}
        relative flex-shrink-0 overflow-auto flex flex-col hide-scrollbar
      `}
      onContextMenu={displayMenu}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={(event) => {
        const eventTarget = get(event.target, ['className'], '')
        if (typeof eventTarget === 'string' && eventTarget.includes('react-contexify')) return
        onSelectColumnEmptySpace(index)
      }}
    >
      {/* Checkbox selection for select all */}
      {view === STORAGE_VIEWS.COLUMNS && (
        <div
          className={`bg-table-header-light dark:bg-table-header-dark sticky top-0 z-10 flex items-center px-4 mb-0 ${
            haveSelectedItems > 0 ? 'opacity-100 py-3 h-10' : 'opacity-0 py-0 h-0'
          } transition-all duration-200`}
          onClick={(event) => event.stopPropagation()}
        >
          {columnFiles.length > 0 ? (
            <>
              <SelectAllCheckbox />
              <Typography.Text type="secondary">
                <p className="text-sm">Select all {columnFiles.length} files</p>
              </Typography.Text>
            </>
          ) : (
            <Typography.Text type="secondary">
              <p className="text-sm">No files available for selection</p>
            </Typography.Text>
          )}
        </div>
      )}

      {/* List Interface Header */}
      {view === STORAGE_VIEWS.LIST && (
        <div
          className="
          bg-panel-footer-light dark:bg-panel-footer-dark
          px-4 py-2 flex items-center min-w-min sticky top-0 z-10
          border-b border-panel-border-light dark:border-panel-border-dark
        "
        >
          <SelectAllCheckbox />
          <Typography.Text style={{ width: '30%', minWidth: '250px' }}>Name</Typography.Text>
          <Typography.Text style={{ width: '15%', minWidth: '100px' }}>Size</Typography.Text>
          <Typography.Text style={{ width: '15%', minWidth: '100px' }}>Type</Typography.Text>
          <Typography.Text style={{ width: '20%', minWidth: '180px' }}>Created at</Typography.Text>
          <Typography.Text style={{ width: '20%', minWidth: '180px' }}>
            Last modified at
          </Typography.Text>
          <div className="w-3" />
        </div>
      )}

      {/* Shimmering loaders while fetching contents */}
      {column.status === STORAGE_ROW_STATUS.LOADING && (
        <div
          className={`
            ${fullWidth ? 'w-full' : 'w-64 border-r border-gray-500'}
            ${view === STORAGE_VIEWS.COLUMNS ? 'my-1' : 'mb-1'}
            flex-shrink-0 overflow-auto flex flex-col space-y-1
          `}
        >
          <ShimmeringLoader />
          <ShimmeringLoader />
          <ShimmeringLoader />
        </div>
      )}

      {/* Column Interface */}
      <InfiniteList
        items={columnItems}
        itemProps={{
          view,
          columnIndex: index,
          selectedItems,
          openedFolders,
          selectedFilePreview,
          onCheckItem,
          onSelectFile,
          onRenameFile,
          onCopyFileURL,
          onDownloadFile,
          onSelectFolder,
          onRenameFolder,
          onCreateFolder,
          onSelectItemDelete,
          onSelectItemRename,
          onSelectItemMove,
        }}
        ItemComponent={FileExplorerRow}
        getItemSize={(index) => {
          if (index !== 0 && index === columnItems.length) return 85
          return 37
        }}
        // Scaffold props for infinite loading
        hasNextPage={false}
        isLoadingNextPage={false}
        onLoadNextPage={() => {}}
      />

      {/* Search empty state */}
      {isSearching && columnItems.length === 0 && column.items.length > 0 && (
        <div className="text-sm mx-3 my-2 opacity-50">No results found based on your search</div>
      )}

      {/* Drag drop upload CTA for when column is empty */}
      {column.items.length === 0 && column.status !== STORAGE_ROW_STATUS.LOADING && (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <img src="/img/storage-placeholder.svg" className="opacity-75" />
          <Typography.Text>
            <p className="my-3 opacity-75">Drop your files here</p>
          </Typography.Text>
          <Typography.Text type="secondary">
            <p className="text-sm text-center w-40">
              Or upload them via the "Upload file" button above
            </p>
          </Typography.Text>
        </div>
      )}

      {/* Drag drop upload CTA for when column has files */}
      <DragOverOverlay
        isOpen={isDraggedOver}
        onDragLeave={() => setIsDraggedOver(false)}
        onDrop={() => setIsDraggedOver(false)}
        folderIsEmpty={
          column.items.filter((item) => item.status !== STORAGE_ROW_STATUS.LOADING).length === 0
        }
      />

      {/* List interface footer */}
      {view === STORAGE_VIEWS.LIST && (
        <div
          className="
          bg-panel-footer-light dark:bg-panel-footer-dark
          px-4 py-2 flex items-center min-w-min sticky bottom-0 z-10
        "
        >
          <Typography.Text small>
            {formatBytes(columnItemsSize)} for {columnItems.length} items
          </Typography.Text>
        </div>
      )}
    </div>
  )
}

export default FileExplorerColumn
