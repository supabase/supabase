import type { CSSProperties } from 'react'
import { memo, useCallback, useMemo } from 'react'

import { InfiniteListDefault } from 'components/ui/InfiniteList'
import type { Bucket } from 'data/storage/buckets-query'
import { cn } from 'ui'
import { BucketRow } from './BucketRow'

type VirtualizedBucketRowProps = {
  item: Bucket
  projectRef?: string
  selectedBucketId?: string
  style?: CSSProperties
}

const BUCKET_ROW_HEIGHT = 'h-7'

const VirtualizedBucketRow = memo(
  ({ item, projectRef, selectedBucketId, style }: VirtualizedBucketRowProps) => {
    const isSelected = selectedBucketId === item.id

    return (
      <BucketRow
        bucket={item}
        isSelected={isSelected}
        projectRef={projectRef}
        style={style as CSSProperties}
        className={cn(BUCKET_ROW_HEIGHT)}
      />
    )
  }
)
VirtualizedBucketRow.displayName = 'VirtualizedBucketRow'

const BucketListVirtualized = ({ buckets, selectedBucketId, projectRef = '' }: BucketListProps) => {
  const itemData = useMemo(
    () => ({
      projectRef,
      selectedBucketId,
    }),
    [projectRef, selectedBucketId]
  )

  const getItemKey = useCallback(
    (index: number) => {
      const item = buckets[index]
      return item?.id || `bucket-${index}`
    },
    [buckets]
  )

  return (
    <InfiniteListDefault
      items={buckets}
      itemProps={itemData}
      getItemKey={getItemKey}
      // Keep in tandem with BUCKET_ROW_HEIGHT
      getItemSize={() => 28}
      ItemComponent={VirtualizedBucketRow}
      // There is no loader because all buckets load from backend at once
      LoaderComponent={() => null}
      className="pb-3"
    />
  )
}

type BucketListProps = {
  buckets: Bucket[]
  selectedBucketId?: string
  projectRef?: string
}

export const BucketList = ({ buckets, selectedBucketId, projectRef = '' }: BucketListProps) => {
  const numBuckets = buckets.length

  if (numBuckets <= 50) {
    return buckets.map((bucket) => (
      <BucketRow
        key={bucket.id}
        bucket={bucket}
        isSelected={selectedBucketId === bucket.id}
        projectRef={projectRef}
        className={BUCKET_ROW_HEIGHT}
      />
    ))
  }

  return (
    <BucketListVirtualized
      buckets={buckets}
      selectedBucketId={selectedBucketId}
      projectRef={projectRef}
    />
  )
}
