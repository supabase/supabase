import dayjs from 'dayjs'
import { Card, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { InlineLink } from '@/components/ui/InlineLink'
import { type StorageRetentionUsage as StorageRetentionUsageData } from '@/data/storage/protection/protection-mocks'
import { useStorageRetentionUsageQuery } from '@/data/storage/protection/storage-retention-usage-query'
import { formatBytes } from '@/lib/helpers'

const SERIES = [
  { key: 'live' as const, label: 'Live objects', color: 'bg-brand' },
  { key: 'versions' as const, label: 'Object versions', color: 'bg-warning' },
  { key: 'snapshots' as const, label: 'Snapshots', color: 'bg-blue-900' },
]

const StackedBars = ({ daily }: { daily: StorageRetentionUsageData['daily'] }) => {
  const max = Math.max(...daily.map((d) => d.live + d.versions + d.snapshots), 1)

  return (
    <div>
      <div className="flex h-44 items-end gap-x-3">
        {daily.map((day) => (
          <div key={day.date} className="flex h-full flex-1 flex-col justify-end">
            {SERIES.map((series) => {
              const value = day[series.key]
              return (
                <div
                  key={series.key}
                  className={cn(series.color, 'w-full')}
                  style={{ height: `${(value / max) * 100}%` }}
                  title={`${series.label}: ${formatBytes(value)}`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-x-3">
        {daily.map((day) => (
          <div key={day.date} className="flex-1 text-center text-xs text-foreground-lighter">
            {dayjs(day.date).format('D MMM')}
          </div>
        ))}
      </div>
    </div>
  )
}

interface StorageRetentionUsageProps {
  projectRef?: string
}

export const StorageRetentionUsage = ({ projectRef }: StorageRetentionUsageProps) => {
  const { data, isPending, isSuccess } = useStorageRetentionUsageQuery({ projectRef })

  if (isPending) {
    return (
      <Card className="p-6">
        <GenericSkeletonLoader />
      </Card>
    )
  }
  if (!isSuccess) return null

  const { totals, daily, byBucket } = data
  const total = totals.live + totals.versions + totals.snapshots
  const retained = totals.versions + totals.snapshots

  return (
    <Card className="divide-y divide-border">
      <div className="grid gap-8 p-6 lg:grid-cols-2">
        <div className="flex flex-col">
          <h3 className="text-base text-foreground">Storage size</h3>
          <p className="mt-1 text-sm text-foreground-light">
            Sum of all objects in your storage buckets, including retained versions and snapshots.
          </p>

          <div className="mt-6 flex flex-col gap-y-3">
            {SERIES.map((series) => (
              <div key={series.key} className="flex items-center justify-between">
                <div className="flex items-center gap-x-2">
                  <span className={cn(series.color, 'h-2.5 w-2.5 rounded-sm')} />
                  <span className="text-sm text-foreground-light">{series.label}</span>
                </div>
                <span className="font-mono text-sm text-foreground tabular-nums">
                  {formatBytes(totals[series.key])}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-foreground">Total</span>
            <span className="font-mono text-sm text-foreground tabular-nums">
              {formatBytes(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="mb-2 text-sm text-foreground-light">Average storage size per day</p>
          <StackedBars daily={daily} />
        </div>
      </div>

      <div className="p-6">
        <Admonition
          type="warning"
          title={`${formatBytes(retained)} is retained recovery data you may have "deleted"`}
        >
          <p className="text-sm">
            Versions and snapshots keep data billable after a delete. It&apos;s freed when its
            lifecycle policy expires it, or when you delete the version or snapshot holding it.
            {projectRef && (
              <>
                {' '}
                Adjust retention per bucket in{' '}
                <InlineLink href={`/project/${projectRef}/storage/files`}>
                  Data protection
                </InlineLink>
                .
              </>
            )}
          </p>
        </Admonition>
      </div>

      <div className="p-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-wide text-foreground-lighter">
          Retained data by bucket
        </p>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-foreground-lighter">
                <th className="px-4 py-2 text-left font-normal">Bucket</th>
                <th className="px-4 py-2 text-right font-normal">Live</th>
                <th className="px-4 py-2 text-right font-normal">Versions</th>
                <th className="px-4 py-2 text-right font-normal">Snapshots</th>
                <th className="px-4 py-2 text-right font-normal">Retained total</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {byBucket.map((row) => {
                const retainedTotal = row.versions + row.snapshots
                return (
                  <tr key={row.bucket} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{row.bucket}</td>
                    <td className="px-4 py-3 text-right text-foreground-light tabular-nums">
                      {formatBytes(row.live)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-warning-600">
                      {row.versions > 0 ? formatBytes(row.versions) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-1100">
                      {row.snapshots > 0 ? formatBytes(row.snapshots) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                      {retainedTotal > 0 ? formatBytes(retainedTotal) : 'none'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.isProtected && projectRef ? (
                        <InlineLink
                          href={`/project/${projectRef}/storage/files/buckets/${row.bucket}?edit=true`}
                        >
                          Manage
                        </InlineLink>
                      ) : (
                        <span className="text-foreground-lighter">Not protected</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )
}
