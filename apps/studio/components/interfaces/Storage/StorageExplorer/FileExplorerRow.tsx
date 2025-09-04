import { PermissionAction } from '@supabase/shared-types/out/constants'
import { find, isEmpty, isEqual } from 'lodash'
import {
  AlertCircle,
  Clipboard,
  Download,
  Edit,
  File,
  Film,
  Image,
  Loader,
  MoreVertical,
  Move,
  Music,
  Trash2,
} from 'lucide-react'
import { useContextMenu } from 'react-contexify'
import { useEffect, useRef } from 'react'
import { useDrag, useDrop, useDragLayer } from 'react-dnd'
import SVG from 'react-inlinesvg'

import { useParams } from 'common'
import type { ItemRenderer } from 'components/ui/InfiniteList'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import {
  Checkbox,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  CONTEXT_MENU_KEYS,
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_VIEWS,
  URL_EXPIRY_DURATION,
} from '../Storage.constants'
import { StorageItem, StorageItemWithColumn } from '../Storage.types'
import FileExplorerRowEditing from './FileExplorerRowEditing'
import { copyPathToFolder, downloadFile } from './StorageExplorer.utils'
import { useCopyUrl } from './useCopyUrl'

export const RowIcon = ({
  view,
  status,
  fileType,
  mimeType,
}: {
  view: STORAGE_VIEWS
  status: STORAGE_ROW_STATUS
  fileType: string
  mimeType: string | undefined
}) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return <Loader size={16} strokeWidth={2} className="animate-spin" />
  }

  if (fileType === STORAGE_ROW_TYPES.BUCKET || fileType === STORAGE_ROW_TYPES.FOLDER) {
    const iconSrc =
      fileType === STORAGE_ROW_TYPES.BUCKET
        ? `${BASE_PATH}/img/bucket-filled.svg`
        : fileType === STORAGE_ROW_TYPES.FOLDER
          ? `${BASE_PATH}/img/folder-filled.svg`
          : `${BASE_PATH}/img/file-filled.svg`
    return (
      <SVG
        src={iconSrc}
        preProcessor={(code) =>
          code.replace(/svg/, 'svg class="w-4 h-4 text-color-inherit opacity-75"')
        }
      />
    )
  }

  if (mimeType?.includes('image')) {
    return <Image size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('audio')) {
    return <Music size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('video')) {
    return <Film size={16} strokeWidth={2} />
  }

  return <File size={16} strokeWidth={2} />
}

export interface FileExplorerRowProps {
  view: STORAGE_VIEWS
  columnIndex: number
  selectedItems: StorageItemWithColumn[]
}

