import { ChevronRight } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import type { StorageItem } from '../Storage.types'
import { StorageRowIcon } from '../StorageRowIcon'
import type { StorageFolder } from '@/data/storage/bucket-folders-query'

const ROW_CONTENT_CLASS = 'flex h-full w-full items-center gap-x-2 px-2.5 text-left'

interface FolderPickerRowProps {
  icon: ReactNode
  name: string
  /** Secondary text shown right-aligned, e.g. the folder's parent path */
  description?: string
  /** Rows without a handler render as plain text — used for files, which can't be destinations */
  onClick?: () => void
  style?: CSSProperties
}

const FolderPickerRow = ({ icon, name, description, onClick, style }: FolderPickerRowProps) => {
  const content = (
    <>
      <span className="flex w-[30px] shrink-0 items-center">{icon}</span>
      <span title={name} className="min-w-0 flex-1 truncate text-sm">
        {name}
      </span>
      {!!description && (
        <span
          title={description}
          className="max-w-[45%] shrink-0 truncate text-xs text-foreground-lighter"
        >
          {description}
        </span>
      )}
      <ChevronRight
        size={14}
        className={cn('shrink-0 text-foreground-lighter', !onClick && 'invisible')}
      />
    </>
  )

  if (!onClick) {
    return (
      <div style={style} className="border-b border-default">
        <div className={cn(ROW_CONTENT_CLASS, 'opacity-50')}>{content}</div>
      </div>
    )
  }

  return (
    <div style={style} className="border-b border-default">
      <button
        type="button"
        tabIndex={0}
        onClick={onClick}
        className={cn(
          ROW_CONTENT_CLASS,
          'cursor-pointer hover:bg-panel-footer-light in-data-[theme*=dark]:hover:bg-panel-footer-dark',
          'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]'
        )}
      >
        {content}
      </button>
    </div>
  )
}

interface FolderPickerBrowseRowProps {
  item: StorageItem
  onSelectFolder: (name: string) => void
  style?: CSSProperties
}

/**
 * A row in the picker's folder listing. Files are listed for context but can't be selected —
 * only folders are valid move destinations.
 */
export const FolderPickerBrowseRow = ({
  item,
  onSelectFolder,
  style,
}: FolderPickerBrowseRowProps) => {
  const isFolder = item.type === STORAGE_ROW_TYPES.FOLDER

  return (
    <FolderPickerRow
      style={style}
      name={item.name}
      onClick={isFolder ? () => onSelectFolder(item.name) : undefined}
      icon={
        <StorageRowIcon
          view={STORAGE_VIEWS.LIST}
          status={STORAGE_ROW_STATUS.READY}
          fileType={item.type}
          mimeType={item.metadata?.mimetype}
        />
      }
    />
  )
}

interface FolderPickerSearchRowProps {
  item: StorageFolder
  /** Stands in for the folder's location when it sits at the root of the bucket */
  bucketName: string
  onSelectFolder: (path: string) => void
  style?: CSSProperties
}

/**
 * A row in the picker's search results, which lists folders from anywhere in the bucket and so
 * needs to show where each one lives.
 */
export const FolderPickerSearchRow = ({
  item,
  bucketName,
  onSelectFolder,
  style,
}: FolderPickerSearchRowProps) => {
  const parentSegments = item.path.split('/').slice(0, -1)
  const parentPath = parentSegments.length > 0 ? parentSegments.join('/') : bucketName

  return (
    <FolderPickerRow
      style={style}
      name={item.name}
      description={parentPath}
      onClick={() => onSelectFolder(item.path)}
      icon={
        <StorageRowIcon
          view={STORAGE_VIEWS.LIST}
          status={STORAGE_ROW_STATUS.READY}
          fileType={STORAGE_ROW_TYPES.FOLDER}
          mimeType={undefined}
        />
      }
    />
  )
}
