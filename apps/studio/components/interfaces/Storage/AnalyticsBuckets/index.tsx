import { ExternalLink, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { AnalyticsBucket, useAnalyticsBucketsQuery } from 'data/storage/analytics-buckets-query'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateAnalyticsBucketModal } from './CreateAnalyticsBucketModal'
import { DeleteAnalyticsBucketModal } from './DeleteAnalyticsBucketModal'

export const AnalyticsBuckets = () => {
  const { ref } = useParams()

  const [filterString, setFilterString] = useState('')
  const [selectedBucket, setSelectedBucket] = useState<AnalyticsBucket>()
  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)

  const { data: buckets = [], isLoading: isLoadingBuckets } = useAnalyticsBucketsQuery({
    projectRef: ref,
  })

  const analyticsBuckets = buckets.filter((bucket) =>
    filterString.length === 0 ? true : bucket.id.toLowerCase().includes(filterString.toLowerCase())
  )

  return (
    <ScaffoldSection isFullWidth>
      <Admonition
        type="warning"
        layout="horizontal"
        className="mb-12 [&>div]:!translate-y-0 [&>svg]:!translate-y-1"
        title="Analytics buckets are in alpha"
        actions={
          <Button asChild type="default" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/orgs/supabase/discussions/40116"
            >
              Leave feedback
            </a>
          </Button>
        }
      >
        <p className="!leading-normal !mb-0">
          Expect rapid changes, limited features, and possible breaking updates as we expand access.
        </p>
        <p className="!leading-normal !mb-0">Please share feedback as we refine the experience!</p>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Created at</TableHead>
                    <TableHead />
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
                    <TableRow key={bucket.id}>
                      <TableCell>
                        <Link
                          href={`/project/${ref}/storage/analytics/buckets/${encodeURIComponent(bucket.id)}`}
                          title={bucket.id}
                          className="text-link-table-cell"
                        >
                          {bucket.id}
                        </Link>
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
                        <div className="flex justify-end gap-2">
                          <Button asChild type="default">
                            <Link
                              href={`/project/${ref}/storage/analytics/buckets/${encodeURIComponent(bucket.id)}`}
                            >
                              View contents
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="default" className="px-1" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-40">
                              <DropdownMenuItem
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                  setModal('delete')
                                  setSelectedBucket(bucket)
                                }}
                              >
                                <Trash2 size={12} />
                                <p>Delete bucket</p>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {selectedBucket && (
        <DeleteAnalyticsBucketModal
          visible={modal === 'delete'}
          bucketId={selectedBucket.id}
          onClose={() => setModal(null)}
        />
      )}
    </ScaffoldSection>
  )
}
