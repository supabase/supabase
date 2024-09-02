import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { find, isEmpty, isEqual } from 'lodash'
import { useContextMenu } from 'react-contexify'
import SVG from 'react-inlinesvg'

import type { ItemRenderer } from 'components/ui/InfiniteList'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { BASE_PATH } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
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
import {
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
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

export interface FileExplorerRowProps {
  view: STORAGE_VIEWS
  columnIndex: number
  selectedItems: StorageItemWithColumn[]
  openedFolders: StorageItem[]
  selectedFilePreview: (StorageItemWithColumn & { previewUrl: string | undefined }) | null
}

const FileExplorerRow: ItemRenderer<StorageItem, FileExplorerRowProps> = ({
  index: itemIndex,
  item,
  view = STORAGE_VIEWS.COLUMNS,
  columnIndex = 0,
  selectedItems = [],
  openedFolders = [],
  selectedFilePreview,
}) => {
  const storageExplorerStore = useStorageStore()
  const {
    getFileUrl,
    popColumnAtIndex,
    pushOpenedFolderAtIndex,
    popOpenedFoldersAtIndex,
    setFilePreview,
    closeFilePreview,
    clearSelectedItems,
    selectedBucket,
    setSelectedItems,
    setSelectedItemsToDelete,
    setSelectedItemToRename,
    setSelectedItemsToMove,
    setSelectedFileCustomExpiry,
    fetchFolderContents,
    downloadFile,
    downloadFolder,
    selectRangeItems,
  } = storageExplorerStore
  const { onCopyUrl } = useCopyUrl(storageExplorerStore.projectRef)

  const isPublic = selectedBucket.public
  const itemWithColumnIndex = { ...item, columnIndex }
  const isSelected = !!selectedItems.find((i) => i.id === item.id)
  const isOpened =
    openedFolders.length > columnIndex ? isEqual(openedFolders[columnIndex], item) : false
  const isPreviewed = !isEmpty(selectedFilePreview) && isEqual(selectedFilePreview?.id, item.id)
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const { show } = useContextMenu()

  const onSelectFile = async (columnIndex: number, file: StorageItem) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setFilePreview(itemWithColumnIndex)
    clearSelectedItems()
  }

  const onSelectFolder = async (columnIndex: number, folder: StorageItem) => {
    closeFilePreview()
    clearSelectedItems(columnIndex + 1)
    popOpenedFoldersAtIndex(columnIndex - 1)
    pushOpenedFolderAtIndex(folder, columnIndex)
    await fetchFolderContents(folder.id, folder.name, columnIndex)
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
    closeFilePreview()
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
                        onClick: () =>
                          onCopyUrl(itemWithColumnIndex.name, getFileUrl(itemWithColumnIndex)),
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
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.WEEK)
                              ),
                          },
                          {
                            name: 'Expire in 1 month',
                            onClick: () =>
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.MONTH)
                              ),
                          },
                          {
                            name: 'Expire in 1 year',
                            onClick: () =>
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.YEAR)
                              ),
                          },
                          {
                            name: 'Custom expiry',
                            onClick: async () => setSelectedFileCustomExpiry(itemWithColumnIndex),
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
                        onClick: async () => await downloadFile(itemWithColumnIndex),
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
      className="h-full border-b border-default"
      onContextMenu={(event) => {
        event.stopPropagation()
        item.type === STORAGE_ROW_TYPES.FILE
          ? displayMenu(event, STORAGE_ROW_TYPES.FILE)
          : displayMenu(event, STORAGE_ROW_TYPES.FOLDER)
      }}
    >
      <div
        className={[
          'storage-row group flex h-full items-center px-2.5',
          'hover:bg-panel-footer-light [[data-theme*=dark]_&]:hover:bg-panel-footer-dark',
          `${isOpened ? 'bg-surface-200' : ''}`,
          `${isPreviewed ? 'bg-green-500 hover:bg-green-500' : ''}`,
          `${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}`,
        ].join(' ')}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          if (item.status !== STORAGE_ROW_STATUS.LOADING && !isOpened && !isPreviewed) {
            item.type === STORAGE_ROW_TYPES.FOLDER || item.type === STORAGE_ROW_TYPES.BUCKET
              ? onSelectFolder(columnIndex, item)
              : onSelectFile(columnIndex, item)
          }
        }}
      >
        <div
          className={[
            'flex items-center',
            view === STORAGE_VIEWS.LIST ? 'w-[40%] min-w-[250px]' : 'w-[90%]',
          ].join(' ')}
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
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <AlertCircle size={18} strokeWidth={2} className="text-foreground-light" />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                      'border border-background',
                    ].join(' ')}
                  >
                    <span className="text-xs text-foreground">
                      File is corrupted, please delete and reupload again.
                    </span>
                  </div>
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
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
            <DropdownMenu modal={false}>
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
