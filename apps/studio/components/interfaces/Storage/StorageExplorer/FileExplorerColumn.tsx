import { Transition } from '@headlessui/react'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { get, noop, sum } from 'lodash'
import { Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useContextMenu } from 'react-contexify'
import { toast } from 'sonner'

import InfiniteList from 'components/ui/InfiniteList'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
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
import FileExplorerRow from './FileExplorerRow'

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
      className="h-full w-full absolute top-0 pointer-events-none"
    >
      <div
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="absolute top-0 flex h-full w-full items-center justify-center pointer-events-auto"
        style={{ backgroundColor: folderIsEmpty ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.2)' }}
      >
        {!folderIsEmpty && (
          <div
            className="w-3/4 h-32 border-2 border-dashed border-muted rounded-md flex flex-col items-center justify-center p-6 pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <Upload className="text-white pointer-events-none" size={20} strokeWidth={2} />
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
  column: StorageColumn
  fullWidth?: boolean
  selectedItems: StorageItemWithColumn[]
  itemSearchString: string
  onFilesUpload: (event: any, index: number) => void
  onSelectAllItemsInColumn: (index: number) => void
  onSelectColumnEmptySpace: (index: number) => void
  onColumnLoadMore: (index: number, column: StorageColumn) => void
}

const FileExplorerColumn = ({
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
  const [isInternalDragOver, setIsInternalDragOver] = useState(false)
  const [moveToPath, setMoveToPath] = useState<string>('')
  const fileExplorerColumnRef = useRef<any>(null)

  const snap = useStorageExplorerStateSnapshot()
  const canUpdateStorage = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

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
    setIsInternalDragOver(false)
    setMoveToPath('')
  }, [column.id])

  // Listen for folder drag over events from child rows
  useEffect(() => {
    const handleFolderDragOver = (event: CustomEvent) => {
      const { targetPath, folderName } = event.detail
      console.log('Folder drag over detected:', folderName, 'Target path:', targetPath)
      setMoveToPath(targetPath)
    }

    const columnElement = fileExplorerColumnRef.current
    if (columnElement) {
      columnElement.addEventListener('folderDragOver', handleFolderDragOver as EventListener)

      return () => {
        columnElement.removeEventListener('folderDragOver', handleFolderDragOver as EventListener)
      }
    }
  }, [])

  // Helper function to get the path for this column
  const getColumnPath = () => {
    // Use the index prop directly instead of trying to find it dynamically
    const columnIndex = index
    console.log(
      'getColumnPath called - Column index:',
      columnIndex,
      'Opened folders:',
      snap.openedFolders.map((f) => f.name)
    )
    console.log(
      'All columns:',
      snap.columns.map((col, idx) => `${idx}: ${col.name} (${col.id})`)
    )
    console.log('Current column:', column.name, 'ID:', column.id, 'Index prop:', index)

    if (columnIndex >= 0) {
      // Column index 0 = root level (empty path)
      // Column index 1 = first folder level (e.g., "foldher")
      // Column index 2 = second folder level (e.g., "foldher/nested-folder")
      const path =
        columnIndex === 0
          ? ''
          : snap.openedFolders
              .slice(0, columnIndex)
              .map((folder) => folder.name)
              .join('/')
      console.log('Calculated column path:', path, '(column index:', columnIndex, ')')
      return path
    }
    console.log('No column index found, returning empty path')
    return ''
  }

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

  const onDragOver = (event: any) => {
    console.log('onDragOver called for column:', column.name, 'Event type:', event.type)

    if (event) {
      // Reset states if this is a new drag operation
      if (event.type === 'dragenter' && !isDraggedOver && !isInternalDragOver) {
        console.log('New drag operation started, resetting states')
      }
      // Check if the drag target is over a folder/item or just the column background
      const target = event.target as HTMLElement
      const isOverItem = target.closest('[data-item-type]') || target.closest('.storage-row')

      console.log('Target element:', target)
      console.log('Is over item:', isOverItem)

      // Check if this is an internal file drag (from another column) or external file drag
      let isInternalFileDrag = false

      // Check if the dataTransfer contains our custom JSON type
      if (event.dataTransfer.types.includes('application/json')) {
        isInternalFileDrag = true
        console.log('Internal file drag detected - JSON type found')
      } else {
        isInternalFileDrag = false
        console.log('External drag - no JSON type found')
      }

      if (isOverItem) {
        // Let the item handle the drag over event
        // Hide the drag overlay since we're over an item
        if (isDraggedOver) {
          setIsDraggedOver(false)
        }
        if (isInternalDragOver) {
          setIsInternalDragOver(false)
        }
        // Don't clear moveToPath here - let the folder row set it
        console.log('Over item, returning early')
        return
      }

      // We're over column background (not over a specific item)
      if (isInternalFileDrag) {
        // Check if this is a drag from the same column (same location)
        try {
          const draggedItem = JSON.parse(event.dataTransfer.getData('application/json'))
          if (draggedItem && draggedItem.columnIndex === index) {
            // Same column drag - don't highlight or allow drop
            console.log('Same column drag detected, ignoring')
            return
          }
        } catch (error) {
          // Can't parse data during dragover, continue with normal logic
        }

        // Internal file drag over column background - show blue ring to indicate valid drop zone
        event.preventDefault()
        if (event.type === 'dragover') {
          if (!isInternalDragOver) {
            setIsInternalDragOver(true)
          }
          // Always update the path when dragging over column background
          const columnPath = getColumnPath()
          setMoveToPath(columnPath)
          console.log(
            'Dragging over column background:',
            column.name,
            'Column index:',
            snap.columns.findIndex((col) => col.id === column.id),
            'Target path:',
            columnPath,
            'Setting moveToPath to:',
            columnPath
          )
        }
      } else {
        // External file drag - show overlay for file uploads (both empty and non-empty columns)
        event.preventDefault()
        if (event.type === 'dragover' && !isDraggedOver) {
          setIsDraggedOver(true)
        }
      }
    }
  }

  const onDrop = (event: any) => {
    console.log('onDrop called for column:', column.name)
    onDragOver(event)

    if (!canUpdateStorage) {
      toast('You need additional permissions to upload files to this project')
      return
    }

    // Check if this is a file drop from another column
    try {
      const draggedItem = JSON.parse(event.dataTransfer.getData('application/json'))
      if (draggedItem && draggedItem.type === STORAGE_ROW_TYPES.FILE) {
        // Check if the drop target is actually a folder item (not the column background)
        // If it's a folder drop, let the folder handle it
        const target = event.target as HTMLElement
        const isFolderDrop =
          target.closest('[data-item-type="folder"]') ||
          target.closest('[data-item-type="file"]') ||
          target.closest('.storage-row')

        if (isFolderDrop) {
          // This is a folder/file drop, let the item handle it
          return
        }

        // Check if this is a drop to the same column (same location)
        if (draggedItem.columnIndex === index) {
          console.log('Same column drop detected, ignoring move operation')
          return
        }

        // This is a column background drop
        // Use the pre-calculated path from drag over
        const targetDirectory = moveToPath

        console.log(
          'Column background drop - Target directory:',
          targetDirectory,
          'Column:',
          column.name,
          'Column index:',
          snap.columns.findIndex((col) => col.id === column.id),
          'Opened folders:',
          snap.openedFolders.map((f) => f.name),
          'MoveToPath:',
          moveToPath,
          'Current moveToPath state:',
          moveToPath
        )
        console.log('Drop event target:', event.target)
        console.log(
          'Is over item check:',
          target.closest('[data-item-type]') || target.closest('.storage-row')
        )

        // Use the new drag & drop function that doesn't interfere with the modal
        snap.moveFilesDragAndDrop([draggedItem], targetDirectory)

        // Reset drag states after successful drop
        setIsDraggedOver(false)
        setIsInternalDragOver(false)

        console.log('File move completed, drag states reset')
        return
      }
    } catch (error) {
      // Not a JSON drag, likely external file upload - continue with normal upload logic
    }

    // Normal file upload logic
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
      className={cn(
        fullWidth ? 'w-full' : 'w-64 border-r border-overlay',
        snap.view === STORAGE_VIEWS.LIST && 'h-full',
        'hide-scrollbar relative flex flex-shrink-0 flex-col overflow-auto',
        (isDraggedOver || isInternalDragOver) && 'bg-selection/10'
      )}
      onContextMenu={displayMenu}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={(event) => {
        // Only reset if we're actually leaving the column (not just moving to a child element)
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          console.log('Leaving column, resetting drag states')
          setIsDraggedOver(false)
          setIsInternalDragOver(false)
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

      {/* List View Background Drag & Drop (separate from content) */}
      {snap.view === STORAGE_VIEWS.LIST && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            isInternalDragOver && 'pointer-events-auto'
          )}
          onDragOver={(event) => {
            // Handle list view background drag over for internal file moves
            if (event.dataTransfer.types.includes('application/json')) {
              event.preventDefault()
              if (!isInternalDragOver) {
                setIsInternalDragOver(true)
                // For list view, the target is the current folder level
                const currentPath = snap.openedFolders.map((folder) => folder.name).join('/')
                setMoveToPath(currentPath)
                console.log('List view background drag over - Target path:', currentPath)
              }
            }
          }}
          onDrop={(event) => {
            // Handle list view background drop for internal file moves
            if (event.dataTransfer.types.includes('application/json')) {
              event.preventDefault()
              try {
                const draggedItem = JSON.parse(event.dataTransfer.getData('application/json'))
                if (draggedItem && draggedItem.type === STORAGE_ROW_TYPES.FILE) {
                  // Check if this is a drop to the same location (same opened folders)
                  const draggedItemPath = snap.openedFolders
                    .slice(0, draggedItem.columnIndex)
                    .map((folder) => folder.name)
                    .join('/')
                  const currentPath = snap.openedFolders.map((folder) => folder.name).join('/')

                  if (draggedItemPath === currentPath) {
                    console.log('Same location drop detected in list view, ignoring move operation')
                    return
                  }

                  const targetDirectory = moveToPath
                  console.log('List view background drop - Target directory:', targetDirectory)

                  // Use the new drag & drop function that doesn't interfere with the modal
                  snap.moveFilesDragAndDrop([draggedItem], targetDirectory)

                  // Reset drag states
                  setIsDraggedOver(false)
                  setIsInternalDragOver(false)
                  setMoveToPath('')

                  console.log('List view file move completed')
                  return
                }
              } catch (error) {
                console.error('Failed to parse dragged item in list view:', error)
              }
            }
          }}
        />
      )}

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
        folderIsEmpty={isEmpty}
        onDragLeave={() => {
          setIsDraggedOver(false)
          setIsInternalDragOver(false)
        }}
        onDrop={() => {
          setIsDraggedOver(false)
          setIsInternalDragOver(false)
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

export default FileExplorerColumn
