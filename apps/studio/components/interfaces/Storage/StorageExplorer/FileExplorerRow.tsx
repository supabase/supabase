import { PermissionAction } from '@supabase/shared-types/out/constants'
import { find, isEmpty, isEqual } from 'lodash'
import {
  AlertCircle,
  Copy,
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
import SVG from 'react-inlinesvg'

import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import type { CSSProperties } from 'react'
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
import { StorageItemWithColumn, type StorageItem } from '../Storage.types'
import { FileExplorerRowEditing } from './FileExplorerRowEditing'
import { copyPathToFolder } from './StorageExplorer.utils'
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
  const { show } = useContextMenu()
  const { onCopyUrl } = useCopyUrl()

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
            icon: <Copy size={14} strokeWidth={1} />,
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
                        icon: <Copy size={14} strokeWidth={1} />,
                        onClick: () => onCopyUrl(itemWithColumnIndex.name),
                      },
                    ]
                  : [
                      {
                        name: 'Get URL',
                        icon: <Copy size={14} strokeWidth={1} />,
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
                        onClick: () => downloadFile(itemWithColumnIndex),
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
    return (
      <FileExplorerRowEditing style={style} view={view} item={item} columnIndex={columnIndex} />
    )
  }

  return (
    <div
      style={style}
      className="h-full border-b border-default"
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
          `${isOpened ? 'bg-selection' : ''}`,
          `${isSelected ? 'bg-selection' : ''}`,
          `${isPreviewed ? 'bg-selection hover:bg-selection' : ''}`,
          `${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}`
        )}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
            item.type === STORAGE_ROW_TYPES.FOLDER || item.type === STORAGE_ROW_TYPES.BUCKET
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
