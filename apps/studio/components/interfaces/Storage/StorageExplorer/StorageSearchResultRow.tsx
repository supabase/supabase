import { ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from 'ui'

import { STORAGE_ROW_STATUS, STORAGE_ROW_TYPES, STORAGE_VIEWS } from '../Storage.constants'
import { StorageRowIcon } from '../StorageRowIcon'
import { getParentPathLabel } from './StorageExplorer.utils'
import type { StorageSearchResult } from '@/data/storage/bucket-search-query'
import { formatBytes } from '@/lib/helpers'

interface StorageSearchResultRowProps {
  item: StorageSearchResult
  /** Stands in for an item's location when it sits at the root of the bucket */
  bucketName: string
  onSelectResult: (item: StorageSearchResult) => void
  style?: CSSProperties
}

/**
 * One match in a bucket-wide search. Results span folders, so each row carries the folder
 * it lives in, and selecting it navigates there rather than acting on it in place.
 */
export const StorageSearchResultRow = ({
  item,
  bucketName,
  onSelectResult,
  style,
}: StorageSearchResultRowProps) => {
  const location = getParentPathLabel(item.path, bucketName)
  const size = item.isFolder || item.size === undefined ? undefined : formatBytes(item.size)

  return (
    <div style={style} className="border-b border-default">
      <button
        type="button"
        onClick={() => onSelectResult(item)}
        aria-label={`${item.name} in ${location}`}
        className={cn(
          'flex h-full w-full cursor-pointer items-center gap-x-2 px-2.5 text-left',
          'hover:bg-panel-footer-light in-data-[theme*=dark]:hover:bg-panel-footer-dark',
          'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]'
        )}
      >
        <span className="flex w-[30px] shrink-0 items-center">
          <StorageRowIcon
            view={STORAGE_VIEWS.LIST}
            status={STORAGE_ROW_STATUS.READY}
            fileType={item.isFolder ? STORAGE_ROW_TYPES.FOLDER : STORAGE_ROW_TYPES.FILE}
            mimeType={item.mimetype}
          />
        </span>
        <span title={item.name} className="min-w-0 flex-1 truncate text-sm">
          {item.name}
        </span>
        {!!size && (
          <span className="shrink-0 text-xs text-foreground-lighter tabular-nums">{size}</span>
        )}
        <span
          title={location}
          className="max-w-[45%] shrink-0 truncate text-xs text-foreground-lighter"
        >
          {location}
        </span>
        <ChevronRight size={14} className="shrink-0 text-foreground-lighter" />
      </button>
    </div>
  )
}
