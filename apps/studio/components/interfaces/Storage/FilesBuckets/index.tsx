import { useDebounce } from '@uidotdev/usehooks'
import { useParams } from 'common'
import { ArrowDownNarrowWide, RefreshCw, Search } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useCallback, useMemo, useRef, useState } from 'react'
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
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateBucketModal } from '../CreateBucketModal'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateBucketButton } from '../NewBucketButton'
import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { useStoragePreference } from '../StorageExplorer/useStoragePreference'
import { BucketsTable } from './BucketsTable'
import { useFilesBucketsShortcuts } from './useFilesBucketsShortcuts'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useProjectStorageConfigQuery } from '@/data/config/project-storage-config-query'
import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'
import { IS_PLATFORM } from '@/lib/constants'
import { formatBytes } from '@/lib/helpers'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useStorageExplorerStateSnapshot } from '@/state/storage-explorer'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const snap = useStorageExplorerStateSnapshot()
  const { sortBucket, setSortBucket } = useStoragePreference(snap.projectRef)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 250)
  const normalizedSearch = debouncedFilterString.trim()

  const sortColumn = sortBucket === STORAGE_BUCKET_SORT.ALPHABETICAL ? 'name' : 'created_at'
  const sortOrder = sortBucket === STORAGE_BUCKET_SORT.ALPHABETICAL ? 'asc' : 'desc'

  const [visible, setVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const {
    data: bucketsData,
    error: bucketsError,
    isError: isErrorBuckets,
    isPending: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
    isFetching: isFetchingBuckets,
    fetchNextPage,
    hasNextPage,
    refetch: refetchBuckets,
  } = usePaginatedBucketsQuery({
    projectRef: ref,
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

  const handleRefresh = useCallback(() => {
    refetchBuckets()
  }, [refetchBuckets])

  useFilesBucketsShortcuts({
    searchInputRef,
    setFilterString,
    sortBucket,
    setSortBucket,
    setCreateVisible: setVisible,
    onRefresh: handleRefresh,
  })

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="h-full gap-y-4">
            {isLoadingBuckets && <GenericSkeletonLoader />}
            {isErrorBuckets && (
              <>
                {hasNoApiKeys ? (
                  <Admonition type="warning" title="Project has no active API keys enabled">
                    <p className="leading-normal! text-sm">
                      The Dashboard relies on having active API keys on the project to function. If
                      you'd like to use Storage through the Dashboard, create a set of API keys{' '}
                      <InlineLink href={`/project/${ref}/settings/api-keys/new`}>here</InlineLink>.
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
                  <EmptyBucketState bucketType="files" onCreateBucket={() => setVisible(true)} />
                ) : (
                  <>
                    <div className="flex grow justify-between gap-x-2 items-center mb-4">
                      <div className="flex items-center gap-x-2">
                        <ShortcutTooltip
                          shortcutId={SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH}
                          label="Search buckets"
                          side="bottom"
                        >
                          <Input
                            ref={searchInputRef}
                            size="tiny"
                            className="grow lg:grow-0 w-52"
                            placeholder="Search for a bucket"
                            value={filterString}
                            onChange={(e) => setFilterString(e.target.value)}
                            icon={<Search />}
                          />
                        </ShortcutTooltip>
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
                        <ShortcutTooltip
                          shortcutId={SHORTCUT_IDS.STORAGE_BUCKETS_REFRESH}
                          side="bottom"
                        >
                          <Button
                            type="default"
                            icon={<RefreshCw />}
                            loading={isFetchingBuckets}
                            onClick={handleRefresh}
                          >
                            Refresh
                          </Button>
                        </ShortcutTooltip>
                      </div>
                      <ShortcutTooltip
                        shortcutId={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
                        label="Create new bucket"
                        side="bottom"
                      >
                        <CreateBucketButton onClick={() => setVisible(true)} />
                      </ShortcutTooltip>
                    </div>

                    <Card>
                      <BucketsTable
                        buckets={fileBuckets}
                        projectRef={ref ?? '_'}
                        filterString={filterString}
                        formattedGlobalUploadLimit={formattedGlobalUploadLimit}
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
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <CreateBucketModal open={visible} onOpenChange={setVisible} />
    </>
  )
}
