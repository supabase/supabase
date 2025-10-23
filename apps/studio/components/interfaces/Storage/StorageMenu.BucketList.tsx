import type { CSSProperties } from 'react'
import { memo, useMemo } from 'react'
import type { ListChildComponentProps } from 'react-window'
import { FixedSizeList as List, areEqual } from 'react-window'

import type { Bucket } from 'data/storage/buckets-query'
import { BucketRow } from './BucketRow'

type BucketListProps = {
  buckets: Bucket[]
  selectedBucketId?: string
  projectRef?: string
}

const BUCKET_ROW_HEIGHT = 'h-7'

const VirtualizedBucketRow = memo(
  ({ index, style, data }: ListChildComponentProps<BucketListProps>) => {
    const bucket = data.buckets[index]
    const isSelected = data.selectedBucketId === bucket.id

    return (
      <BucketRow
        bucket={bucket}
        isSelected={isSelected}
        projectRef={data.projectRef}
        style={style as CSSProperties}
        className={BUCKET_ROW_HEIGHT}
      />
    )
  },
  (prev, next) => {
    if (!areEqual(prev, next)) return false

    const prevBucket = prev.data.buckets[prev.index]
    const nextBucket = next.data.buckets[next.index]

    if (prevBucket !== nextBucket) return false

    const wasSelected = prev.data.selectedBucketId === prevBucket.id
    const isSelected = next.data.selectedBucketId === nextBucket.id

    return wasSelected === isSelected
  }
)
VirtualizedBucketRow.displayName = 'VirtualizedBucketRow'

const BucketListVirtualized = ({ buckets, selectedBucketId, projectRef = '' }: BucketListProps) => {
  const itemData = useMemo<BucketListProps>(
    () => ({
      buckets,
      projectRef,
      selectedBucketId,
    }),
    [buckets, projectRef, selectedBucketId]
  )

  return (
    <List
      itemCount={buckets.length}
      itemData={itemData}
      itemKey={(index) => buckets[index].id}
      height={500}
      // itemSize should match the height of BucketRow + any gap/margin
      itemSize={28}
      width="100%"
    >
      {VirtualizedBucketRow}
    </List>
  )
}

export const BucketList = ({ buckets, selectedBucketId, projectRef = '' }: BucketListProps) => {
  const numBuckets = buckets.length

  if (numBuckets <= 50) {
    return (
      <>
        {buckets.map((bucket) => (
          <BucketRow
            key={bucket.id}
            bucket={bucket}
            isSelected={selectedBucketId === bucket.id}
            projectRef={projectRef}
            className={BUCKET_ROW_HEIGHT}
          />
        ))}
      </>
    )
  }

  return (
    <BucketListVirtualized
      buckets={buckets}
      selectedBucketId={selectedBucketId}
      projectRef={projectRef}
    />
  )
}
