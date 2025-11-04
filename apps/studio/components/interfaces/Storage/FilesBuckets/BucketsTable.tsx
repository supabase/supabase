import { VirtualizedTable, VirtualizedTableBody } from 'components/ui/VirtualizedTable'
import { Bucket } from 'data/storage/buckets-query'
import { Table, TableBody } from 'ui'
import { BucketTableEmptyState, BucketTableHeader, BucketTableRow } from './BucketTable'

type BucketsTableProps = {
  buckets: Bucket[]
  projectRef: string
  filterString: string
  formattedGlobalUploadLimit: string
  setSelectedBucket: (bucket: Bucket) => void
  setModal: (modal: 'edit' | 'empty' | 'delete' | null) => void
  getPolicyCount: (bucketName: string) => number
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
  setSelectedBucket,
  setModal,
  getPolicyCount,
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0

  return (
    <Table
      containerProps={{ containerClassName: 'h-full overflow-auto', className: 'overflow-visible' }}
    >
      <BucketTableHeader mode="standard" />
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
              getPolicyCount={getPolicyCount}
              setSelectedBucket={setSelectedBucket}
              setModal={setModal}
            />
          ))
        )}
      </TableBody>
    </Table>
  )
}

const BucketsTableVirtualized = ({
  buckets,
  projectRef,
  filterString,
  formattedGlobalUploadLimit,
  setSelectedBucket,
  setModal,
  getPolicyCount,
}: BucketsTableProps) => {
  const showSearchEmptyState = buckets.length === 0 && filterString.length > 0

  return (
    <VirtualizedTable data={buckets} estimateSize={() => 59} getItemKey={(bucket) => bucket.id}>
      <BucketTableHeader mode="virtualized" />
      <VirtualizedTableBody<Bucket>
        paddingColSpan={5}
        emptyContent={
          showSearchEmptyState ? (
            <BucketTableEmptyState mode="virtualized" filterString={filterString} />
          ) : undefined
        }
      >
        {(bucket) => (
          <BucketTableRow
            mode="virtualized"
            key={bucket.id}
            bucket={bucket}
            projectRef={projectRef}
            formattedGlobalUploadLimit={formattedGlobalUploadLimit}
            getPolicyCount={getPolicyCount}
            setSelectedBucket={setSelectedBucket}
            setModal={setModal}
          />
        )}
      </VirtualizedTableBody>
    </VirtualizedTable>
  )
}
