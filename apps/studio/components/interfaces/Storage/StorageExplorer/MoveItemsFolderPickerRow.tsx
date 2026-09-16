import { ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { StorageRowIcon } from '../StorageRowIcon'
import { getParentPathLabel } from './MoveItemsModal.utils'
import type { StorageFolder } from '@/data/storage/bucket-folders-query'

interface FolderPickerRowProps {
  item: StorageFolder
  /** Path of the folder currently set as the move destination */
  selectedPath: string
  /** Shows where each folder lives — only useful for search, which spans the whole bucket */
  showLocation: boolean
  /** Stands in for a folder's location when it sits at the root of the bucket */
  bucketName: string
  onSelectFolder: (path: string) => void
  style?: CSSProperties
}

export const FolderPickerRow = ({
  item,
  selectedPath,
  showLocation,
  bucketName,
  onSelectFolder,
  style,
}: FolderPickerRowProps) => {
  const isSelected = item.path === selectedPath
  const location = getParentPathLabel(item.path, bucketName)

  return (
    <div style={style} className="border-b border-default">
      <button
        type="button"
        tabIndex={0}
        onClick={() => onSelectFolder(item.path)}
        aria-label={showLocation ? `${item.name} in ${location}` : item.name}
        aria-current={isSelected ? 'true' : undefined}
        className={cn(
          'flex h-full w-full cursor-pointer items-center gap-x-2 px-2.5 text-left',
          'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]',
          isSelected
            ? 'bg-selection'
            : 'hover:bg-panel-footer-light in-data-[theme*=dark]:hover:bg-panel-footer-dark'
        )}
      >
        <span className="flex w-[30px] shrink-0 items-center">
          <StorageRowIcon
            view={STORAGE_VIEWS.LIST}
            status={STORAGE_ROW_STATUS.READY}
            fileType={STORAGE_ROW_TYPES.FOLDER}
            mimeType={undefined}
          />
        </span>
        <span title={item.name} className="min-w-0 flex-1 truncate text-sm">
          {item.name}
        </span>
        {showLocation && (
          <span
            title={location}
            className="max-w-[45%] shrink-0 truncate text-xs text-foreground-lighter"
          >
            {location}
          </span>
        )}
        <ChevronRight size={14} className="shrink-0 text-foreground-lighter" />
      </button>
    </div>
  )
}
