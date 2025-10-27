import { MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { Bucket, useBucketsQuery } from 'data/storage/buckets-query'
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
import { TimestampInfo } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { CreateSpecializedBucketModal } from './CreateSpecializedBucketModal'
import { DeleteBucketModal } from './DeleteBucketModal'
import { EmptyBucketState } from './EmptyBucketState'

export const AnalyticsBuckets = () => {
  const router = useRouter()
  const { ref } = useParams()

  const [modal, setModal] = useState<'edit' | 'empty' | 'delete' | null>(null)
  const [selectedBucket, setSelectedBucket] = useState<Bucket>()
  const [filterString, setFilterString] = useState('')

  const { data: buckets = [], isLoading: isLoadingBuckets } = useBucketsQuery({ projectRef: ref })

  const analyticsBuckets = buckets
    .filter((bucket) => !('type' in bucket) || bucket.type === 'ANALYTICS')
    .filter((bucket) =>
      filterString.length === 0
        ? true
        : bucket.name.toLowerCase().includes(filterString.toLowerCase())
    )

  return (
    <>
      {!isLoadingBuckets &&
      buckets.filter((bucket) => !('type' in bucket) || bucket.type === 'ANALYTICS').length ===
        0 ? (
        <EmptyBucketState bucketType="analytics" />
      ) : (
        // Override the default first:pt-12 to match other storage types
        <ScaffoldSection isFullWidth className="gap-y-4 first:pt-8">
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
            <CreateSpecializedBucketModal
              buttonType="primary"
              buttonClassName="w-fit"
              bucketType="analytics"
            />
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
                    <TableRow>
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
                      className="cursor-pointer"
                      onClick={(event) => {
                        const url = `/project/${ref}/storage/analytics/buckets/${bucket.id}`
                        if (event.metaKey) window.open(url, '_blank')
                        else router.push(url)
                      }}
                    >
                      <TableCell>
                        <p className="text-foreground">{bucket.name}</p>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              View contents
                            </Link>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="default"
                                className="px-1"
                                icon={<MoreVertical />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="bottom" align="end" className="w-40">
                              <DropdownMenuItem
                                className="flex items-center space-x-2"
                                onClick={(e) => {
                                  e.stopPropagation()
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
        </ScaffoldSection>
      )}

      {selectedBucket && (
        <DeleteBucketModal
          visible={modal === `delete`}
          bucket={selectedBucket}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
