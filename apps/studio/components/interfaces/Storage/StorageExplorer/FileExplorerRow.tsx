import { PermissionAction } from '@supabase/shared-types/out/constants'
import { FilesBucket as FilesBucketIcon } from 'icons'
import { find, isEmpty, isEqual } from 'lodash'
import {
  AlertCircle,
  Copy,
  Download,
  Edit,
  File,
  Film,
  FolderOpen,
  Image,
  LoaderCircle,
  MoreVertical,
  Move,
  Music,
  Trash2,
} from 'lucide-react'
import type { CSSProperties } from 'react'
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
  STORAGE_ROW_STATUS,
  STORAGE_ROW_TYPES,
  STORAGE_VIEWS,
  URL_EXPIRY_DURATION,
} from '../Storage.constants'
import { StorageItemWithColumn, type StorageItem } from '../Storage.types'
import { useFileExplorerContextMenu } from './FileExplorerRowContextMenu'
import { FileExplorerRowEditing } from './FileExplorerRowEditing'
import { copyPathToFolder } from './StorageExplorer.utils'
import { useCopyUrl } from './useCopyUrl'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { formatBytes } from '@/lib/helpers'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const RowIcon = ({
  view,
  status,
  fileType,
  isOpened = false,
  mimeType,
}: {
  view: STORAGE_VIEWS
  status: STORAGE_ROW_STATUS
  fileType: string
  isOpened?: boolean
  mimeType: string | undefined
}) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return (
      <LoaderCircle size={14} strokeWidth={2} className="animate-spin text-foreground-lighter" />
    )
  }

  if (fileType === STORAGE_ROW_TYPES.FOLDER) {
    return isOpened ? (
      <FolderOpen size={16} strokeWidth={2} className="text-foreground-lighter" />
    ) : (
      <FilesBucketIcon size={16} strokeWidth={2} className="text-foreground-lighter" />
    )
  }

  if (mimeType?.includes('image')) {
    return <Image size={16} className="text-foreground-lighter" />
  }

  if (mimeType?.includes('audio')) {
    return <Music size={16} strokeWidth={2} className="text-foreground-lighter" />
  }

  if (mimeType?.includes('video')) {
    return <Film size={16} strokeWidth={2} className="text-foreground-lighter" />
  }

  return <File size={16} strokeWidth={2} className="text-foreground-lighter" />
}

interface FileExplorerRowProps {
  index: number
  item: StorageItem
  view: STORAGE_VIEWS
  columnIndex: number
  selectedItems: StorageItemWithColumn[]
  style?: CSSProperties
}

