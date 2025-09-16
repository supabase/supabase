import { Transition } from '@headlessui/react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { get, noop, sum } from 'lodash'
import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useContextMenu } from 'react-contexify'
import { useDrop } from 'react-dnd'
import { toast } from 'sonner'

import InfiniteList from 'components/ui/InfiniteList'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { Checkbox, cn } from 'ui'
import {
  CONTEXT_MENU_KEYS,
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_VIEWS,
} from '../Storage.constants'
import type { StorageColumn, StorageItemWithColumn } from '../Storage.types'
import { FileExplorerRow } from './FileExplorerRow'

interface DragOverOverlayProps {
  isOpen: boolean
  onDragLeave: () => void
  onDrop: () => void
}

const DragOverOverlay = ({ isOpen, onDragLeave, onDrop }: DragOverOverlayProps) => {
  return (
    <Transition
      show={isOpen}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0"
      enterTo="transform opacity-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
      className="h-full w-full absolute top-0 pointer-events-none"
    >
      <div
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="absolute top-0 flex h-full w-full items-center justify-center pointer-events-auto"
        style={{ backgroundColor: folderIsEmpty ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)' }}
      >
        <div
          className="w-3/4 h-32 border-2 border-dashed border-muted rounded-md flex flex-col items-center justify-center p-6 pointer-events-none"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <Upload className="text-white pointer-events-none" size={20} strokeWidth={2} />
          <p className="text-center text-sm  text-white mt-2 pointer-events-none">
            Drop your files to upload to this folder
          </p>
        </div>
      </div>
    </Transition>
  )
}

export interface FileExplorerColumnProps {
  index: number
  column: StorageColumn
  fullWidth?: boolean
  selectedItems: StorageItemWithColumn[]
  itemSearchString: string
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
}

export const FileExplorerColumn = ({
  index = 0,
  column,
  fullWidth = false,
  selectedItems = [],
  itemSearchString,
  onFilesUpload = noop,
  onSelectAllItemsInColumn = noop,
  onSelectColumnEmptySpace = noop,
  onColumnLoadMore = noop,
}: FileExplorerColumnProps) => {
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const fileExplorerColumnRef = useRef<any>(null)

  const snap = useStorageExplorerStateSnapshot()
  const { can: canUpdateStorage } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  // Helper function to get the path for this column
  const getColumnPath = () => {
    // Use the index prop directly instead of trying to find it dynamically
    const columnIndex = index

    if (columnIndex >= 0) {
      // The column index represents the folder level we're currently viewing
      const path = snap.openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .join('/')

      return path
    }

    return ''
  }

  // Drop target for column background
  const [dropProps, drop] = useDrop({
    accept: 'storage-item',
    canDrop: (draggedItem: any, monitor: any) => {
      // Only allow drops when we're actually hovering over the column background
      // This prevents interference with folder item drops
      const isOverColumnBackground = monitor.isOver({ shallow: true })

      if (!isOverColumnBackground) {
        // Not over column background, blocking drop
        return false
      }

      // Handle multi-item drops
      if (draggedItem.type === 'multi-item') {
        const items = draggedItem.items || []

        // Check all items in the selection for drop validity
        for (const draggedSubItem of items) {
          // Don't allow dropping on the same column
          if (draggedSubItem.columnIndex === index) return false

          // Don't allow dropping a folder into itself or any of its subdirectories (circular reference)
          if (draggedSubItem.type === STORAGE_ROW_TYPES.FOLDER) {
            const draggedItemPath = snap.openedFolders
              .slice(0, draggedSubItem.columnIndex)
              .map((folder) => folder.name)
              .join('/')
            const targetPath = getColumnPath()

            // Build the full path of the dragged folder
            const draggedItemFullPath =
              draggedItemPath.length > 0
                ? `${draggedItemPath}/${draggedSubItem.name}`
                : draggedSubItem.name

            // Check if target path is the same as dragged item path (dropping on itself)
            if (targetPath === draggedItemFullPath) {
              // Cannot drop folder on itself
              return false
            }

            // Additional check: Block column background drops for folders when the target would be invalid
            // This prevents the column from intercepting drops that should go to folder items
            // Allow valid moves (like moving a folder to root) while preventing invalid ones
            const draggedItemCurrentPath = snap.openedFolders
              .slice(0, draggedSubItem.columnIndex)
              .map((folder) => folder.name)
              .join('/')

            // Block if the target path would be the same as the dragged item's current location
            // (This prevents self-drops, but allows moves from subdirectories to parent directories)
            if (targetPath === draggedItemCurrentPath) {
              // Blocking folder drop to same location
              return false
            }
          }
        }

        return true
      }

      // Handle single-item drops (existing logic)
      // Don't allow dropping on the same column
      if (draggedItem.sourceColumnIndex === index) return false

      // Don't allow dropping a folder into itself or any of its subdirectories (circular reference)
      if (draggedItem.type === STORAGE_ROW_TYPES.FOLDER) {
        const draggedItemPath = snap.openedFolders
          .slice(0, draggedItem.sourceColumnIndex)
          .map((folder) => folder.name)
          .join('/')
        const targetPath = getColumnPath()

        // Build the full path of the dragged folder
        const draggedItemFullPath =
          draggedItemPath.length > 0 ? `${draggedItemPath}/${draggedItem.name}` : draggedItem.name

        // Check if target path is the same as dragged item path (dropping on itself)
        if (targetPath === draggedItemFullPath) {
          // Cannot drop folder on itself
          return false
        }

        // Additional check: Block column background drops for folders when the target would be invalid
        // This prevents the column from intercepting drops that should go to folder items
        // Allow valid moves (like moving a folder to root) while preventing invalid ones
        const draggedItemCurrentPath = snap.openedFolders
          .slice(0, draggedItem.sourceColumnIndex)
          .map((folder) => folder.name)
          .join('/')

        // Block if the target path would be the same as the dragged item's current location
        // (This prevents self-drops, but allows moves from subdirectories to parent directories)
        if (targetPath === draggedItemCurrentPath) {
          // Blocking folder drop to same location
          return false
        }
      }

      return true
    },
    drop: (draggedItem: any, monitor: any) => {
      if (canUpdateStorage) {
        const targetDirectory = getColumnPath()

        // Handle multi-item drops
        if (draggedItem.type === 'multi-item') {
          const items = draggedItem.items || []
          // Move all selected items
          snap.moveFilesDragAndDrop(items, targetDirectory)
        } else {
          // Handle single-item drops (existing logic)
          // Use the drag & drop function that doesn't interfere with the modal
          snap.moveFilesDragAndDrop([draggedItem], targetDirectory)
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: false }),
    }),
  })

  // Apply drop ref to the column
  drop(fileExplorerColumnRef)

  const haveSelectedItems = selectedItems.length > 0
  const columnItemsId = column.items.map((item) => item.id)
  const columnFiles = column.items.filter((item) => item.type === STORAGE_ROW_TYPES.FILE)
  const selectedItemsFromColumn = selectedItems.filter((item) => columnItemsId.includes(item.id))
  const selectedFilesFromColumn = selectedItemsFromColumn.filter(
    (item) => item.type === STORAGE_ROW_TYPES.FILE
  )

  const columnItems = column.items.map((item, index) => ({ ...item, columnIndex: index }))
  const columnItemsSize = sum(columnItems.map((item) => get(item, ['metadata', 'size'], 0)))

  const isEmpty =
    column.items.filter((item) => item.status !== STORAGE_ROW_STATUS.LOADING).length === 0

  const { show } = useContextMenu()
  const displayMenu = (event: any) => {
    show(event, {
      id: CONTEXT_MENU_KEYS.STORAGE_COLUMN,
      props: { index },
    })
  }

  // Handle external file drag over for uploads (separate from react-dnd)
  const onDragOver = (event: any) => {
    if (event) {
      event.stopPropagation()
      event.preventDefault()

      // Only show overlay for external file drags (not internal storage-item drags)
      // Check if this is an external file drag by looking for file types in dataTransfer
      const hasFiles =
        event.dataTransfer.items &&
        Array.from(event.dataTransfer.items).some((item: any) => item.kind === 'file')
      const hasInternalType = event.dataTransfer.types.includes('storage-item')

      // Only show overlay for external file drags (has files but no internal storage-item type)
      if (hasFiles && !hasInternalType && event.type === 'dragover' && !isDraggedOver) {
        setIsDraggedOver(true)
      }
    }
  }

  // Handle external file drops for uploads (separate from react-dnd)
  const handleExternalFileDrop = (event: any) => {
    // Reset drag state
    setIsDraggedOver(false)

    if (!canUpdateStorage) {
      toast('You need additional permissions to upload files to this project')
      return
    }

    // Check if this is an external file drop (not our internal storage-item type)
    const hasInternalType = event.dataTransfer.types.includes('storage-item')
    if (!hasInternalType) {
      // This is an external file upload
      onFilesUpload(event, index)
    }
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

  useEffect(() => {
    if (fileExplorerColumnRef) {
      const { scrollHeight, clientHeight } = fileExplorerColumnRef.current
      if (scrollHeight > clientHeight) {
        fileExplorerColumnRef.current.scrollTop += scrollHeight - clientHeight
      }
    }
  }, [column])

  // Reset drag states when column changes
  useEffect(() => {
    setIsDraggedOver(false)
  }, [column.id])

  return (
    <div
      ref={fileExplorerColumnRef}
      className={cn(
        fullWidth ? 'w-full' : 'w-64 border-r border-overlay',
        snap.view === STORAGE_VIEWS.LIST && 'h-full',
        'hide-scrollbar relative flex flex-shrink-0 flex-col overflow-auto',
        (dropProps.isOver || isDraggedOver) && 'bg-selection/10'
      )}
      onContextMenu={displayMenu}
      onDragOver={onDragOver}
      onDrop={handleExternalFileDrop}
      onDragLeave={(event) => {
        // Only reset if we're actually leaving the column (not just moving to a child element)
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsDraggedOver(false)
        }
      }}
      onClick={(event) => {
        const eventTarget = get(event.target, ['className'], '')
        if (typeof eventTarget === 'string' && eventTarget.includes('react-contexify')) return
        onSelectColumnEmptySpace(index)
      }}
    >
      {/* Checkbox selection for select all */}
      {snap.view === STORAGE_VIEWS.COLUMNS && (
        <div
          className={cn(
            'sticky top-0 z-10 mb-0 flex items-center bg-table-header-light px-2.5 [[data-theme*=dark]_&]:bg-table-header-dark',
            haveSelectedItems ? 'h-10 py-3 opacity-100' : 'h-0 py-0 opacity-0',
            'transition-all duration-200'
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {columnFiles.length > 0 ? (
            <>
              <SelectAllCheckbox />
              <p className="text-sm text-foreground-light">Select all {columnFiles.length} files</p>
            </>
          ) : (
            <p className="text-sm text-foreground-light">No files available for selection</p>
          )}
        </div>
      )}

      {/* List Interface Header */}
      {snap.view === STORAGE_VIEWS.LIST && (
        <div className="sticky top-0 py-2 z-10 flex min-w-min items-center border-b border-overlay bg-surface-100 px-2.5">
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
            ${fullWidth ? 'w-full' : 'w-64 border-r border-default'}
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
          view: snap.view,
          columnIndex: index,
          selectedItems,
        }}
        ItemComponent={FileExplorerRow}
        getItemSize={(index) => (index !== 0 && index === columnItems.length ? 85 : 37)}
        hasNextPage={column.status !== STORAGE_ROW_STATUS.LOADING && column.hasMoreItems}
        isLoadingNextPage={column.isLoadingMoreItems}
        onLoadNextPage={() => onColumnLoadMore(index, column)}
      />

      {/* Drag drop upload CTA for when column is empty */}
      {!(snap.isSearching && itemSearchString.length > 0) &&
        column.items.length === 0 &&
        column.status !== STORAGE_ROW_STATUS.LOADING && (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <img
              alt="storage-placeholder"
              src={`${BASE_PATH}/img/storage-placeholder.svg`}
              className="opacity-75 pointer-events-none"
            />
            <p className="text-sm my-3 opacity-75">Drop your files here</p>
            <p className="w-40 text-center text-xs text-foreground-light">
              Or upload them via the "Upload file" button above
            </p>
          </div>
        )}

      {snap.isSearching &&
        itemSearchString.length > 0 &&
        isEmpty &&
        column.status !== STORAGE_ROW_STATUS.LOADING && (
          <div className="h-full w-full flex flex-col items-center justify-center">
            <p className="text-sm my-3 text-foreground">No results found in this folder</p>
            <p className="w-40 text-center text-sm text-foreground-light">
              Your search for "{itemSearchString}" did not return any results
            </p>
          </div>
        )}

      {/* Drag drop upload CTA for when column has files */}
      <DragOverOverlay
        isOpen={isDraggedOver}
        onDragLeave={() => {
          setIsDraggedOver(false)
        }}
        onDrop={() => {
          setIsDraggedOver(false)
        }}
      />

      {/* List interface footer */}
      {snap.view === STORAGE_VIEWS.LIST && (
        <div className="shrink-0 rounded-b-md z-10 flex min-w-min items-center bg-panel-footer-light px-2.5 py-2 [[data-theme*=dark]_&]:bg-panel-footer-dark w-full">
          <p className="text-sm">
            {formatBytes(columnItemsSize)} for {columnItems.length} items
          </p>
        </div>
      )}
    </div>
  )
}
