import { useParams } from 'common'
import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { StorageBackupSyncDialog } from './StorageBackupSyncDialog'
import { useIsStorageProtectionEnabled } from '@/components/interfaces/Storage/StorageProtection.constants'
import { useStorageBackupSyncQuery } from '@/data/restore-points/restore-points-query'

interface StorageCoverageNoticeProps {
  /**
   * Scheduled backups restore to a discrete point; PITR restores to any second,
   * which storage snapshots can't match — that caveat only applies to PITR.
   */
  mode: 'scheduled' | 'pitr'
}

/**
 * The single answer to "what happens to my files when I restore?" on the backups
 * pages.
 *
 * Replaces the old always-on "Storage objects are not included" alert, which is
 * wrong once a bucket has snapshots enabled. This states the project's actual
 * coverage and offers the fix inline, so users don't have to leave for Storage
 * to work out why a restore would leave them inconsistent.
 */
export const StorageCoverageNotice = ({ mode }: StorageCoverageNoticeProps) => {
  const { ref: projectRef } = useParams()
  const isProtectionEnabled = useIsStorageProtectionEnabled()
  const [showSyncDialog, setShowSyncDialog] = useState(false)

  const { data: sync, isSuccess } = useStorageBackupSyncQuery({ projectRef })

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

  const included = sync.buckets.filter((bucket) => bucket.isIncluded)
  const excluded = sync.buckets.filter((bucket) => !bucket.isIncluded)
  const isSyncOff = !sync.isEnabled || included.length === 0
  const hasGap = excluded.length > 0
  const willDriftOnNewBuckets = sync.isEnabled && !sync.applyToNewBuckets

  const configureAction = (
    <Button type="default" onClick={() => setShowSyncDialog(true)}>
      Configure
    </Button>
  )

  const pitrCaveat =
    mode === 'pitr'
      ? ' Storage restores to the nearest snapshot before your chosen time, not the exact second.'
      : ''

  return (
    <>
      {isSyncOff && (
        <Admonition
          type="default"
          layout="horizontal"
          title="Storage objects are not included"
          description={`Restoring will bring back your database — including Auth users and Storage metadata, which live in Postgres — but not the objects themselves. Rows may end up referencing files that no longer exist.${pitrCaveat}`}
        >
          <div className="mt-3">{configureAction}</div>
        </Admonition>
      )}

      {!isSyncOff && hasGap && (
        <Admonition
          type="warning"
          layout="horizontal"
          title={`${excluded.length} of ${sync.buckets.length} buckets are not included in backups`}
          description={`${included.map((b) => b.name).join(', ')} restore alongside the database. ${excluded.map((b) => b.name).join(', ')} will keep ${excluded.length === 1 ? 'its' : 'their'} current files, so restored rows may reference objects that no longer exist.${pitrCaveat}`}
        >
          <div className="mt-3">{configureAction}</div>
        </Admonition>
      )}

      {!isSyncOff && !hasGap && (
        <Admonition
          type="default"
          layout="horizontal"
          title="Database and Storage restore together"
          description={`All ${sync.buckets.length} buckets are snapshotted before each scheduled backup, so your database and files restore to the same point in time.${pitrCaveat}${
            willDriftOnNewBuckets
              ? ' Buckets created from now on are not included automatically.'
              : ''
          }`}
        >
          {willDriftOnNewBuckets && <div className="mt-3">{configureAction}</div>}
        </Admonition>
      )}

      <StorageBackupSyncDialog
        visible={showSyncDialog}
        projectRef={projectRef}
        onClose={() => setShowSyncDialog(false)}
      />
    </>
  )
}
