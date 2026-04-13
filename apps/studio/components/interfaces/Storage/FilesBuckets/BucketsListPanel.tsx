import { useDebounce } from '@uidotdev/usehooks'
import { ArrowDownNarrowWide, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EmptyBucketState } from '../EmptyBucketState'
import { CreateBucketButton } from '../NewBucketButton'
import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { BucketsTable } from './BucketsTable'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import type { Bucket } from '@/data/storage/buckets-query'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { IS_PLATFORM } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'

type BucketsListPanelProps = {
  projectRef?: string
  searchPlaceholder?: string
  sortBucket?: STORAGE_BUCKET_SORT
  onSortBucketChange?: (value: STORAGE_BUCKET_SORT) => void
  onCreateBucket?: () => void
  onSelectBucket?: (bucket: Bucket) => void
  publicBucketsOnly?: boolean
  wrapperClassName?: string
  tableClassName?: string
}

export const BucketsListPanel = ({
  projectRef,
  searchPlaceholder = 'Search for a bucket',
  sortBucket,
  onSortBucketChange,
  onCreateBucket,
  onSelectBucket,
  publicBucketsOnly = false,
  wrapperClassName,
  tableClassName,
}: BucketsListPanelProps) => {
  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 250)
  const normalizedSearch = debouncedFilterString.trim()

  const isSortEnabled = !!sortBucket && !!onSortBucketChange
  const sortColumn =
    isSortEnabled && sortBucket === STORAGE_BUCKET_SORT.CREATED_AT ? 'created_at' : 'name'
  const sortOrder = isSortEnabled && sortBucket === STORAGE_BUCKET_SORT.CREATED_AT ? 'desc' : 'asc'

  const { data: storageConfig } = useProjectStorageConfigQuery(
    { projectRef },
    { enabled: IS_PLATFORM && !!projectRef }
  )

  const {
    data: bucketsData,
    error: bucketsError,
    isError: isErrorBuckets,
    isPending: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
    isFetching: isFetchingBuckets,
    fetchNextPage,
    hasNextPage,
  } = usePaginatedBucketsQuery(
    {
      projectRef,
      search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
      sortColumn,
      sortOrder,
    },
    { enabled: !!projectRef }
  )

  const buckets = useMemo(() => bucketsData?.pages.flatMap((page) => page) ?? [], [bucketsData])
  const fileBuckets = useMemo(
    () => buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD'),
    [buckets]
  )
  const hasNoBuckets = fileBuckets.length === 0 && normalizedSearch.length === 0
  const formattedGlobalUploadLimit = formatBytes(storageConfig?.fileSizeLimit ?? 0)

  const hasNoApiKeys =
    isErrorBuckets && bucketsError.message.includes('Project has no active API keys')

  const handleLoadMoreBuckets = useCallback(() => {
    if (hasNextPage && !isFetchingBuckets) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingBuckets, fetchNextPage])

  return (
    <div className={wrapperClassName ?? 'flex h-full min-h-0 w-full flex-1 flex-col gap-3'}>
      {isLoadingBuckets && <GenericSkeletonLoader />}
      {isErrorBuckets && (
        <>
          {hasNoApiKeys ? (
            <Admonition type="warning" title="Project has no active API keys enabled">
              <p className="!leading-normal text-sm">
                The Dashboard relies on having active API keys on the project to function. If you'd
                like to use Storage through the Dashboard, create a set of API keys{' '}
                <InlineLink href={`/project/${projectRef}/settings/api-keys/new`}>here</InlineLink>.
              </p>
            </Admonition>
          ) : (
            <AlertError error={bucketsError} subject="Failed to retrieve buckets" />
          )}
        </>
      )}
      {isSuccessBuckets &&
        (hasNoBuckets ? (
          <EmptyBucketState
            bucketType="files"
            onCreateBucket={onCreateBucket}
            className="flex h-full min-h-0 flex-1"
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-x-2">
              <div className="flex items-center gap-x-2">
                <Input
                  size="tiny"
                  className="flex-grow lg:flex-grow-0 w-52"
                  placeholder={searchPlaceholder}
                  value={filterString}
                  onChange={(e) => setFilterString(e.target.value)}
                  icon={<Search />}
                />
                {isSortEnabled && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" icon={<ArrowDownNarrowWide />}>
                        Sorted by{' '}
                        {sortBucket === STORAGE_BUCKET_SORT.ALPHABETICAL ? 'name' : 'created at'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuRadioGroup
                        value={sortBucket}
                        onValueChange={(value) => onSortBucketChange(value as STORAGE_BUCKET_SORT)}
                      >
                        <DropdownMenuRadioItem value={STORAGE_BUCKET_SORT.ALPHABETICAL}>
                          Sort by name
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value={STORAGE_BUCKET_SORT.CREATED_AT}>
                          Sort by created at
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <CreateBucketButton onClick={onCreateBucket} />
            </div>

            <Card className={tableClassName ?? 'min-h-0 flex-1 overflow-hidden'}>
              <BucketsTable
                buckets={fileBuckets}
                projectRef={projectRef ?? '_'}
                filterString={filterString}
                formattedGlobalUploadLimit={formattedGlobalUploadLimit}
                pagination={{
                  hasMore: hasNextPage,
                  isLoadingMore: isFetchingBuckets,
                  onLoadMore: handleLoadMoreBuckets,
                }}
                onSelectBucket={onSelectBucket}
                publicBucketsOnly={publicBucketsOnly}
              />
            </Card>
          </>
        ))}
    </div>
  )
}
