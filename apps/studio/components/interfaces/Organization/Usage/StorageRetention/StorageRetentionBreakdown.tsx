import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { useStorageRetentionUsageQuery } from '@/data/storage/protection/storage-retention-usage-query'
import { formatBytes } from '@/lib/helpers'

import { COLOR_MAP } from '../Usage.constants'

const SEGMENTS = [
  { key: 'live' as const, label: 'Live objects', color: 'white' as const },
  {
    key: 'noncurrentVersions' as const,
    label: 'Noncurrent versions',
    color: 'yellow' as const,
  },
  { key: 'softDeleted' as const, label: 'Soft-deleted files', color: 'orange' as const },
]

/**
 * Breaks Storage Size down into what's driving it — live objects vs data
 * retained by object versioning (noncurrent versions and soft-deleted files
 * past their live lifetime) — and attributes the retained portion to the
 * buckets responsible for it.
 *
 * Rendered inside the Storage Size usage section (via `additionalInfo`) so
 * the retained cost sits with the metric it inflates.
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
  const retained = totals.noncurrentVersions + totals.softDeleted
  const versionedBuckets = byBucket.filter(
    (bucket) => bucket.noncurrentVersions + bucket.softDeleted > 0
  )

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
          <p className="text-xs">{formatBytes(totals.live + retained)}</p>
        </div>
      </div>

      {retained > 0 && (
        <Admonition type="warning" title={`${formatBytes(retained)} is retained recovery data`}>
          <p className="text-xs">
            Noncurrent object versions and soft-deleted files keep data billable after a delete or
            overwrite. Data is freed when a lifecycle policy expires it, when the retention limit is
            reached, or when you delete the version.
          </p>
        </Admonition>
      )}

      {versionedBuckets.length > 0 && (
        <div>
          <p className="text-sm mb-2">Retained data by bucket</p>
          {versionedBuckets.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center justify-between border-b py-1">
              <p className="text-xs text-foreground-light font-mono">{bucket.bucket}</p>
              <div className="flex items-center gap-x-3">
                <p className="text-xs text-foreground-lighter">
                  {formatBytes(bucket.noncurrentVersions)} versions ·{' '}
                  {formatBytes(bucket.softDeleted)} deleted
                </p>
                <p className="text-xs w-16 text-right">
                  {formatBytes(bucket.noncurrentVersions + bucket.softDeleted)}
                </p>
              </div>
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
