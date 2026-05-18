import { FilesBucket as FilesBucketIcon } from 'icons'
import { AlertCircle, File, Film, FolderOpen, Image, LoaderCircle, Music } from 'lucide-react'
import type { CSSProperties, MouseEvent } from 'react'
import { Checkbox, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { type StorageItem } from '../Storage.types'
import { formatBytes } from '@/lib/helpers'

const RowIcon = ({
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

interface BucketFilePickerRowProps {
  item: StorageItem
  view: STORAGE_VIEWS
  isSelected: boolean
  isPreviewed: boolean
  isOpened: boolean
  isDisabled?: boolean
  hideCheckbox: boolean
  onCheck: (isShiftKeyHeld: boolean) => void
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  style?: CSSProperties
}

export const BucketFilePickerRow = ({
  item,
  view = STORAGE_VIEWS.COLUMNS,
  onCheck,
  onClick,
  isSelected,
  isPreviewed,
  isOpened,
  isDisabled = false,
  hideCheckbox,
  style,
}: BucketFilePickerRowProps) => {
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

  return (
    <div style={style} className="h-full border-b border-default">
      <div
        className={cn(
          'storage-row group flex h-full items-center px-2.5',
          'hover:bg-panel-footer-light in-data-[theme*=dark]:hover:bg-panel-footer-dark',
          `${isOpened ? 'bg-selection' : ''}`,
          `${isSelected ? 'bg-selection' : ''}`,
          `${isPreviewed ? 'bg-selection hover:bg-selection' : ''}`,
          `${item.status !== STORAGE_ROW_STATUS.LOADING ? 'cursor-pointer' : ''}`,
          isDisabled && 'cursor-not-allowed opacity-40 hover:bg-transparent'
        )}
        onClick={isDisabled ? undefined : onClick}
      >
        <div
          className={cn(
            'flex items-center',
            view === STORAGE_VIEWS.LIST ? 'w-[40%] min-w-[250px]' : 'w-[90%]'
          )}
        >
          <div className="relative w-[30px]" onClick={(event) => event.stopPropagation()}>
            <div
              className={cn('top-0.5', {
                absolute: !hideCheckbox,
                'group-hover:hidden': !hideCheckbox && item.type === STORAGE_ROW_TYPES.FILE,
                hidden: isSelected,
              })}
            >
              <RowIcon
                view={view}
                status={item.status}
                fileType={item.type}
                isOpened={isOpened}
                mimeType={item.metadata?.mimetype}
              />
            </div>
            {!hideCheckbox && (
              <Checkbox
                className={cn(
                  'w-full',
                  { invisible: item.type !== STORAGE_ROW_TYPES.FILE },
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                checked={isSelected}
                onChange={(event) => {
                  event.stopPropagation()
                  onCheck((event.nativeEvent as KeyboardEvent).shiftKey)
                }}
              />
            )}
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
            view === STORAGE_VIEWS.LIST ? 'grow' : 'w-[10%]'
          }`}
          onClick={(event) =>
            // Stops click event from this div, to resolve an issue with menu item's click event triggering unexpected row select
            event.stopPropagation()
          }
        >
          {item.status === STORAGE_ROW_STATUS.LOADING && (
            <LoaderCircle
              className={`animate-spin text-foreground-lighter ${view === STORAGE_VIEWS.LIST ? 'invisible' : ''}`}
              size={14}
              strokeWidth={2}
            />
          )}
        </div>
      </div>
    </div>
  )
}
