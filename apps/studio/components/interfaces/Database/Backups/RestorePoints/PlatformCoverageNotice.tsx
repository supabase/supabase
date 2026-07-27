import { useParams } from 'common'
import { Admonition } from 'ui-patterns/admonition'

import { InlineLink } from '@/components/ui/InlineLink'
import { usePlatformProtectionSummaryQuery } from '@/data/restore-points/restore-points-query'

/**
 * Explains what a scheduled backup does and does not cover across the platform,
 * and links to the gap. A backup restores Postgres (and Auth + Storage metadata
 * with it), but object bytes only come back if the bucket has snapshots enabled.
 */
export const PlatformCoverageNotice = () => {
  const { ref: projectRef } = useParams()
  const { data, isSuccess } = usePlatformProtectionSummaryQuery({ projectRef })

  if (!isSuccess) return null

  const { bucketsProtected, bucketsTotal } = data
  const unprotected = bucketsTotal - bucketsProtected
  const hasGap = unprotected > 0

  if (!hasGap) {
    return (
      <Admonition
        type="default"
        title="Backups cover your whole project"
        description={`Database, Auth, and all ${bucketsTotal} file buckets restore to the same point in time.`}
      />
    )
  }

  return (
    <Admonition type="warning" title={`${unprotected} of ${bucketsTotal} buckets aren't covered`}>
      <p className="text-sm !leading-normal">
        A database backup restores Postgres — including Auth users and Storage metadata, which live
        in Postgres. It does not restore object bytes. Buckets without snapshots enabled will keep
        their current files, so restored rows may reference objects that no longer exist.
      </p>
      <p className="text-sm !leading-normal mt-2">
        Enable snapshots per bucket under{' '}
        <InlineLink href={`/project/${projectRef}/storage/files`}>Storage → Files</InlineLink> to
        capture a snapshot before every scheduled backup.
      </p>
    </Admonition>
  )
}
