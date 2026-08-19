import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useStorageRetentionUsageQuery } from '@/data/storage/protection/storage-retention-usage-query'
import { formatBytes } from '@/lib/helpers'

import { COLOR_MAP } from '../Usage.constants'

const SEGMENTS = [
  { key: 'current' as const, label: 'Current objects', color: 'white' as const },
  { key: 'noncurrent' as const, label: 'Noncurrent objects', color: 'yellow' as const },
]

/**
 * Breaks Storage Size down into what's driving it — current objects vs the
 * noncurrent data (noncurrent versions and the delete-marker placeholders
 * behind archived files) retained by object versioning — and attributes the
 * noncurrent portion to the buckets responsible for it.
 *
 * Rendered inside the Storage Size usage section (via `additionalInfo`) so
 * the noncurrent cost sits with the metric it inflates.
 */
export const StorageRetentionBreakdown = () => {
  const { data, isPending, isSuccess } = useStorageRetentionUsageQuery()

  if (isPending) {
    return (
      <div className="space-y-2">
        <ShimmeringLoader />
        <ShimmeringLoader className="w-3/4" />
      </div>
    )
  }
  if (!isSuccess) return null

  const { totals, byBucket } = data
  const versionedBuckets = byBucket.filter((bucket) => bucket.noncurrent > 0)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-2">What&apos;s driving this</p>
        {SEGMENTS.map((segment) => (
          <div key={segment.key} className="flex items-center justify-between border-b py-1">
            <div className="flex items-center gap-x-2">
              <div className={cn('w-3 h-3 rounded-xs', COLOR_MAP[segment.color].marker)} />
              <p className="text-xs text-foreground-light">{segment.label}</p>
            </div>
            <p className="text-xs">{formatBytes(totals[segment.key])}</p>
          </div>
        ))}
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-foreground-light">Total</p>
          <p className="text-xs">{formatBytes(totals.current + totals.noncurrent)}</p>
        </div>
      </div>

      {totals.noncurrent > 0 && (
        <Admonition
          type="warning"
          title={`${formatBytes(totals.noncurrent)} is retained recovery data`}
        >
          <p className="text-xs">
            Noncurrent objects keep data billable after a delete or overwrite. Data is freed when a
            lifecycle policy expires it, when the retention limit is reached, or when you delete
            the version.
          </p>
        </Admonition>
      )}

      {versionedBuckets.length > 0 && (
        <div>
          <p className="text-sm mb-2">Noncurrent data by bucket</p>
          {versionedBuckets.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center justify-between border-b py-1">
              <p className="text-xs text-foreground-light font-mono">{bucket.bucket}</p>
              <p className="text-xs w-16 text-right">{formatBytes(bucket.noncurrent)}</p>
            </div>
          ))}
          <p className="text-xs text-foreground-lighter pt-2">
            Adjust retention per bucket under Storage → Files → bucket settings → Object versioning.
          </p>
        </div>
      )}
    </div>
  )
}
