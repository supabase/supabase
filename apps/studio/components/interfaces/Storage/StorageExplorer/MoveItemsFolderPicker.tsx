import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { ArrowLeft, Search, X } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { STORAGE_SORT_BY, STORAGE_SORT_BY_ORDER } from '../Storage.constants'
import { FolderPickerBrowseRow, FolderPickerSearchRow } from './MoveItemsFolderPickerRow'
import { filterFoldersBySearch, sortFoldersFirst } from './MoveItemsModal.utils'
import { formatFolderItems } from './StorageExplorer.utils'
import { InfiniteListDefault, LoaderForIconMenuItems } from '@/components/ui/InfiniteList'
import { bucketFoldersQueryOptions } from '@/data/storage/bucket-folders-query'
import { useBucketObjectsInfiniteQuery } from '@/data/storage/bucket-objects-infinite-query'
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
    hasNextPage,
    fetchNextPage,
  } = useBucketObjectsInfiniteQuery({
    projectRef,
    bucketId,
    path,
    options: {
      sortBy: { column: STORAGE_SORT_BY.NAME, order: STORAGE_SORT_BY_ORDER.ASC },
    },
  })

  const { data: foldersData, isPending: isPendingFolders } = useQuery({
    ...bucketFoldersQueryOptions({ projectRef, bucketId }),
    enabled: isSearching,
  })

  const items = useMemo(
    () => sortFoldersFirst(formatFolderItems(objectsData?.pages.flat() ?? [])),
    [objectsData]
  )

  const searchResults = useMemo(
    () => filterFoldersBySearch(foldersData?.folders ?? [], debouncedSearchString),
    [foldersData, debouncedSearchString]
  )

  const isRoot = pathSegments.length === 0
  const currentFolderName = isRoot ? bucketName : pathSegments[pathSegments.length - 1]

  // Navigating always leaves search mode, so that the listing shown matches the destination
  const handleNavigate = (segments: string[]) => {
    setSearchString('')
    onChangePath(segments)
  }

  const handleOpenFolder = (name: string) => handleNavigate([...pathSegments, name])

  const handleOpenSearchResult = (folderPath: string) => handleNavigate(folderPath.split('/'))

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
        <Breadcrumb className="min-w-0 flex-1 overflow-hidden">
          <BreadcrumbList className="flex-nowrap gap-1 sm:gap-1">
            {[bucketName, ...pathSegments].map((segment, index) => {
              const isCurrent = index === pathSegments.length
              return (
                <Fragment key={`${segment}-${index}`}>
                  {index > 0 && <BreadcrumbSeparator className="shrink-0" />}
                  <BreadcrumbItem className="min-w-0">
                    {isCurrent ? (
                      <BreadcrumbPage className="truncate text-xs">{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button
                          type="button"
                          tabIndex={0}
                          className="truncate text-xs"
                          onClick={() => handleNavigate(pathSegments.slice(0, index))}
                        >
                          {segment}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isSearching && isPendingFolders && (
          <div className="flex flex-col gap-y-2 p-2.5">
            <ShimmeringLoader />
            <ShimmeringLoader />
            <ShimmeringLoader />
          </div>
        )}

        {isSearching && !isPendingFolders && searchResults.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-y-1 px-6">
            <p className="text-sm text-foreground">No folders match "{debouncedSearchString}"</p>
            <p className="text-center text-sm text-foreground-light">
              Clear the search to browse {bucketName} instead.
            </p>
          </div>
        )}

        {isSearching && searchResults.length > 0 && (
          <InfiniteListDefault
            className="h-full"
            items={searchResults}
            itemProps={{ bucketName, onSelectFolder: handleOpenSearchResult }}
            getItemKey={(index) => searchResults[index]?.path ?? `folder-${index}`}
            getItemSize={() => ROW_HEIGHT}
            ItemComponent={FolderPickerSearchRow}
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

        {!isSearching && !isPendingObjects && items.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-y-1 px-6">
            <p className="text-sm text-foreground">{currentFolderName} is empty</p>
            <p className="text-center text-sm text-foreground-light">
              Move the files here, or go back to choose another folder.
            </p>
          </div>
        )}

        {!isSearching && items.length > 0 && (
          <InfiniteListDefault
            className="h-full"
            items={items}
            itemProps={{ onSelectFolder: handleOpenFolder }}
            getItemKey={(index) => items[index]?.id ?? `item-${index}`}
            getItemSize={() => ROW_HEIGHT}
            ItemComponent={FolderPickerBrowseRow}
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
