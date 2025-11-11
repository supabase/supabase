import { ChevronRight, ExternalLink, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { Bucket as BucketIcon } from 'icons'
import { Button, Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateAnalyticsBucketModal } from './CreateAnalyticsBucketModal'

export const AnalyticsBuckets = () => {
  const { ref } = useParams()
  const router = useRouter()

  const [filterString, setFilterString] = useState('')

  const { data: buckets = [], isLoading: isLoadingBuckets } = useAnalyticsBucketsQuery({
    projectRef: ref,
  })

  const analyticsBuckets = buckets.filter((bucket) =>
    filterString.length === 0 ? true : bucket.id.toLowerCase().includes(filterString.toLowerCase())
  )

  const handleBucketNavigation = (
    bucketId: string,
    event: React.MouseEvent | React.KeyboardEvent
  ) => {
    const url = `/project/${ref}/storage/analytics/buckets/${encodeURIComponent(bucketId)}`
    if (event.metaKey || event.ctrlKey) {
      window.open(url, '_blank')
    } else {
      router.push(url)
    }
  }

  return (
    <ScaffoldSection isFullWidth>
      <Admonition
        type="note"
        layout="horizontal"
        className="-mt-4 mb-8 [&>div]:!translate-y-0 [&>svg]:!translate-y-1"
        title="Private alpha"
        actions={
          <Button asChild type="default" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/orgs/supabase/discussions/40116"
            >
              Share feedback
            </a>
          </Button>
        }
      >
        <p className="!leading-normal !mb-0 text-balance">
          Analytics buckets are now in private alpha. Expect rapid changes, limited features, and
          possible breaking updates. Please share feedback as we refine the experience and expand
          access.
        </p>
      </Admonition>

      {!isLoadingBuckets &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'ANALYTICS').length ===
        0 ? (
        <EmptyBucketState bucketType="analytics" />
      ) : (
        <div className="flex flex-col gap-y-4">
          <ScaffoldHeader className="py-0">
            <ScaffoldSectionTitle>Buckets</ScaffoldSectionTitle>
          </ScaffoldHeader>
          <div className="flex flex-grow justify-between gap-x-2 items-center">
            <Input
              size="tiny"
              className="flex-grow lg:flex-grow-0 w-52"
              placeholder="Search for a bucket"
              value={filterString}
              onChange={(e) => setFilterString(e.target.value)}
              icon={<Search size={12} />}
            />
            <CreateAnalyticsBucketModal buttonType="primary" buttonClassName="w-fit" />
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
                    <TableRow key={bucket.id} className="relative cursor-pointer h-16">
                      <TableCell className="w-2 pr-1">
                        <BucketIcon size={16} className="text-foreground-muted" />
                      </TableCell>
                      <TableCell>
                        <p className="whitespace-nowrap max-w-[512px] truncate">{bucket.id}</p>
                        <button
                          className={cn('absolute inset-0', 'inset-focus')}
                          onClick={(event) => handleBucketNavigation(bucket.id, event)}
                        >
                          <span className="sr-only">Go to table details</span>
                        </button>
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
    </ScaffoldSection>
  )
}
