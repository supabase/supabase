import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { ArrowLeft, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER } from '../Storage.constants'
import { MoveItemsFolderPickerBreadcrumb } from './MoveItemsFolderPickerBreadcrumb'
import { FolderPickerRow } from './MoveItemsFolderPickerRow'
import { filterFoldersBySearch, getDestinationLabel } from './MoveItemsModal.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { bucketFoldersQueryOptions } from '@/data/storage/bucket-folders-query'
import { bucketObjectsInfiniteQueryOptions } from '@/data/storage/bucket-objects-infinite-query'
import { onSearchInputEscape } from '@/lib/keyboard'

const ROW_HEIGHT = 37

interface MoveItemsFolderPickerProps {
  projectRef: string
  bucketId: string
  bucketName: string
  pathSegments: string[]
  onChangePath: (pathSegments: string[]) => void
}

/**
 * A file explorer scoped down to picking a destination folder
 */
export const MoveItemsFolderPicker = ({
  projectRef,
  bucketId,
  bucketName,
  pathSegments,
  onChangePath,
}: MoveItemsFolderPickerProps) => {
  const [searchString, setSearchString] = useState('')
  const debouncedSearchString = useDebounce(searchString, 300)
  const isSearching = debouncedSearchString.trim().length > 0

  const path = pathSegments.join('/')

  const {
    data: objectsData,
    isPending: isPendingObjects,
    isFetching: isFetchingObjects,
    isError: isErrorObjects,
    error: objectsError,
    hasNextPage,
    fetchNextPage,
    refetch: refetchObjects,
  } = useInfiniteQuery({
    ...bucketObjectsInfiniteQueryOptions({
      projectRef,
      bucketId,
      path,
      options: {
        sortBy: { column: STORAGE_SORT_BY.NAME, order: STORAGE_SORT_BY_ORDER.ASC },
      },
    }),
  })

  const {
    data: foldersData,
    isPending: isPendingFolders,
    isError: isErrorFolders,
    error: foldersError,
    refetch: refetchFolders,
  } = useQuery({
    ...bucketFoldersQueryOptions({ projectRef, bucketId }),
    enabled: isSearching,
  })

  const folders = useMemo(() => {
    // v2's `name` is the folder's full path from the bucket root, with a trailing slash
    // (e.g. "outer/inner/") — not the bare folder name, and not relative to `path`.
    return (objectsData?.pages ?? [])
      .flatMap((page) => page.folders)
      .map((folder) => {
        const folderPath = folder.name.replace(/\/$/, '')
        return {
          name: folderPath.split('/').pop() ?? folderPath,
          path: folderPath,
        }
      })
  }, [objectsData])

  const searchResults = useMemo(
    () => filterFoldersBySearch(foldersData?.folders ?? [], debouncedSearchString),
    [foldersData, debouncedSearchString]
  )

  const isRoot = pathSegments.length === 0
  const currentFolderName = isRoot ? bucketName : pathSegments[pathSegments.length - 1]
  // A page of pure files leaves nothing to render yet
  const isDrainingPages = folders.length === 0 && hasNextPage

  // Navigating always leaves search mode
  const handleNavigate = (segments: string[]) => {
    setSearchString('')
    onChangePath(segments)
  }

  const handleSelectFolder = (folderPath: string) => handleNavigate(folderPath.split('/'))

  return (
    <div className="flex h-[360px] flex-col overflow-hidden rounded-md border border-overlay bg-studio">
      <div className="flex shrink-0 items-center gap-x-2 border-b border-overlay bg-surface-100 px-2.5 py-2">
        <Button
          size="tiny"
          variant="outline"
          aria-label="Go up one level"
          className="w-7 shrink-0 px-1"
          icon={<ArrowLeft size={14} />}
          disabled={isRoot}
          onClick={() => handleNavigate(pathSegments.slice(0, -1))}
        />
        <Input
          size="tiny"
          className="w-52 shrink-0"
          icon={<Search />}
          placeholder={`Search folders in ${bucketName}...`}
          type="text"
          value={searchString}
          onChange={(event) => setSearchString(event.target.value)}
          onKeyDown={onSearchInputEscape(searchString, setSearchString)}
          actions={
            searchString.length > 0
              ? [
                  <Button
                    key="clear"
                    size="tiny"
                    variant="text"
                    aria-label="Clear search"
                    icon={<X />}
                    className="h-5 w-5 p-0"
                    onClick={() => setSearchString('')}
                  />,
                ]
              : undefined
          }
        />
        <MoveItemsFolderPickerBreadcrumb
          bucketName={bucketName}
          pathSegments={pathSegments}
          onNavigate={handleNavigate}
        />
      </div>

      <div className="flex shrink-0 items-center border-b border-default bg-surface-75 px-2.5 py-2">
        <p className="min-w-0 truncate text-xs text-foreground-light">
          Moving to{' '}
          <span className="font-mono text-foreground">
            {getDestinationLabel(bucketName, pathSegments)}
          </span>
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden" data-testid="folder-picker-list">
        {isSearching && isPendingFolders && (
          <div className="flex flex-col gap-y-2 p-2.5">
            <ShimmeringLoader />
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        )}

        {isSearching && isErrorFolders && (
          <div className="flex h-full items-center justify-center p-2.5">
            <AlertError
              error={foldersError}
              subject="Failed to search folders"
              additionalActions={
                <Button size="tiny" variant="outline" onClick={() => refetchFolders()}>
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {isSearching && !isPendingFolders && !isErrorFolders && searchResults.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-y-1 px-6">
            <p className="text-sm text-foreground">No folders match "{debouncedSearchString}"</p>
            <p className="text-center text-sm text-foreground-light">
              Clear the search to browse {bucketName} instead.
            </p>
          </div>
        )}

        {isSearching && !isErrorFolders && searchResults.length > 0 && (
          <InfiniteListDefault
            className="h-full"
            items={searchResults}
            itemProps={{
              selectedPath: path,
              showLocation: true,
              bucketName,
              onSelectFolder: handleSelectFolder,
            }}
            getItemKey={(index) => searchResults[index]?.path ?? `folder-${index}`}
            getItemSize={() => ROW_HEIGHT}
            ItemComponent={FolderPickerRow}
            LoaderComponent={LoaderForIconMenuItems}
          />
        )}

        {!isSearching && isPendingObjects && (
          <div className="flex flex-col gap-y-2 p-2.5">
            <ShimmeringLoader />
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        )}

        {!isSearching && isErrorObjects && (
          <div className="flex h-full items-center justify-center p-2.5">
            <AlertError
              error={objectsError}
              subject="Failed to load folder contents"
              additionalActions={
                <Button size="tiny" variant="outline" onClick={() => refetchObjects()}>
                  Try again
                </Button>
              }
            />
          </div>
        )}

        {!isSearching &&
          !isPendingObjects &&
          !isErrorObjects &&
          folders.length === 0 &&
          !isDrainingPages && (
            <div className="flex h-full flex-col items-center justify-center gap-y-1 px-6">
              <p className="text-sm text-foreground">No folders in {currentFolderName}</p>
              <p className="text-center text-sm text-foreground-light">
                Move the files here, or go back to choose another folder.
              </p>
            </div>
          )}

        {!isSearching &&
          !isPendingObjects &&
          !isErrorObjects &&
          (folders.length > 0 || isDrainingPages) && (
            <InfiniteListDefault
              className="h-full"
              items={folders}
              itemProps={{
                selectedPath: path,
                showLocation: false,
                bucketName,
                onSelectFolder: handleSelectFolder,
              }}
              getItemKey={(index) => folders[index]?.path ?? `folder-${index}`}
              getItemSize={() => ROW_HEIGHT}
              ItemComponent={FolderPickerRow}
              LoaderComponent={LoaderForIconMenuItems}
              hasNextPage={hasNextPage}
              isLoadingNextPage={isFetchingObjects}
              onLoadNextPage={fetchNextPage}
            />
          )}
      </div>

      {isSearching && !!foldersData?.isTruncated && (
        <p className="shrink-0 border-t border-overlay bg-surface-100 px-2.5 py-2 text-xs text-foreground-lighter">
          {bucketName} has too many folders to search through all of them. Browse to the folder if
          it isn't listed.
        </p>
      )}
    </div>
  )
}
