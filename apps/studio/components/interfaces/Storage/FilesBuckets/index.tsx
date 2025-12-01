import { ArrowDownNarrowWide, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useBucketsQuery } from 'data/storage/buckets-query'
import { IS_PLATFORM } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
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
import { CreateBucketModal } from '../CreateBucketModal'
import { EmptyBucketState } from '../EmptyBucketState'
import { STORAGE_BUCKET_SORT } from '../Storage.constants'
import { BucketsTable } from './BucketsTable'

export const FilesBuckets = () => {
  const { ref } = useParams()
  const snap = useStorageExplorerStateSnapshot()
  const [filterString, setFilterString] = useState('')

  const { data } = useProjectStorageConfigQuery({ projectRef: ref }, { enabled: IS_PLATFORM })
  const {
    data: buckets = [],
    error: bucketsError,
    isError: isErrorBuckets,
    isLoading: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
  } = useBucketsQuery({ projectRef: ref })

  const formattedGlobalUploadLimit = formatBytes(data?.fileSizeLimit ?? 0)

  const filesBuckets = buckets
    .filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')
    .filter((bucket) =>
      filterString.length === 0
        ? true
        : bucket.id.toLowerCase().includes(filterString.toLowerCase())
    )
  const hasNoBuckets =
    buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD').length === 0
  const hasNoApiKeys =
    isErrorBuckets && bucketsError.message.includes('Project has no active API keys')

  const sortedFilesBuckets = useMemo(
    () =>
      snap.sortBucket === 'alphabetical'
        ? filesBuckets.sort((a, b) =>
            a.id.toLowerCase().trim().localeCompare(b.id.toLowerCase().trim())
          )
        : filesBuckets.sort((a, b) => (new Date(b.created_at) > new Date(a.created_at) ? 1 : -1)),
    [filesBuckets, snap.sortBucket]
  )

  return (
    <PageContainer>
      <PageSection>
        <PageSectionContent className="h-full gap-y-4">
          {isLoadingBuckets && <GenericSkeletonLoader />}
          {isErrorBuckets && (
            <>
              {hasNoApiKeys ? (
                <Admonition type="warning" title="Project has no active API keys enabled">
                  <p className="!leading-normal text-sm">
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
                <EmptyBucketState bucketType="files" />
              ) : (
                <>
                  <div className="flex flex-grow justify-between gap-x-2 items-center mb-4">
                    <div className="flex items-center gap-x-2">
                      <Input
                        size="tiny"
                        className="flex-grow lg:flex-grow-0 w-52"
                        placeholder="Search for a bucket"
                        value={filterString}
                        onChange={(e) => setFilterString(e.target.value)}
                        icon={<Search />}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="default" icon={<ArrowDownNarrowWide />}>
                            Sorted by {snap.sortBucket === 'alphabetical' ? 'name' : 'created at'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuRadioGroup
                            value={snap.sortBucket}
                            onValueChange={(value) =>
                              snap.setSortBucket(value as STORAGE_BUCKET_SORT)
                            }
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
                    <CreateBucketModal buttonType="primary" buttonClassName="w-fit" />
                  </div>

                  <Card>
                    <BucketsTable
                      buckets={sortedFilesBuckets}
                      projectRef={ref ?? '_'}
                      filterString={filterString}
                      formattedGlobalUploadLimit={formattedGlobalUploadLimit}
                    />
                  </Card>
                </>
              )}
            </>
          )}
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
