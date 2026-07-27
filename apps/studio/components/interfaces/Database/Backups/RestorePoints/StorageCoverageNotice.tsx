import { useParams } from 'common'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { useIsStorageProtectionEnabled } from '@/components/interfaces/Storage/StorageProtection.constants'
import { useRestorePointPolicyQuery } from '@/data/restore-points/restore-points-query'

interface StorageCoverageNoticeProps {
  /**
   * Scheduled backups restore to a discrete point; PITR restores to any second,
   * which storage restore points can't match — that caveat only applies to PITR.
   */
  mode: 'scheduled' | 'pitr'
}

/**
 * The single answer to "what happens to my files when I restore?" on the backups
 * pages.
 *
 * Replaces the old always-on "Storage objects are not included" alert, which is
 * wrong once a bucket is included in restore points. States the project's actual
 * coverage and links to the one place it's configured.
 */
export const StorageCoverageNotice = ({ mode }: StorageCoverageNoticeProps) => {
  const { ref: projectRef } = useParams()
  const isProtectionEnabled = useIsStorageProtectionEnabled()

  const { data: policy, isSuccess } = useRestorePointPolicyQuery({ projectRef })

  // Without the feature, the original message is still the correct one.
  if (!isProtectionEnabled) {
    return (
      <Admonition
        type="default"
        layout="horizontal"
        title="Storage objects are not included"
        description="Database backups do not include objects stored via the Storage API, as the database only
        includes metadata about these objects. Restoring an old backup does not restore objects that
        have been deleted since then."
      />
    )
  }

  if (!isSuccess) return null

  const included = policy.buckets.filter((bucket) => bucket.isIncluded)
  const excluded = policy.buckets.filter((bucket) => !bucket.isIncluded)
  const isCaptureOff = !policy.isEnabled || included.length === 0
  const hasGap = excluded.length > 0
  const willDriftOnNewBuckets = policy.isEnabled && !policy.applyToNewBuckets

  const configureAction = (
    <Button asChild variant="default">
      <Link href={`/project/${projectRef}/storage/files/settings`}>Configure restore points</Link>
    </Button>
  )

  const pitrCaveat =
    mode === 'pitr'
      ? ' Storage restores to the nearest restore point before your chosen time, not the exact second.'
      : ''

  if (isCaptureOff) {
    return (
      <Admonition
        type="default"
        layout="horizontal"
        title="Storage objects are not included"
        description={`Restoring will bring back your database — including Auth users and Storage metadata, which live in Postgres — but not the objects themselves. Rows may end up referencing files that no longer exist.${pitrCaveat}`}
      >
        <div className="mt-3">{configureAction}</div>
      </Admonition>
    )
  }

  if (hasGap) {
    return (
      <Admonition
        type="warning"
        layout="horizontal"
        title={`${excluded.length} of ${policy.buckets.length} buckets are not included in restore points`}
        description={`${included.map((b) => b.name).join(', ')} restore alongside the database. ${excluded.map((b) => b.name).join(', ')} will keep ${excluded.length === 1 ? 'its' : 'their'} current files, so restored rows may reference objects that no longer exist.${pitrCaveat}`}
      >
        <div className="mt-3">{configureAction}</div>
      </Admonition>
    )
  }

  return (
    <Admonition
      type="default"
      layout="horizontal"
      title="Database and Storage restore together"
      description={`All ${policy.buckets.length} buckets are captured before each backup and kept for ${policy.retentionDays} days, so your database and files restore to the same point in time.${pitrCaveat}${
        willDriftOnNewBuckets ? ' Buckets created from now on are not included automatically.' : ''
      }`}
    >
      {willDriftOnNewBuckets && <div className="mt-3">{configureAction}</div>}
    </Admonition>
  )
}
