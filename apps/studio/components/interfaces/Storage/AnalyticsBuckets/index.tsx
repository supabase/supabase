import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import { Bucket as BucketIcon } from 'icons'
import { BASE_PATH } from 'lib/constants'
import { ChevronRight, ExternalLink, Search } from 'lucide-react'
import {
  Badge,
  Button,
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
      window.open(`${BASE_PATH}${url}`, '_blank')
    } else {
      router.push(url)
    }
  }

  return (
    <ScaffoldSection isFullWidth>
      <Admonition showIcon={false} type="tip" className="relative mb-6 overflow-hidden">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt="Supabase Grafana"
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2 py-1">
          <div className="flex flex-col gap-y-0.5">
            <div className="flex flex-col gap-y-2 items-start">
              <Badge variant="success" className="-ml-0.5 uppercase">
                New
              </Badge>
              <p className="text-sm font-medium">Introducing analytics buckets</p>
            </div>
            <p className="text-sm text-foreground-lighter text-balance">
              Analytics buckets are now in private alpha. Expect rapid changes, limited features,
              and possible breaking updates. Please share feedback as we refine the experience and
              expand access.
            </p>
          </div>
          <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />} className="mt-2">
            <Link
              href="https://github.com/orgs/supabase/discussions/40116"
              target="_blank"
              rel="noopener noreferrer"
            >
              Share feedback
            </Link>
          </Button>
        </div>
      </Admonition>

      {!isLoadingBuckets &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'ANALYTICS').length ===
        0 ? (
        <EmptyBucketState bucketType="analytics" />
      ) : (
        <div className="flex flex-col gap-y-4">
          <ScaffoldHeader className="py-0 flex flex-row items-center gap-x-2">
            <ScaffoldSectionTitle>Buckets</ScaffoldSectionTitle>
            {analyticsBuckets.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <span className="bg-surface-200 rounded-full px-2 py-1 leading-none text-xs text-foreground-lighter tracking-widest">
                    {analyticsBuckets.length}
                    /2
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-64 text-center">
                  Each project can only have up to 2 buckets while analytics buckets are in alpha{' '}
                </TooltipContent>
              </Tooltip>
            )}
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
                    <TableRow
                      key={bucket.id}
                      className="relative cursor-pointer h-16 inset-focus"
                      onClick={(event) => handleBucketNavigation(bucket.id, event)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleBucketNavigation(bucket.id, event)
                        }
                      }}
                      tabIndex={0}
                    >
                      <TableCell className="w-2 pr-1">
                        <BucketIcon size={16} className="text-foreground-muted" />
                      </TableCell>
                      <TableCell>
                        <p className="whitespace-nowrap max-w-[512px] truncate">{bucket.id}</p>
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
