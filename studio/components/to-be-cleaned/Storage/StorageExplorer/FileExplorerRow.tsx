import { find, isEmpty, isEqual } from 'lodash'
import {
  Checkbox,
  Dropdown,
  IconMoreVertical,
  IconLoader,
  IconImage,
  IconMusic,
  IconFilm,
  IconFile,
  IconAlertCircle,
  IconDownload,
  IconEdit,
  IconMove,
  IconClipboard,
  IconTrash2,
  IconChevronRight,
} from 'ui'
import SVG from 'react-inlinesvg'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useContextMenu } from 'react-contexify'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useCheckPermissions } from 'hooks'
import {
  STORAGE_VIEWS,
  STORAGE_ROW_TYPES,
  STORAGE_ROW_STATUS,
  CONTEXT_MENU_KEYS,
  URL_EXPIRY_DURATION,
} from '../Storage.constants'
import { formatBytes } from 'lib/helpers'
import { BASE_PATH } from 'lib/constants'
import { useStorageStore } from 'localStores/storageExplorer/StorageExplorerStore'
import FileExplorerRowEditing from './FileExplorerRowEditing'

export const RowIcon = ({ view, status, fileType, mimeType }: any) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return <IconLoader size={16} strokeWidth={2} className="animate-spin" />
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
    return <IconImage size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('audio')) {
    return <IconMusic size={16} strokeWidth={2} />
  }

  if (mimeType?.includes('video')) {
    return <IconFilm size={16} strokeWidth={2} />
  }

  return <IconFile size={16} strokeWidth={2} />
}

export interface FileExplorerRowProps {
  index: number
  item: any
  view: string
  columnIndex: number
  selectedItems: any[]
  openedFolders: any[]
  selectedFilePreview: any
  onCopyUrl: (name: string, url: string) => void
}

const FileExplorerRow = ({
  index: itemIndex,
  item = {},
  view = STORAGE_VIEWS.COLUMNS,
  columnIndex = 0,
  selectedItems = [],
  openedFolders = [],
  selectedFilePreview = {},
  onCopyUrl,
}: FileExplorerRowProps) => {
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

  const isPublic = selectedBucket.public
  const itemWithColumnIndex = { ...item, columnIndex }
  const isSelected = find(selectedItems, item) !== undefined
  const isOpened =
    openedFolders.length > columnIndex ? isEqual(openedFolders[columnIndex], item) : false
  const isPreviewed = !isEmpty(selectedFilePreview) && isEqual(selectedFilePreview.id, item.id)
  const canUpdateFiles = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const { show } = useContextMenu()

  const onSelectFile = async (columnIndex: number, file: any) => {
    popColumnAtIndex(columnIndex)
    popOpenedFoldersAtIndex(columnIndex - 1)
    setFilePreview(file)
    clearSelectedItems()
  }

  const onSelectFolder = async (columnIndex: number, folder: any) => {
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
    if (find(selectedItems, (item: any) => itemWithColumnIndex.id === item.id) !== undefined) {
      setSelectedItems(
        selectedItems.filter((selectedItem: any) => itemWithColumnIndex.id !== selectedItem.id)
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
                  icon: <IconEdit size="tiny" />,
                  onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                },
              ]
            : []),
          {
            name: 'Download',
            icon: <IconDownload size="tiny" />,
            onClick: () => downloadFolder(itemWithColumnIndex),
          },
          ...(canUpdateFiles
            ? [
                { name: 'Separator', icon: undefined, onClick: undefined },
                {
                  name: 'Delete',
                  icon: <IconTrash2 size="tiny" />,
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
                        icon: <IconClipboard size="tiny" />,
                        onClick: async () =>
                          onCopyUrl(
                            itemWithColumnIndex.name,
                            await getFileUrl(itemWithColumnIndex)
                          ),
                      },
                    ]
                  : [
                      {
                        name: 'Get URL',
                        icon: <IconClipboard size="tiny" />,
                        children: [
                          {
                            name: 'Expire in 1 week',
                            onClick: async () =>
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                await getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.WEEK)
                              ),
                          },
                          {
                            name: 'Expire in 1 month',
                            onClick: async () =>
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                await getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.MONTH)
                              ),
                          },
                          {
                            name: 'Expire in 1 year',
                            onClick: async () =>
                              onCopyUrl(
                                itemWithColumnIndex.name,
                                await getFileUrl(itemWithColumnIndex, URL_EXPIRY_DURATION.YEAR)
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
                        icon: <IconEdit size="tiny" />,
                        onClick: () => setSelectedItemToRename(itemWithColumnIndex),
                      },
                      {
                        name: 'Move',
                        icon: <IconMove size="tiny" />,
                        onClick: () => setSelectedItemsToMove([itemWithColumnIndex]),
                      },
                      {
                        name: 'Download',
                        icon: <IconDownload size="tiny" />,
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
                  icon: <IconTrash2 size="tiny" />,
                  onClick: () => setSelectedItemsToDelete([itemWithColumnIndex]),
                },
              ]
            : []),
        ]

  const size = item.metadata ? formatBytes(item.metadata.size) : '-'
  const mimeType = item.metadata ? item.metadata.mimetype : '-'
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : '-'
  const updatedAt = item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'

  const displayMenu = (event: any, rowType: any) => {
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
      className="h-full border-b dark:border-dark"
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
          'hover:bg-panel-footer-light dark:hover:bg-panel-footer-dark',
          `${isOpened ? 'bg-scale-400' : ''}`,
          `${isPreviewed ? 'bg-green-500 hover:bg-green-500 dark:hover:bg-green-500' : ''}`,
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
                <IconAlertCircle size={18} strokeWidth={2} className="text-scale-1000" />
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
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
            <IconLoader
              className={`animate-spin ${view === STORAGE_VIEWS.LIST ? 'invisible' : ''}`}
              size={16}
              strokeWidth={2}
            />
          ) : (
            <Dropdown
              side="bottom"
              align="end"
              overlay={[
                rowOptions.map((option) => {
                  if ((option?.children ?? []).length > 0) {
                    return (
                      <Dropdown
                        isNested
                        key={option.name}
                        side="right"
                        align="start"
                        overlay={(option?.children ?? [])?.map((child) => {
                          return (
                            <Dropdown.Item key={child.name} onClick={child.onClick}>
                              <p className="text-xs">{child.name}</p>
                            </Dropdown.Item>
                          )
                        })}
                      >
                        <div
                          className={[
                            'flex items-center justify-between px-4 py-1.5 text-xs text-scale-1100',
                            'w-full focus:bg-scale-300 dark:focus:bg-scale-500 focus:text-scale-1200',
                          ].join(' ')}
                        >
                          <div className="flex items-center space-x-2">
                            {option.icon}
                            <p className="text">{option.name}</p>
                          </div>
                          <IconChevronRight size="tiny" />
                        </div>
                      </Dropdown>
                    )
                  } else if (option.name === 'Separator') {
                    return <Dropdown.Separator key="row-separator" />
                  } else {
                    return (
                      <Dropdown.Item
                        key={option.name}
                        icon={option.icon || <></>}
                        onClick={option.onClick}
                      >
                        <p className="text-xs">{option.name}</p>
                      </Dropdown.Item>
                    )
                  }
                }),
              ]}
            >
              <div className="storage-row-menu opacity-0">
                <IconMoreVertical size={16} strokeWidth={2} />
              </div>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorerRow
