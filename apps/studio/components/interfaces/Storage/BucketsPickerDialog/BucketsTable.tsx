import { useRef } from 'react'
import { Table, TableBody } from 'ui'

import { LoadMoreRow } from './BucketsTable.LoadMoreRow'
import { BucketTableHeader } from './BucketTableHeader'
import { BucketTableEmptyState, BucketTableRow } from './BucketTableRow'
import type { AllowedBucketType, BucketsTablePaginationProps } from './types'
import { VirtualizedTable, VirtualizedTableBody } from '@/components/ui/VirtualizedTable'
import { type Bucket } from '@/data/storage/buckets-query'

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  onSelectBucket: (bucket: Bucket) => void
  allowedBucketType: AllowedBucketType
  pagination: BucketsTablePaginationProps
}

export const BucketsTable = (props: BucketsTableProps) => {
  const isVirtualized = props.buckets.length > 50
  return isVirtualized ? (
    <BucketsTableVirtualized {...props} />
  ) : (
    <BucketsTableUnvirtualized {...props} />
  )
}

const BucketsTableUnvirtualized = ({
  buckets,
  filterString,
  formattedGlobalUploadLimit,
  onSelectBucket,
  allowedBucketType,
  pagination: { hasMore = false, isLoadingMore = false, onLoadMore },
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0

  return (
    <Table
      containerProps={{
        containerClassName: 'h-full overflow-auto',
        className: 'overflow-visible',
      }}
    >
      <BucketTableHeader mode="standard" hasBuckets={buckets.length > 0} />
      <TableBody>
        {showSearchEmptyState ? (
          <BucketTableEmptyState mode="standard" filterString={filterString} />
        ) : (
          buckets.map((bucket) => (
            <BucketTableRow
              mode="standard"
              key={bucket.id}
              bucket={bucket}
              onSelectBucket={onSelectBucket}
              allowedBucketType={allowedBucketType}
              formattedGlobalUploadLimit={formattedGlobalUploadLimit}
            />
          ))
        )}
        <LoadMoreRow
          mode="standard"
          colSpan={6}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
        />
      </TableBody>
    </Table>
  )
}

const BucketsTableVirtualized = ({
  buckets,
  filterString,
  formattedGlobalUploadLimit,
  onSelectBucket,
  allowedBucketType,
  pagination: { hasMore = false, isLoadingMore = false, onLoadMore },
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  return (
    <VirtualizedTable
      data={buckets}
      estimateSize={() => 59}
      getItemKey={(bucket) => bucket.id}
      scrollContainerRef={scrollContainerRef}
    >
      <BucketTableHeader mode="virtualized" hasBuckets={buckets.length > 0} />
      <VirtualizedTableBody<Bucket>
        paddingColSpan={5}
        emptyContent={
          showSearchEmptyState ? (
            <BucketTableEmptyState mode="virtualized" filterString={filterString} />
          ) : undefined
        }
        trailingContent={
          <LoadMoreRow
            mode="virtualized"
            colSpan={6}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        }
      >
        {(bucket) => (
          <BucketTableRow
            mode="virtualized"
            key={bucket.id}
            bucket={bucket}
            onSelectBucket={onSelectBucket}
            allowedBucketType={allowedBucketType}
            formattedGlobalUploadLimit={formattedGlobalUploadLimit}
          />
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}
