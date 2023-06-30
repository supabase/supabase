import { useState, useRef, useEffect } from 'react'
import { get, noop, sum } from 'lodash'
import { Checkbox, IconUpload } from 'ui'
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
import { BASE_PATH } from 'lib/constants'
import { StorageColumn } from '../Storage.types'

const DragOverOverlay = ({ isOpen, onDragLeave, onDrop, folderIsEmpty }: any) => {
  return (
    <Transition
      show={isOpen}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0"
      enterTo="transform opacity-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
      className="h-full w-full absolute top-0"
    >
      <div
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="absolute top-0 flex h-full w-full items-center justify-center"
        style={{ backgroundColor: folderIsEmpty ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)' }}
      >
        {!folderIsEmpty && (
          <div
            className="w-3/4 h-32 border-2 border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center p-6 pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <IconUpload className="text-white pointer-events-none" size={20} strokeWidth={2} />
            <p className="text-center text-sm  text-white mt-2 pointer-events-none">
              Drop your files to upload to this folder
            </p>
          </div>
        )}
      </div>
    </Transition>
  )
}

export interface FileExplorerColumnProps {
  index: number
  view: string
  column: StorageColumn
  fullWidth?: boolean
  openedFolders?: any[]
  selectedItems: any[]
  selectedFilePreview: any
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
  onCopyUrl: (name: string, url: string) => void
}

const FileExplorerColumn = ({
  index = 0,
  view = STORAGE_VIEWS.COLUMNS,
  column,
  fullWidth = false,
  openedFolders = [],
  selectedItems = [],
  selectedFilePreview = {},
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
  onCopyUrl = noop,
}: FileExplorerColumnProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const fileExplorerColumnRef = useRef<any>(null)

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

  const columnItems = column.items
  const columnItemsSize = sum(columnItems.map((item) => get(item, ['metadata', 'size'], 0)))

  const { show } = useContextMenu()
  const displayMenu = (event: any) => {
    show(event, {
      id: CONTEXT_MENU_KEYS.STORAGE_COLUMN,
      props: { index },
    })
  }

  const onDragOver = (event: any) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
      if (event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      }
    }
  }

  const onDrop = (event: any) => {
    onDragOver(event)
    onFilesUpload(event, index)
  }

  const SelectAllCheckbox = () => (
    <Checkbox
      label=""
      className="-mt-0.5"
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
        hide-scrollbar relative flex flex-shrink-0 flex-col overflow-auto
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
          className={`sticky top-0 z-10 mb-0 flex items-center bg-table-header-light px-2.5 dark:bg-table-header-dark ${
            haveSelectedItems ? 'h-10 py-3 opacity-100' : 'h-0 py-0 opacity-0'
          } transition-all duration-200`}
          onClick={(event) => event.stopPropagation()}
        >
          {columnFiles.length > 0 ? (
            <>
              <SelectAllCheckbox />
              <p className="text-sm text-scale-1100">Select all {columnFiles.length} files</p>
            </>
          ) : (
            <p className="text-sm text-scale-1100">No files available for selection</p>
          )}
        </div>
      )}

      {/* List Interface Header */}
      {view === STORAGE_VIEWS.LIST && (
        <div
          className="
          sticky top-0
          z-10 flex min-w-min items-center border-b border-panel-border-light bg-panel-footer-light px-2.5
          py-2 dark:border-panel-border-dark dark:bg-panel-footer-dark
        "
        >
          <div className="flex w-[40%] min-w-[250px] items-center">
            <SelectAllCheckbox />
            <p className="text-sm">Name</p>
          </div>
          <p className="w-[11%] min-w-[100px] text-sm">Size</p>
          <p className="w-[14%] min-w-[100px] text-sm">Type</p>
          <p className="w-[15%] min-w-[160px] text-sm">Created at</p>
          <p className="w-[15%] min-w-[160px] text-sm">Last modified at</p>
        </div>
      )}

      {/* Shimmering loaders while fetching contents */}
      {column.status === STORAGE_ROW_STATUS.LOADING && (
        <div
          className={`
            ${fullWidth ? 'w-full' : 'w-64 border-r border-gray-500'}
            px-2 py-1 my-1 flex flex-shrink-0 flex-col space-y-2 overflow-auto
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
          onCopyUrl,
        }}
        ItemComponent={FileExplorerRow}
        getItemSize={(index) => (index !== 0 && index === columnItems.length ? 85 : 37)}
        hasNextPage={column.status !== STORAGE_ROW_STATUS.LOADING && column.hasMoreItems}
        isLoadingNextPage={column.isLoadingMoreItems}
        onLoadNextPage={() => onColumnLoadMore(index, column)}
      />

      {/* Drag drop upload CTA for when column is empty */}
      {column.items.length === 0 && column.status !== STORAGE_ROW_STATUS.LOADING && (
        <div className="h-full w-full flex flex-col items-center justify-center">
          <img
            src={`${BASE_PATH}/img/storage-placeholder.svg`}
            className="opacity-75 pointer-events-none"
          />
          <p className="my-3 opacity-75">Drop your files here</p>
          <p className="w-40 text-center text-sm text-scale-1100">
            Or upload them via the "Upload file" button above
          </p>
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
          sticky bottom-0
          z-10 flex min-w-min items-center bg-panel-footer-light px-2.5 py-2 dark:bg-panel-footer-dark
        "
        >
          <p className="text-sm">
            {formatBytes(columnItemsSize)} for {columnItems.length} items
          </p>
        </div>
      )}
    </div>
  )
}

export default FileExplorerColumn