const FileExplorerRow: ItemRenderer<StorageItem, FileExplorerRowProps> = ({
  index: itemIndex,
  item,
  view = STORAGE_VIEWS.COLUMNS,
  columnIndex = 0,
  selectedItems = [],
}) => {
  const { ref: projectRef, bucketId } = useParams()
  const ref = useRef<HTMLDivElement>(null)

  const snap = useStorageExplorerStateSnapshot()
  const {
    selectedBucket,
    selectedFilePreview,
    openedFolders,
    popColumnAtIndex,
    popOpenedFoldersAtIndex,
    clearSelectedItems,
    setSelectedFilePreview,
    setSelectedFileCustomExpiry,
    setSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    openFolder,
    downloadFolder,
    selectRangeItems,
    foldersBeingMoved,
  } = snap

  // Track global drag state to show/hide items across all components
  const { isDragging: isAnyItemDragging, draggedItem } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    draggedItem: monitor.getItem(),
  }))
  const { show } = useContextMenu()
  const { onCopyUrl } = useCopyUrl()

  const isPublic = selectedBucket.public
  const itemWithColumnIndex = { ...item, columnIndex }
  const isSelected = !!selectedItems.find((i) => i.id === item.id)
  const isOpened =
    openedFolders.length > columnIndex ? openedFolders[columnIndex].name === item.name : false
  const isPreviewed = !isEmpty(selectedFilePreview) && isEqual(selectedFilePreview?.id, item.id)
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  // Check if this folder is currently being moved
  const isBeingMoved =
    item.type === STORAGE_ROW_TYPES.FOLDER &&
    (() => {
      const folderPath = openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .concat(item.name)
        .join('/')
      return foldersBeingMoved.has(folderPath)
    })()

  // Drag source for files and folders
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'storage-item',
      item: () => {
        // If this item is selected and there are multiple selected items, drag all selected items
        if (isSelected && selectedItems.length > 1) {
          // Get the element's position in the viewport for the custom drag layer
          const elementRect = ref.current?.getBoundingClientRect()

          return {
            type: 'multi-item',
            items: selectedItems,
            sourceColumnIndex: columnIndex,
            draggedFromElement: {
              rect: elementRect,
              itemId: item.id,
            },
          }
        }
        // Otherwise, drag just this item
        return {
          ...itemWithColumnIndex,
          sourceColumnIndex: columnIndex,
        }
      },
      canDrag: () => canUpdateFiles && item.type !== STORAGE_ROW_TYPES.BUCKET,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [
      isSelected,
      selectedItems,
      columnIndex,
      itemWithColumnIndex,
      canUpdateFiles,
      item.type,
      item.id,
    ]
  )

  // Always hide default preview for multi-item drags and set empty preview early
  useEffect(() => {
    if (isSelected && selectedItems.length > 1) {
      // Create a completely transparent 1x1 pixel image
      const emptyImage = document.createElement('img')
      emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
      emptyImage.onload = () => {
        preview(emptyImage, { captureDraggingState: true })
      }
      // Set it immediately as well
      preview(emptyImage, { captureDraggingState: true })
    }
  }, [isSelected, selectedItems.length, preview])

  // Drop target for folders
  const [{ isOver }, drop] = useDrop({
    accept: 'storage-item',
    canDrop: (draggedItem: any) => {
      // Only allow drops on folders
      if (item.type !== STORAGE_ROW_TYPES.FOLDER) {
        // Not a folder
        return false
      }

      // Handle multi-item drops
      if (draggedItem.type === 'multi-item') {
        const items = draggedItem.items || []

        // Check all items in the selection for drop validity
        for (const draggedSubItem of items) {
          // Don't allow dropping on itself - compare paths instead of IDs
          const draggedItemPath = snap.openedFolders
            .slice(0, draggedSubItem.columnIndex)
            .map((folder) => folder.name)
            .join('/')
          const targetItemPath = snap.openedFolders
            .slice(0, columnIndex)
            .map((folder) => folder.name)
            .join('/')

          const draggedItemFullPath =
            draggedItemPath.length > 0
              ? `${draggedItemPath}/${draggedSubItem.name}`
              : draggedSubItem.name
          const targetItemFullPath =
            targetItemPath.length > 0 ? `${targetItemPath}/${item.name}` : item.name

          if (draggedItemFullPath === targetItemFullPath) {
            // Can't drop on itself (same path)
            return false
          }

          // Don't allow dropping a folder into itself or any of its subdirectories (circular reference)
          if (draggedSubItem.type === STORAGE_ROW_TYPES.FOLDER) {
            // For folder drops, the target is the folder itself
            // When dropping on a folder item, we want to move INTO that folder
            const targetPath = snap.openedFolders
              .slice(0, columnIndex)
              .map((folder) => folder.name)
              .concat(item.name)
              .join('/')

            // Check if target path is the same as dragged item path (dropping on itself)
            if (targetPath === draggedItemFullPath) {
              return false
            }

            // Check if target path is a subdirectory of the dragged item (would create circular reference)
            const droppedOnOwnSubdir = targetPath.startsWith(draggedItemFullPath + '/')

            if (droppedOnOwnSubdir) {
              // Can't drop in own subdirectory
              return false
            }

            // Check if target path is the IMMEDIATE parent of the dragged item
            // This prevents dropping a folder into its direct parent, but allows moving to ancestor directories
            const draggedItemImmediateParent = draggedItemFullPath.split('/').slice(0, -1).join('/')
            const isDroppingOnImmediateParent = targetPath === draggedItemImmediateParent

            if (isDroppingOnImmediateParent) {
              // Cannot drop folder into its immediate parent directory (same directory)
              return false
            }
          }
        }

        return true
      }

      // Handle single-item drops (existing logic)
      const draggedItemPath = snap.openedFolders
        .slice(0, draggedItem.columnIndex || draggedItem.sourceColumnIndex)
        .map((folder) => folder.name)
        .join('/')
      const targetItemPath = snap.openedFolders
        .slice(0, columnIndex)
        .map((folder) => folder.name)
        .join('/')

      const draggedItemFullPath =
        draggedItemPath.length > 0 ? `${draggedItemPath}/${draggedItem.name}` : draggedItem.name
      const targetItemFullPath =
        targetItemPath.length > 0 ? `${targetItemPath}/${item.name}` : item.name

      if (draggedItemFullPath === targetItemFullPath) {
        // Can't drop on itself (same path)
        return false
      }

      // Don't allow dropping a folder into itself or any of its subdirectories (circular reference)
      if (draggedItem.type === STORAGE_ROW_TYPES.FOLDER) {
        // For folder drops, the target is the folder itself
        // When dropping on a folder item, we want to move INTO that folder
        const targetPath = snap.openedFolders
          .slice(0, columnIndex)
          .map((folder) => folder.name)
          .concat(item.name)
          .join('/')

        // Check if target path is the same as dragged item path (dropping on itself)
        if (targetPath === draggedItemFullPath) {
          return false
        }

        // Check if target path is a subdirectory of the dragged item (would create circular reference)
        const droppedOnOwnSubdir = targetPath.startsWith(draggedItemFullPath + '/')

        if (droppedOnOwnSubdir) {
          // Can't drop in own subdirectory
          return false
        }

        // Check if target path is the IMMEDIATE parent of the dragged item
        // This prevents dropping a folder into its direct parent, but allows moving to ancestor directories
        const draggedItemImmediateParent = draggedItemFullPath.split('/').slice(0, -1).join('/')
        const isDroppingOnImmediateParent = targetPath === draggedItemImmediateParent

        if (isDroppingOnImmediateParent) {
          // Cannot drop folder into its immediate parent directory (same directory)
          return false
        }
      }

      return true
    },
    drop: (draggedItem: any, monitor: any) => {
      if (item.type === STORAGE_ROW_TYPES.FOLDER && canUpdateFiles) {
        // Calculate target directory path - for folder drops, target is the folder itself
        const targetDirectory = snap.openedFolders
          .slice(0, columnIndex)
          .map((folder) => folder.name)
          .concat(item.name)
          .join('/')

        // Handle multi-item drops
        if (draggedItem.type === 'multi-item') {
          const items = draggedItem.items || []

          // Check if any item is being dropped to the same location
          const shouldSkip = items.some((subItem: any) => {
            const draggedItemPath = snap.openedFolders
              .slice(0, subItem.columnIndex)
              .map((folder) => folder.name)
              .join('/')
            return draggedItemPath === targetDirectory
          })

          if (shouldSkip) {
            // Some items would be dropped to same location, ignoring move operation
            return
          }

          // Move all selected items
          snap.moveFilesDragAndDrop(items, targetDirectory)
        } else {
          // Handle single-item drops (existing logic)
          const draggedItemPath = snap.openedFolders
            .slice(0, draggedItem.columnIndex || draggedItem.sourceColumnIndex)
            .map((folder) => folder.name)
            .join('/')

          if (draggedItemPath === targetDirectory) {
            // Same location drop detected on folder, ignoring move operation
            return
          }

          // Use the drag & drop function that doesn't interfere with the modal
          snap.moveFilesDragAndDrop([draggedItem], targetDirectory)
        }
      } else {
        // Drop conditions not met
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: false }),
    }),
  })

  // Apply drag and drop refs
  if (canUpdateFiles && item.type !== STORAGE_ROW_TYPES.BUCKET) {
    // Always apply drag ref
    drag(ref)

    // Only apply drop ref for folders
    if (item.type === STORAGE_ROW_TYPES.FOLDER) {
      drop(ref)
    }
  }

  const onSelectFile = async (columnIndex: number, file: StorageItem) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setSelectedFilePreview(itemWithColumnIndex)
    clearSelectedItems()
  }

  const onCheckItem = (isShiftKeyHeld: boolean) => {
    // Select a range if shift is held down
    if (isShiftKeyHeld && selectedItems.length !== 0) {
      selectRangeItems(columnIndex, itemIndex)
      return
    }
    if (find(selectedItems, (item) => itemWithColumnIndex.id === item.id) !== undefined) {
      setSelectedItems(
        selectedItems.filter((selectedItem) => itemWithColumnIndex.id !== selectedItem.id)
      )
    } else {
      setSelectedItems([...selectedItems, itemWithColumnIndex])
    }
    setSelectedFilePreview(undefined)
  }

  const onDoubleClickName = () => {
    if (canUpdateFiles && item.type !== STORAGE_ROW_TYPES.BUCKET) {
      setSelectedItemToRename(itemWithColumnIndex)
    }
  }

  const rowOptions =
    item.type === STORAGE_ROW_TYPES.FOLDER
      ? [
          ...(canUpdateFiles
            ? [
                {
                  name: 'Rename',
                  icon: <Edit size={14} strokeWidth={1} />,
                  onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                },
              ]
            : []),
          {
            name: 'Download',
            icon: <Download size={14} strokeWidth={1} />,
            onClick: () => downloadFolder(itemWithColumnIndex),
          },
          {
            name: 'Copy path to folder',
            icon: <Clipboard size={14} strokeWidth={1} />,
            onClick: () => copyPathToFolder(openedFolders, itemWithColumnIndex),
          },
          ...(canUpdateFiles
            ? [
                { name: 'Separator', icon: undefined, onClick: undefined },
                {
                  name: 'Delete',
                  icon: <Trash2 size={14} strokeWidth={1} />,
                  onClick: () => setSelectedItemsToDelete([itemWithColumnIndex]),
                },
              ]
            : []),
        ]
      : [
          ...(!item.isCorrupted
            ? [
                ...(isPublic
                  ? [
                      {
                        name: 'Get URL',
                        icon: <Clipboard size={14} strokeWidth={1} />,
                        onClick: () => onCopyUrl(itemWithColumnIndex.name),
                      },
                    ]
                  : [
                      {
                        name: 'Get URL',
                        icon: <Clipboard size={14} strokeWidth={1} />,
                        children: [
                          {
                            name: 'Expire in 1 week',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.name, URL_EXPIRY_DURATION.WEEK),
                          },
                          {
                            name: 'Expire in 1 month',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.name, URL_EXPIRY_DURATION.MONTH),
                          },
                          {
                            name: 'Expire in 1 year',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.name, URL_EXPIRY_DURATION.YEAR),
                          },
                          {
                            name: 'Custom expiry',
                            onClick: () => setSelectedFileCustomExpiry(itemWithColumnIndex),
                          },
                        ],
                      },
                    ]),
                ...(canUpdateFiles
                  ? [
                      {
                        name: 'Rename',
                        icon: <Edit size={14} strokeWidth={1} />,
                        onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                      },
                      {
                        name: 'Move',
                        icon: <Move size={14} strokeWidth={1} />,
                        onClick: () => setSelectedItemsToMove([itemWithColumnIndex]),
                      },
                      {
                        name: 'Download',
                        icon: <Download size={14} strokeWidth={1} />,
                        onClick: async () => {
                          await downloadFile({
                            projectRef,
                            bucketId,
                            file: itemWithColumnIndex,
                          })
                        },
                      },
                      { name: 'Separator', icon: undefined, onClick: undefined },
                    ]
                  : []),
              ]
            : []),
          ...(canUpdateFiles
            ? [
                {
                  name: 'Delete',
                  icon: <Trash2 size={14} strokeWidth={1} />,
                  onClick: () => setSelectedItemsToDelete([itemWithColumnIndex]),
                },
              ]
            : []),
        ]

  const size = item.metadata ? formatBytes(item.metadata.size) : '-'
  const mimeType = item.metadata ? item.metadata.mimetype : '-'
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : '-'
  const updatedAt = item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'

  const displayMenu = (event: any, rowType: STORAGE_ROW_TYPES) => {
    show(event, {
      id:
        rowType === STORAGE_ROW_TYPES.FILE
          ? CONTEXT_MENU_KEYS.STORAGE_ITEM
          : CONTEXT_MENU_KEYS.STORAGE_FOLDER,
      props: {
        item: itemWithColumnIndex,
      },
    })
  }

  const nameWidth =
    view === STORAGE_VIEWS.LIST && item.isCorrupted
      ? `calc(100% - 60px)`
      : view === STORAGE_VIEWS.LIST && !item.isCorrupted
        ? `calc(100% - 50px)`
        : '100%'

  if (item.status === STORAGE_ROW_STATUS.EDITING) {
    return <FileExplorerRowEditing view={view} item={item} columnIndex={columnIndex} />
  }

  return (
    <div
      ref={ref}
      className={cn(
        'h-full border-b border-default',
        isDragging && 'opacity-50',
        isBeingMoved && 'opacity-50',
        // Add visual feedback for selected items being dragged
        isDragging && isSelected && selectedItems.length > 1 && 'ring-2 ring-brand-500/50'
      )}
      data-item-type={item.type.toLowerCase()}
      data-item-name={item.name}
      onContextMenu={(event) => {
        event.stopPropagation()
        item.type === STORAGE_ROW_TYPES.FILE
          ? displayMenu(event, STORAGE_ROW_TYPES.FILE)
          : displayMenu(event, STORAGE_ROW_TYPES.FOLDER)
      }}
    >
      <div
        className={cn(
          'storage-row group flex h-full items-center px-2.5',
          'hover:bg-panel-footer-light [[data-theme*=dark]_&]:hover:bg-panel-footer-dark',
          `${isOpened ? 'bg-surface-200' : ''}`,
          `${isPreviewed ? 'bg-green-500 hover:bg-green-500' : ''}`,
          `${isOver ? 'bg-selection' : ''}`,
          `${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}`,
          // Add subtle highlight for all selected items when multiple items are selected
          `${isSelected && selectedItems.length > 1 && 'bg-surface-200/50'}`,
          // Hide selected items during multi-item drag (they'll be shown in custom drag layer)
          `${
            isAnyItemDragging &&
            draggedItem?.type === 'multi-item' &&
            draggedItem?.items?.some((draggedSubItem: any) => draggedSubItem.id === item.id) &&
            'opacity-20'
          }`
        )}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
            item.type === STORAGE_ROW_TYPES.FOLDER || item.type === STORAGE_ROW_TYPES.BUCKET
              ? openFolder(columnIndex, item)
              : onSelectFile(columnIndex, item)
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
              item.type === STORAGE_ROW_TYPES.FOLDER || item.type === STORAGE_ROW_TYPES.BUCKET
                ? openFolder(columnIndex, item)
                : onSelectFile(columnIndex, item)
            }
          }
        }}
        tabIndex={item.status !== STORAGE_ROW_STATUS.LOADING ? 0 : -1}
      >
        <div
          className={cn(
            'flex items-center',
            view === STORAGE_VIEWS.LIST ? 'w-[40%] min-w-[250px]' : 'w-[90%]'
          )}
        >
          <div
            className="relative w-[30px]"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
          >
            {!isSelected && (
              <div
                className={`absolute ${
                  item.type === STORAGE_ROW_TYPES.FILE ? 'group-hover:hidden' : ''
                }`}
                style={{ top: '2px' }}
              >
                <RowIcon
                  view={view}
                  status={item.status}
                  fileType={item.type}
                  mimeType={item.metadata?.mimetype}
                />
              </div>
            )}
            <Checkbox
              label={''}
              className={`w-full ${item.type !== STORAGE_ROW_TYPES.FILE ? 'invisible' : ''} ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              checked={isSelected}
              onChange={(event) => {
                event.stopPropagation()
                onCheckItem((event.nativeEvent as KeyboardEvent).shiftKey)
              }}
            />
          </div>
          <p
            title={item.name}
            className="truncate text-sm cursor-pointer hover:text-foreground relative"
            style={{ width: nameWidth }}
            onDoubleClick={onDoubleClickName}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onDoubleClickName()
              }
            }}
            tabIndex={canUpdateFiles && item.type !== STORAGE_ROW_TYPES.BUCKET ? 0 : -1}
          >
            {item.name}
            {/* Show badge for multi-item drag operations */}
            {isDragging && isSelected && selectedItems.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-brand-500 text-foreground text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium shadow-md">
                {selectedItems.length}
              </span>
            )}
          </p>
          {item.isCorrupted && (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={18} strokeWidth={2} className="text-foreground-light" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                File is corrupted, please delete and reupload again.
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {view === STORAGE_VIEWS.LIST && (
          <>
            <p className="w-[11%] min-w-[100px] truncate text-sm">{size}</p>
            <p className="w-[14%] min-w-[100px] truncate text-sm">{mimeType}</p>
            <p className="w-[15%] min-w-[160px] truncate text-sm">{createdAt}</p>
            <p className="w-[15%] min-w-[160px] truncate text-sm">{updatedAt}</p>
          </>
        )}

        <div
          className={`flex items-center justify-end ${
            view === STORAGE_VIEWS.LIST ? 'flex-grow' : 'w-[10%]'
          }`}
          onClick={(event) =>
            // Stops click event from this div, to resolve an issue with menu item's click event triggering unexpected row select
            event.stopPropagation()
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
        >
          {item.status === STORAGE_ROW_STATUS.LOADING ? (
            <Loader
              className={`animate-spin ${view === STORAGE_VIEWS.LIST ? 'invisible' : ''}`}
              size={16}
              strokeWidth={2}
            />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="storage-row-menu opacity-0">
                  <MoreVertical size={16} strokeWidth={2} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="end">
                {rowOptions.map((option) => {
                  if ((option?.children ?? []).length > 0) {
                    return (
                      <DropdownMenuSub key={option.name}>
                        <DropdownMenuSubTrigger className="space-x-2">
                          {option.icon || <></>}
                          <p>{option.name}</p>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {(option?.children ?? [])?.map((child) => {
                              return (
                                <DropdownMenuItem key={child.name} onClick={child.onClick}>
                                  <p>{child.name}</p>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    )
                  } else if (option.name === 'Separator') {
                    return <DropdownMenuSeparator key={option.name} />
                  } else {
                    return (
                      <DropdownMenuItem
                        className="space-x-2"
                        key={option.name}
                        onClick={option.onClick}
                      >
                        {option.icon || <></>}
                        <p>{option.name}</p>
                      </DropdownMenuItem>
                    )
                  }
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorerRow
