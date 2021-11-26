import { useState, useRef, useEffect } from 'react'
import { find, has, isEmpty, isEqual } from 'lodash'
import {
  Checkbox,
  Dropdown,
  IconMoreVertical,
  IconLoader,
  IconImage,
  IconMusic,
  IconFilm,
  IconFile,
  Typography,
} from '@supabase/ui'
import SVG from 'react-inlinesvg'
import { useContextMenu } from 'react-contexify'
import {
  STORAGE_VIEWS,
  STORAGE_ROW_TYPES,
  STORAGE_ROW_STATUS,
  CONTEXT_MENU_KEYS,
} from '../Storage.constants.ts'
import { formatBytes } from 'lib/helpers'

const RowIcon = ({ view, status, fileType, mimeType }) => {
  if (view === STORAGE_VIEWS.LIST && status === STORAGE_ROW_STATUS.LOADING) {
    return (
      <Typography.Text>
        <IconLoader size={16} strokeWidth={2} className="animate-spin" />
      </Typography.Text>
    )
  }

  if (fileType === STORAGE_ROW_TYPES.BUCKET || fileType === STORAGE_ROW_TYPES.FOLDER) {
    const iconSrc =
      fileType === STORAGE_ROW_TYPES.BUCKET
        ? '/img/bucket-filled.svg'
        : fileType === STORAGE_ROW_TYPES.FOLDER
        ? '/img/folder-filled.svg'
        : '/img/file-filled.svg'
    return (
      <Typography.Text>
        <SVG
          src={iconSrc}
          alt={fileType}
          preProcessor={(code) =>
            code.replace(/svg/, 'svg class="w-4 h-4 text-color-inherit opacity-75"')
          }
        />
      </Typography.Text>
    )
  }

  if (mimeType?.includes('image')) {
    return (
      <Typography.Text>
        <IconImage size={16} strokeWidth={2} />
      </Typography.Text>
    )
  }

  if (mimeType?.includes('audio')) {
    return (
      <Typography.Text>
        <IconMusic size={16} strokeWidth={2} />
      </Typography.Text>
    )
  }

  if (mimeType?.includes('video')) {
    return (
      <Typography.Text>
        <IconFilm size={16} strokeWidth={2} />
      </Typography.Text>
    )
  }

  return (
    <Typography.Text>
      <IconFile size={16} strokeWidth={2} />
    </Typography.Text>
  )
}

const FileExplorerRow = ({
  item = {},
  view = STORAGE_VIEWS.COLUMNS,
  columnIndex = 0,
  selectedItems = [],
  openedFolders = [],
  selectedFilePreview = {},

  onCheckItem = () => {},
  onSelectFile = () => {},
  onRenameFile = () => {},
  onCopyFileURL = () => {},
  onDownloadFile = () => {},
  onSelectFolder = () => {},
  onRenameFolder = () => {},
  onCreateFolder = () => {},
  onSelectItemDelete = () => {},
  onSelectItemRename = () => {},
  onSelectItemMove = () => {},
}) => {
  const isSelected = find(selectedItems, item) !== undefined
  const isOpened =
    openedFolders.length > columnIndex ? isEqual(openedFolders[columnIndex], item) : false
  const isPreviewed = !isEmpty(selectedFilePreview) && isEqual(selectedFilePreview.id, item.id)

  if (item.status === STORAGE_ROW_STATUS.EDITING) {
    const inputRef = useRef(null)
    const [itemName, setItemName] = useState(item.name)

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.select()
      }
    }, [])

    const onSetItemName = (event) => {
      event.preventDefault()
      if (item.type === STORAGE_ROW_TYPES.FILE) {
        onRenameFile(item, itemName, columnIndex)
      } else if (has(item, 'id')) {
        onRenameFolder(item, itemName, columnIndex)
      } else {
        onCreateFolder(itemName, columnIndex)
      }
    }

    return (
      <div className="storage-row flex items-center justify-between rounded bg-gray-500">
        <div className="flex flex-grow items-center h-full px-4">
          <div className="">
            <RowIcon
              view={view}
              status={item.status}
              fileType={item.type}
              mimeType={item.metadata?.mimetype}
            />
          </div>
          <form className="h-9">
            <input
              autoFocus
              ref={inputRef}
              className="storage-row-input text-sm ml-3 p-0 px-1 h-full"
              type="text"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              onBlur={onSetItemName}
            />
            <button className="hidden" type="submit" onClick={onSetItemName} />
          </form>
        </div>
      </div>
    )
  }

  const itemWithColumnIndex = { ...item, columnIndex }
  const rowOptions =
    item.type === STORAGE_ROW_TYPES.BUCKET
      ? [{ name: 'Delete', onClick: () => onSelectItemDelete(itemWithColumnIndex) }]
      : item.type === STORAGE_ROW_TYPES.FOLDER
      ? [
          { name: 'Rename', onClick: () => onSelectItemRename(itemWithColumnIndex) },
          { name: 'Delete', onClick: () => onSelectItemDelete(itemWithColumnIndex) },
        ]
      : [
          { name: 'Copy URL', onClick: () => onCopyFileURL(itemWithColumnIndex) },
          { name: 'Rename', onClick: () => onSelectItemRename(itemWithColumnIndex) },
          { name: 'Move', onClick: () => onSelectItemMove(itemWithColumnIndex) },
          { name: 'Download', onClick: () => onDownloadFile(itemWithColumnIndex) },
          { name: 'Delete', onClick: () => onSelectItemDelete(itemWithColumnIndex) },
        ]

  const size = item.metadata ? formatBytes(item.metadata.size) : '-'
  const mimeType = item.metadata ? item.metadata.mimetype : '-'
  const createdAt = item.created_at ? new Date(item.created_at).toLocaleString() : '-'
  const updatedAt = item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'

  const { show } = useContextMenu()
  const displayMenu = (event, rowType) => {
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

  return (
    <div
      className="border-b dark:border-dark"
      onContextMenu={(event) => {
        event.stopPropagation()
        item.type === STORAGE_ROW_TYPES.FILE
          ? displayMenu(event, STORAGE_ROW_TYPES.FILE)
          : displayMenu(event, STORAGE_ROW_TYPES.FOLDER)
      }}
    >
      <div
        className={`
        storage-row px-4 flex items-center justify-between hover:bg-panel-footer-light dark:hover:bg-panel-footer-dark
        ${isOpened ? 'bg-bg-secondary-light dark:bg-bg-alt-dark' : ''} ${
          isPreviewed ? 'bg-green-500 hover:bg-green-500 dark:hover:bg-green-500' : ''
        } ${view === STORAGE_VIEWS.LIST ? 'min-w-min' : ''}
        ${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}
      `}
      >
        <div className="w-full flex flex-grow items-center">
          {/* Row Checkbox / Row Icon */}
          <div
            className="relative group"
            style={{ width: view === STORAGE_VIEWS.COLUMNS ? '15%' : 'auto' }}
            onClick={(event) => event.stopPropagation()}
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
              onChange={() => onCheckItem(itemWithColumnIndex)}
            />
          </div>

          {/* Row Text */}
          <div
            className="flex items-center h-full py-2"
            style={{ width: view === STORAGE_VIEWS.COLUMNS ? '80%' : '100%' }}
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
            {view === STORAGE_VIEWS.COLUMNS ? (
              <Typography.Text className="w-full truncate">{item.name}</Typography.Text>
            ) : (
              <>
                <Typography.Text className="truncate" style={{ width: '30%', minWidth: '250px' }}>
                  {item.name}
                </Typography.Text>
                <Typography.Text className="truncate" style={{ width: '15%', minWidth: '100px' }}>
                  {size}
                </Typography.Text>
                <Typography.Text className="truncate" style={{ width: '15%', minWidth: '100px' }}>
                  {mimeType}
                </Typography.Text>
                <Typography.Text className="truncate" style={{ width: '20%', minWidth: '180px' }}>
                  {createdAt}
                </Typography.Text>
                <Typography.Text className="truncate" style={{ width: '20%', minWidth: '175px' }}>
                  {updatedAt}
                </Typography.Text>
                {/* The 175px here is intentional due to the irregular width of the header checkbox and row icon */}
              </>
            )}
          </div>
          {item.status === STORAGE_ROW_STATUS.LOADING ? (
            <Typography.Text>
              <IconLoader
                className={`animate-spin ${view === STORAGE_VIEWS.LIST ? 'invisible' : ''}`}
                size={16}
                strokeWidth={2}
              />
            </Typography.Text>
          ) : (
            <Dropdown
              side="bottom"
              align="end"
              overlay={[
                rowOptions.map((option) => (
                  <Dropdown.Item key={option.name} onClick={option.onClick}>
                    {option.name}
                  </Dropdown.Item>
                )),
              ]}
            >
              <Typography.Text type="secondary">
                <div className="storage-row-menu opacity-0">
                  <IconMoreVertical size={16} strokeWidth={2} />
                </div>
              </Typography.Text>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  )
}

export default FileExplorerRow
