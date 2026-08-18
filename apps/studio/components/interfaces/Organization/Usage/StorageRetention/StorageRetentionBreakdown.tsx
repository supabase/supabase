import { useQuery } from '@tanstack/react-query'
import { cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { COLOR_MAP } from '../Usage.colors'
import { STORAGE_SIZE_SEGMENTS } from './StorageRetention.constants'
import { storageRetentionUsageQueryOptions } from '@/data/storage/versioning/storage-retention-usage-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { formatBytes } from '@/lib/helpers'

/**
 * What is driving Storage Size — current objects versus the noncurrent data
 * versioning retains — attributed to the buckets responsible. Rendered via
 * `additionalInfo` so the noncurrent cost sits with the metric it inflates.
 */
export const StorageRetentionBreakdown = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const { data, isPending, isSuccess } = useQuery(
    storageRetentionUsageQueryOptions({ orgSlug: organization?.slug })
  )

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
  const bucketsWithNoncurrentData = byBucket.filter((bucket) => bucket.noncurrent > 0)

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm">What’s driving this</p>
        {STORAGE_SIZE_SEGMENTS.map((segment) => (
          <div
            key={segment.attributeKey}
            className="flex items-center justify-between border-b py-1"
          >
            <div className="flex items-center gap-x-2">
              <div className={cn('h-3 w-3 rounded-xs', COLOR_MAP[segment.color].marker)} />
              <p className="text-xs text-foreground-light">{segment.name}</p>
            </div>
            <p className="text-xs">{formatBytes(totals[segment.totalsKey])}</p>
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
            Noncurrent objects stay billable after an overwrite or delete. They are freed when a
            lifecycle policy expires them, when the retention limit is reached, or when you delete
            the version yourself.
          </p>
        </Admonition>
      )}

      {bucketsWithNoncurrentData.length > 0 && (
        <div>
          <p className="mb-2 text-sm">Noncurrent data by bucket</p>
          {bucketsWithNoncurrentData.map((bucket) => (
            <div key={bucket.bucket} className="flex items-center justify-between border-b py-1">
              <p className="font-mono text-xs text-foreground-light">{bucket.bucket}</p>
              <p className="w-16 text-right text-xs">{formatBytes(bucket.noncurrent)}</p>
            </div>
          ))}
          <p className="pt-2 text-xs text-foreground-lighter">
            Retention is set per bucket, in the bucket’s settings.
          </p>
        </div>
      )}
    </div>
  )
}
