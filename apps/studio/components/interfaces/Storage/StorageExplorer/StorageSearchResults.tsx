import { useQuery } from '@tanstack/react-query'
import { Button } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useStorageExplorerNavigation } from './StorageExplorerNavigation'
import { StorageSearchResultRow } from './StorageSearchResultRow'
import { AlertError } from '@/components/ui/AlertError'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import {
  bucketSearchQueryOptions,
  type StorageSearchResult,
} from '@/data/storage/bucket-search-query'
import { useTrack } from '@/lib/telemetry/track'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

const ROW_HEIGHT = 37

interface StorageSearchResultsProps {
  /** Debounced search term. Empty while typing is still settling, which reads as pending. */
  searchString: string
  onClearSearch: () => void
}

/**
 * Matches for a search across the whole bucket, shown in place of the folder columns.
 * Selecting a result navigates to it, which is also what clears the search.
 */
export const StorageSearchResults = ({
  searchString,
  onClearSearch,
}: StorageSearchResultsProps) => {
  const { projectRef, selectedBucket } = useStorageExplorerStateSnapshot()
  const { navigateToPath } = useStorageExplorerNavigation()
  const track = useTrack()

  const bucketName = selectedBucket.name
  const { data, isPending, isError, error, refetch } = useQuery(
    bucketSearchQueryOptions({ projectRef, bucketId: selectedBucket.id, searchString })
  )

  const results = data?.results ?? []
  const matchCount = `${results.length} ${results.length === 1 ? 'match' : 'matches'}`

  const handleSelectResult = (item: StorageSearchResult) => {
    track('storage_explorer_search_result_clicked', {
      itemType: item.isFolder ? 'folder' : 'file',
    })
    const segments = item.path.split('/')
    onClearSearch()
    if (item.isFolder) {
      navigateToPath(segments)
    } else {
      navigateToPath(segments.slice(0, -1), { preview: item.name })
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-x-2 border-b border-default bg-surface-75 px-2.5 py-2">
        <p className="min-w-0 truncate text-xs text-foreground-light">
          {isPending && `Searching ${bucketName}...`}
          {!isPending && !isError && `${matchCount} in ${bucketName}`}
        </p>
        <Button size="tiny" variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isPending && (
          <div className="flex flex-col gap-y-2 p-2.5">
            <ShimmeringLoader />
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        )}

        {isError && (
          <div className="flex h-full items-center justify-center p-2.5">
            <AlertError
              error={error}
              subject={`Failed to search ${bucketName}`}
              additionalActions={
                <Button size="tiny" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {!isPending && !isError && results.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-y-1 px-6">
            <p className="text-sm text-foreground">No items match "{searchString}"</p>
            <p className="text-center text-sm text-foreground-light">
              Clear the search to browse {bucketName} instead.
            </p>
          </div>
        )}

        {!isError && results.length > 0 && (
          <InfiniteListDefault
            className="h-full"
            items={results}
            itemProps={{ bucketName, onSelectResult: handleSelectResult }}
            getItemKey={(index) => results[index]?.path ?? `result-${index}`}
            getItemSize={() => ROW_HEIGHT}
            ItemComponent={StorageSearchResultRow}
            LoaderComponent={LoaderForIconMenuItems}
          />
        )}
      </div>

      {!!data?.isTruncated && (
        <p className="shrink-0 border-t border-overlay bg-surface-100 px-2.5 py-2 text-xs text-foreground-lighter">
          {bucketName} has too many items to search through all of them. Browse to an item if it
          isn't listed.
        </p>
      )}
    </div>
  )
}
