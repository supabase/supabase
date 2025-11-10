import { ExternalLink, MoreVertical, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { ScaffoldHeader, ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
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
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'
import { DeleteVectorBucketModal } from './DeleteVectorBucketModal'

/**
 * [Joshen] Low-priority refactor: We should use a virtualized table here as per how we do it
 * for the files buckets for consistency. Not pressing, just an optimization area.
 */

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()

  const [filterString, setFilterString] = useState('')
  const [bucketForDeletion, setBucketForDeletion] = useState<{
    vectorBucketName: string
    creationTime: string
  } | null>(null)

  const { data, isLoading: isLoadingBuckets } = useVectorBucketsQuery({ projectRef })
  const bucketsList = data?.vectorBuckets ?? []

  const filteredBuckets =
    filterString.length === 0
      ? bucketsList
      : bucketsList.filter((bucket) =>
          bucket.vectorBucketName.toLowerCase().includes(filterString.toLowerCase())
        )

  return (
    <ScaffoldSection isFullWidth>
      <Admonition
        type="warning"
        layout="horizontal"
        className="mb-12 [&>div]:!translate-y-0 [&>svg]:!translate-y-1"
        title="Vector buckets are in alpha"
        actions={
          <Button asChild type="default" icon={<ExternalLink />}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              // [Joshen] To update with Vector specific GH discussion
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

      {!isLoadingBuckets && bucketsList.length === 0 ? (
        <EmptyBucketState bucketType="vectors" />
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
            <CreateVectorBucketDialog />
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
                  {filteredBuckets.length === 0 && filterString.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <p className="text-sm text-foreground">No results found</p>
                        <p className="text-sm text-foreground-lighter">
                          Your search for "{filterString}" did not return any results
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredBuckets.map((bucket, idx: number) => {
                    const id = `bucket-${idx}`
                    const name = bucket.vectorBucketName
                    // the creation time is in seconds, convert it to milliseconds
                    const created = +bucket.creationTime * 1000

                    return (
                      <TableRow key={id}>
                        <TableCell>
                          <Link
                            href={`/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(name)}`}
                            title={name}
                            className="text-link-table-cell"
                          >
                            {name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <p className="text-foreground-light">
                            <TimestampInfo
                              utcTimestamp={created}
                              className="text-sm text-foreground-light"
                            />
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button asChild type="default">
                              <Link
                                href={`/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(name)}`}
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
                                  onClick={() => {
                                    setBucketForDeletion(bucket)
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
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      <DeleteVectorBucketModal
        visible={!!bucketForDeletion}
        bucketName={bucketForDeletion?.vectorBucketName!}
        onCancel={() => setBucketForDeletion(null)}
        onSuccess={() => setBucketForDeletion(null)}
      />
    </ScaffoldSection>
  )
}
