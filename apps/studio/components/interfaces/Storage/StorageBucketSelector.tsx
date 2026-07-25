import { useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { usePaginatedBucketsQuery } from '@/data/storage/buckets-query'

interface StorageBucketSelectorProps {
  projectRef?: string
  value?: string
  onChange: (bucketId: string) => void
}

/**
 * Compact bucket picker shared by the Snapshots and Trash pages, both of which
 * are scoped to a single bucket at a time.
 */
export const StorageBucketSelector = ({
  projectRef,
  value,
  onChange,
}: StorageBucketSelectorProps) => {
  const { data } = usePaginatedBucketsQuery({ projectRef })

  const bucketNames = useMemo(() => {
    const buckets = data?.pages.flatMap((page) => page) ?? []
    return buckets
      .filter((bucket) => !('type' in bucket) || bucket.type === 'STANDARD')
      .map((bucket) => bucket.name)
  }, [data])

  if (bucketNames.length === 0) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44" aria-label="Select a bucket">
        <SelectValue placeholder="Select a bucket" />
      </SelectTrigger>
      <SelectContent>
        {bucketNames.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
