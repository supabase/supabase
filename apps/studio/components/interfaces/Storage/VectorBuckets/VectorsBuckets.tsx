import { useParams } from 'common'
import { useVectorBucketsQuery } from 'data/storage/vector-buckets-query'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { TimestampInfo } from 'ui-patterns'
import { EmptyBucketState } from '../EmptyBucketState'
import { CreateVectorBucketDialog } from './CreateVectorBucketDialog'

export const VectorsBuckets = () => {
  const { ref: projectRef } = useParams()
  const { data } = useVectorBucketsQuery({ projectRef })

  const bucketsList = data?.vectorBuckets ?? []

  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-end mb-4">
        <CreateVectorBucketDialog />
      </div>

      {bucketsList.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bucketsList.map((bucket, idx: number) => {
                const id = `bucket-${idx}`
                const name = bucket.vectorBucketName
                const created = bucket.creationTime

                return (
                  <TableRow key={id}>
                    <TableCell>{name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{id}</TableCell>
                    <TableCell>
                      {created ? (
                        <TimestampInfo utcTimestamp={created} className="text-sm text-gray-600" />
                      ) : (
                        <span className="text-sm text-gray-600">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyBucketState bucketType="vectors" />
      )}
    </div>
  )
}
