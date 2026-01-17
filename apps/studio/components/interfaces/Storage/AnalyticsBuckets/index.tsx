import { ChevronRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { AlphaNotice } from 'components/ui/AlphaNotice'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { AnalyticsBucket as AnalyticsBucketIcon } from 'icons'
import { BASE_PATH } from 'lib/constants'
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent, PageSectionTitle } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateBucketButton } from '../NewBucketButton'
import { CreateAnalyticsBucketModal } from './CreateAnalyticsBucketModal'

export const AnalyticsBuckets = () => {
  const { ref } = useParams()
  const router = useRouter()

  const [filterString, setFilterString] = useState('')

  const [visible, setVisible] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const { data: config } = useProjectStorageConfigQuery({ projectRef: ref })
  const maxAnalyticsBuckets = config?.features.icebergCatalog.maxCatalogs ?? 2

  const {
    data: buckets = [],
    error: bucketsError,
    isError: isErrorBuckets,
    isPending: isLoadingBuckets,
    isSuccess: isSuccessBuckets,
  } = useAnalyticsBucketsQuery({
    projectRef: ref,
  })

  const analyticsBuckets = buckets.filter((bucket) =>
    filterString.length === 0
      ? true
      : bucket.name.toLowerCase().includes(filterString.toLowerCase())
  )
  const hasNoBuckets = buckets.length === 0

  const handleBucketNavigation = (
    bucketId: string,
    event: React.MouseEvent | React.KeyboardEvent
  ) => {
    const url = `/project/${ref}/storage/analytics/buckets/${encodeURIComponent(bucketId)}`
    if (event.metaKey || event.ctrlKey) {
      window.open(`${BASE_PATH}${url}`, '_blank')
    } else {
      router.push(url)
    }
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionContent className="flex flex-col gap-y-8">
            <AlphaNotice
              entity="Analytics buckets"
              feedbackUrl="https://github.com/orgs/supabase/discussions/40116"
            />

            {isLoadingBuckets && <GenericSkeletonLoader />}

            {isErrorBuckets && (
              <AlertError error={bucketsError} subject="Failed to retrieve analytics buckets" />
            )}

            {isSuccessBuckets && (
              <>
                {hasNoBuckets ? (
                  <EmptyBucketState
                    bucketType="analytics"
                    onCreateBucket={() => setVisible(true)}
                  />
                ) : (
                  <div className="flex flex-col gap-y-4">
                    <div className="flex flex-row items-center gap-x-2">
                      <PageSectionTitle>Buckets</PageSectionTitle>
                      {analyticsBuckets.length > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="bg-surface-200 rounded-full px-2 py-1 leading-none text-xs text-foreground-lighter tracking-widest">
                              {analyticsBuckets.length}/{maxAnalyticsBuckets}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="w-72 text-center">
                            Each project can only have up to {maxAnalyticsBuckets} buckets while
                            analytics buckets are in alpha{' '}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex flex-grow justify-between gap-x-2 items-center">
                      <Input
                        size="tiny"
                        className="flex-grow lg:flex-grow-0 w-52"
                        placeholder="Search for a bucket"
                        value={filterString}
                        onChange={(e) => setFilterString(e.target.value)}
                        icon={<Search />}
                      />
                      <CreateBucketButton onClick={() => setVisible(true)} />
                    </div>

                    {isLoadingBuckets ? (
                      <GenericSkeletonLoader />
                    ) : (
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {analyticsBuckets.length > 0 && (
                                <TableHead className="w-2 pr-1">
                                  <span className="sr-only">Icon</span>
                                </TableHead>
                              )}
                              <TableHead>Name</TableHead>
                              <TableHead>Created at</TableHead>
                              <TableHead>
                                <span className="sr-only">Actions</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analyticsBuckets.length === 0 && filterString.length > 0 && (
                              <TableRow className="[&>td]:hover:bg-inherit">
                                <TableCell colSpan={3}>
                                  <p className="text-sm text-foreground">No results found</p>
                                  <p className="text-sm text-foreground-light">
                                    Your search for "{filterString}" did not return any results
                                  </p>
                                </TableCell>
                              </TableRow>
                            )}
                            {analyticsBuckets.map((bucket) => (
                              <TableRow
                                key={bucket.name}
                                className="relative cursor-pointer h-16 inset-focus"
                                onClick={(event) => handleBucketNavigation(bucket.name, event)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    handleBucketNavigation(bucket.name, event)
                                  }
                                }}
                                tabIndex={0}
                              >
                                <TableCell className="w-2 pr-1">
                                  <AnalyticsBucketIcon
                                    size={16}
                                    className="text-foreground-muted"
                                  />
                                </TableCell>
                                <TableCell>
                                  <p className="whitespace-nowrap max-w-[512px] truncate">
                                    {bucket.name}
                                  </p>
                                </TableCell>

                                <TableCell>
                                  <p className="text-foreground-light">
                                    <TimestampInfo
                                      utcTimestamp={bucket.created_at}
                                      className="text-sm text-foreground-light"
                                    />
                                  </p>
                                </TableCell>

                                <TableCell>
                                  <div className="flex justify-end items-center h-full">
                                    <ChevronRight size={14} className="text-foreground-muted/60" />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
      <CreateAnalyticsBucketModal open={visible} onOpenChange={setVisible} />
    </>
  )
}
