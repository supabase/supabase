import { useRef } from 'react'
import { Table, TableBody } from 'ui'

import { LoadMoreRow } from './BucketsTable.LoadMoreRow'
import type { BucketsTablePaginationProps } from './BucketsTable.types'
import { BucketTableHeader, BucketTableRow } from './BucketTable'
import { TableRowNoResults } from '@/components/ui/TableRowNoResults'
import { VirtualizedTable, VirtualizedTableBody } from '@/components/ui/VirtualizedTable'
import { Bucket } from '@/data/storage/buckets-query'

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  pagination: BucketsTablePaginationProps
}

// [Joshen] To investigate: There's a lot of duplicate logic + components between
// this FilesBuckets/BucketsTable and BucketsPickerDialog/BucketsTable. Check separately
// if they can be cleaned up and consolidated. The latter should take precedence as it aims to
// reduce footprint on the giant StorageExplorerState.

export const BucketsTable = (props: BucketsTableProps) => {
  // [Joshen] To investigate: Can't we just default to virtualized?
  // Do we need to dynamically decide whether to use a virtualized or unvirtualized one?
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
          <TableRowNoResults
            className="[&>td]:hover:bg-inherit"
            colSpan={5}
            search={filterString}
          />
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
            <TableRowNoResults
              className="[&>td]:hover:bg-inherit"
              colSpan={5}
              search={filterString}
            />
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
