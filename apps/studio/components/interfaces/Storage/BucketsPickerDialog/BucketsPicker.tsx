import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
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
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateBucketModal } from '../CreateBucketModal'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateBucketButton } from '../NewBucketButton'
import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { BucketsTable } from './BucketsTable'
import type { AllowedBucketType } from './types'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { usePaginatedBucketsQuery, type Bucket } from '@/data/storage/buckets-query'
import { IS_PLATFORM } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'

export const BucketsPicker = ({
  onSelectBucket,
  allowedBucketType = 'all',
}: {
  onSelectBucket: (bucket: Bucket) => void
  allowedBucketType?: AllowedBucketType
}) => {
  const { ref: projectRef } = useParams()
  const [createBucketShown, showCreateBucket] = useState(false)
  const { sortBucket, setSortBucket } = useStoragePreference(projectRef!)

  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 250)
  const normalizedSearch = debouncedFilterString.trim()

  const sortColumn = sortBucket === STORAGE_BUCKET_SORT.ALPHABETICAL ? 'name' : 'created_at'
  const sortOrder = sortBucket === STORAGE_BUCKET_SORT.ALPHABETICAL ? 'asc' : 'desc'

  const { data } = useProjectStorageConfigQuery({ projectRef }, { enabled: IS_PLATFORM })
  const {
    data: bucketsData,
    error: bucketsError,
    isError: isErrorBuckets,
    isPending: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
    isFetching: isFetchingBuckets,
    fetchNextPage,
    hasNextPage,
  } = usePaginatedBucketsQuery({
    projectRef,
    search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
    sortColumn,
    sortOrder,
  })
  const buckets = useMemo(() => bucketsData?.pages.flatMap((page) => page) ?? [], [bucketsData])
  const fileBuckets = buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')
  const hasNoBuckets = fileBuckets.length === 0 && normalizedSearch.length === 0

  const formattedGlobalUploadLimit = formatBytes(data?.fileSizeLimit ?? 0)

  const hasNoApiKeys =
    isErrorBuckets && bucketsError.message.includes('Project has no active API keys')

  const handleLoadMoreBuckets = useCallback(() => {
    if (hasNextPage && !isFetchingBuckets) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingBuckets, fetchNextPage])

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {isLoadingBuckets && <GenericSkeletonLoader />}
      {isErrorBuckets && (
        <>
          {hasNoApiKeys ? (
            <Admonition type="warning" title="Project has no active API keys enabled">
              <p className="leading-normal! text-sm">
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
      {isSuccessBuckets && (
        <>
          {hasNoBuckets ? (
            <EmptyBucketState
              bucketType="files"
              onCreateBucket={() => showCreateBucket(true)}
              className="h-full justify-center"
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <Input
                    size="tiny"
                    className="grow lg:grow-0 w-52"
                    placeholder="Search for a bucket"
                    value={filterString}
                    onChange={(e) => setFilterString(e.target.value)}
                    icon={<Search />}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" icon={<ArrowDownNarrowWide />}>
                        Sorted by {sortBucket === 'alphabetical' ? 'name' : 'created at'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-40">
                      <DropdownMenuRadioGroup
                        value={sortBucket}
                        onValueChange={(value) => setSortBucket(value as STORAGE_BUCKET_SORT)}
                      >
                        <DropdownMenuRadioItem value="alphabetical">
                          Sort by name
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="created_at">
                          Sort by created at
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CreateBucketButton onClick={() => showCreateBucket(true)} />
              </div>

              <Card className="min-h-0 flex-1 overflow-hidden">
                <BucketsTable
                  buckets={fileBuckets}
                  projectRef={projectRef ?? '_'}
                  filterString={filterString}
                  formattedGlobalUploadLimit={formattedGlobalUploadLimit}
                  onSelectBucket={onSelectBucket}
                  allowedBucketType={allowedBucketType}
                  pagination={{
                    hasMore: hasNextPage,
                    isLoadingMore: isFetchingBuckets,
                    onLoadMore: handleLoadMoreBuckets,
                  }}
                />
              </Card>
            </>
          )}
        </>
      )}
      <CreateBucketModal open={createBucketShown} onOpenChange={showCreateBucket} />
    </div>
  )
}
