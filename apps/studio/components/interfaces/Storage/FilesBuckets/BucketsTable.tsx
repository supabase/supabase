import { useRef } from 'react'

import { VirtualizedTable, VirtualizedTableBody } from 'components/ui/VirtualizedTable'
import { Bucket } from 'data/storage/buckets-query'
import { Table, TableBody } from 'ui'
import { BucketTableEmptyState, BucketTableHeader, BucketTableRow } from './BucketTable'
import { LoadMoreRow } from './BucketsTable.LoadMoreRow'
import type { BucketsTablePaginationProps } from './BucketsTable.types'

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
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
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
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
              projectRef={projectRef}
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
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
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
            projectRef={projectRef}
            formattedGlobalUploadLimit={formattedGlobalUploadLimit}
          />
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}