export const FileExplorerRow = ({
  index: itemIndex,
  item,
  view = STORAGE_VIEWS.COLUMNS,
  columnIndex = 0,
  selectedItems = [],
  style,
}: FileExplorerRowProps) => {
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
    downloadFile,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    openFolder,
    downloadFolder,
    selectRangeItems,
  } = useStorageExplorerStateSnapshot()
  const { onCopyUrl } = useCopyUrl()
  const ctx = useFileExplorerContextMenu()

  const isPublic = selectedBucket.public
  const itemWithColumnIndex = { ...item, columnIndex }
  const isSelected = !!selectedItems.find((i) => i.id === item.id)
  const isOpened =
    openedFolders.length > columnIndex ? openedFolders[columnIndex].name === item.name : false
  const isPreviewed = !isEmpty(selectedFilePreview) && isEqual(selectedFilePreview?.id, item.id)
  const { can: canUpdateFiles } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  const onSelectFile = async (columnIndex: number) => {
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

  const rowOptions =
    item.type === STORAGE_ROW_TYPES.FOLDER
      ? [
          ...(canUpdateFiles
            ? [
                {
                  name: 'Rename',
                  icon: <Edit size={12} className="text-foreground-light" />,
                  onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                },
              ]
            : []),
          {
            name: 'Download',
            icon: <Download size={12} className="text-foreground-light" />,
            onClick: () => downloadFolder(itemWithColumnIndex),
          },
          {
            name: 'Copy path to folder',
            icon: <Copy size={12} className="text-foreground-light" />,
            onClick: () => copyPathToFolder(openedFolders, itemWithColumnIndex),
          },
          ...(canUpdateFiles
            ? [
                { name: 'Separator', icon: undefined, onClick: undefined },
                {
                  name: 'Delete',
                  icon: <Trash2 size={12} className="text-foreground-light" />,
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
                        icon: <Copy size={12} className="text-foreground-light" />,
                        onClick: () => {
                          onCopyUrl(itemWithColumnIndex.path!)
                        },
                      },
                    ]
                  : [
                      {
                        name: 'Get URL',
                        icon: <Copy size={12} className="text-foreground-light" />,
                        children: [
                          {
                            name: 'Expire in 1 week',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.path!, URL_EXPIRY_DURATION.WEEK),
                          },
                          {
                            name: 'Expire in 1 month',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.path!, URL_EXPIRY_DURATION.MONTH),
                          },
                          {
                            name: 'Expire in 1 year',
                            onClick: () =>
                              onCopyUrl(itemWithColumnIndex.path!, URL_EXPIRY_DURATION.YEAR),
                          },
                          {
                            name: 'Custom expiry',
                            onClick: () => setSelectedFileCustomExpiry(itemWithColumnIndex),
                          },
                        ],
                      },
                    ]),
                {
                  name: 'Download',
                  icon: <Download size={12} className="text-foreground-light" />,
                  onClick: () => downloadFile(itemWithColumnIndex),
                },
                ...(canUpdateFiles
                  ? [
                      {
                        name: 'Rename',
                        icon: <Edit size={12} className="text-foreground-light" />,
                        onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                      },
                      {
                        name: 'Move',
                        icon: <Move size={12} className="text-foreground-light" />,
                        onClick: () => setSelectedItemsToMove([itemWithColumnIndex]),
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
                  icon: <Trash2 size={12} className="text-foreground-light" />,
                  onClick: () => setSelectedItemsToDelete([itemWithColumnIndex]),
                },
              ]
            : []),
        ]

  const size = item.metadata ? formatBytes(item.metadata.size) : '-'
  const mimeType = item.metadata ? item.metadata.mimetype : '-'
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : '-'
  const updatedAt = item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'

  const nameWidth =
    view === STORAGE_VIEWS.LIST && item.isCorrupted
      ? `calc(100% - 60px)`
      : view === STORAGE_VIEWS.LIST && !item.isCorrupted
        ? `calc(100% - 50px)`
        : '100%'

  if (item.status === STORAGE_ROW_STATUS.EDITING) {
    return (
      <FileExplorerRowEditing style={style} view={view} item={item} columnIndex={columnIndex} />
    )
  }

  return (
    <div
      style={style}
      className="h-full border-b border-default"
      onContextMenu={(e) => ctx?.onRowContextMenu(e, rowOptions)}
    >
      <div
        className={cn(
          'storage-row group flex h-full items-center px-2.5',
          'hover:bg-panel-footer-light [[data-theme*=dark]_&]:hover:bg-panel-footer-dark',
          `${isOpened ? 'bg-selection' : ''}`,
          `${isSelected ? 'bg-selection' : ''}`,
          `${isPreviewed ? 'bg-selection hover:bg-selection' : ''}`,
          `${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}`
        )}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
            item.type === STORAGE_ROW_TYPES.FOLDER
              ? openFolder(columnIndex, item)
              : onSelectFile(columnIndex)
          }
        }}
      >
        <div
          className={cn(
            'flex items-center',
            view === STORAGE_VIEWS.LIST ? 'w-[40%] min-w-[250px]' : 'w-[90%]'
          )}
        >
          <div className="relative w-[30px]" onClick={(event) => event.stopPropagation()}>
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
                  isOpened={isOpened}
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
          <p title={item.name} className="truncate text-sm" style={{ width: nameWidth }}>
            {item.name}
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
        >
          {item.status === STORAGE_ROW_STATUS.LOADING ? (
            <LoaderCircle
              className={`animate-spin text-foreground-lighter ${view === STORAGE_VIEWS.LIST ? 'invisible' : ''}`}
              size={14}
              strokeWidth={2}
            />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="storage-row-menu opacity-0">
                  <MoreVertical size={16} strokeWidth={2} />
                  <span className="sr-only">{item.name} actions</span>
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
