import { MoreVertical, Trash2 } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
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
import { TimestampInfo } from 'ui-patterns'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'
import { EmptyVectorBucketsState } from './EmptyVectorBucketState'

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()
  const { data } = useVectorBucketsQuery({ projectRef })

  const bucketsList = data?.vectorBuckets ?? []

  return (
    <div className="flex flex-col">
      {bucketsList.length > 0 && (
        <div className="flex flex-row justify-between mt-16 mb-6">
          <span className="text-lg">Buckets</span>
          <CreateVectorBucketDialog />
        </div>
      )}

      {bucketsList.length > 0 ? (
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
              {bucketsList.map((bucket, idx: number) => {
                const id = `bucket-${idx}`
                const name = bucket.vectorBucketName
                // the creation time is in seconds, convert it to milliseconds
                const created = +bucket.creationTime * 1000

                return (
                  <TableRow key={id}>
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      {created ? (
                        <TimestampInfo
                          utcTimestamp={created}
                          displayAs="local"
                          className="text-sm"
                          labelFormat="DD MMM YYYY - HH:mm:ss (Z)"
                        />
                      ) : (
                        <span className="text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild type="default">
                          <Link
                            href={`/project/${projectRef}/storage/vectors/buckets/${encodeURIComponent(name)}`}
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
      ) : (
        <EmptyVectorBucketsState />
      )}
    </div>
  )
}
